import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
} from '@babylonjs/core';
import { ParticleSystemManager } from './ParticleSystemManager.ts';
import { AudioSystem } from './AudioSystem.ts';
import { EscapeZone } from '../world/EscapeZone.ts';
import { DifficultyConfig, DIFFICULTY_CONFIGS } from '../game/GameConfig.ts';

interface ActiveFishHazard {
  root: TransformNode;
  fishBody: Mesh;
  fishTail: Mesh;
  isSkyFall: boolean;
  // For Sky Fall
  pondDisc?: Mesh;
  pondMat?: StandardMaterial;
  rippleRing1?: Mesh;
  rippleRing2?: Mesh;
  rippleMat?: StandardMaterial;
  // Trajectory & Timing
  startPos: Vector3;
  targetPos: Vector3;
  arcHeight: number;
  timer: number;
  totalTime: number;
  isLanded: boolean;
  fadeTimer: number;
}

export class BombManager {
  private activeHazards: ActiveFishHazard[] = [];
  private spawnTimer: number = 0;
  public isBombardmentActive: boolean = false;
  public blastRadius: number = 3.6;

  // Difficulty parameters
  private config: DifficultyConfig = DIFFICULTY_CONFIGS.MEDIUM;

  // Reusable Materials
  private fishBlueMat: StandardMaterial;
  private fishFinMat: StandardMaterial;
  private fishEyeMat: StandardMaterial;

  constructor(
    private scene: Scene,
    private particles: ParticleSystemManager,
    private audio: AudioSystem,
    private escapeZone: EscapeZone
  ) {
    this.fishBlueMat = new StandardMaterial('fishBlueMat', scene);
    this.fishBlueMat.diffuseColor = new Color3(0.2, 0.65, 0.98);
    this.fishBlueMat.specularColor = new Color3(0.8, 0.95, 1.0);
    this.fishBlueMat.emissiveColor = new Color3(0.05, 0.18, 0.35);

    this.fishFinMat = new StandardMaterial('fishFinMat', scene);
    this.fishFinMat.diffuseColor = new Color3(1.0, 0.55, 0.1);
    this.fishFinMat.specularColor = new Color3(0.5, 0.5, 0.5);

    this.fishEyeMat = new StandardMaterial('fishEyeMat', scene);
    this.fishEyeMat.diffuseColor = new Color3(0.05, 0.05, 0.05);
    this.fishEyeMat.specularColor = new Color3(1.0, 1.0, 1.0);
  }

  public setDifficulty(config: DifficultyConfig): void {
    this.config = config;
  }

  public startBombardment(): void {
    this.isBombardmentActive = true;
    this.spawnTimer = 0.35; // Quick first fish drop
  }

  public stopBombardment(): void {
    this.isBombardmentActive = false;
    this.clearAllBombs();
  }

  public clearAllBombs(): void {
    for (const h of this.activeHazards) {
      h.root.dispose();
    }
    this.activeHazards = [];
  }

  private buildFishModel(parent: TransformNode): { fishBody: Mesh; fishTail: Mesh } {
    const id = Date.now() + Math.random();

    // 1. Torpedo Fish Body
    const fishBody = MeshBuilder.CreateSphere(
      `fishBody_${id}`,
      { diameterX: 0.85, diameterY: 1.1, diameterZ: 2.2, segments: 12 },
      this.scene
    );
    fishBody.material = this.fishBlueMat;
    fishBody.parent = parent;

    // 2. Animated Tail Fin
    const fishTail = MeshBuilder.CreateCylinder(
      `fishTail_${id}`,
      { diameterTop: 1.1, diameterBottom: 0.1, height: 0.7, tessellation: 8 },
      this.scene
    );
    fishTail.rotation.x = Math.PI / 2;
    fishTail.position = new Vector3(0, 0, 1.25);
    fishTail.material = this.fishFinMat;
    fishTail.parent = fishBody;

    // 3. Dorsal Fin
    const dorsalFin = MeshBuilder.CreateCylinder(
      `fishDorsal_${id}`,
      { diameterTop: 0.7, diameterBottom: 0.1, height: 0.4, tessellation: 6 },
      this.scene
    );
    dorsalFin.position = new Vector3(0, 0.65, -0.2);
    dorsalFin.rotation.z = Math.PI / 2;
    dorsalFin.material = this.fishFinMat;
    dorsalFin.parent = fishBody;

    // 4. Eyes
    const leftEye = MeshBuilder.CreateSphere(`fishEyeL_${id}`, { diameter: 0.2, segments: 8 }, this.scene);
    leftEye.position = new Vector3(-0.35, 0.25, -0.7);
    leftEye.material = this.fishEyeMat;
    leftEye.parent = fishBody;

    const rightEye = MeshBuilder.CreateSphere(`fishEyeR_${id}`, { diameter: 0.2, segments: 8 }, this.scene);
    rightEye.position = new Vector3(0.35, 0.25, -0.7);
    rightEye.material = this.fishEyeMat;
    rightEye.parent = fishBody;

    return { fishBody, fishTail };
  }

