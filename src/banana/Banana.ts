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
    this.bananaMat = new StandardMaterial('bananaMat', this.scene);
    this.bananaMat.diffuseColor = new Color3(1.0, 0.85, 0.0);
    this.bananaMat.emissiveColor = new Color3(0.45, 0.35, 0.02);
    this.bananaMat.specularColor = new Color3(0.9, 0.8, 0.2);

    const tipMat = new StandardMaterial('bananaTipMat', this.scene);
    tipMat.diffuseColor = new Color3(0.2, 0.12, 0.05);

    this.mesh = MeshBuilder.CreateTorus(
      'bananaBody',
      { diameter: 0.9, thickness: 0.28, tessellation: 24 },
      this.scene
    );
    this.mesh.scaling = new Vector3(1.0, 0.5, 0.4);
    this.mesh.rotation.x = Math.PI / 2.5;
    this.mesh.rotation.z = Math.PI / 4;
    this.mesh.material = this.bananaMat;
    this.mesh.parent = this.root;

    const stem = MeshBuilder.CreateCylinder(
      'bananaStem',
      { diameter: 0.1, height: 0.2, tessellation: 8 },
      this.scene
    );
    stem.position = new Vector3(0.38, 0.22, 0);
    stem.rotation.z = -0.4;
    stem.material = tipMat;
    stem.parent = this.mesh;

    // Glowing interaction halo ring around banana
    this.haloRing = MeshBuilder.CreateTorus(
      'bananaHalo',
      { diameter: 1.6, thickness: 0.06, tessellation: 32 },
      this.scene
    );
    this.haloRing.parent = this.root;
    this.haloMat = new StandardMaterial('bananaHaloMat', this.scene);
    this.haloMat.diffuseColor = new Color3(1.0, 0.9, 0.2);
    this.haloMat.emissiveColor = new Color3(0.8, 0.6, 0.0);
    this.haloRing.material = this.haloMat;

    if (shadowGenerator) {
      shadowGenerator.addShadowCaster(this.mesh);
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
