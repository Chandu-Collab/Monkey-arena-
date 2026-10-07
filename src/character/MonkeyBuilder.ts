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
  hasGreenGlasses?: boolean; // For Pink Monkey (Player)
  hasEarring?: boolean;      // For Red Monkey
  hasLaptopBag?: boolean;    // For Purple Monkey
  isSlim?: boolean;          // Slender & Slim Build (Red Monkey)
  hasShirt?: boolean;        // Fitted Shirt (Red Monkey)
  shirtColor?: Color3;
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
    const isSlim = !!options.isSlim;
    
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

    // 1. Torso / Body (Adjustable width for slim profile)
    const bodyWidth = (isSlim ? 0.58 : 0.9) * scale;
    const bodyHeight = (isSlim ? 1.26 : 1.1) * scale;
    const bodyDepth = (isSlim ? 0.56 : 0.85) * scale;

    this.bodyMesh = MeshBuilder.CreateSphere(
      `${this.name}_body`,
      { diameterX: bodyWidth, diameterY: bodyHeight, diameterZ: bodyDepth, segments: 16 },
      this.scene
    );
    this.bodyMesh.position.y = 0.85 * scale;
    this.bodyMesh.parent = this.root;
    this.bodyMesh.material = furMat;

    // Belly patch
    const bellyWidth = (isSlim ? 0.42 : 0.65) * scale;
    const bellyHeight = (isSlim ? 0.88 : 0.75) * scale;
    const bellyDepth = (isSlim ? 0.26 : 0.4) * scale;
    const bellyZ = (isSlim ? 0.22 : 0.32) * scale;

    const belly = MeshBuilder.CreateSphere(
      `${this.name}_belly`,
      { diameterX: bellyWidth, diameterY: bellyHeight, diameterZ: bellyDepth, segments: 12 },
      this.scene
    );
    belly.position = new Vector3(0, 0.8 * scale, bellyZ);
    belly.parent = this.root;
    belly.material = skinMat;

    // 2. Head & Authentic Simian Face (All parented to headMesh)
    this.headMesh = MeshBuilder.CreateSphere(
      `${this.name}_head`,
      { diameter: (isSlim ? 0.76 : 0.82) * scale, segments: 16 },
      this.scene
    );
    this.headMesh.position = new Vector3(0, (isSlim ? 1.58 : 1.55) * scale, 0.05 * scale);
    this.headMesh.parent = this.root;
    this.headMesh.material = furMat;

    // Prominent Simian Brow Ridge (Iconic Ape/Monkey Feature)
    const browRidge = MeshBuilder.CreateSphere(
      `${this.name}_browRidge`,
      { diameterX: 0.58 * scale, diameterY: 0.16 * scale, diameterZ: 0.22 * scale, segments: 10 },
      this.scene
    );
    browRidge.position = new Vector3(0, 0.14 * scale, 0.32 * scale);
    browRidge.parent = this.headMesh;
    browRidge.material = furMat;

    // Heart-Shaped Simian Face Mask (Around Eyes & Cheeks)
    const faceMask = MeshBuilder.CreateSphere(
      `${this.name}_faceMask`,
      { diameterX: 0.54 * scale, diameterY: 0.42 * scale, diameterZ: 0.22 * scale, segments: 12 },
      this.scene
    );
    faceMask.position = new Vector3(0, 0.02 * scale, 0.28 * scale);
    faceMask.parent = this.headMesh;
    faceMask.material = skinMat;

    // Plump Rounded Monkey Muzzle & Mouth (Short & wide, NOT a long dog snout)
    const muzzle = MeshBuilder.CreateSphere(
      `${this.name}_muzzle`,
      { diameterX: 0.46 * scale, diameterY: 0.28 * scale, diameterZ: 0.26 * scale, segments: 12 },
      this.scene
    );
    muzzle.position = new Vector3(0, -0.14 * scale, 0.30 * scale);
    muzzle.parent = this.headMesh;
    muzzle.material = skinMat;

    // Cute Simian Nostrils (Instead of a pointed dog nose)
    const leftNose = MeshBuilder.CreateSphere(
      `${this.name}_noseL`,
      { diameterX: 0.045 * scale, diameterY: 0.035 * scale, diameterZ: 0.03 * scale },
      this.scene
    );
    leftNose.position = new Vector3(-0.045 * scale, -0.09 * scale, 0.42 * scale);
    leftNose.parent = this.headMesh;
    leftNose.material = eyeMat;

    const rightNose = MeshBuilder.CreateSphere(
      `${this.name}_noseR`,
      { diameterX: 0.045 * scale, diameterY: 0.035 * scale, diameterZ: 0.03 * scale },
      this.scene
    );
    rightNose.position = new Vector3(0.045 * scale, -0.09 * scale, 0.42 * scale);
    rightNose.parent = this.headMesh;
    rightNose.material = eyeMat;

    // Big Expressive Eyes (Set inside face mask under brow)
    const leftEye = MeshBuilder.CreateSphere(
      `${this.name}_leftEye`,
      { diameter: 0.12 * scale, segments: 8 },
      this.scene
    );
    leftEye.position = new Vector3(-0.14 * scale, 0.06 * scale, 0.37 * scale);
    leftEye.parent = this.headMesh;
    leftEye.material = eyeMat;

    const rightEye = MeshBuilder.CreateSphere(
      `${this.name}_rightEye`,
      { diameter: 0.12 * scale, segments: 8 },
      this.scene
    );
    rightEye.position = new Vector3(0.14 * scale, 0.06 * scale, 0.37 * scale);
    rightEye.parent = this.headMesh;
    rightEye.material = eyeMat;

    // Big Iconic Round Monkey Ears (Cupped on direct sides of head)
    const leftEar = MeshBuilder.CreateCylinder(
      `${this.name}_leftEar`,
      { diameter: 0.40 * scale, height: 0.06 * scale, tessellation: 20 },
      this.scene
    );
    leftEar.position = new Vector3(-0.44 * scale, 0.02 * scale, -0.02 * scale);
    leftEar.rotation.z = Math.PI / 2;
    leftEar.rotation.y = Math.PI / 10;
    leftEar.parent = this.headMesh;
    leftEar.material = furMat;

    const leftEarInner = MeshBuilder.CreateCylinder(
      `${this.name}_leftEarInner`,
      { diameter: 0.25 * scale, height: 0.07 * scale, tessellation: 16 },
      this.scene
    );
    leftEarInner.position = new Vector3(-0.44 * scale, 0.02 * scale, 0.0);
    leftEarInner.rotation.z = Math.PI / 2;
    leftEarInner.rotation.y = Math.PI / 10;
    leftEarInner.parent = this.headMesh;
    leftEarInner.material = earInnerMat;

    const rightEar = MeshBuilder.CreateCylinder(
      `${this.name}_rightEar`,
      { diameter: 0.40 * scale, height: 0.06 * scale, tessellation: 20 },
      this.scene
    );
    rightEar.position = new Vector3(0.44 * scale, 0.02 * scale, -0.02 * scale);
    rightEar.rotation.z = -Math.PI / 2;
    rightEar.rotation.y = -Math.PI / 10;
    rightEar.parent = this.headMesh;
    rightEar.material = furMat;

    const rightEarInner = MeshBuilder.CreateCylinder(
      `${this.name}_rightEarInner`,
      { diameter: 0.25 * scale, height: 0.07 * scale, tessellation: 16 },
      this.scene
    );
    rightEarInner.position = new Vector3(0.44 * scale, 0.02 * scale, 0.0);
    rightEarInner.rotation.z = -Math.PI / 2;
    rightEarInner.rotation.y = -Math.PI / 10;
    rightEarInner.parent = this.headMesh;
    rightEarInner.material = earInnerMat;

    // --- ACCESSORY 1: DARK GREEN SPECTACLES (Clue for Pink Monkey) ---
    if (options.hasGreenGlasses) {
      const glassesFrameMat = new StandardMaterial(`${this.name}_glassesFrameMat`, this.scene);
      glassesFrameMat.diffuseColor = new Color3(0.02, 0.38, 0.12); // Deep dark forest green
      glassesFrameMat.emissiveColor = new Color3(0.01, 0.15, 0.04);
      glassesFrameMat.specularColor = new Color3(0.8, 0.9, 0.8);

      const lensMat = new StandardMaterial(`${this.name}_lensMat`, this.scene);
      lensMat.diffuseColor = new Color3(0.04, 0.32, 0.12);
      lensMat.emissiveColor = new Color3(0.02, 0.18, 0.06);
      lensMat.alpha = 0.72;

      // Left Frame & Lens
      const leftFrame = MeshBuilder.CreateTorus(
        `${this.name}_leftFrame`,
        { diameter: 0.22 * scale, thickness: 0.04 * scale, tessellation: 20 },
        this.scene
      );
      leftFrame.position = new Vector3(-0.14 * scale, 0.06 * scale, 0.40 * scale);
      leftFrame.rotation.x = Math.PI / 2;
      leftFrame.parent = this.headMesh;
      leftFrame.material = glassesFrameMat;

      const leftLens = MeshBuilder.CreateCylinder(
        `${this.name}_leftLens`,
        { diameter: 0.19 * scale, height: 0.02 * scale, tessellation: 16 },
        this.scene
      );
      leftLens.position = new Vector3(-0.14 * scale, 0.06 * scale, 0.40 * scale);
      leftLens.rotation.x = Math.PI / 2;
      leftLens.parent = this.headMesh;
      leftLens.material = lensMat;

      // Right Frame & Lens
      const rightFrame = MeshBuilder.CreateTorus(
        `${this.name}_rightFrame`,
        { diameter: 0.22 * scale, thickness: 0.04 * scale, tessellation: 20 },
        this.scene
      );
      rightFrame.position = new Vector3(0.14 * scale, 0.06 * scale, 0.40 * scale);
      rightFrame.rotation.x = Math.PI / 2;
      rightFrame.parent = this.headMesh;
      rightFrame.material = glassesFrameMat;

      const rightLens = MeshBuilder.CreateCylinder(
        `${this.name}_rightLens`,
        { diameter: 0.19 * scale, height: 0.02 * scale, tessellation: 16 },
        this.scene
      );
      rightLens.position = new Vector3(0.14 * scale, 0.06 * scale, 0.40 * scale);
      rightLens.rotation.x = Math.PI / 2;
      rightLens.parent = this.headMesh;
      rightLens.material = lensMat;

      // Glasses Bridge
      const bridge = MeshBuilder.CreateCylinder(
        `${this.name}_glassesBridge`,
        { diameter: 0.03 * scale, height: 0.10 * scale, tessellation: 8 },
        this.scene
      );
      bridge.position = new Vector3(0, 0.06 * scale, 0.41 * scale);
      bridge.rotation.z = Math.PI / 2;
      bridge.parent = this.headMesh;
      bridge.material = glassesFrameMat;

      // Temples / Sidearms
      const leftArmGlass = MeshBuilder.CreateCylinder(
        `${this.name}_leftArmGlass`,
        { diameter: 0.025 * scale, height: 0.36 * scale, tessellation: 8 },
        this.scene
      );
      leftArmGlass.position = new Vector3(-0.25 * scale, 0.06 * scale, 0.22 * scale);
      leftArmGlass.rotation.x = Math.PI / 2;
      leftArmGlass.parent = this.headMesh;
      leftArmGlass.material = glassesFrameMat;

      const rightArmGlass = MeshBuilder.CreateCylinder(
        `${this.name}_rightArmGlass`,
        { diameter: 0.025 * scale, height: 0.36 * scale, tessellation: 8 },
        this.scene
      );
      rightArmGlass.position = new Vector3(0.25 * scale, 0.06 * scale, 0.22 * scale);
      rightArmGlass.rotation.x = Math.PI / 2;
      rightArmGlass.parent = this.headMesh;
      rightArmGlass.material = glassesFrameMat;
    }

    // --- ACCESSORY 2: GOLDEN EARRING (Clue for Red Monkey) ---
    if (options.hasEarring) {
      const goldMat = new StandardMaterial(`${this.name}_earringMat`, this.scene);
      goldMat.diffuseColor = new Color3(1.0, 0.85, 0.15);
      goldMat.emissiveColor = new Color3(0.35, 0.25, 0.02);
      goldMat.specularColor = new Color3(1.0, 0.95, 0.8);

      const earring = MeshBuilder.CreateTorus(
        `${this.name}_earring`,
        { diameter: 0.22 * scale, thickness: 0.045 * scale, tessellation: 24 },
        this.scene
      );
      earring.position = new Vector3(-0.46 * scale, -0.12 * scale, -0.02 * scale);
      earring.rotation.y = Math.PI / 6;
      earring.parent = this.headMesh;
      earring.material = goldMat;
      if (shadowGenerator) shadowGenerator.addShadowCaster(earring);
    }

    // --- ACCESSORY 3: LAPTOP BAG (Clue for Purple Monkey) ---
    if (options.hasLaptopBag) {
      const bagMat = new StandardMaterial(`${this.name}_bagMat`, this.scene);
      bagMat.diffuseColor = new Color3(0.18, 0.2, 0.24); // Executive dark slate
      bagMat.specularColor = new Color3(0.35, 0.35, 0.35);

      const strapMat = new StandardMaterial(`${this.name}_strapMat`, this.scene);
      strapMat.diffuseColor = new Color3(0.12, 0.13, 0.15);

      const badgeMat = new StandardMaterial(`${this.name}_bagBadgeMat`, this.scene);
      badgeMat.diffuseColor = new Color3(0.85, 0.85, 0.9);
      badgeMat.specularColor = new Color3(1.0, 1.0, 1.0);

      // Laptop Bag Main Compartment
      const bagBox = MeshBuilder.CreateBox(
        `${this.name}_laptopBag`,
        { width: 0.48 * scale, height: 0.36 * scale, depth: 0.16 * scale },
        this.scene
      );
      bagBox.position = new Vector3(0.48 * scale, -0.15 * scale, 0.08 * scale);
      bagBox.rotation.z = -0.18;
      bagBox.parent = this.bodyMesh;
      bagBox.material = bagMat;

      // Metallic Buckle
      const buckle = MeshBuilder.CreateBox(
        `${this.name}_bagBuckle`,
        { width: 0.12 * scale, height: 0.08 * scale, depth: 0.18 * scale },
        this.scene
      );
      buckle.position = new Vector3(0.48 * scale, -0.15 * scale, 0.09 * scale);
      buckle.rotation.z = -0.18;
      buckle.parent = this.bodyMesh;
      buckle.material = badgeMat;

      // Crossbody Strap across Torso
      const strap = MeshBuilder.CreateTorus(
        `${this.name}_bagStrap`,
        { diameter: 0.95 * scale, thickness: 0.06 * scale, tessellation: 24 },
        this.scene
      );
      strap.position = new Vector3(0, 0.05 * scale, 0);
      strap.rotation.z = -Math.PI / 4.2;
      strap.rotation.x = Math.PI / 12;
      strap.parent = this.bodyMesh;
      strap.material = strapMat;

      if (shadowGenerator) {
        shadowGenerator.addShadowCaster(bagBox);
      }
    }

    // --- ACCESSORY 4: STYLISH FITTED SHIRT (For Red Monkey) ---
    if (options.hasShirt) {
      const shirtMat = new StandardMaterial(`${this.name}_shirtMat`, this.scene);
      // Sophisticated Navy/Slate Blue complementary to red fur
      shirtMat.diffuseColor = options.shirtColor || new Color3(0.12, 0.19, 0.32);
      shirtMat.specularColor = new Color3(0.15, 0.15, 0.2);

      const collarMat = new StandardMaterial(`${this.name}_collarMat`, this.scene);
      collarMat.diffuseColor = options.shirtColor || new Color3(0.12, 0.19, 0.32);
      collarMat.specularColor = new Color3(0.25, 0.25, 0.3);

      const buttonMat = new StandardMaterial(`${this.name}_shirtButtonMat`, this.scene);
      buttonMat.diffuseColor = new Color3(0.95, 0.95, 0.92);
      buttonMat.specularColor = new Color3(1.0, 1.0, 1.0);

      // 1. Fitted Shirt Torso Vest
      const shirtVest = MeshBuilder.CreateCylinder(
        `${this.name}_shirtVest`,
        {
          diameterTop: (isSlim ? 0.62 : 0.94) * scale,
          diameterBottom: (isSlim ? 0.58 : 0.90) * scale,
          height: (isSlim ? 0.95 : 0.82) * scale,
          tessellation: 16,
        },
        this.scene
      );
      shirtVest.position = new Vector3(0, 0, 0);
      shirtVest.parent = this.bodyMesh;
      shirtVest.material = shirtMat;

      // 2. Folded Collar Left Wing
      const leftCollar = MeshBuilder.CreateBox(
        `${this.name}_leftCollar`,
        { width: 0.16 * scale, height: 0.08 * scale, depth: 0.22 * scale },
        this.scene
      );
      leftCollar.position = new Vector3(-0.13 * scale, (isSlim ? 0.58 : 0.50) * scale, (isSlim ? 0.18 : 0.28) * scale);
      leftCollar.rotation.y = Math.PI / 4;
      leftCollar.rotation.z = -0.22;
      leftCollar.parent = this.bodyMesh;
      leftCollar.material = collarMat;

      // 3. Folded Collar Right Wing
      const rightCollar = MeshBuilder.CreateBox(
        `${this.name}_rightCollar`,
        { width: 0.16 * scale, height: 0.08 * scale, depth: 0.22 * scale },
        this.scene
      );
      rightCollar.position = new Vector3(0.13 * scale, (isSlim ? 0.58 : 0.50) * scale, (isSlim ? 0.18 : 0.28) * scale);
      rightCollar.rotation.y = -Math.PI / 4;
      rightCollar.rotation.z = 0.22;
      rightCollar.parent = this.bodyMesh;
      rightCollar.material = collarMat;

      // 4. Center Placket Strip
      const placket = MeshBuilder.CreateBox(
        `${this.name}_placket`,
        { width: 0.08 * scale, height: (isSlim ? 0.78 : 0.68) * scale, depth: 0.03 * scale },
        this.scene
      );
      placket.position = new Vector3(0, 0.08 * scale, (isSlim ? 0.29 : 0.44) * scale);
      placket.parent = this.bodyMesh;
      placket.material = shirtMat;

      // 5. Pearl Buttons
      for (let b = 0; b < 3; b++) {
        const btn = MeshBuilder.CreateCylinder(
          `${this.name}_shirtBtn_${b}`,
          { diameter: 0.04 * scale, height: 0.02 * scale, tessellation: 8 },
          this.scene
        );
        btn.position = new Vector3(0, (-0.18 + b * 0.22) * scale, (isSlim ? 0.31 : 0.46) * scale);
        btn.rotation.x = Math.PI / 2;
        btn.parent = this.bodyMesh;
        btn.material = buttonMat;
      }

      if (shadowGenerator) {
        shadowGenerator.addShadowCaster(shirtVest);
      }
    }

    // Limbs - Arms (Slender when isSlim)
    const armRadius = (isSlim ? 0.08 : 0.11) * scale;
    const armHeight = (isSlim ? 0.72 : 0.65) * scale;
    const armX = (isSlim ? 0.38 : 0.52) * scale;

    this.leftArm = MeshBuilder.CreateCapsule(
      `${this.name}_leftArm`,
      { radius: armRadius, height: armHeight },
      this.scene
    );
    this.leftArm.position = new Vector3(-armX, 0.85 * scale, 0.05 * scale);
    this.leftArm.rotation.z = -0.3;
    this.leftArm.parent = this.root;
    this.leftArm.material = furMat;

    this.rightArm = MeshBuilder.CreateCapsule(
      `${this.name}_rightArm`,
      { radius: armRadius, height: armHeight },
      this.scene
    );
    this.rightArm.position = new Vector3(armX, 0.85 * scale, 0.05 * scale);
    this.rightArm.rotation.z = 0.3;
    this.rightArm.parent = this.root;
    this.rightArm.material = furMat;

    // Limbs - Legs (Longer and slimmer when isSlim)
    const legRadius = (isSlim ? 0.09 : 0.13) * scale;
    const legHeight = (isSlim ? 0.68 : 0.55) * scale;
    const legX = (isSlim ? 0.18 : 0.25) * scale;

    this.leftLeg = MeshBuilder.CreateCapsule(
      `${this.name}_leftLeg`,
      { radius: legRadius, height: legHeight },
      this.scene
    );
    this.leftLeg.position = new Vector3(-legX, 0.32 * scale, 0);
    this.leftLeg.parent = this.root;
    this.leftLeg.material = furMat;

    this.rightLeg = MeshBuilder.CreateCapsule(
      `${this.name}_rightLeg`,
      { radius: legRadius, height: legHeight },
      this.scene
    );
    this.rightLeg.position = new Vector3(legX, 0.32 * scale, 0);
    this.rightLeg.parent = this.root;
    this.rightLeg.material = furMat;

    // Prehensile Curly Monkey Tail
    this.tail = MeshBuilder.CreateCylinder(
      `${this.name}_tail`,
      { diameterTop: 0.06 * scale, diameterBottom: 0.11 * scale, height: 0.85 * scale, tessellation: 10 },
      this.scene
    );
    this.tail.position = new Vector3(0, 0.7 * scale, -0.45 * scale);
    this.tail.rotation.x = -Math.PI / 3.2;
    this.tail.parent = this.root;
    this.tail.material = furMat;

    const tailCurl = MeshBuilder.CreateTorus(
      `${this.name}_tailCurl`,
      { diameter: 0.26 * scale, thickness: 0.065 * scale, tessellation: 16 },
      this.scene
    );
    tailCurl.position = new Vector3(0, 0.40 * scale, 0);
    tailCurl.rotation.x = Math.PI / 2;
    tailCurl.parent = this.tail;
    tailCurl.material = furMat;

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
    // 1. Stride frequency proportional to locomotion pace
    const targetPace = this.isSprinting ? 16.0 : this.isMoving ? 10.5 : 2.4;
    this.animTimer += deltaSeconds * targetPace;

    // 2. Alert indicator state
    this.alertMarker.isVisible = this.isAlerted;
    if (this.isAlerted) {
      this.alertMarker.position.y = 2.6 * this.scale + Math.sin(this.animTimer * 2) * 0.12;
      this.alertMarker.rotation.y += deltaSeconds * 3.5;
    }

    const sin = Math.sin(this.animTimer);
    const cos = Math.cos(this.animTimer);
    const doubleSin = Math.sin(this.animTimer * 2);
    const intensity = this.isSprinting ? 1.05 : 0.78;

    // 3. Natural Leg Locomotion & Footfall Physics
    if (this.isJumping) {
      this.leftLeg.rotation.x = 0.5;
      this.rightLeg.rotation.x = 0.5;
      this.leftLeg.rotation.z = -0.08;
      this.rightLeg.rotation.z = 0.08;
      this.leftLeg.position.y = 0.42 * this.scale;
      this.rightLeg.position.y = 0.42 * this.scale;
    } else if (this.isMoving) {
      this.leftLeg.rotation.x = -sin * intensity;
      this.rightLeg.rotation.x = sin * intensity;
      this.leftLeg.rotation.z = -0.05;
      this.rightLeg.rotation.z = 0.05;

      // Smooth step lift (cosine parabolic foot arch)
      const leftStepLift = Math.max(0, -sin) * 0.10 * this.scale;
      const rightStepLift = Math.max(0, sin) * 0.10 * this.scale;
      this.leftLeg.position.y = 0.32 * this.scale + leftStepLift;
      this.rightLeg.position.y = 0.32 * this.scale + rightStepLift;
    } else {
      // Natural grounded stance
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftLeg.rotation.z = -0.04;
      this.rightLeg.rotation.z = 0.04;
      this.leftLeg.position.y = 0.32 * this.scale;
      this.rightLeg.position.y = 0.32 * this.scale;
    }

    // 4. Arm Swing & Banana Carry Posture
    if (this.isHoldingBanana) {
      // Hands held high overhead proudly carrying the golden banana with elastic arm balance
      const carryBob = this.isMoving ? doubleSin * 0.05 : 0;
      this.leftArm.position.y = (1.28 + carryBob) * this.scale;
      this.leftArm.rotation.z = -1.15;
      this.leftArm.rotation.x = -0.25 + (this.isMoving ? sin * 0.12 : 0);

      this.rightArm.position.y = (1.28 + carryBob) * this.scale;
      this.rightArm.rotation.z = 1.15;
      this.rightArm.rotation.x = -0.25 - (this.isMoving ? sin * 0.12 : 0);
    } else if (this.isJumping) {
      this.leftArm.position.y = 0.95 * this.scale;
      this.leftArm.rotation.z = -0.75;
      this.leftArm.rotation.x = -0.45;

      this.rightArm.position.y = 0.95 * this.scale;
      this.rightArm.rotation.z = 0.75;
      this.rightArm.rotation.x = -0.45;
    } else if (this.isMoving) {
      // Natural primate arm counter-swing with outward flare
      this.leftArm.position.y = 0.85 * this.scale;
      this.leftArm.rotation.z = -0.28 - Math.abs(sin) * 0.08;
      this.leftArm.rotation.x = sin * intensity * 0.95;

      this.rightArm.position.y = 0.85 * this.scale;
      this.rightArm.rotation.z = 0.28 + Math.abs(sin) * 0.08;
      this.rightArm.rotation.x = -sin * intensity * 0.95;
    } else {
      // Idle simian breathing stance
      const breath = sin * 0.02;
      this.leftArm.position.y = (0.85 + breath) * this.scale;
      this.leftArm.rotation.z = -0.28;
      this.leftArm.rotation.x = 0;

      this.rightArm.position.y = (0.85 + breath) * this.scale;
      this.rightArm.rotation.z = 0.28;
      this.rightArm.rotation.x = 0;
    }

    // 5. Simian Pelvic Sway, Harmonic Bobbing & Spine Kinematics
    if (this.isMoving) {
      // Smooth double-frequency harmonic bob (one dip per footfall)
      const harmonicBob = (1 - Math.cos(this.animTimer * 2)) * 0.5 * (this.isSprinting ? 0.07 : 0.045);
      this.bodyMesh.position.y = (0.85 + harmonicBob) * this.scale;
      this.headMesh.position.y = (1.55 + harmonicBob * 1.15) * this.scale;

      // Natural forward sprint lean & subtle lateral pelvic roll
      this.bodyMesh.rotation.x = this.isSprinting ? 0.18 : 0.10;
      this.bodyMesh.rotation.z = sin * 0.05; // Gentle hip roll

      // Head counter-stabilization
      this.headMesh.rotation.z = -sin * 0.03;
      this.headMesh.rotation.x = this.isSprinting ? -0.10 : -0.05;

      // Fluid prehensile tail trailing wave
      this.tail.rotation.z = Math.sin(this.animTimer - 0.4) * 0.38;
      this.tail.rotation.x = -Math.PI / 3.4 + cos * 0.12;
    } else {
      // Idle stance
      const idleBreath = sin * 0.015;
      this.bodyMesh.position.y = (0.85 + idleBreath) * this.scale;
      this.headMesh.position.y = (1.55 + idleBreath * 1.5) * this.scale;
      this.bodyMesh.rotation.x = 0;
      this.bodyMesh.rotation.z = 0;
      this.headMesh.rotation.z = 0;
      this.headMesh.rotation.x = 0;

      // Gentle lazy tail swish
      this.tail.rotation.z = Math.sin(this.animTimer * 0.7) * 0.18;
      this.tail.rotation.x = -Math.PI / 3.4 + Math.cos(this.animTimer * 0.7) * 0.05;
    }
  }
}