  // 1. Hand-Thrown Fish by Enemy Monkeys (Outer Circle)
  private spawnHandThrownFish(playerPos: Vector3, enemyPositions?: Vector3[]): void {
    let throwerPos: Vector3;

    if (enemyPositions && enemyPositions.length > 0) {
      // Pick closest enemy monkey to throw the fish
      let closestEnemy = enemyPositions[0];
      let minDist = 999;
      for (const ep of enemyPositions) {
        const d = Vector3.Distance(ep, playerPos);
        if (d < minDist) {
          minDist = d;
          closestEnemy = ep;
        }
      }
      throwerPos = new Vector3(closestEnemy.x, 1.2, closestEnemy.z);
    } else {
      throwerPos = new Vector3(0, 1.2, 0);
    }

    // Target slightly leading/near player
    const targetX = playerPos.x + (Math.random() * 4 - 2);
    const targetZ = playerPos.z + (Math.random() * 4 - 2);
    const targetPos = new Vector3(targetX, 0, targetZ);

    const id = Date.now() + Math.random();
    const root = new TransformNode(`thrownFishRoot_${id}`, this.scene);
    root.position = throwerPos.clone();

    const { fishBody, fishTail } = this.buildFishModel(root);

    this.activeHazards.push({
      root,
      fishBody,
      fishTail,
      isSkyFall: false,
      startPos: throwerPos.clone(),
      targetPos,
      arcHeight: 4.8,
      timer: 0,
      totalTime: 1.1, // Swift throw
      isLanded: false,
      fadeTimer: 0.8,
    });
  }

