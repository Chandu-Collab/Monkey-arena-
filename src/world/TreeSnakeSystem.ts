import {
  Scene,
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Mesh,
  ShadowGenerator,
} from '@babylonjs/core';
import { AudioSystem } from '../systems/AudioSystem.ts';
import { ParticleSystemManager } from '../systems/ParticleSystemManager.ts';

export enum SnakeState {
  CAMOUFLAGED_IDLE = 'CAMOUFLAGED_IDLE',
  STRIKE_LUNGE = 'STRIKE_LUNGE',
  RETRACTING = 'RETRACTING',
  COOLDOWN = 'COOLDOWN',
}

export class TreeViper {
  public root: TransformNode;
  public headMesh: Mesh;
  public tongueMesh: Mesh;
  public bodySegments: Mesh[] = [];
  public basePosition: Vector3;
  public state: SnakeState = SnakeState.CAMOUFLAGED_IDLE;

  private stateTimer: number = 0;
  private strikeProgress: number = 0; // 0 to 1
  private strikeTargetPos: Vector3 = Vector3.Zero();
  private hasDealtDamageThisStrike: boolean = false;
  private strikeCooldown: number = 0;
  private animTimer: number = 0;
  private snakeMat: StandardMaterial;
  private eyeMat: StandardMaterial;

  constructor(
    public id: number,
    treePos: Vector3,
    scene: Scene,
    private audio: AudioSystem,
    private particles: ParticleSystemManager,
    shadowGenerator?: ShadowGenerator
  ) {
    this.basePosition = new Vector3(treePos.x, 3.8, treePos.z);
    this.root = new TransformNode(`treeViper_${id}`, scene);
    this.root.position = this.basePosition.clone();

    // 1. Viper Skin Material (Emerald Green & Toxic Camo)
    this.snakeMat = new StandardMaterial(`viperMat_${id}`, scene);
    this.snakeMat.diffuseColor = new Color3(0.12, 0.65, 0.28);
    this.snakeMat.emissiveColor = new Color3(0.04, 0.2, 0.08);
    this.snakeMat.specularColor = new Color3(0.3, 0.3, 0.3);
    this.snakeMat.alpha = 0.25; // Initially camouflaged high in tree

    // 2. Glowing Venomous Red Eyes
    this.eyeMat = new StandardMaterial(`viperEyeMat_${id}`, scene);
    this.eyeMat.diffuseColor = new Color3(1.0, 0.05, 0.1);
    this.eyeMat.emissiveColor = new Color3(0.9, 0.0, 0.05);

    // 3. Viper Head
    this.headMesh = MeshBuilder.CreateSphere(
      `viperHead_${id}`,
      { diameterX: 0.38, diameterY: 0.24, diameterZ: 0.52, segments: 10 },
      scene
    );
    this.headMesh.parent = this.root;
    this.headMesh.material = this.snakeMat;
    this.headMesh.scaling = new Vector3(1.0, 0.7, 1.2);

    // Eyes
    const leftEye = MeshBuilder.CreateSphere(`vEyeL_${id}`, { diameter: 0.09 }, scene);
    leftEye.position = new Vector3(-0.14, 0.08, 0.12);
    leftEye.parent = this.headMesh;
    leftEye.material = this.eyeMat;

    const rightEye = MeshBuilder.CreateSphere(`vEyeR_${id}`, { diameter: 0.09 }, scene);
    rightEye.position = new Vector3(0.14, 0.08, 0.12);
    rightEye.parent = this.headMesh;
    rightEye.material = this.eyeMat;

    // Forked Red Tongue
    this.tongueMesh = MeshBuilder.CreateCylinder(
      `vTongue_${id}`,
      { diameterTop: 0.02, diameterBottom: 0.04, height: 0.32, tessellation: 6 },
      scene
    );
    this.tongueMesh.position = new Vector3(0, -0.02, 0.32);
    this.tongueMesh.rotation.x = Math.PI / 2;
    this.tongueMesh.parent = this.headMesh;
    const tongueMat = new StandardMaterial(`vTongueMat_${id}`, scene);
    tongueMat.diffuseColor = new Color3(0.9, 0.1, 0.15);
    tongueMat.emissiveColor = new Color3(0.7, 0.05, 0.1);
    this.tongueMesh.material = tongueMat;

    // 4. Multi-Segmented Snake Body (6 body links)
    const segmentCount = 6;
    for (let i = 0; i < segmentCount; i++) {
      const radius = 0.18 * (1.0 - (i / segmentCount) * 0.45);
      const seg = MeshBuilder.CreateSphere(
        `vSeg_${id}_${i}`,
        { diameter: radius * 2, segments: 8 },
        scene
      );
      seg.parent = this.root;
      seg.material = this.snakeMat;
      seg.position = new Vector3(0, 0.2 + i * 0.22, -i * 0.25);
      this.bodySegments.push(seg);

      if (shadowGenerator) {
        shadowGenerator.addShadowCaster(seg);
      }
    }

    if (shadowGenerator) {
      shadowGenerator.addShadowCaster(this.headMesh);
    }
  }

