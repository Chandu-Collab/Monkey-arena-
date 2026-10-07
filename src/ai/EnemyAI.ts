import { Vector3 } from '@babylonjs/core';
import { MonkeyCharacter } from '../character/MonkeyBuilder.ts';

export enum AIState {
  WANDER = 'WANDER',
  DEFEND_PEDESTAL = 'DEFEND_PEDESTAL',
  SEEK_BANANA = 'SEEK_BANANA',
  CHASE_PLAYER = 'CHASE_PLAYER',
  SEARCH_JUNGLE = 'SEARCH_JUNGLE',
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
      this.baseSpeed = 4.8;
      this.chaseSpeed = 7.0;
    } else if (personality === 'DEFENDER') {
      this.baseSpeed = 4.2;
      this.chaseSpeed = 6.6;
    } else {
      this.baseSpeed = 4.5;
      this.chaseSpeed = 6.8;
    }

    this.pickNewWanderTarget();
  }

  public setDifficultySpeeds(base: number, chase: number): void {
    const adjustedChase = chase * 0.82; // Maintain increased distance / breathing room
    if (this.personality === 'AGGRESSIVE') {
      this.baseSpeed = base + 0.3;
      this.chaseSpeed = adjustedChase + 0.3;
    } else if (this.personality === 'DEFENDER') {
      this.baseSpeed = base - 0.2;
      this.chaseSpeed = adjustedChase - 0.3;
    } else {
      this.baseSpeed = base;
      this.chaseSpeed = adjustedChase;
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

  private pickNewWanderTarget(isFullJungleSearch: boolean = false): void {
    if (isFullJungleSearch) {
      // Roam full jungle arena searching for the hidden monkey
      const angle = Math.random() * Math.PI * 2;
      const distance = 8 + Math.random() * 22;
      this.targetPoint = new Vector3(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      );
      this.wanderTimer = 2.0 + Math.random() * 2.5;
    } else if (this.personality === 'DEFENDER') {
      // Continuously patrol and circle around the golden banana pedestal (radius 3.5 - 7.8)
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.5 + Math.random() * 4.3;
      this.targetPoint = new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      this.wanderTimer = 2.0 + Math.random() * 2.0;
    } else {
      // Roam across open arena
      const angle = Math.random() * Math.PI * 2;
      const distance = 6 + Math.random() * 22;
      this.targetPoint = new Vector3(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      );
      this.wanderTimer = 3.0 + Math.random() * 3.0;
    }
  }

  public update(
    deltaSeconds: number,
    bananaPos: Vector3,
    bananaIsHeldByPlayer: boolean,
    isPlayerInInnerDangerZone: boolean,
    playerPos: Vector3,
    isPlayerStationary: boolean,
    isPlayerHiding: boolean = false
  ): AIUpdateResult {
    let attackTriggered = false;
    this.wanderTimer -= deltaSeconds;
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaSeconds;
    }

    let target = this.targetPoint;
    let currentSpeed = this.baseSpeed;

    // 1. If player is hiding inside a rock:
    // Enemies cannot see the player and actively search the full jungle!
    if (isPlayerHiding) {
      this.state = AIState.SEARCH_JUNGLE;
      this.character.isAlerted = false;
      currentSpeed = this.baseSpeed * 1.15;

      if (this.wanderTimer <= 0 || Vector3.Distance(this.character.root.position, this.targetPoint) <= 1.0) {
        this.pickNewWanderTarget(true);
      }
      target = this.targetPoint;
    } else {
      // 2. Active Chase check (inner danger zone or escaping with banana)
      const shouldChase = bananaIsHeldByPlayer || isPlayerInInnerDangerZone;

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
        // Continuous Patrolling / Roaming State
        this.character.isAlerted = false;

        if (this.personality === 'DEFENDER') {
          this.state = AIState.DEFEND_PEDESTAL;
          const distToBanana = Vector3.Distance(this.character.root.position, bananaPos);
          if (distToBanana > 10.5) {
            target = bananaPos;
          } else if (this.wanderTimer <= 0 || Vector3.Distance(this.character.root.position, this.targetPoint) <= 1.0) {
            this.pickNewWanderTarget();
          }
        } else {
          const distToBanana = Vector3.Distance(this.character.root.position, bananaPos);
          if (distToBanana < 9.5 && Math.random() < 0.3) {
            this.state = AIState.SEEK_BANANA;
            target = bananaPos;
          } else {
            this.state = AIState.WANDER;
            if (this.wanderTimer <= 0 || Vector3.Distance(this.character.root.position, this.targetPoint) <= 1.0) {
              this.pickNewWanderTarget();
            }
          }
        }
      }
    }

    // Apply continuous movement
    const currentPos = this.character.root.position;
    const diff = target.subtract(currentPos);
    diff.y = 0;
    const distance = diff.length();

    if (distance > 0.4) {
      diff.normalize();
      const move = diff.scale(currentSpeed * deltaSeconds);
      this.character.root.position.addInPlace(move);

      // Arena boundary limits (35.0m)
      const limit = 35.0;
      this.character.root.position.x = Math.max(-limit, Math.min(limit, this.character.root.position.x));
      this.character.root.position.z = Math.max(-limit, Math.min(limit, this.character.root.position.z));

      const targetAngle = Math.atan2(diff.x, diff.z);
      this.character.root.rotation.y = this.lerpAngle(
        this.character.root.rotation.y,
        targetAngle,
        10.0,
        deltaSeconds
      );
      this.character.isMoving = true;
    } else {
      // Arrived at waypoint -> immediately pick next waypoint and keep moving without stopping!
      this.pickNewWanderTarget(this.state === AIState.SEARCH_JUNGLE);
      this.character.isMoving = true;
    }

    this.character.updateAnimation(deltaSeconds);
    return { attackTriggered, damageAmount: 34 };
  }

  private lerpAngle(current: number, target: number, rate: number, dt: number): number {
    let diff = (target - current) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return current + diff * Math.min(1.0, rate * dt);
  }
}
