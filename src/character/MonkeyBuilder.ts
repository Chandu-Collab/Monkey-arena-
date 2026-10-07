import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
  ShadowGenerator,
} from '@babylonjs/core';

export interface MonkeyMeshOptions {
  name: string;
  bodyColor?: Color3;
  bellyColor?: Color3;
  scale?: number;
  isAI?: boolean;
}

export class MonkeyCharacter {
  public root: TransformNode;
  public bodyMesh!: Mesh;
  public headMesh!: Mesh;
  public leftArm!: Mesh;
  public rightArm!: Mesh;
  public leftLeg!: Mesh;
  public rightLeg!: Mesh;
  public tail!: Mesh;
  public alertMarker!: Mesh;

  public isMoving: boolean = false;
  public isSprinting: boolean = false;
  public isJumping: boolean = false;
  public isHoldingBanana: boolean = false;
  public isAlerted: boolean = false;

  private animTimer: number = 0;
  private scale: number;

  constructor(
    public name: string,
    private scene: Scene,
    options: MonkeyMeshOptions = { name: 'monkey' },
    shadowGenerator?: ShadowGenerator
  ) {
    this.scale = options.scale || 1.0;
    this.root = new TransformNode(name, scene);
    this.buildMonkey(options, shadowGenerator);
  }

