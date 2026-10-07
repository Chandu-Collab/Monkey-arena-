import {
  Vector3,
  ArcRotateCamera,
} from '@babylonjs/core';
import { MonkeyCharacter } from '../character/MonkeyBuilder.ts';

export class PlayerController {
  public baseSpeed: number = 8.5;
  public sprintSpeed: number = 13.5;
  public jumpStrength: number = 9.0;
  public gravity: number = -22.0;

  // Jump physics state
  public verticalVelocity: number = 0;
  public isGrounded: boolean = true;
  private groundY: number = 0;

  // Movement & Stationary State
  public isMoving: boolean = false;
  public isStationary: boolean = true;

  // Knockback physics
  public knockbackVelocity: Vector3 = Vector3.Zero();

  // Stamina for sprint
  public stamina: number = 100;
  public maxStamina: number = 100;

  // Lifeline / Health System
  public health: number = 100;
  public maxHealth: number = 100;
  public invulnerableTimer: number = 0;
  public readonly iFrameDuration: number = 1.2;

  // Key tracking
  private keys: { [code: string]: boolean } = {};
  public targetRotationY: number = 0;

  // Rock Hiding Mechanic
  public isHidingInsideRock: boolean = false;
  public nearbyRockPos: Vector3 | null = null;
  public onToggleHide?: (isHiding: boolean) => void;

  // Callbacks
  public onJump?: () => void;
  public onInteract?: () => void;
  public onDamageTaken?: (remainingHealth: number) => void;

  constructor(
    public character: MonkeyCharacter,
    private camera: ArcRotateCamera
  ) {
    this.setupWindowListeners();
  }