  public update(
    deltaSeconds: number,
    playerPos: Vector3,
    isPlayerHiding: boolean,
    onPlayerBitten: (snakePos: Vector3) => void
  ): void {
    this.animTimer += deltaSeconds;
    if (this.strikeCooldown > 0) {
      this.strikeCooldown -= deltaSeconds;
    }

    const horizDistToPlayer = Vector3.Distance(
      new Vector3(this.basePosition.x, 0, this.basePosition.z),
      new Vector3(playerPos.x, 0, playerPos.z)
    );

    switch (this.state) {
      case SnakeState.CAMOUFLAGED_IDLE: {
        // Coiled subtly high up in tree foliage, nearly invisible
        this.snakeMat.alpha = Math.max(0.18, this.snakeMat.alpha - deltaSeconds * 1.5);
        this.tongueMesh.scaling.setAll(0.3);

        const idleCoilRadius = 0.45;
        this.headMesh.position.x = Math.sin(this.animTimer * 1.5) * idleCoilRadius;
        this.headMesh.position.y = Math.cos(this.animTimer * 1.5) * 0.15;
        this.headMesh.position.z = Math.cos(this.animTimer * 1.5) * idleCoilRadius;

        for (let i = 0; i < this.bodySegments.length; i++) {
          const seg = this.bodySegments[i];
          const phase = this.animTimer * 1.5 - i * 0.4;
          seg.position.x = Math.sin(phase) * (idleCoilRadius + i * 0.05);
          seg.position.y = 0.2 + i * 0.18 + Math.sin(phase * 2) * 0.05;
          seg.position.z = Math.cos(phase) * (idleCoilRadius + i * 0.05);
        }

        // Trigger Strike if pink monkey comes close (<= 3.8m) and is not hiding in stone
        if (horizDistToPlayer <= 3.8 && !isPlayerHiding && this.strikeCooldown <= 0) {
          this.triggerStrike(playerPos);
        }
        break;
      }

      case SnakeState.STRIKE_LUNGE: {
        // Snake becomes fully visible, uncoils, lunges down with venomous strike!
        this.snakeMat.alpha = Math.min(1.0, this.snakeMat.alpha + deltaSeconds * 8);
        this.stateTimer += deltaSeconds;

        // Fast lunge down (takes ~0.32 seconds)
        const lungeDuration = 0.32;
        this.strikeProgress = Math.min(1.0, this.stateTimer / lungeDuration);

        // Tongue aggressively flicks
        this.tongueMesh.scaling.y = 1.0 + Math.sin(this.animTimer * 30) * 0.6;
        this.tongueMesh.scaling.x = 1.0 + Math.sin(this.animTimer * 20) * 0.3;

        // Head trajectory from high branch towards monkey's height
        const startHeadPos = new Vector3(0, 0, 0);
        const relativeTarget = this.strikeTargetPos.subtract(this.basePosition);
        // Peak lunge reaches near ground / monkey torso
        relativeTarget.y = Math.max(-2.8, relativeTarget.y);

        // Easing for snappy snake strike
        const ease = Math.pow(this.strikeProgress, 2);
        const currentHeadPos = Vector3.Lerp(startHeadPos, relativeTarget, ease);
        this.headMesh.position.copyFrom(currentHeadPos);

        // Face strike direction
        const dir = relativeTarget.normalize();
        this.headMesh.rotation.y = Math.atan2(dir.x, dir.z);
        this.headMesh.rotation.x = Math.asin(-dir.y);

        // Body segments stretch along the strike path
        for (let i = 0; i < this.bodySegments.length; i++) {
          const segFraction = (i + 1) / (this.bodySegments.length + 1);
          const segTarget = Vector3.Lerp(startHeadPos, currentHeadPos, 1.0 - segFraction * 0.85);
          // Add serpentine wiggle to body during lunge
          const wave = Math.sin(this.animTimer * 18 - i * 0.8) * 0.12 * (1.0 - this.strikeProgress);
          segTarget.x += wave;
          this.bodySegments[i].position.copyFrom(segTarget);
        }

        // Bite check at the peak of the strike
        if (this.strikeProgress >= 0.85 && !this.hasDealtDamageThisStrike && !isPlayerHiding) {
          const worldHeadPos = this.headMesh.getAbsolutePosition();
          const distToPlayer = Vector3.Distance(worldHeadPos, playerPos);

          if (distToPlayer <= 2.2) {
            this.hasDealtDamageThisStrike = true;
            this.particles.createJumpDust(worldHeadPos);
            onPlayerBitten(worldHeadPos);
          }
        }

        if (this.strikeProgress >= 1.0) {
          this.state = SnakeState.RETRACTING;
          this.stateTimer = 0;
        }
        break;
      }

      case SnakeState.RETRACTING: {
        // Smooth recoil back up into canopy
        this.stateTimer += deltaSeconds;
        const retractDuration = 0.65;
        const p = Math.min(1.0, this.stateTimer / retractDuration);

        const currentHeadPos = Vector3.Lerp(this.headMesh.position, Vector3.Zero(), p);
        this.headMesh.position.copyFrom(currentHeadPos);

        for (let i = 0; i < this.bodySegments.length; i++) {
          const segPos = Vector3.Lerp(this.bodySegments[i].position, new Vector3(0, 0.2 + i * 0.2, -i * 0.2), p);
          this.bodySegments[i].position.copyFrom(segPos);
        }

        if (p >= 1.0) {
          this.state = SnakeState.COOLDOWN;
          this.strikeCooldown = 2.4; // Cooldown before next bite attempt
        }
        break;
      }

      case SnakeState.COOLDOWN: {
        // Fade back into camouflage
        this.snakeMat.alpha = Math.max(0.2, this.snakeMat.alpha - deltaSeconds * 0.8);
        if (this.strikeCooldown <= 0) {
          this.state = SnakeState.CAMOUFLAGED_IDLE;
        }
        break;
      }
    }
  }

