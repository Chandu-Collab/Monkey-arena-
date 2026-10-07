import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
  Mesh,
} from '@babylonjs/core';

export class EscapeZone {
  public root: TransformNode;
  public platformMesh: Mesh;
  public beaconPillar: Mesh;
  public outerPulseRing: Mesh;
  public isActive: boolean = false;
  public radius: number = 3.2;

  // Waypoints for dynamic patrolling around arena
  private waypoints: Vector3[] = [
    new Vector3(0, 0, -16),
    new Vector3(-13, 0, -10),
    new Vector3(-14, 0, 10),
    new Vector3(0, 0, 15),
    new Vector3(14, 0, 9),
    new Vector3(13, 0, -11),
  ];
  private currentWaypointIndex: number = 0;
  public speed: number = 4.8;
  private animTimer: number = 0;

  public isPhaseAppeared: boolean = true;
  private blinkTimer: number = 0;

  constructor(private scene: Scene) {
    this.root = new TransformNode('movingEscapeZone', scene);
    this.root.position = this.waypoints[0].clone();

    // 1. Glowing Green Base Platform
    this.platformMesh = MeshBuilder.CreateCylinder(
      'escapePlatform',
      { diameter: this.radius * 2, height: 0.12, tessellation: 36 },
      this.scene
    );
    this.platformMesh.position.y = 0.06;
    this.platformMesh.parent = this.root;

    const platformMat = new StandardMaterial('escapePlatformMat', this.scene);
    platformMat.diffuseColor = new Color3(0.2, 0.9, 0.4);
    platformMat.emissiveColor = new Color3(0.15, 0.6, 0.25);
    this.platformMesh.material = platformMat;

    // 2. Translucent Green Light Pillar (Beacon)
    this.beaconPillar = MeshBuilder.CreateCylinder(
      'escapeBeacon',
      { diameterTop: 2.2, diameterBottom: this.radius * 1.8, height: 16, tessellation: 24 },
      this.scene
    );
    this.beaconPillar.position.y = 8.0;
    this.beaconPillar.parent = this.root;

    const beaconMat = new StandardMaterial('escapeBeaconMat', this.scene);
    beaconMat.diffuseColor = new Color3(0.3, 1.0, 0.5);
    beaconMat.emissiveColor = new Color3(0.2, 0.8, 0.35);
    beaconMat.alpha = 0.22;
    this.beaconPillar.material = beaconMat;

    // 3. Pulsating Outer Ring
    this.outerPulseRing = MeshBuilder.CreateTorus(
      'escapePulseRing',
      { diameter: this.radius * 2.2, thickness: 0.12, tessellation: 36 },
      this.scene
    );
    this.outerPulseRing.position.y = 0.08;
    this.outerPulseRing.parent = this.root;

    const ringMat = new StandardMaterial('escapePulseRingMat', this.scene);
    ringMat.diffuseColor = new Color3(0.4, 1.0, 0.6);
    ringMat.emissiveColor = new Color3(0.3, 0.9, 0.45);
    this.outerPulseRing.material = ringMat;
  }

  public setSpeed(newSpeed: number): void {
    this.speed = newSpeed;
  }

  public activate(): void {
    this.isActive = true;
    this.isPhaseAppeared = true;
    this.blinkTimer = 0;
    this.applyVisibility(1.0);
  }

  public reset(): void {
    this.isActive = false;
    this.isPhaseAppeared = true;
    this.blinkTimer = 0;
    this.currentWaypointIndex = 0;
    this.root.position = this.waypoints[0].clone();
    this.applyVisibility(1.0);
  }

  public getPosition(): Vector3 {
    return this.root.position;
  }

  public isInside(point: Vector3): boolean {
    if (!this.isActive || !this.isPhaseAppeared) return false;

    const dist = Vector3.Distance(
      new Vector3(this.root.position.x, 0, this.root.position.z),
      new Vector3(point.x, 0, point.z)
    );
    return dist <= this.radius;
  }

  private applyVisibility(alphaPct: number): void {
    this.platformMesh.visibility = alphaPct;
    this.beaconPillar.visibility = alphaPct > 0.5 ? 0.22 * alphaPct : 0.0;
    this.outerPulseRing.visibility = alphaPct;
  }

  public update(deltaSeconds: number): void {
    this.animTimer += deltaSeconds;

    if (this.isActive) {
      // 2-second appear & disappear cycle
      this.blinkTimer += deltaSeconds;
      if (this.blinkTimer >= 2.0) {
        this.blinkTimer -= 2.0;
        this.isPhaseAppeared = !this.isPhaseAppeared;
      }

      // Smooth visibility transition
      const targetVisibility = this.isPhaseAppeared ? 1.0 : 0.08;
      this.applyVisibility(targetVisibility);

      // Move towards current waypoint
      const target = this.waypoints[this.currentWaypointIndex];
      const diff = target.subtract(this.root.position);
      diff.y = 0;
      const distance = diff.length();

      if (distance > 0.4) {
        diff.normalize();
        const move = diff.scale(this.speed * deltaSeconds);
        this.root.position.addInPlace(move);
      } else {
        // Switch to next waypoint
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
      }
    } else {
      this.applyVisibility(0.85);
    }

    // Beacon and ring pulse
    if (this.isPhaseAppeared) {
      const pulse = 0.5 + Math.sin(this.animTimer * 4) * 0.4;
      this.outerPulseRing.scaling.setAll(1.0 + pulse * 0.12);
    }
  }
}
