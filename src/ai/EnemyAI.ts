import { Vector3 } from '@babylonjs/core';
import { MonkeyCharacter } from '../character/MonkeyBuilder.ts';

export enum AIState {
  WANDER = 'WANDER',
  DEFEND_PEDESTAL = 'DEFEND_PEDESTAL',
  SEEK_BANANA = 'SEEK_BANANA',
  CHASE_PLAYER = 'CHASE_PLAYER',
}

export type AIPersonality = 'AGGRESSIVE' | 'DEFENDER' | 'GREEDY';

export interface AIUpdateResult {
  attackTriggered: boolean;
  damageAmount: number;
}

export class EnemyAI {
  public state: AIState = AIState.WANDER;
  public baseSpeed: number;
  public chaseSpeed: number;
  public tackleRadius: number = 1.4;
  public personality: AIPersonality;

  private targetPoint: Vector3 = new Vector3(0, 0, 0);
  private wanderTimer: number = 0;
  private attackCooldown: number = 0;
  private spawnPos: Vector3;

  constructor(
    public character: MonkeyCharacter,
    initialPos: Vector3,
    personality: AIPersonality = 'AGGRESSIVE'
  ) {
    this.spawnPos = initialPos.clone();
    this.character.root.position = initialPos.clone();
    this.personality = personality;

    if (personality === 'AGGRESSIVE') {
      this.baseSpeed = 5.2;
      this.chaseSpeed = 8.6;
    } else if (personality === 'DEFENDER') {
      this.baseSpeed = 4.6;
      this.chaseSpeed = 8.2;
    } else {
      this.baseSpeed = 4.8;
      this.chaseSpeed = 8.4;
    }

    this.pickNewWanderTarget();
  }

  public setDifficultySpeeds(base: number, chase: number): void {
    if (this.personality === 'AGGRESSIVE') {
      this.baseSpeed = base + 0.4;
      this.chaseSpeed = chase + 0.3;
    } else if (this.personality === 'DEFENDER') {
      this.baseSpeed = base - 0.2;
      this.chaseSpeed = chase - 0.3;
    } else {
      this.baseSpeed = base;
      this.chaseSpeed = chase;
    }
  }

  public reset(): void {
    this.character.root.position = this.spawnPos.clone();
    this.state = AIState.WANDER;
    this.character.isAlerted = false;
    this.character.isMoving = false;
    this.attackCooldown = 0;
    this.pickNewWanderTarget();
  }

  private pickNewWanderTarget(): void {
    if (this.personality === 'DEFENDER') {
      // Guard circular perimeter around the golden banana (radius 2.8 - 6.2)
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.8 + Math.random() * 3.5;
      this.targetPoint = new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      this.wanderTimer = 1.8 + Math.random() * 2.0;
    } else {
      // Roam arena
      const angle = Math.random() * Math.PI * 2;
      const distance = 4 + Math.random() * 12;
      this.targetPoint = new Vector3(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      );
      this.wanderTimer = 2.5 + Math.random() * 3.0;
    }
  }

  public update(
    deltaSeconds: number,
    bananaPos: Vector3,
    bananaIsHeldByPlayer: boolean,
    isPlayerInDangerZone: boolean,
    playerPos: Vector3,
    isPlayerStationary: boolean
  ): AIUpdateResult {
    let attackTriggered = false;
    this.wanderTimer -= deltaSeconds;
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaSeconds;
    }

    let target = this.targetPoint;
    let currentSpeed = this.baseSpeed;

    // Determine if enemy should actively chase the player
    // 1. Player holds the banana
    // 2. OR Player has entered the guarded Danger Zone around the banana
    const shouldChase = bananaIsHeldByPlayer || isPlayerInDangerZone;

    if (shouldChase) {
      this.state = AIState.CHASE_PLAYER;
      this.character.isAlerted = true;
      target = playerPos;
      currentSpeed = this.chaseSpeed;

      // Check attack: ONLY hits if player is stationary / standing still at one position!
      const distToPlayer = Vector3.Distance(this.character.root.position, playerPos);
      if (distToPlayer <= this.tackleRadius && isPlayerStationary && this.attackCooldown <= 0) {
        attackTriggered = true;
        this.attackCooldown = 1.0; // 1 second cooldown between hits
      }
    } else {
      // Neutral / Patrolling State
      this.character.isAlerted = false;

      if (this.personality === 'DEFENDER') {
        this.state = AIState.DEFEND_PEDESTAL;
        const distToBanana = Vector3.Distance(this.character.root.position, bananaPos);
        if (distToBanana > 7) {
          target = bananaPos;
        } else if (this.wanderTimer <= 0) {
          this.pickNewWanderTarget();
        }
      } else {
        const distToBanana = Vector3.Distance(this.character.root.position, bananaPos);
        if (distToBanana < 8.5) {
          this.state = AIState.SEEK_BANANA;
          target = bananaPos;
        } else {
          this.state = AIState.WANDER;
          if (this.wanderTimer <= 0) {
            this.pickNewWanderTarget();
          }
        }
      }
    }

    // Apply movement
    const currentPos = this.character.root.position;
    const diff = target.subtract(currentPos);
    diff.y = 0;
    const distance = diff.length();

    if (distance > 0.45) {
      diff.normalize();
      const move = diff.scale(currentSpeed * deltaSeconds);
      this.character.root.position.addInPlace(move);

      // Arena boundary limits
      const limit = 18.5;
      this.character.root.position.x = Math.max(-limit, Math.min(limit, this.character.root.position.x));
      this.character.root.position.z = Math.max(-limit, Math.min(limit, this.character.root.position.z));

      this.character.root.rotation.y = Math.atan2(diff.x, diff.z);
      this.character.isMoving = true;
    } else {
      this.character.isMoving = false;
      if (this.state === AIState.WANDER || this.state === AIState.DEFEND_PEDESTAL) {
        this.pickNewWanderTarget();
      }
    }

    this.character.updateAnimation(deltaSeconds);
    return { attackTriggered, damageAmount: 34 };
  }
}