  private triggerStrike(targetPos: Vector3): void {
    this.state = SnakeState.STRIKE_LUNGE;
    this.stateTimer = 0;
    this.strikeProgress = 0;
    this.strikeTargetPos = targetPos.clone();
    this.hasDealtDamageThisStrike = false;
    this.audio.playSnakeHiss();
  }

  public reset(): void {
    this.state = SnakeState.CAMOUFLAGED_IDLE;
    this.stateTimer = 0;
    this.strikeProgress = 0;
    this.hasDealtDamageThisStrike = false;
    this.strikeCooldown = 0;
    this.headMesh.position.setAll(0);
    this.snakeMat.alpha = 0.25;
  }
}

export class TreeSnakeSystem {
  public snakes: TreeViper[] = [];

  constructor(
    treePositions: Vector3[],
    private scene: Scene,
    private audio: AudioSystem,
    private particles: ParticleSystemManager,
    shadowGenerator?: ShadowGenerator
  ) {
    treePositions.forEach((pos, idx) => {
      const viper = new TreeViper(idx, pos, this.scene, this.audio, this.particles, shadowGenerator);
      this.snakes.push(viper);
    });
  }

  public update(
    deltaSeconds: number,
    playerPos: Vector3,
    isPlayerHiding: boolean,
    onPlayerBitten: (snakePos: Vector3) => void
  ): void {
    for (const snake of this.snakes) {
      snake.update(deltaSeconds, playerPos, isPlayerHiding, onPlayerBitten);
    }
  }

  public reset(): void {
    for (const snake of this.snakes) {
      snake.reset();
    }
  }
}