  // 2. Sky-Falling Fish plunging into Water Ponds (Post-Banana Escape)
  private spawnSkyFallingFishAndPond(playerPos: Vector3): void {
    let targetX: number;
    let targetZ: number;

    if (Math.random() < 0.65) {
      targetX = playerPos.x + (Math.random() * 12 - 6);
      targetZ = playerPos.z + (Math.random() * 12 - 6);
    } else {
      targetX = Math.random() * 60 - 30;
      targetZ = Math.random() * 60 - 30;
    }

    targetX = Math.max(-33.0, Math.min(33.0, targetX));
    targetZ = Math.max(-33.0, Math.min(33.0, targetZ));
    const targetPos = new Vector3(targetX, 0, targetZ);

    const id = Date.now() + Math.random();
    const root = new TransformNode(`pondRoot_${id}`, this.scene);
    root.position = targetPos.clone();

    // 1. Water Pond Disc on the Ground
    const pondDisc = MeshBuilder.CreateCylinder(
      `pondDisc_${id}`,
      { diameter: this.blastRadius * 2, height: 0.04, tessellation: 36 },
      this.scene
    );
    pondDisc.position.y = 0.035;
    pondDisc.parent = root;
    pondDisc.scaling.setAll(0.01);

    const pondMat = new StandardMaterial(`pondMat_${id}`, this.scene);
    pondMat.diffuseColor = new Color3(0.08, 0.55, 0.95);
    pondMat.emissiveColor = new Color3(0.05, 0.32, 0.65);
    pondMat.specularColor = new Color3(0.9, 0.98, 1.0);
    pondMat.alpha = 0.88;
    pondDisc.material = pondMat;

    // 2. Concentric Ripple Rings
    const rippleMat = new StandardMaterial(`rippleMat_${id}`, this.scene);
    rippleMat.diffuseColor = new Color3(0.6, 0.9, 1.0);
    rippleMat.emissiveColor = new Color3(0.35, 0.75, 1.0);

    const rippleRing1 = MeshBuilder.CreateTorus(
      `ripple1_${id}`,
      { diameter: this.blastRadius * 1.2, thickness: 0.09, tessellation: 32 },
      this.scene
    );
    rippleRing1.position.y = 0.045;
    rippleRing1.parent = root;
    rippleRing1.material = rippleMat;
    rippleRing1.scaling.setAll(0.1);

    const rippleRing2 = MeshBuilder.CreateTorus(
      `ripple2_${id}`,
      { diameter: this.blastRadius * 1.8, thickness: 0.07, tessellation: 32 },
      this.scene
    );
    rippleRing2.position.y = 0.045;
    rippleRing2.parent = root;
    rippleRing2.material = rippleMat;
    rippleRing2.scaling.setAll(0.1);

    // 3. Falling Fish from Sky (Y = 26.0)
    const fishRoot = new TransformNode(`fishRoot_${id}`, this.scene);
    const startY = 26.0;
    fishRoot.position = new Vector3(0, startY, 0);
    fishRoot.parent = root;
    fishRoot.rotation.x = Math.PI / 2; // Head straight down

    const { fishBody, fishTail } = this.buildFishModel(fishRoot);

    this.activeHazards.push({
      root,
      fishBody,
      fishTail,
      isSkyFall: true,
      pondDisc,
      pondMat,
      rippleRing1,
      rippleRing2,
      rippleMat,
      startPos: new Vector3(targetX, startY, targetZ),
      targetPos,
      arcHeight: 0,
      timer: 0,
      totalTime: this.config.bombFallDuration,
      isLanded: false,
      fadeTimer: 1.6,
    });
  }

