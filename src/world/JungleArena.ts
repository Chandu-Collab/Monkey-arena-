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

  public readonly innerDangerRadius: number = 5.2; // Pedestal danger circle
  public readonly outerDangerRadius: number = 15.0; // Outer fish throwing circle

  private pulseTimer: number = 0;

  // Primary interactive tree positions (where canopy vipers perch)
  public treePositions: Vector3[] = [
    new Vector3(-28, 0, -26),
    new Vector3(-30, 0, 0),
    new Vector3(-26, 0, 27),
    new Vector3(0, 0, 30),
    new Vector3(27, 0, 27),
    new Vector3(30, 0, -3),
    new Vector3(26, 0, -28),
    new Vector3(-22, 0, 12),
    new Vector3(22, 0, -14),
    new Vector3(0, 0, -30),
  ];

  // Secondary interactive rock positions (where player can hide when holding banana)
  public rockPositions: Vector3[] = [
    new Vector3(-12, 0, -9),
    new Vector3(12, 0, 10),
    new Vector3(-20, 0, 14),
    new Vector3(19, 0, -18),
    new Vector3(-11, 0, 22),
    new Vector3(10, 0, -20),
    new Vector3(-18, 0, -20),
    new Vector3(21, 0, 16),
  ];

  // Reusable Materials
  private groundMat!: StandardMaterial;
  private trunkMat!: StandardMaterial;
  private palmTrunkMat!: StandardMaterial;
  private darkLeafMat!: StandardMaterial;
  private brightLeafMat!: StandardMaterial;
  private palmFrondMat!: StandardMaterial;
  private vineMat!: StandardMaterial;
  private rockMat!: StandardMaterial;
  private mossMat!: StandardMaterial;
  private coconutMat!: StandardMaterial;
  private flowerRedMat!: StandardMaterial;
  private flowerOrangeMat!: StandardMaterial;
  private mushroomMat!: StandardMaterial;

  constructor(private scene: Scene, private shadowGenerator?: ShadowGenerator) {
    this.root = new TransformNode('jungleArena', scene);
    this.initMaterials();
    this.buildArena();
  }

  private initMaterials(): void {
    // 1. Rainforest Floor (Damp fertile loam with moss highlights)
    this.groundMat = new StandardMaterial('arenaGroundMat', this.scene);
    this.groundMat.diffuseColor = new Color3(0.13, 0.32, 0.16);
    this.groundMat.specularColor = new Color3(0.04, 0.08, 0.04);
    this.groundMat.ambientColor = new Color3(0.08, 0.18, 0.09);

    // 2. Ancient Rainforest Bark (Gnarled, mossy hardwood)
    this.trunkMat = new StandardMaterial('ancientTrunkMat', this.scene);
    this.trunkMat.diffuseColor = new Color3(0.28, 0.18, 0.11);
    this.trunkMat.specularColor = new Color3(0.05, 0.05, 0.04);

    // 3. Palm Tree Ring Trunk (Segmented fibrous bark)
    this.palmTrunkMat = new StandardMaterial('palmTrunkMat', this.scene);
    this.palmTrunkMat.diffuseColor = new Color3(0.38, 0.26, 0.15);
    this.palmTrunkMat.specularColor = new Color3(0.08, 0.08, 0.05);

    // 4. Canopy Foliage Tones (Multi-tier rainforest greens)
    this.darkLeafMat = new StandardMaterial('darkLeafMat', this.scene);
    this.darkLeafMat.diffuseColor = new Color3(0.07, 0.38, 0.14);
    this.darkLeafMat.specularColor = new Color3(0.06, 0.14, 0.06);

    this.brightLeafMat = new StandardMaterial('brightLeafMat', this.scene);
    this.brightLeafMat.diffuseColor = new Color3(0.18, 0.58, 0.22);
    this.brightLeafMat.specularColor = new Color3(0.12, 0.24, 0.12);

    this.palmFrondMat = new StandardMaterial('palmFrondMat', this.scene);
    this.palmFrondMat.diffuseColor = new Color3(0.15, 0.52, 0.18);
    this.palmFrondMat.specularColor = new Color3(0.14, 0.25, 0.12);

    // 5. Hanging Jungle Vines (Lianas)
    this.vineMat = new StandardMaterial('vineMat', this.scene);
    this.vineMat.diffuseColor = new Color3(0.14, 0.42, 0.16);
    this.vineMat.specularColor = new Color3(0.04, 0.08, 0.04);

    // 6. Natural Rainforest Rocks (Weathered dark mineral slate)
    this.rockMat = new StandardMaterial('naturalRockMat', this.scene);
    this.rockMat.diffuseColor = new Color3(0.32, 0.34, 0.38);
    this.rockMat.specularColor = new Color3(0.1, 0.1, 0.1);

    // 7. Lush Green Moss Cap
    this.mossMat = new StandardMaterial('mossCapMat', this.scene);
    this.mossMat.diffuseColor = new Color3(0.22, 0.52, 0.18);
    this.mossMat.specularColor = new Color3(0.04, 0.08, 0.04);

    // 8. Coconuts
    this.coconutMat = new StandardMaterial('coconutMat', this.scene);
    this.coconutMat.diffuseColor = new Color3(0.32, 0.22, 0.10);

    // 9. Exotic Rainforest Flora & Mushrooms
    this.flowerRedMat = new StandardMaterial('flowerRedMat', this.scene);
    this.flowerRedMat.diffuseColor = new Color3(0.95, 0.18, 0.25);
    this.flowerRedMat.emissiveColor = new Color3(0.2, 0.02, 0.04);

    this.flowerOrangeMat = new StandardMaterial('flowerOrangeMat', this.scene);
    this.flowerOrangeMat.diffuseColor = new Color3(1.0, 0.55, 0.05);
    this.flowerOrangeMat.emissiveColor = new Color3(0.2, 0.08, 0.0);

    this.mushroomMat = new StandardMaterial('mushroomMat', this.scene);
    this.mushroomMat.diffuseColor = new Color3(0.92, 0.32, 0.15);
  }

  private buildArena(): void {
    // 1. Vast Rainforest Ground (76m x 76m)
    const ground = MeshBuilder.CreateGround(
      'arenaGround',
      { width: 76, height: 76, subdivisions: 12 },
      this.scene
    );
    ground.parent = this.root;
    ground.material = this.groundMat;
    ground.receiveShadows = true;

    // 2. Ancient Carved Stone Altar / Banana Pedestal
    this.createAncientAltar();

    // 3. INNER DANGER RING (radius = 5.2m)
    this.innerRingMesh = MeshBuilder.CreateTorus(
      'bananaInnerRing',
      { diameter: this.innerDangerRadius * 2, thickness: 0.18, tessellation: 64 },
      this.scene
    );
    this.innerRingMesh.position.y = 0.06;
    this.innerRingMesh.parent = this.root;

    this.innerRingMat = new StandardMaterial('innerRingMat', this.scene);
    this.innerRingMat.diffuseColor = new Color3(1.0, 0.3, 0.1);
    this.innerRingMat.emissiveColor = new Color3(0.9, 0.2, 0.05);
    this.innerRingMesh.material = this.innerRingMat;

    // 4. OUTER DANGER RING (radius = 15.0m)
    this.outerRingMesh = MeshBuilder.CreateTorus(
      'bananaOuterRing',
      { diameter: this.outerDangerRadius * 2, thickness: 0.15, tessellation: 72 },
      this.scene
    );
    this.outerRingMesh.position.y = 0.05;
    this.outerRingMesh.parent = this.root;

    this.outerRingMat = new StandardMaterial('outerRingMat', this.scene);
    this.outerRingMat.diffuseColor = new Color3(0.15, 0.7, 1.0);
    this.outerRingMat.emissiveColor = new Color3(0.1, 0.45, 0.85);
    this.outerRingMesh.material = this.outerRingMat;

    // 5. Realistic Rainforest Trees (Interactive Snake Trees + Ambient Deep Forest)
    this.createInteractiveTrees();
    this.createDenseForestPerimeter();

    // 6. Natural Rainforest Rock Formations with Moss & Logs
    this.createRealisticRockFormations();

    // 7. Lush Rainforest Undergrowth (Giant Ferns, Bushes, Wild Orchids, Mushrooms)
    this.createRainforestUndergrowth();
  }

  private createAncientAltar(): void {
    const altarNode = new TransformNode('ancientAltar', this.scene);
    altarNode.parent = this.root;

    const altarMat = new StandardMaterial('altarMat', this.scene);
    altarMat.diffuseColor = new Color3(0.34, 0.32, 0.28);
    altarMat.specularColor = new Color3(0.12, 0.12, 0.12);

    // Stepped ancient jungle stone base
    const baseStep = MeshBuilder.CreateCylinder(
      'altarBase',
      { diameterTop: 3.6, diameterBottom: 4.2, height: 0.25, tessellation: 12 },
      this.scene
    );
    baseStep.position.y = 0.12;
    baseStep.material = altarMat;
    baseStep.parent = altarNode;
    baseStep.receiveShadows = true;

    const topPlinth = MeshBuilder.CreateCylinder(
      'altarTop',
      { diameterTop: 2.2, diameterBottom: 2.8, height: 0.35, tessellation: 10 },
      this.scene
    );
    topPlinth.position.y = 0.4;
    topPlinth.material = altarMat;
    topPlinth.parent = altarNode;
    topPlinth.receiveShadows = true;

    // Moss layer on top rim
    const mossRim = MeshBuilder.CreateTorus(
      'altarMossRim',
      { diameter: 2.3, thickness: 0.12, tessellation: 20 },
      this.scene
    );
    mossRim.position.y = 0.56;
    mossRim.material = this.mossMat;
    mossRim.parent = altarNode;

    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(baseStep);
      this.shadowGenerator.addShadowCaster(topPlinth);
    }
  }

  private createInteractiveTrees(): void {
    this.treePositions.forEach((pos, idx) => {
      // Alternate between realistic Canopy Banyan/Kapok Trees and Tall Tropical Coconut Palms
      if (idx % 2 === 0) {
        this.buildAncientRainforestTree(`canopyTree_${idx}`, pos, 1.0 + (idx % 3) * 0.15);
      } else {
        this.buildTropicalCoconutPalm(`palmTree_${idx}`, pos, 1.0 + (idx % 3) * 0.12);
      }
    });
  }

  // --- 1. Realistic Ancient Rainforest Canopy Tree (Kapok / Banyan) ---
  private buildAncientRainforestTree(name: string, pos: Vector3, scale: number): void {
    const treeRoot = new TransformNode(name, this.scene);
    treeRoot.position = pos;
    treeRoot.parent = this.root;

    // 1. Spreading Buttress Roots (3-4 natural flared root fins anchoring tree)
    const numRoots = 4;
    for (let r = 0; r < numRoots; r++) {
      const angle = (r / numRoots) * Math.PI * 2 + (pos.x * 0.3);
      const rootFin = MeshBuilder.CreateBox(
        `${name}_root_${r}`,
        { width: 0.35 * scale, height: 1.4 * scale, depth: 1.8 * scale },
        this.scene
      );
      rootFin.position = new Vector3(
        Math.sin(angle) * 0.9 * scale,
        0.5 * scale,
        Math.cos(angle) * 0.9 * scale
      );
      rootFin.rotation = new Vector3(0.2, angle, 0.15);
      rootFin.material = this.trunkMat;
      rootFin.parent = treeRoot;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(rootFin);
    }

    // 2. Sturdy Gnarled Mossy Trunk
    const trunk = MeshBuilder.CreateCylinder(
      `${name}_trunk`,
      {
        diameterTop: 0.7 * scale,
        diameterBottom: 1.3 * scale,
        height: 4.8 * scale,
        tessellation: 9,
      },
      this.scene
    );
    trunk.position.y = 2.4 * scale;
    trunk.material = this.trunkMat;
    trunk.parent = treeRoot;
    if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(trunk);

    // 3. Thick Canopy Boughs / Branches (Snake perches here!)
    const branchAngles = [0.4, 2.3, 4.4];
    branchAngles.forEach((bAngle, bIdx) => {
      const branch = MeshBuilder.CreateCylinder(
        `${name}_branch_${bIdx}`,
        {
          diameterTop: 0.3 * scale,
          diameterBottom: 0.5 * scale,
          height: 2.6 * scale,
          tessellation: 7,
        },
        this.scene
      );
      branch.position = new Vector3(
        Math.sin(bAngle) * 0.9 * scale,
        3.8 * scale,
        Math.cos(bAngle) * 0.9 * scale
      );
      branch.rotation = new Vector3(0.75, bAngle, -0.2);
      branch.material = this.trunkMat;
      branch.parent = treeRoot;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(branch);

      // Hanging Jungle Liana Vines dangling from branch
      const vine = MeshBuilder.CreateTube(
        `${name}_vine_${bIdx}`,
        {
          path: [
            branch.position.add(new Vector3(0, 0.2, 0)),
            branch.position.add(new Vector3(0.1, -1.2 * scale, 0.05)),
            branch.position.add(new Vector3(-0.05, -2.4 * scale, 0.1)),
          ],
          radius: 0.035 * scale,
          tessellation: 5,
        },
        this.scene
      );
      vine.material = this.vineMat;
      vine.parent = treeRoot;
    });

    // 4. Dense Multi-Tiered Foliage Canopy Domes
    const canopyTiers = [
      { y: 4.2 * scale, diamX: 4.8 * scale, diamY: 2.2 * scale, diamZ: 4.6 * scale, mat: this.darkLeafMat },
      { y: 5.3 * scale, diamX: 4.0 * scale, diamY: 2.0 * scale, diamZ: 3.9 * scale, mat: this.brightLeafMat },
      { y: 6.2 * scale, diamX: 2.9 * scale, diamY: 1.7 * scale, diamZ: 2.8 * scale, mat: this.darkLeafMat },
    ];

    canopyTiers.forEach((tier, tIdx) => {
      const canopy = MeshBuilder.CreateSphere(
        `${name}_canopy_${tIdx}`,
        {
          diameterX: tier.diamX,
          diameterY: tier.diamY,
          diameterZ: tier.diamZ,
          segments: 6,
        },
        this.scene
      );
      canopy.position = new Vector3((tIdx % 2 === 0 ? 0.2 : -0.2) * scale, tier.y, 0);
      canopy.material = tier.mat;
      canopy.parent = treeRoot;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(canopy);
    });
  }

  // --- 2. Realistic Tropical Coconut Palm Tree ---
  private buildTropicalCoconutPalm(name: string, pos: Vector3, scale: number): void {
    const palmRoot = new TransformNode(name, this.scene);
    palmRoot.position = pos;
    palmRoot.parent = this.root;

    // 1. Natural Curved Segmented Palm Trunk
    const trunkCurvePoints = [
      new Vector3(0, 0, 0),
      new Vector3(0.15 * scale, 1.4 * scale, 0.1 * scale),
      new Vector3(0.45 * scale, 2.9 * scale, 0.3 * scale),
      new Vector3(0.65 * scale, 4.3 * scale, 0.45 * scale),
    ];

    const trunk = MeshBuilder.CreateTube(
      `${name}_palmTrunk`,
      {
        path: trunkCurvePoints,
        radiusFunction: (i) => (0.34 - i * 0.04) * scale,
        tessellation: 8,
        cap: Mesh.CAP_ALL,
      },
      this.scene
    );
    trunk.material = this.palmTrunkMat;
    trunk.parent = palmRoot;
    if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(trunk);

    const crownPos = trunkCurvePoints[trunkCurvePoints.length - 1];

    // 2. Coconut Cluster under crown
    for (let c = 0; c < 4; c++) {
      const cAngle = (c / 4) * Math.PI * 2 + 0.3;
      const coconut = MeshBuilder.CreateSphere(
        `${name}_coco_${c}`,
        { diameter: 0.32 * scale, segments: 5 },
        this.scene
      );
      coconut.position = crownPos.add(
        new Vector3(Math.sin(cAngle) * 0.28 * scale, -0.22 * scale, Math.cos(cAngle) * 0.28 * scale)
      );
      coconut.material = this.coconutMat;
      coconut.parent = palmRoot;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(coconut);
    }

    // 3. 8 Large Arching Drooping Palm Fronds
    const numFronds = 8;
    for (let f = 0; f < numFronds; f++) {
      const fAngle = (f / numFronds) * Math.PI * 2;
      const frondLength = 2.6 * scale;
      const frondWidth = 0.85 * scale;

      const frond = MeshBuilder.CreatePlane(
        `${name}_frond_${f}`,
        { width: frondWidth, height: frondLength },
        this.scene
      );
      // Position at crown and arch outward/downward
      frond.position = crownPos.add(
        new Vector3(Math.sin(fAngle) * (frondLength * 0.4), 0.1 * scale, Math.cos(fAngle) * (frondLength * 0.4))
      );
      frond.rotation = new Vector3(
        1.1, // Droop angle
        -fAngle + Math.PI / 2,
        0.35 * Math.sin(fAngle)
      );
      frond.material = this.palmFrondMat;
      frond.parent = palmRoot;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(frond);
    }
  }

  // --- 3. Dense Perimeter Rainforest Backdrop ---
  private createDenseForestPerimeter(): void {
    const perimeterPositions = [
      new Vector3(-35, 0, -35),
      new Vector3(-36, 0, -18),
      new Vector3(-36, 0, 18),
      new Vector3(-35, 0, 35),
      new Vector3(-18, 0, 36),
      new Vector3(18, 0, 36),
      new Vector3(35, 0, 35),
      new Vector3(36, 0, 18),
      new Vector3(36, 0, -18),
      new Vector3(35, 0, -35),
      new Vector3(18, 0, -36),
      new Vector3(-18, 0, -36),
    ];

    perimeterPositions.forEach((pos, idx) => {
      const scale = 1.35 + (idx % 3) * 0.2;
      if (idx % 2 === 0) {
        this.buildAncientRainforestTree(`perimTree_${idx}`, pos, scale);
      } else {
        this.buildTropicalCoconutPalm(`perimPalm_${idx}`, pos, scale);
      }
    });
  }

  // --- 4. Realistic Natural Rock Formations with Moss & Logs ---
  private createRealisticRockFormations(): void {
    const rockConfigs = [
      { pos: this.rockPositions[0], scale: 1.35, rotY: 0.4 },
      { pos: this.rockPositions[1], scale: 1.45, rotY: 1.2 },
      { pos: this.rockPositions[2], scale: 1.65, rotY: 2.1 },
      { pos: this.rockPositions[3], scale: 1.55, rotY: 0.9 },
      { pos: this.rockPositions[4], scale: 1.38, rotY: 3.0 },
      { pos: this.rockPositions[5], scale: 1.48, rotY: 1.7 },
      { pos: this.rockPositions[6], scale: 1.58, rotY: 2.6 },
      { pos: this.rockPositions[7], scale: 1.52, rotY: 0.6 },
    ];

    rockConfigs.forEach((cfg, idx) => {
      const rockCluster = new TransformNode(`rockCluster_${idx}`, this.scene);
      rockCluster.position = cfg.pos;
      rockCluster.parent = this.root;

      // 1. Main Weathered Boulder (Multi-faceted, rugged rainforest granite)
      const mainRock = MeshBuilder.CreateSphere(
        `mainRock_${idx}`,
        { diameter: 2.3 * cfg.scale, segments: 5 },
        this.scene
      );
      mainRock.position = new Vector3(0, 0.75 * cfg.scale, 0);
      mainRock.scaling = new Vector3(1.35, 0.82, 1.05);
      mainRock.rotation = new Vector3(0.2, cfg.rotY, 0.15);
      mainRock.material = this.rockMat;
      mainRock.parent = rockCluster;
      mainRock.receiveShadows = true;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(mainRock);

      // 2. Green Moss Overgrowth Cap on Top of Boulder
      const mossCap = MeshBuilder.CreateSphere(
        `mossCap_${idx}`,
        { diameter: 2.1 * cfg.scale, segments: 4 },
        this.scene
      );
      mossCap.position = new Vector3(0, 1.15 * cfg.scale, 0);
      mossCap.scaling = new Vector3(1.18, 0.42, 0.92);
      mossCap.rotation = mainRock.rotation.clone();
      mossCap.material = this.mossMat;
      mossCap.parent = rockCluster;
      mossCap.receiveShadows = true;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(mossCap);

      // 3. Flanking Smaller River Stones (embedded in soil around base)
      const stoneOffsets = [
        { offset: new Vector3(-1.1 * cfg.scale, 0.3 * cfg.scale, 0.7 * cfg.scale), sz: 0.85 * cfg.scale },
        { offset: new Vector3(1.0 * cfg.scale, 0.25 * cfg.scale, -0.6 * cfg.scale), sz: 0.7 * cfg.scale },
      ];

      stoneOffsets.forEach((st, sIdx) => {
        const sideStone = MeshBuilder.CreateSphere(
          `sideStone_${idx}_${sIdx}`,
          { diameter: st.sz, segments: 4 },
          this.scene
        );
        sideStone.position = st.offset;
        sideStone.scaling = new Vector3(1.2, 0.6, 0.9);
        sideStone.material = this.rockMat;
        sideStone.parent = rockCluster;
        sideStone.receiveShadows = true;
        if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(sideStone);
      });

      // 4. Fallen Mossy Jungle Log resting beside some rock clusters
      if (idx % 2 === 0) {
        const log = MeshBuilder.CreateCylinder(
          `jungleLog_${idx}`,
          { diameter: 0.35 * cfg.scale, height: 2.2 * cfg.scale, tessellation: 7 },
          this.scene
        );
        log.position = new Vector3(0.6 * cfg.scale, 0.18 * cfg.scale, 1.2 * cfg.scale);
        log.rotation = new Vector3(Math.PI / 2, 0.7 + idx, 0.1);
        log.material = this.trunkMat;
        log.parent = rockCluster;
        log.receiveShadows = true;
        if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(log);
      }
    });
  }

  // --- 5. Lush Rainforest Undergrowth (Giant Ferns, Bushes, Orchids, Fungi) ---
  private createRainforestUndergrowth(): void {
    // 1. Giant Tropical Fern Clusters (Monstera / Fiddlehead Ferns)
    const fernLocations = [
      new Vector3(-8, 0, -6),
      new Vector3(7, 0, 8),
      new Vector3(-15, 0, 7),
      new Vector3(14, 0, -11),
      new Vector3(-6, 0, 16),
      new Vector3(16, 0, 6),
      new Vector3(-16, 0, -15),
      new Vector3(8, 0, -16),
      new Vector3(0, 0, 14),
      new Vector3(0, 0, -14),
    ];

    fernLocations.forEach((fPos, fIdx) => {
      const fernRoot = new TransformNode(`fernCluster_${fIdx}`, this.scene);
      fernRoot.position = fPos;
      fernRoot.parent = this.root;

      // 6 radiating arched fronds
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + fIdx * 0.4;
        const frond = MeshBuilder.CreatePlane(
          `fernFrond_${fIdx}_${i}`,
          { width: 0.55, height: 1.4 },
          this.scene
        );
        frond.position = new Vector3(Math.sin(angle) * 0.45, 0.35, Math.cos(angle) * 0.45);
        frond.rotation = new Vector3(0.85, -angle + Math.PI / 2, 0);
        frond.material = this.brightLeafMat;
        frond.parent = fernRoot;
      }
    });

    // 2. Rainforest Bushes & Shrubbery
    const bushLocations = [
      new Vector3(-18, 0, 0),
      new Vector3(18, 0, 0),
      new Vector3(-4, 0, -22),
      new Vector3(5, 0, 22),
      new Vector3(-24, 0, -10),
      new Vector3(24, 0, 10),
    ];

    bushLocations.forEach((bPos, bIdx) => {
      const bush = MeshBuilder.CreateSphere(
        `bush_${bIdx}`,
        { diameterX: 2.2, diameterY: 1.2, diameterZ: 1.9, segments: 4 },
        this.scene
      );
      bush.position = new Vector3(bPos.x, 0.6, bPos.z);
      bush.material = bIdx % 2 === 0 ? this.darkLeafMat : this.brightLeafMat;
      bush.parent = this.root;
      bush.receiveShadows = true;
      if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(bush);
    });

    // 3. Exotic Rainforest Flowers & Wild Mushrooms dotting clearings
    const flowerLocations = [
      { pos: new Vector3(-9.5, 0, -8), mat: this.flowerRedMat },
      { pos: new Vector3(10.5, 0, 9), mat: this.flowerOrangeMat },
      { pos: new Vector3(-17, 0, 12), mat: this.flowerRedMat },
      { pos: new Vector3(17, 0, -16), mat: this.flowerOrangeMat },
      { pos: new Vector3(-13, 0, 19), mat: this.flowerRedMat },
      { pos: new Vector3(12, 0, -18), mat: this.flowerOrangeMat },
    ];

    flowerLocations.forEach((fl, idx) => {
      const bloom = MeshBuilder.CreateSphere(
        `flower_${idx}`,
        { diameter: 0.38, segments: 4 },
        this.scene
      );
      bloom.position = new Vector3(fl.pos.x, 0.45, fl.pos.z);
      bloom.material = fl.mat;
      bloom.parent = this.root;

      // Stem
      const stem = MeshBuilder.CreateCylinder(
        `flowerStem_${idx}`,
        { diameter: 0.05, height: 0.45, tessellation: 4 },
        this.scene
      );
      stem.position = new Vector3(fl.pos.x, 0.22, fl.pos.z);
      stem.material = this.brightLeafMat;
      stem.parent = this.root;
    });
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
}
