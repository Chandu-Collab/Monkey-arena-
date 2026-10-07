import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
  ShadowGenerator,
  Mesh,
} from '@babylonjs/core';

export class JungleArena {
  public root: TransformNode;
  public innerRingMesh!: Mesh;
  private innerRingMat!: StandardMaterial;
  public outerRingMesh!: Mesh;
  private outerRingMat!: StandardMaterial;

  public readonly innerDangerRadius: number = 4.6; // Smaller inner circle for monkey defenders
  public readonly outerDangerRadius: number = 12.5; // Outer circle for enemy monkey fish throwers

  private pulseTimer: number = 0;

  constructor(private scene: Scene, private shadowGenerator?: ShadowGenerator) {
    this.root = new TransformNode('jungleArena', scene);
    this.buildArena();
  }

  private buildArena(): void {
    // 1. Ground Mesh
    const ground = MeshBuilder.CreateGround(
      'arenaGround',
      { width: 44, height: 44, subdivisions: 4 },
      this.scene
    );
    ground.parent = this.root;
    const groundMat = new StandardMaterial('arenaGroundMat', this.scene);
    groundMat.diffuseColor = new Color3(0.16, 0.45, 0.2);
    groundMat.specularColor = new Color3(0.04, 0.08, 0.04);
    ground.material = groundMat;
    ground.receiveShadows = true;

    // 2. Center Banana Pedestal
    const pedestal = MeshBuilder.CreateCylinder(
      'centerPedestal',
      { diameterTop: 2.2, diameterBottom: 3.0, height: 0.5, tessellation: 20 },
      this.scene
    );
    pedestal.position.y = 0.25;
    pedestal.parent = this.root;
    const pedestalMat = new StandardMaterial('pedestalMat', this.scene);
    pedestalMat.diffuseColor = new Color3(0.38, 0.26, 0.16);
    pedestal.material = pedestalMat;
    pedestal.receiveShadows = true;
    if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(pedestal);

    // 3. INNER DANGER RING (Enemy Monkeys attack here, radius = 4.6m)
    this.innerRingMesh = MeshBuilder.CreateTorus(
      'bananaInnerRing',
      { diameter: this.innerDangerRadius * 2, thickness: 0.16, tessellation: 64 },
      this.scene
    );
    this.innerRingMesh.position.y = 0.06;
    this.innerRingMesh.parent = this.root;

    this.innerRingMat = new StandardMaterial('innerRingMat', this.scene);
    this.innerRingMat.diffuseColor = new Color3(1.0, 0.3, 0.1);
    this.innerRingMat.emissiveColor = new Color3(0.9, 0.2, 0.05);
    this.innerRingMesh.material = this.innerRingMat;

    // 4. OUTER DANGER RING (Enemy Monkeys throw fish here, radius = 12.5m)
    this.outerRingMesh = MeshBuilder.CreateTorus(
      'bananaOuterRing',
      { diameter: this.outerDangerRadius * 2, thickness: 0.14, tessellation: 72 },
      this.scene
    );
    this.outerRingMesh.position.y = 0.05;
    this.outerRingMesh.parent = this.root;

    this.outerRingMat = new StandardMaterial('outerRingMat', this.scene);
    this.outerRingMat.diffuseColor = new Color3(0.15, 0.7, 1.0);
    this.outerRingMat.emissiveColor = new Color3(0.1, 0.45, 0.85);
    this.outerRingMesh.material = this.outerRingMat;

    // 5. Surround with Palm Trees & Jungle Rocks
    this.createJungleTrees();
    this.createRocks();
  }