  private setupWindowListeners(): void {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      // Trigger jump on space key down
      if ((code === 'Space' || key === ' ') && !this.keys['Space']) {
        if (this.isHidingInsideRock) {
          this.exitRock();
        } else {
          this.triggerJump();
        }
      }

      // Trigger interact on E
      if ((code === 'KeyE' || key === 'e') && !this.keys['KeyE']) {
        if (this.onInteract) this.onInteract();
      }

      // Trigger Rock Hide / Unhide on H
      if ((code === 'KeyH' || key === 'h') && !this.keys['KeyH']) {
        if (this.isHidingInsideRock) {
          this.exitRock();
        } else if (this.nearbyRockPos) {
          this.enterRock(this.nearbyRockPos);
        }
      }

      this.keys[code] = true;
      this.keys[key] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
    });
  }

  public enterRock(rockPos: Vector3): void {
    this.isHidingInsideRock = true;
    this.character.root.position.x = rockPos.x;
    this.character.root.position.z = rockPos.z;
    this.character.root.position.y = 0.2;
    this.character.bodyMesh.visibility = 0.25;
    if (this.onToggleHide) this.onToggleHide(true);
  }

  public exitRock(): void {
    this.isHidingInsideRock = false;
    this.character.root.position.y = 0;
    this.character.bodyMesh.visibility = 1.0;
    if (this.onToggleHide) this.onToggleHide(false);
  }

  public triggerJump(): void {
    if (this.isGrounded && !this.isHidingInsideRock) {
      this.verticalVelocity = this.jumpStrength;
      this.isGrounded = false;
      this.character.isJumping = true;
      if (this.onJump) this.onJump();
    }
  }

  public snatchBananaAnimation(): void {
    // Mini hop + reach overhead when grabbing the golden banana
    if (this.isGrounded) {
      this.verticalVelocity = 4.5;
      this.isGrounded = false;
    }
    this.character.isHoldingBanana = true;
  }

  public takeDamage(damage: number, attackerPos: Vector3): boolean {
    if (this.invulnerableTimer > 0 || this.isHidingInsideRock) {
      return false; // Immune during i-frames or while hiding inside rock!
    }

    this.health = Math.max(0, this.health - damage);
    this.invulnerableTimer = this.iFrameDuration;

    // Apply knockback impulse away from attacker
    const knockDir = this.character.root.position.subtract(attackerPos);
    knockDir.y = 0;
    if (knockDir.lengthSquared() < 0.01) {
      knockDir.set(0, 0, -1);
    } else {
      knockDir.normalize();
    }
    this.knockbackVelocity = knockDir.scale(12.0);
    this.verticalVelocity = 4.0;
    this.isGrounded = false;

    if (this.onDamageTaken) {
      this.onDamageTaken(this.health);
    }

    return true;
  }

  public reset(): void {
    this.health = this.maxHealth;
    this.stamina = this.maxStamina;
    this.invulnerableTimer = 0;
    this.verticalVelocity = 0;
    this.knockbackVelocity = Vector3.Zero();
    this.isGrounded = true;
    this.isMoving = false;
    this.isStationary = true;
    this.isHidingInsideRock = false;
    this.nearbyRockPos = null;
    this.character.bodyMesh.visibility = 1.0;
  }

  public update(deltaSeconds: number): void {
    // 1. Invulnerability Timer & Visual Flashing
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaSeconds;
      const flicker = Math.floor(this.invulnerableTimer * 20) % 2 === 0;
      this.character.bodyMesh.visibility = flicker ? 0.35 : 1.0;
    } else {
      this.character.bodyMesh.visibility = 1.0;
    }

    // 2. Gather directional inputs (W: Front, S: Back, A: Left, D: Right)
    let forwardInput = 0;
    let sideInput = 0;

    if (this.keys['KeyW'] || this.keys['w'] || this.keys['ArrowUp']) forwardInput += 1;
    if (this.keys['KeyS'] || this.keys['s'] || this.keys['ArrowDown']) forwardInput -= 1;
    if (this.keys['KeyA'] || this.keys['a'] || this.keys['ArrowLeft']) sideInput -= 1;
    if (this.keys['KeyD'] || this.keys['d'] || this.keys['ArrowRight']) sideInput += 1;

    // Sprinting (Shift)
    const wantSprint = !!((this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['shift']) && (forwardInput !== 0 || sideInput !== 0));
    let isSprinting = false;

    if (wantSprint && this.stamina > 5) {
      isSprinting = true;
      this.stamina = Math.max(0, this.stamina - deltaSeconds * 28);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + deltaSeconds * 18);
    }

    this.character.isSprinting = isSprinting;
    const currentSpeed = isSprinting ? this.sprintSpeed : this.baseSpeed;
    const isMoving = forwardInput !== 0 || sideInput !== 0;
    if (isMoving && this.isHidingInsideRock) {
      this.exitRock();
    }
    this.isMoving = isMoving;
    this.isStationary = !isMoving;
    this.character.isMoving = isMoving;

    let moveDirection = Vector3.Zero();

    if (isMoving) {
      const inputLen = Math.hypot(sideInput, forwardInput);
      const normSide = sideInput / inputLen;
      const normForward = forwardInput / inputLen;

      const camForward = this.camera.target.subtract(this.camera.position);
      camForward.y = 0;
      if (camForward.lengthSquared() < 0.001) {
        camForward.set(0, 0, 1);
      } else {
        camForward.normalize();
      }

      const camRight = Vector3.Cross(Vector3.Up(), camForward).normalize();
      moveDirection = camForward.scale(normForward).add(camRight.scale(normSide)).normalize();

      const displacement = moveDirection.scale(currentSpeed * deltaSeconds);
      this.character.root.position.addInPlace(displacement);

      this.targetRotationY = Math.atan2(moveDirection.x, moveDirection.z);
    }

    // Smooth rotational damping (Shortest-arc angle lerping)
    this.character.root.rotation.y = this.lerpAngle(
      this.character.root.rotation.y,
      this.targetRotationY,
      14.0,
      deltaSeconds
    );

    // 3. Apply Knockback Decay
    if (this.knockbackVelocity.lengthSquared() > 0.01) {
      this.character.root.position.addInPlace(this.knockbackVelocity.scale(deltaSeconds));
      this.knockbackVelocity.scaleInPlace(Math.max(0, 1 - deltaSeconds * 8));
    }

    // Clamp inside arena bounds
    const arenaLimit = 35.0;
    this.character.root.position.x = Math.max(-arenaLimit, Math.min(arenaLimit, this.character.root.position.x));
    this.character.root.position.z = Math.max(-arenaLimit, Math.min(arenaLimit, this.character.root.position.z));

    // 4. Vertical Jump & Gravity Physics
    if (!this.isGrounded) {
      this.verticalVelocity += this.gravity * deltaSeconds;
      this.character.root.position.y += this.verticalVelocity * deltaSeconds;

      if (this.character.root.position.y <= this.groundY) {
        this.character.root.position.y = this.groundY;
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.character.isJumping = false;
      }
    }

    // 5. Update procedural limbs animation
    this.character.updateAnimation(deltaSeconds);

    // 6. Smooth camera tracking
    const currentTarget = this.camera.target;
    const playerPos = this.character.root.position;
    currentTarget.x += (playerPos.x - currentTarget.x) * (1 - Math.exp(-12 * deltaSeconds));
    currentTarget.y += (playerPos.y + 1.2 - currentTarget.y) * (1 - Math.exp(-12 * deltaSeconds));
    currentTarget.z += (playerPos.z - currentTarget.z) * (1 - Math.exp(-12 * deltaSeconds));
  }

  private lerpAngle(current: number, target: number, rate: number, dt: number): number {
    let diff = (target - current) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return current + diff * Math.min(1.0, rate * dt);
  }
}
