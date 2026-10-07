import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  ArcRotateCamera,
  ShadowGenerator,
} from '@babylonjs/core';
import { JungleArena } from './world/JungleArena.ts';
import { MonkeyCharacter } from './character/MonkeyBuilder.ts';
import { Banana } from './banana/Banana.ts';
import { PlayerController } from './player/PlayerController.ts';
import { EnemyAI } from './ai/EnemyAI.ts';
import { GameState } from './game/GameState.ts';
import { AudioSystem } from './systems/AudioSystem.ts';
import { ParticleSystemManager } from './systems/ParticleSystemManager.ts';
import { GameUI } from './ui/GameUI.ts';
import { EscapeZone } from './world/EscapeZone.ts';
import { BombManager } from './systems/BombManager.ts';
import { DifficultyMode, DIFFICULTY_CONFIGS } from './game/GameConfig.ts';

export class GameApp {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private shadowGenerator!: ShadowGenerator;

  // Systems
  public audio: AudioSystem;
  public particles!: ParticleSystemManager;
  public ui!: GameUI;
  public bombManager!: BombManager;

  // Game Entities & State
  public gameState: GameState = GameState.INTRO;
  public gameTimer: number = 0;
  public currentDifficulty: DifficultyMode = 'MEDIUM';
  private wasInDangerZone: boolean = false;

  public arena!: JungleArena;
  public escapeZone!: EscapeZone;
  public banana!: Banana;
  public player!: MonkeyCharacter;
  public playerController!: PlayerController;
  public enemies: EnemyAI[] = [];

  constructor(canvasId: string) {
    const canvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvasElement) {
      throw new Error(`Canvas with id '${canvasId}' not found in DOM.`);
    }
    this.canvas = canvasElement;

    // 1. Audio & UI Systems
    this.audio = new AudioSystem();
    this.ui = new GameUI();
    this.ui.onRestartClick = () => this.restartGame();
    this.ui.onPickupClick = () => this.attemptBananaPickup();
    this.ui.onDifficultyChange = (modeStr) => this.setDifficulty(modeStr as DifficultyMode);
    this.ui.onIntroComplete = () => {
      if (this.gameState === GameState.INTRO) {
        this.gameState = GameState.PLAYING;
        this.audio.playJump();
      }
    };

    // 2. Engine Initialization
    this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    // 3. Scene & Entity Composition
    this.scene = this.createScene();

    // Apply default difficulty settings
    this.setDifficulty('MEDIUM', false);

