import {
  Scene,
  ParticleSystem,
  Texture,
  Vector3,
  Color4,
} from '@babylonjs/core';

export class ParticleSystemManager {
  private particleTexture: Texture;

  constructor(private scene: Scene) {
    this.particleTexture = new Texture(
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="28" fill="white"/></svg>',
      this.scene
    );
  }

  public createPickupSparkles(position: Vector3): void {
    const ps = new ParticleSystem('pickupSparkles', 60, this.scene);
    ps.particleTexture = this.particleTexture;
    ps.emitter = position.clone();
    ps.minEmitBox = new Vector3(-0.3, -0.3, -0.3);
    ps.maxEmitBox = new Vector3(0.3, 0.3, 0.3);

    ps.color1 = new Color4(1.0, 0.9, 0.2, 1.0);
    ps.color2 = new Color4(1.0, 0.6, 0.1, 1.0);
    ps.colorDead = new Color4(1.0, 0.8, 0.0, 0.0);

    ps.minSize = 0.15;
    ps.maxSize = 0.35;
    ps.minLifeTime = 0.4;
    ps.maxLifeTime = 0.8;

    ps.emitRate = 200;
    ps.direction1 = new Vector3(-2, 3, -2);
    ps.direction2 = new Vector3(2, 5, 2);
    ps.gravity = new Vector3(0, -9.81, 0);

    ps.targetStopDuration = 0.3;
    ps.disposeOnStop = true;
    ps.start();
  }

  public createJumpDust(position: Vector3): void {
    const ps = new ParticleSystem('jumpDust', 20, this.scene);
    ps.particleTexture = this.particleTexture;
    ps.emitter = new Vector3(position.x, 0.05, position.z);
    ps.minEmitBox = new Vector3(-0.2, 0, -0.2);
    ps.maxEmitBox = new Vector3(0.2, 0, 0.2);

    ps.color1 = new Color4(0.7, 0.65, 0.5, 0.6);
    ps.color2 = new Color4(0.8, 0.75, 0.6, 0.4);
    ps.colorDead = new Color4(0.6, 0.55, 0.4, 0.0);

    ps.minSize = 0.2;
    ps.maxSize = 0.5;
    ps.minLifeTime = 0.25;
    ps.maxLifeTime = 0.5;

    ps.emitRate = 120;
    ps.direction1 = new Vector3(-1.5, 0.5, -1.5);
    ps.direction2 = new Vector3(1.5, 1.0, 1.5);

    ps.targetStopDuration = 0.15;
    ps.disposeOnStop = true;
    ps.start();
  }

  public createDuckSplash(position: Vector3): void {
    const ps = new ParticleSystem('duckSplash', 45, this.scene);
    ps.particleTexture = this.particleTexture;
    ps.emitter = new Vector3(position.x, 0.3, position.z);
    ps.color1 = new Color4(1.0, 0.9, 0.1, 1.0);
    ps.color2 = new Color4(1.0, 0.6, 0.0, 1.0);
    ps.colorDead = new Color4(1.0, 0.9, 0.2, 0.0);
    ps.minSize = 0.25;
    ps.maxSize = 0.7;
    ps.minLifeTime = 0.3;
    ps.maxLifeTime = 0.6;
    ps.emitRate = 250;
    ps.direction1 = new Vector3(-3, 4, -3);
    ps.direction2 = new Vector3(3, 6, 3);
    ps.gravity = new Vector3(0, -10, 0);
    ps.targetStopDuration = 0.18;
    ps.disposeOnStop = true;
    ps.start();
  }

  public createAnvilSparks(position: Vector3): void {
    const ps = new ParticleSystem('anvilSparks', 60, this.scene);
    ps.particleTexture = this.particleTexture;
    ps.emitter = new Vector3(position.x, 0.2, position.z);
    ps.color1 = new Color4(1.0, 0.95, 0.7, 1.0);
    ps.color2 = new Color4(1.0, 0.6, 0.2, 1.0);
    ps.colorDead = new Color4(0.8, 0.3, 0.1, 0.0);
    ps.minSize = 0.15;
    ps.maxSize = 0.45;
    ps.minLifeTime = 0.2;
    ps.maxLifeTime = 0.45;
    ps.emitRate = 350;
    ps.direction1 = new Vector3(-5, 2, -5);
    ps.direction2 = new Vector3(5, 5, 5);
    ps.gravity = new Vector3(0, -15, 0);
    ps.targetStopDuration = 0.15;
    ps.disposeOnStop = true;
    ps.start();
  }

  public createFishSplash(position: Vector3): void {
    // 1. Water Splash Droplets & Foam
    const ps = new ParticleSystem('fishSplash', 70, this.scene);
    ps.particleTexture = this.particleTexture;
    ps.emitter = new Vector3(position.x, 0.25, position.z);
    ps.color1 = new Color4(0.3, 0.75, 1.0, 0.95);
    ps.color2 = new Color4(0.7, 0.92, 1.0, 0.85);
    ps.colorDead = new Color4(0.15, 0.45, 0.85, 0.0);
    ps.minSize = 0.25;
    ps.maxSize = 0.85;
    ps.minLifeTime = 0.35;
    ps.maxLifeTime = 0.75;
    ps.emitRate = 380;
    ps.direction1 = new Vector3(-3.5, 4.0, -3.5);
    ps.direction2 = new Vector3(3.5, 7.0, 3.5);
    ps.gravity = new Vector3(0, -11.0, 0);
    ps.targetStopDuration = 0.25;
    ps.disposeOnStop = true;
    ps.start();
  }

  public createDurianSlime(position: Vector3): void {
    const ps = new ParticleSystem('durianSlime', 55, this.scene);
    ps.particleTexture = this.particleTexture;
    ps.emitter = new Vector3(position.x, 0.3, position.z);
    ps.color1 = new Color4(0.4, 0.85, 0.2, 1.0);
    ps.color2 = new Color4(0.6, 0.95, 0.1, 1.0);
    ps.colorDead = new Color4(0.2, 0.5, 0.1, 0.0);
    ps.minSize = 0.3;
    ps.maxSize = 0.8;
    ps.minLifeTime = 0.35;
    ps.maxLifeTime = 0.7;
    ps.emitRate = 280;
    ps.direction1 = new Vector3(-3.5, 3.5, -3.5);
    ps.direction2 = new Vector3(3.5, 5.5, 3.5);
    ps.gravity = new Vector3(0, -11, 0);
    ps.targetStopDuration = 0.2;
    ps.disposeOnStop = true;
    ps.start();
  }

  public createExplosion(position: Vector3): void {
    this.createDuckSplash(position);
  }
}