  public update(
    deltaSeconds: number,
    isPlayerInOuterZone: boolean,
    isPlayerInInnerZone: boolean
  ): void {
    this.pulseTimer += deltaSeconds;

    // 1. Update Inner Ring Pulse
    const innerPulseSpeed = isPlayerInInnerZone ? 8.0 : 3.0;
    const innerPulse = 0.5 + Math.sin(this.pulseTimer * innerPulseSpeed) * 0.45;
    if (isPlayerInInnerZone) {
      this.innerRingMat.emissiveColor = new Color3(1.0 * innerPulse + 0.1, 0.1, 0.05);
      this.innerRingMat.diffuseColor = new Color3(1.0, 0.2, 0.05);
    } else {
      this.innerRingMat.emissiveColor = new Color3(0.6 * innerPulse + 0.1, 0.2, 0.02);
      this.innerRingMat.diffuseColor = new Color3(0.9, 0.35, 0.1);
    }

    // 2. Update Outer Ring Pulse
    const outerPulseSpeed = isPlayerInOuterZone ? 7.0 : 2.5;
    const outerPulse = 0.5 + Math.sin(this.pulseTimer * outerPulseSpeed) * 0.4;
    if (isPlayerInOuterZone) {
      this.outerRingMat.emissiveColor = new Color3(0.2, 0.7 * outerPulse + 0.3, 1.0);
      this.outerRingMat.diffuseColor = new Color3(0.25, 0.8, 1.0);
    } else {
      this.outerRingMat.emissiveColor = new Color3(0.08, 0.35 * outerPulse + 0.1, 0.6);
      this.outerRingMat.diffuseColor = new Color3(0.15, 0.6, 0.9);
    }
  }

  private createJungleTrees(): void {
    const trunkMat = new StandardMaterial('trunkMat', this.scene);
    trunkMat.diffuseColor = new Color3(0.35, 0.22, 0.12);

    const leafMat = new StandardMaterial('leafMat', this.scene);
    leafMat.diffuseColor = new Color3(0.12, 0.55, 0.2);
    leafMat.specularColor = new Color3(0.1, 0.2, 0.1);

    const treePositions = [
      new Vector3(-17, 0, -15),
      new Vector3(-18, 0, 0),
      new Vector3(-16, 0, 16),
      new Vector3(0, 0, 18),
      new Vector3(16, 0, 16),
      new Vector3(18, 0, -2),
      new Vector3(15, 0, -16),
      new Vector3(-14, 0, 7),
      new Vector3(14, 0, -8),
    ];

    treePositions.forEach((pos, idx) => {
      const treeRoot = new TransformNode(`tree_${idx}`, this.scene);
      treeRoot.position = pos;
      treeRoot.parent = this.root;

      const trunk = MeshBuilder.CreateCylinder(
        `trunk_${idx}`,
        { diameterTop: 0.45, diameterBottom: 0.8, height: 4.5, tessellation: 8 },
        this.scene
      );
      trunk.position.y = 2.25;
      trunk.material = trunkMat;
      trunk.parent = treeRoot;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(trunk);

      for (let layer = 0; layer < 3; layer++) {
        const leaves = MeshBuilder.CreateCylinder(
          `leaves_${idx}_${layer}`,
          {
            diameterTop: 0.1,
            diameterBottom: 3.6 - layer * 0.7,
            height: 1.8,
            tessellation: 7,
          },
          this.scene
        );
        leaves.position.y = 3.8 + layer * 1.1;
        leaves.material = leafMat;
        leaves.parent = treeRoot;
        if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(leaves);
      }
    });
  }

  private createRocks(): void {
    const rockMat = new StandardMaterial('rockMat', this.scene);
    rockMat.diffuseColor = new Color3(0.4, 0.42, 0.45);
    rockMat.specularColor = new Color3(0.1, 0.1, 0.1);

    const rockPositions = [
      { pos: new Vector3(-8, 0, -6), scale: 1.1 },
      { pos: new Vector3(8, 0, 7), scale: 1.2 },
      { pos: new Vector3(-13, 0, 8), scale: 1.5 },
      { pos: new Vector3(12, 0, -12), scale: 1.4 },
      { pos: new Vector3(-7, 0, 14), scale: 1.0 },
      { pos: new Vector3(6, 0, -13), scale: 1.2 },
    ];

    rockPositions.forEach((item, idx) => {
      const rock = MeshBuilder.CreateSphere(
        `rock_${idx}`,
        { diameter: 1.8 * item.scale, segments: 4 },
        this.scene
      );
      rock.position = new Vector3(item.pos.x, 0.7 * item.scale, item.pos.z);
      rock.scaling = new Vector3(1.2, 0.7, 0.9);
      rock.rotation = new Vector3(idx * 0.8, idx * 1.2, 0);
      rock.material = rockMat;
      rock.parent = this.root;
      rock.receiveShadows = true;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(rock);
    });
  }
}