    // 4. Render & Game Loops
    this.initRenderLoop();
    this.initResizeListener();
  }

  public setDifficulty(mode: DifficultyMode, playAudio: boolean = true): void {
    this.currentDifficulty = mode;
    const config = DIFFICULTY_CONFIGS[mode];

    if (this.bombManager) {
      this.bombManager.setDifficulty(config);
    }
    if (this.escapeZone) {
      this.escapeZone.setSpeed(config.portalSpeed);
    }
    if (this.enemies) {
      for (const enemy of this.enemies) {
        enemy.setDifficultySpeeds(config.enemyBaseSpeed, config.enemyChaseSpeed);
      }
    }
    if (playAudio && this.audio) {
      this.audio.playJump();
    }
  }

  private createScene(): Scene {
    const scene = new Scene(this.engine);
    scene.clearColor = new Color4(0.06, 0.1, 0.16, 1.0);

    this.particles = new ParticleSystemManager(scene);

    // --- CAMERA ---
    const camera = new ArcRotateCamera(
      'followCamera',
      -Math.PI / 2,
      Math.PI / 3.2,
      14,
      new Vector3(0, 1.2, -8),
      scene
    );
    camera.attachControl(this.canvas, true);
    camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 30;
    camera.upperBetaLimit = Math.PI / 2.05;
    camera.wheelPrecision = 30;

    // --- LIGHTING ---
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.7;
    hemiLight.diffuse = new Color3(0.95, 0.98, 1.0);
    hemiLight.groundColor = new Color3(0.18, 0.35, 0.16);

    const sunLight = new DirectionalLight('sunLight', new Vector3(-0.6, -1.2, -0.6).normalize(), scene);
    sunLight.position = new Vector3(25, 45, 25);
    sunLight.intensity = 0.9;
    sunLight.diffuse = new Color3(1.0, 0.95, 0.82);

    this.shadowGenerator = new ShadowGenerator(1024, sunLight);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = 16;

    // --- 1. JUNGLE ARENA ENVIRONMENT ---
    this.arena = new JungleArena(scene, this.shadowGenerator);

    // --- 2. DYNAMIC MOVING ESCAPE ZONE ---
    this.escapeZone = new EscapeZone(scene);

    // --- 3. JUNGLE BOMBARDMENT SYSTEM ---
    this.bombManager = new BombManager(scene, this.particles, this.audio, this.escapeZone);

    // --- 4. GOLDEN BANANA ---
    this.banana = new Banana(scene, new Vector3(0, 1.2, 0), this.shadowGenerator);

    // --- 5. PLAYER MONKEY ---
    this.player = new MonkeyCharacter(
      'playerMonkey',
      scene,
      {
        name: 'player',
        bodyColor: new Color3(0.55, 0.28, 0.12),
        bellyColor: new Color3(0.96, 0.78, 0.52),
        scale: 1.0,
      },
      this.shadowGenerator
    );
    this.player.root.position = new Vector3(0, 0, -8);

    this.playerController = new PlayerController(this.player, camera);
    
    // Jump Effects
    this.playerController.onJump = () => {
      this.audio.playJump();
      this.particles.createJumpDust(this.player.root.position);
    };

    // Grab Key (E)
    this.playerController.onInteract = () => {
      this.attemptBananaPickup();
    };

    // Damage Taken Callback
    this.playerController.onDamageTaken = () => {
      this.audio.playHitHurt();
      this.ui.triggerDamageFlash();
      this.particles.createJumpDust(this.player.root.position);
    };

    // --- 6. AI RIVAL MONKEYS ---
    // Rival 1: Blue Baboon (Aggressive Guard)
    const enemy1 = new MonkeyCharacter(
      'aiRival1',
      scene,
      {
        name: 'enemy1',
        bodyColor: new Color3(0.25, 0.35, 0.5),
        bellyColor: new Color3(0.78, 0.85, 0.92),
        scale: 0.95,
      },
      this.shadowGenerator
    );
    this.enemies.push(new EnemyAI(enemy1, new Vector3(-11, 0, 8), 'AGGRESSIVE'));

    // Rival 2: Orange Baboon (Pedestal Defender)
    const enemy2 = new MonkeyCharacter(
      'aiRival2',
      scene,
      {
        name: 'enemy2',
        bodyColor: new Color3(0.75, 0.35, 0.12),
        bellyColor: new Color3(0.98, 0.85, 0.55),
        scale: 1.05,
      },
      this.shadowGenerator
    );
    this.enemies.push(new EnemyAI(enemy2, new Vector3(8, 0, 6), 'DEFENDER'));

    // Rival 3: Dark Chimp (Greedy Banana Snatcher)
    const enemy3 = new MonkeyCharacter(
      'aiRival3',
      scene,
      {
        name: 'enemy3',
        bodyColor: new Color3(0.3, 0.2, 0.15),
        bellyColor: new Color3(0.85, 0.65, 0.45),
        scale: 1.0,
      },
      this.shadowGenerator
    );
    this.enemies.push(new EnemyAI(enemy3, new Vector3(-6, 0, 12), 'GREEDY'));

    // --- GAME TICK OBSERVABLE ---
    scene.onBeforeRenderObservable.add(() => {
      const deltaSeconds = this.engine.getDeltaTime() / 1000.0;
      if (deltaSeconds > 0.1) return;

      this.updateGame(deltaSeconds);
    });

    return scene;
  }

  private updateGame(deltaSeconds: number): void {
    if (this.gameState === GameState.WON || this.gameState === GameState.LOST) {
      return;
    }

    // While in INTRO state, the game is paused until the mission briefing is dismissed
    if (this.gameState === GameState.INTRO) {
      this.ui.updateIntroSplash(deltaSeconds);
      return;
    }

    this.gameTimer += deltaSeconds;

    // 1. Update Entities
    this.banana.update(deltaSeconds);
    this.playerController.update(deltaSeconds);
    this.escapeZone.update(deltaSeconds);

    const playerPos = this.player.root.position;
    const bananaPos = this.banana.root.position;
    const isPlayerHolding = this.gameState === GameState.BANANA_HELD;

    // 2. Zone Proximity Checks
    const distToBanana = Vector3.Distance(playerPos, bananaPos);
    const isPlayerInOuterZone = distToBanana <= this.arena.outerDangerRadius && !isPlayerHolding;
    const isPlayerInInnerZone = distToBanana <= this.arena.innerDangerRadius && !isPlayerHolding;

    // Trigger alert sound on entering zones
    if ((isPlayerInOuterZone || isPlayerInInnerZone) && !this.wasInDangerZone) {
      this.audio.playAlert();
    }
    this.wasInDangerZone = isPlayerInOuterZone || isPlayerInInnerZone;

    // 3. Fish Hazard: Hand-thrown by enemy monkeys in Outer Zone, Sky-falling ponds when escaping with banana
    const enemyPositions = this.enemies.map((e) => e.character.root.position);
    this.bombManager.update(
      deltaSeconds,
      playerPos,
      isPlayerInOuterZone,
      isPlayerHolding,
      enemyPositions,
      (fishImpactPos: Vector3) => {
        const hit = this.playerController.takeDamage(34, fishImpactPos);
        if (hit && this.playerController.health <= 0) {
          this.handlePlayerDefeated();
        }
      }
    );

    // Check if player is close enough to snatch banana (<= 2.6m)
    const canPickupBanana = distToBanana <= 2.6 && !this.banana.isHeld && !isPlayerHolding;
    this.banana.isPlayerInRange = canPickupBanana;

    // Update Arena Rings
    this.arena.update(deltaSeconds, isPlayerInOuterZone, isPlayerInInnerZone);

    // 4. Update AI Rivals & Combat / Lifeline Checks
    // NOTE: Monkeys ONLY pursue/attack when player enters the Inner Circle or holds the banana!
    // And they ONLY land hits when isPlayerStationary is TRUE!
    const isStationary = this.playerController.isStationary;

    for (const enemy of this.enemies) {
      const result = enemy.update(
        deltaSeconds,
        bananaPos,
        isPlayerHolding,
        isPlayerInInnerZone,
        playerPos,
        isStationary
      );

      if (result.attackTriggered) {
        const hitSuccessful = this.playerController.takeDamage(
          result.damageAmount,
          enemy.character.root.position
        );

        if (hitSuccessful) {
          if (this.playerController.health <= 0) {
            this.handlePlayerDefeated();
            break;
          }
        }
      }
    }

    // 5. Check Moving Escape Zone Trigger (when carrying banana)
    if (isPlayerHolding) {
      if (this.escapeZone.isInside(playerPos)) {
        this.handlePlayerEscaped();
      }
    }

    // 6. Update HUD
    const distToEscape = isPlayerHolding
      ? Vector3.Distance(playerPos, this.escapeZone.getPosition())
      : undefined;

    this.ui.updateHUD(
      this.gameState,
      this.playerController.health,
      this.playerController.maxHealth,
      this.playerController.stamina,
      this.playerController.maxStamina,
      this.gameTimer,
      isPlayerInOuterZone,
      isPlayerInInnerZone,
      isStationary,
      canPickupBanana,
      distToEscape,
      this.escapeZone.isPhaseAppeared
    );
  }

  public attemptBananaPickup(): void {
    if (this.banana.isHeld || this.gameState === GameState.BANANA_HELD) return;

    const dist = Vector3.Distance(this.player.root.position, this.banana.root.position);
    if (dist <= 3.2) {
      this.gameState = GameState.BANANA_HELD;
      this.playerController.snatchBananaAnimation();
      this.banana.attachTo(this.player.root);

      // Activate Moving Escape Zone & Jungle Bombardment Chaos!
      this.escapeZone.activate();
      this.bombManager.startBombardment();

      // Audio & VFX
      this.audio.playGrabBanana();
      this.audio.playAlert();
      this.particles.createPickupSparkles(this.banana.root.position);
    }
  }

  private handlePlayerDefeated(): void {
    this.gameState = GameState.LOST;
    this.player.isHoldingBanana = false;
    this.banana.drop(this.player.root.position);
    this.bombManager.stopBombardment();

    this.audio.playTackle();
    setTimeout(() => this.audio.playDefeat(), 250);

    this.ui.showDefeat(this.gameTimer);
  }

  private handlePlayerEscaped(): void {
    this.gameState = GameState.WON;
    this.bombManager.stopBombardment();
    this.audio.playVictory();
    this.particles.createPickupSparkles(this.player.root.position);
    this.ui.showVictory(this.gameTimer);
  }

  public restartGame(): void {
    this.gameState = GameState.INTRO;
    this.gameTimer = 0;
    this.wasInDangerZone = false;

    // Reset Player
    this.player.root.position = new Vector3(0, 0, -8);
    this.player.isHoldingBanana = false;
    this.player.isMoving = false;
    this.player.isJumping = false;
    this.playerController.reset();

    // Reset Banana, Escape Zone, and Bombardment
    this.banana.reset();
    this.escapeZone.reset();
    this.bombManager.stopBombardment();

    // Reset Enemies
    for (const enemy of this.enemies) {
      enemy.reset();
    }

    // Reapply difficulty settings
    this.setDifficulty(this.currentDifficulty, false);

    // Reset intro splash
    this.ui.resetIntroSplash();
  }

  private initRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  private initResizeListener(): void {
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }
}

// Bootstrap on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new GameApp('renderCanvas');
});