  public update(
    deltaSeconds: number,
    playerPos: Vector3,
    isOuterZoneActive: boolean,
    isBananaHeldEscape: boolean,
    enemyPositions: Vector3[],
    onPlayerHit: (attackerPos: Vector3) => void
  ): void {
    const isAnyHazardActive = isOuterZoneActive || isBananaHeldEscape;

    if (isAnyHazardActive) {
      this.spawnTimer -= deltaSeconds;
      if (this.spawnTimer <= 0) {
        if (isBananaHeldEscape) {
          // Once banana collected -> Sky falling fish into ponds
          this.spawnSkyFallingFishAndPond(playerPos);
          const intervalRange = this.config.bombSpawnIntervalMax - this.config.bombSpawnIntervalMin;
          this.spawnTimer = this.config.bombSpawnIntervalMin + Math.random() * intervalRange;
        } else if (isOuterZoneActive) {
          // When entering outer circle before snatch -> Enemy monkeys throw fish from hands
          this.spawnHandThrownFish(playerPos, enemyPositions);
          this.spawnTimer = 1.3 + Math.random() * 0.9;
        }
      }
    }

    // Update active thrown & sky-falling fish
    for (let i = this.activeHazards.length - 1; i >= 0; i--) {
      const hazard = this.activeHazards[i];

      if (!hazard.isLanded) {
        hazard.timer += deltaSeconds;
        const progress = Math.min(1.0, hazard.timer / hazard.totalTime);

        if (hazard.isSkyFall) {
          // --- SKY FALLING FISH INTO WATER POND ---
          const pondGrowth = Math.min(1.0, progress * 2.2);
          if (hazard.pondDisc) hazard.pondDisc.scaling.set(pondGrowth, 1.0, pondGrowth);

          // Descend vertically into pond
          const currentY = hazard.startPos.y * (1 - progress);
          hazard.root.getChildTransformNodes()[0].position.y = currentY;

          // Animated tail wiggles
          hazard.fishTail.rotation.y = Math.sin(hazard.timer * 32) * 0.75;
          hazard.fishBody.rotation.z = Math.sin(hazard.timer * 16) * 0.3;

          // Ripples expanding
          if (hazard.rippleRing1 && hazard.rippleRing2) {
            const rippleScale1 = pondGrowth * (0.3 + (progress * 2.0) % 1.0);
            const rippleScale2 = pondGrowth * (0.15 + ((progress * 2.0 + 0.5) % 1.0));
            hazard.rippleRing1.scaling.setAll(rippleScale1);
            hazard.rippleRing2.scaling.setAll(rippleScale2);
          }

          if (progress >= 1.0) {
            hazard.isLanded = true;
            this.handleFishImpact(hazard, playerPos, onPlayerHit);
          }
        } else {
          // --- HAND-THROWN FISH FROM SPECTATOR ---
          // Arced trajectory from hand to ground
          const currentX = hazard.startPos.x + (hazard.targetPos.x - hazard.startPos.x) * progress;
          const currentZ = hazard.startPos.z + (hazard.targetPos.z - hazard.startPos.z) * progress;
          const arcY = hazard.startPos.y * (1 - progress) + Math.sin(progress * Math.PI) * hazard.arcHeight;

          hazard.root.position.set(currentX, arcY, currentZ);

          // Rotate head towards velocity
          const dirX = hazard.targetPos.x - hazard.startPos.x;
          const dirZ = hazard.targetPos.z - hazard.startPos.z;
          const dirY = (hazard.targetPos.y - hazard.startPos.y) + Math.cos(progress * Math.PI) * hazard.arcHeight;
          hazard.root.rotation.y = Math.atan2(dirX, dirZ);
          hazard.root.rotation.x = -Math.atan2(dirY, Math.sqrt(dirX * dirX + dirZ * dirZ));

          // Flapping tail
          hazard.fishTail.rotation.y = Math.sin(hazard.timer * 30) * 0.7;

          if (progress >= 1.0) {
            hazard.isLanded = true;
            this.handleFishImpact(hazard, playerPos, onPlayerHit);
          }
        }
      } else {
        // --- POST-IMPACT FADEOUT ---
        hazard.fadeTimer -= deltaSeconds;
        const fadePct = Math.max(0, hazard.fadeTimer / (hazard.isSkyFall ? 1.6 : 0.8));

        if (hazard.isSkyFall && hazard.pondMat && hazard.rippleMat) {
          hazard.pondMat.alpha = 0.88 * fadePct;
          hazard.rippleMat.alpha = fadePct;

          const postSplashWave = (1.6 - hazard.fadeTimer) * 1.8;
          if (hazard.rippleRing1) hazard.rippleRing1.scaling.setAll(1.0 + postSplashWave * 0.5);
          if (hazard.rippleRing2) hazard.rippleRing2.scaling.setAll(1.3 + postSplashWave * 0.6);
        }

        if (hazard.fadeTimer <= 0) {
          hazard.root.dispose();
          this.activeHazards.splice(i, 1);
        }
      }
    }
  }

  private handleFishImpact(
    hazard: ActiveFishHazard,
    playerPos: Vector3,
    onPlayerHit: (attackerPos: Vector3) => void
  ): void {
    const impactPos = hazard.targetPos;

    // Splash particles and sound
    this.particles.createFishSplash(impactPos);
    this.audio.playWaterSplash();

    // Hide the fish mesh on impact
    if (hazard.isSkyFall) {
      const childNodes = hazard.root.getChildTransformNodes();
      if (childNodes.length > 0) childNodes[0].dispose();
    } else {
      hazard.fishBody.dispose();
    }

    // Check hit radius
    const distToPlayer = Vector3.Distance(
      new Vector3(impactPos.x, 0, impactPos.z),
      new Vector3(playerPos.x, 0, playerPos.z)
    );

    const isProtectedInGreenZone = this.escapeZone.isInside(playerPos);

    if (distToPlayer <= this.blastRadius && !isProtectedInGreenZone) {
      onPlayerHit(impactPos);
    }
  }
}
