import {
  Scene,
  TransformNode,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  ShadowGenerator,
} from '@babylonjs/core';

export class Banana {
  public root: TransformNode;
  public mesh!: Mesh;
  public haloRing!: Mesh;
  private haloMat!: StandardMaterial;
  private bananaMat!: StandardMaterial;

  public isHeld: boolean = false;
  public holder: TransformNode | null = null;
  public basePosition: Vector3;
  private animTimer: number = 0;
  public isPlayerInRange: boolean = false;

  constructor(
    private scene: Scene,
    position: Vector3 = new Vector3(0, 1.4, 0),
    shadowGenerator?: ShadowGenerator
  ) {
    this.basePosition = position.clone();
    this.root = new TransformNode('bananaRoot', scene);
    this.root.position = position.clone();
    this.buildBanana(shadowGenerator);
  }

  private buildBanana(shadowGenerator?: ShadowGenerator): void {
    // 1. Golden Peel Material
    this.bananaMat = new StandardMaterial('bananaMat', this.scene);
    this.bananaMat.diffuseColor = new Color3(1.0, 0.88, 0.05); // Ripe golden yellow
    this.bananaMat.emissiveColor = new Color3(0.42, 0.32, 0.02); // Warm golden glow
    this.bananaMat.specularColor = new Color3(1.0, 0.95, 0.4);
    this.bananaMat.specularPower = 32;

    // 2. Stem & Tip Materials
    const stemMat = new StandardMaterial('bananaStemMat', this.scene);
    stemMat.diffuseColor = new Color3(0.28, 0.32, 0.12); // Slightly greenish-brown woody stem
    stemMat.specularColor = new Color3(0.1, 0.1, 0.1);

    const tipMat = new StandardMaterial('bananaTipMat', this.scene);
    tipMat.diffuseColor = new Color3(0.15, 0.1, 0.05); // Dark bottom nub
    tipMat.specularColor = new Color3(0.05, 0.05, 0.05);

    // 3. Construct Curved Banana Body with 6-faceted Simian Peel
    const numPoints = 24;
    const arcRadius = 1.1;
    const arcAngle = Math.PI * 0.65; // ~118 degrees natural crescent curve
    const points: Vector3[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints; // 0 (stem end) to 1 (flower tip end)
      const angle = -arcAngle / 2 + t * arcAngle;
      // Natural crescent arch
      const x = Math.sin(angle) * arcRadius;
      const y = (1 - Math.cos(angle)) * arcRadius * 0.85;
      points.push(new Vector3(x, y, 0));
    }

    const radiusFunction = (index: number) => {
      const t = index / numPoints;
      // Thick, luscious body in center, tapering to ends
      const profile = Math.sin(t * Math.PI);
      return 0.045 + 0.145 * Math.pow(profile, 0.65);
    };

    this.mesh = MeshBuilder.CreateTube(
      'bananaBody',
      {
        path: points,
        radiusFunction,
        tessellation: 6, // 6 faceted sides just like real banana peels
        cap: Mesh.CAP_ALL,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      this.scene
    );
    this.mesh.material = this.bananaMat;
    this.mesh.parent = this.root;
    // Rotate to rest aesthetically on pedestal
    this.mesh.rotation.z = Math.PI / 12;
    this.mesh.rotation.x = Math.PI / 8;

    // 4. Realistic Curved Woody Stem at top
    const stemStart = points[0];
    const stemPath = [
      stemStart,
      stemStart.add(new Vector3(-0.08, 0.09, 0)),
      stemStart.add(new Vector3(-0.14, 0.18, 0.03)),
    ];
    const stem = MeshBuilder.CreateTube(
      'bananaStem',
      {
        path: stemPath,
        radius: 0.038,
        tessellation: 6,
        cap: Mesh.CAP_ALL,
      },
      this.scene
    );
    stem.material = stemMat;
    stem.parent = this.mesh;

    // 5. Dark Bottom Nub
    const nub = MeshBuilder.CreateSphere(
      'bananaBottomNub',
      { diameterX: 0.08, diameterY: 0.06, diameterZ: 0.08, segments: 6 },
      this.scene
    );
    nub.position = points[points.length - 1].add(new Vector3(0.02, 0.01, 0));
    nub.material = tipMat;
    nub.parent = this.mesh;

    // 6. Glowing Interaction Halo Ring around banana
    this.haloRing = MeshBuilder.CreateTorus(
      'bananaHalo',
      { diameter: 1.9, thickness: 0.05, tessellation: 36 },
      this.scene
    );
    this.haloRing.parent = this.root;
    this.haloRing.position.y = 0.25;
    this.haloMat = new StandardMaterial('bananaHaloMat', this.scene);
    this.haloMat.diffuseColor = new Color3(1.0, 0.9, 0.2);
    this.haloMat.emissiveColor = new Color3(0.8, 0.6, 0.0);
    this.haloRing.material = this.haloMat;

    if (shadowGenerator) {
      shadowGenerator.addShadowCaster(this.mesh);
      shadowGenerator.addShadowCaster(stem);
    }
  }

  public attachTo(holderNode: TransformNode): void {
    this.isHeld = true;
    this.holder = holderNode;
    this.haloRing.isVisible = false;
  }

  public drop(atPosition: Vector3): void {
    this.isHeld = false;
    this.holder = null;
    this.basePosition = atPosition.clone();
    this.basePosition.y = 1.2;
    this.root.position = this.basePosition.clone();
    this.haloRing.isVisible = true;
  }

  public reset(): void {
    this.isHeld = false;
    this.holder = null;
    this.root.position = new Vector3(0, 1.4, 0);
    this.basePosition = new Vector3(0, 1.4, 0);
    this.haloRing.isVisible = true;
  }

  public update(deltaSeconds: number): void {
    this.animTimer += deltaSeconds;

    if (this.isHeld && this.holder) {
      // Attached overhead while running
      const targetPos = this.holder.position.add(new Vector3(0, 2.35 + Math.sin(this.animTimer * 4) * 0.08, 0));
      this.root.position.copyFrom(targetPos);
      this.root.rotation.y = this.holder.rotation.y + Math.PI / 4;
    } else {
      // Free hover and rotation on pedestal
      const bobSpeed = this.isPlayerInRange ? 6.0 : 3.5;
      const spinSpeed = this.isPlayerInRange ? 4.5 : 2.5;

      this.root.position.y = this.basePosition.y + Math.sin(this.animTimer * bobSpeed) * 0.22;
      this.root.rotation.y += deltaSeconds * spinSpeed;

      // Pulse halo
      const haloPulse = 0.5 + Math.sin(this.animTimer * 5) * 0.4;
      this.haloRing.scaling.setAll(1.0 + (this.isPlayerInRange ? haloPulse * 0.25 : 0.05));
      this.haloMat.emissiveColor = this.isPlayerInRange
        ? new Color3(1.0, 0.8 * haloPulse + 0.2, 0.1)
        : new Color3(0.5, 0.35, 0.0);
    }
  }
}