  private buildMonkey(options: MonkeyMeshOptions, shadowGenerator?: ShadowGenerator): void {
    const scale = this.scale;
    
    // Materials
    const furMat = new StandardMaterial(`${this.name}_furMat`, this.scene);
    furMat.diffuseColor = options.bodyColor || new Color3(0.48, 0.25, 0.12);
    furMat.specularColor = new Color3(0.1, 0.1, 0.1);

    const skinMat = new StandardMaterial(`${this.name}_skinMat`, this.scene);
    skinMat.diffuseColor = options.bellyColor || new Color3(0.92, 0.72, 0.48);
    skinMat.specularColor = new Color3(0.05, 0.05, 0.05);

    const eyeMat = new StandardMaterial(`${this.name}_eyeMat`, this.scene);
    eyeMat.diffuseColor = new Color3(0.05, 0.05, 0.05);
    eyeMat.specularColor = new Color3(0.9, 0.9, 0.9);

    const earInnerMat = new StandardMaterial(`${this.name}_earInnerMat`, this.scene);
    earInnerMat.diffuseColor = new Color3(0.95, 0.65, 0.55);

    // 1. Torso / Body
    this.bodyMesh = MeshBuilder.CreateSphere(
      `${this.name}_body`,
      { diameterX: 0.9 * scale, diameterY: 1.1 * scale, diameterZ: 0.85 * scale, segments: 16 },
      this.scene
    );
    this.bodyMesh.position.y = 0.85 * scale;
    this.bodyMesh.parent = this.root;
    this.bodyMesh.material = furMat;

    // Belly patch
    const belly = MeshBuilder.CreateSphere(
      `${this.name}_belly`,
      { diameterX: 0.65 * scale, diameterY: 0.75 * scale, diameterZ: 0.4 * scale, segments: 12 },
      this.scene
    );
    belly.position = new Vector3(0, 0.8 * scale, 0.32 * scale);
    belly.parent = this.root;
    belly.material = skinMat;

    // 2. Head
    this.headMesh = MeshBuilder.CreateSphere(
      `${this.name}_head`,
      { diameter: 0.8 * scale, segments: 16 },
      this.scene
    );
    this.headMesh.position = new Vector3(0, 1.55 * scale, 0.05 * scale);
    this.headMesh.parent = this.root;
    this.headMesh.material = furMat;

    // Muzzle
    const muzzle = MeshBuilder.CreateSphere(
      `${this.name}_muzzle`,
      { diameterX: 0.5 * scale, diameterY: 0.38 * scale, diameterZ: 0.42 * scale, segments: 12 },
      this.scene
    );
    muzzle.position = new Vector3(0, 1.45 * scale, 0.35 * scale);
    muzzle.parent = this.root;
    muzzle.material = skinMat;

    // Nose
    const nose = MeshBuilder.CreateSphere(
      `${this.name}_nose`,
      { diameterX: 0.12 * scale, diameterY: 0.08 * scale, diameterZ: 0.08 * scale },
      this.scene
    );
    nose.position = new Vector3(0, 1.52 * scale, 0.54 * scale);
    nose.parent = this.root;
    nose.material = eyeMat;

    // Eyes
    const leftEye = MeshBuilder.CreateSphere(
      `${this.name}_leftEye`,
      { diameter: 0.12 * scale, segments: 8 },
      this.scene
    );
    leftEye.position = new Vector3(-0.16 * scale, 1.62 * scale, 0.38 * scale);
    leftEye.parent = this.root;
    leftEye.material = eyeMat;

    const rightEye = MeshBuilder.CreateSphere(
      `${this.name}_rightEye`,
      { diameter: 0.12 * scale, segments: 8 },
      this.scene
    );
    rightEye.position = new Vector3(0.16 * scale, 1.62 * scale, 0.38 * scale);
    rightEye.parent = this.root;
    rightEye.material = eyeMat;

    // Big Iconic Ears
    const leftEar = MeshBuilder.CreateCylinder(
      `${this.name}_leftEar`,
      { diameter: 0.38 * scale, height: 0.08 * scale, tessellation: 16 },
      this.scene
    );
    leftEar.position = new Vector3(-0.48 * scale, 1.6 * scale, 0);
    leftEar.rotation.z = Math.PI / 3;
    leftEar.rotation.y = Math.PI / 12;
    leftEar.parent = this.root;
    leftEar.material = furMat;

    const leftEarInner = MeshBuilder.CreateCylinder(
      `${this.name}_leftEarInner`,
      { diameter: 0.24 * scale, height: 0.09 * scale, tessellation: 12 },
      this.scene
    );
    leftEarInner.position = new Vector3(-0.48 * scale, 1.6 * scale, 0.02 * scale);
    leftEarInner.rotation.z = Math.PI / 3;
    leftEarInner.parent = this.root;
    leftEarInner.material = earInnerMat;

    const rightEar = MeshBuilder.CreateCylinder(
      `${this.name}_rightEar`,
      { diameter: 0.38 * scale, height: 0.08 * scale, tessellation: 16 },
      this.scene
    );
    rightEar.position = new Vector3(0.48 * scale, 1.6 * scale, 0);
    rightEar.rotation.z = -Math.PI / 3;
    rightEar.rotation.y = -Math.PI / 12;
    rightEar.parent = this.root;
    rightEar.material = furMat;

    const rightEarInner = MeshBuilder.CreateCylinder(
      `${this.name}_rightEarInner`,
      { diameter: 0.24 * scale, height: 0.09 * scale, tessellation: 12 },
      this.scene
    );
    rightEarInner.position = new Vector3(0.48 * scale, 1.6 * scale, 0.02 * scale);
    rightEarInner.rotation.z = -Math.PI / 3;
    rightEarInner.parent = this.root;
    rightEarInner.material = earInnerMat;

    // Limbs - Arms
    this.leftArm = MeshBuilder.CreateCapsule(
      `${this.name}_leftArm`,
      { radius: 0.11 * scale, height: 0.65 * scale },
      this.scene
    );
    this.leftArm.position = new Vector3(-0.52 * scale, 0.85 * scale, 0.05 * scale);
    this.leftArm.rotation.z = -0.3;
    this.leftArm.parent = this.root;
    this.leftArm.material = furMat;

    this.rightArm = MeshBuilder.CreateCapsule(
      `${this.name}_rightArm`,
      { radius: 0.11 * scale, height: 0.65 * scale },
      this.scene
    );
    this.rightArm.position = new Vector3(0.52 * scale, 0.85 * scale, 0.05 * scale);
    this.rightArm.rotation.z = 0.3;
    this.rightArm.parent = this.root;
    this.rightArm.material = furMat;

    // Limbs - Legs
    this.leftLeg = MeshBuilder.CreateCapsule(
      `${this.name}_leftLeg`,
      { radius: 0.13 * scale, height: 0.55 * scale },
      this.scene
    );
    this.leftLeg.position = new Vector3(-0.25 * scale, 0.32 * scale, 0);
    this.leftLeg.parent = this.root;
    this.leftLeg.material = furMat;

    this.rightLeg = MeshBuilder.CreateCapsule(
      `${this.name}_rightLeg`,
      { radius: 0.13 * scale, height: 0.55 * scale },
      this.scene
    );
    this.rightLeg.position = new Vector3(0.25 * scale, 0.32 * scale, 0);
    this.rightLeg.parent = this.root;
    this.rightLeg.material = furMat;

    // Tail
    this.tail = MeshBuilder.CreateCylinder(
      `${this.name}_tail`,
      { diameterTop: 0.06 * scale, diameterBottom: 0.12 * scale, height: 0.8 * scale, tessellation: 8 },
      this.scene
    );
    this.tail.position = new Vector3(0, 0.7 * scale, -0.45 * scale);
    this.tail.rotation.x = -Math.PI / 3.5;
    this.tail.parent = this.root;
    this.tail.material = furMat;

    // Alert Exclamation / Anger Marker
    this.alertMarker = MeshBuilder.CreateCylinder(
      `${this.name}_alertMarker`,
      { diameterTop: 0.35, diameterBottom: 0.08, height: 0.7, tessellation: 12 },
      this.scene
    );
    this.alertMarker.position = new Vector3(0, 2.6 * scale, 0);
    this.alertMarker.parent = this.root;
    const alertMat = new StandardMaterial(`${this.name}_alertMat`, this.scene);
    alertMat.diffuseColor = new Color3(1.0, 0.1, 0.1);
    alertMat.emissiveColor = new Color3(0.8, 0.05, 0.05);
    this.alertMarker.material = alertMat;
    this.alertMarker.isVisible = false;

    // Shadows
    if (shadowGenerator) {
      shadowGenerator.addShadowCaster(this.bodyMesh);
      shadowGenerator.addShadowCaster(this.headMesh);
      shadowGenerator.addShadowCaster(this.leftArm);
      shadowGenerator.addShadowCaster(this.rightArm);
      shadowGenerator.addShadowCaster(this.leftLeg);
      shadowGenerator.addShadowCaster(this.rightLeg);
    }
  }

