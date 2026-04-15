import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;

  readonly ambientLight: THREE.AmbientLight;
  readonly directionalLight: THREE.DirectionalLight;
  readonly backLight: THREE.DirectionalLight;
  private animationFrameId: number | null = null;
  // Light offset expressed in CAMERA-LOCAL space. Transformed to world each frame
  // so the light tracks the camera orientation (headlamp with upper-left offset).
  private readonly directionalLightOffset = new THREE.Vector3(-90, 90, 100);

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    this.camera.position.set(0, 80, 200);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.enabled = true;
    // PCF (not Soft) gives sharper shadows for the small embossed text/logo
    // details. Soft PCF blurs over too many texels at this resolution, which
    // produces a noisy speckled pattern on fine features.
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.directionalLight.position.set(-90, 90, 100);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 4096;
    this.directionalLight.shadow.mapSize.height = 4096;
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 1000;
    // Initial shadow frustum; tightened to fit the model in fitShadowToObject().
    this.directionalLight.shadow.camera.left = -200;
    this.directionalLight.shadow.camera.right = 200;
    this.directionalLight.shadow.camera.top = 200;
    this.directionalLight.shadow.camera.bottom = -200;
    // Slight bias to avoid shadow acne on the embossed text/logo surfaces.
    this.directionalLight.shadow.bias = -0.0005;
    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);

    this.backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.backLight.position.set(-70, 100, -150);
    this.scene.add(this.backLight);

    // Controls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;

    this.startAnimationLoop();
    this.setupResize(canvas);
  }

  private startAnimationLoop(): void {
    const worldOffset = new THREE.Vector3();
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.controls.update();

      // Transform the camera-local light offset into world space and place the
      // light there. Target tracks the orbit center. As the camera orbits, the
      // light rotates with it but the target stays at the model — so the light
      // angle relative to the model changes, sweeping shadows across surfaces.
      worldOffset.copy(this.directionalLightOffset).applyQuaternion(this.camera.quaternion);
      this.directionalLight.position.copy(this.camera.position).add(worldOffset);
      this.directionalLight.target.position.copy(this.controls.target);
      this.directionalLight.target.updateMatrixWorld();

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private setupResize(canvas: HTMLCanvasElement): void {
    const observer = new ResizeObserver(() => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    });
    observer.observe(canvas);
  }

  private lastFitTarget: { center: THREE.Vector3; distance: number } | null = null;

  fitCameraToObject(object: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;

    this.lastFitTarget = { center: center.clone(), distance };

    this.camera.position.set(center.x + 72.6, center.y + 30.1, center.z + 148.9);
    this.controls.target.copy(center);
    this.controls.update();

    this.fitShadowToObject(box);
  }

  /**
   * Tightens the directional light's shadow camera frustum to fit the model.
   * The default 400×400 frustum wastes most of the 2048×2048 shadow map on
   * empty space, producing grainy shadows. Sized to the bounding sphere so
   * the model fits no matter what angle the (orbiting) light views it from.
   */
  private fitShadowToObject(box: THREE.Box3): void {
    const size = box.getSize(new THREE.Vector3());
    // Bounding sphere radius (half-diagonal of the box) plus 10% margin.
    const radius = 0.5 * Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z);
    const half = radius * 1.1;
    const cam = this.directionalLight.shadow.camera;
    cam.left = -half;
    cam.right = half;
    cam.top = half;
    cam.bottom = -half;
    cam.updateProjectionMatrix();
  }

  /** Updates the camera-local offset used to position the directional light. */
  setDirectionalLightOffset(x: number, y: number, z: number): void {
    this.directionalLightOffset.set(x, y, z);
  }

  resetView(): void {
    if (!this.lastFitTarget) return;
    const { center, distance } = this.lastFitTarget;
    // Straight-on frontal view: camera directly in front along Z axis
    this.camera.position.set(center.x, center.y, center.z + distance);
    this.camera.up.set(0, 1, 0);
    this.controls.target.copy(center);
    this.controls.update();
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.controls.dispose();
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