  public updateAnimation(deltaSeconds: number): void {
    const animSpeed = this.isSprinting ? 22 : this.isMoving ? 14 : 3;
    this.animTimer += deltaSeconds * animSpeed;

    // Alert indicator state
    this.alertMarker.isVisible = this.isAlerted;
    if (this.isAlerted) {
      this.alertMarker.position.y = 2.6 * this.scale + Math.sin(this.animTimer * 2) * 0.15;
      this.alertMarker.rotation.y += deltaSeconds * 4;
    }

    if (this.isHoldingBanana) {
      // Hold hands high overhead carrying the prize!
      this.leftArm.position.y = 1.3 * this.scale;
      this.leftArm.rotation.z = -1.2;
      this.leftArm.rotation.x = -0.3;

      this.rightArm.position.y = 1.3 * this.scale;
      this.rightArm.rotation.z = 1.2;
      this.rightArm.rotation.x = -0.3;
    } else if (this.isJumping) {
      // Jumping pose (arms out, legs tucked)
      this.leftArm.rotation.z = -0.8;
      this.leftArm.rotation.x = -0.5;
      this.rightArm.rotation.z = 0.8;
      this.rightArm.rotation.x = -0.5;
      this.leftLeg.rotation.x = 0.6;
      this.rightLeg.rotation.x = 0.6;
    } else if (this.isMoving) {
      // Running / Walking cycle
      const swing = Math.sin(this.animTimer);
      const intensity = this.isSprinting ? 1.1 : 0.7;

      this.leftArm.position.y = 0.85 * this.scale;
      this.leftArm.rotation.z = -0.3;
      this.leftArm.rotation.x = swing * intensity;

      this.rightArm.position.y = 0.85 * this.scale;
      this.rightArm.rotation.z = 0.3;
      this.rightArm.rotation.x = -swing * intensity;

      this.leftLeg.rotation.x = -swing * (intensity * 0.85);
      this.rightLeg.rotation.x = swing * (intensity * 0.85);

      this.headMesh.position.y = 1.55 * this.scale + Math.abs(Math.sin(this.animTimer * 2)) * 0.09;
      this.tail.rotation.z = Math.sin(this.animTimer * 1.5) * 0.5;
    } else {
      // Idle breathing
      this.leftArm.position.y = 0.85 * this.scale;
      this.leftArm.rotation.z = -0.3;
      this.leftArm.rotation.x = 0;

      this.rightArm.position.y = 0.85 * this.scale;
      this.rightArm.rotation.z = 0.3;
      this.rightArm.rotation.x = 0;

      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;

      this.headMesh.position.y = 1.55 * this.scale + Math.sin(this.animTimer) * 0.02;
      this.tail.rotation.z = Math.sin(this.animTimer * 0.8) * 0.2;
    }
  }
}
