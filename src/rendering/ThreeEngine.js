/*
  ThreeEngine.js
  Robust WebGL rendering loop with physics collision detection using Three.js.
  - Initializes scene, camera, renderer.
  - Sets up a basic physics world (AABB collision) for mesh objects.
  - Provides start, stop, and update methods.
  - Exposes addObject/removeObject helpers.
*/

// Require Three.js (assumes three is installed in node_modules or loaded via CDN in the browser)
const THREE = typeof require !== "undefined" ? require("three") : window.THREE;

// Simple AABB collision utility
class AABB {
  constructor(mesh) {
    this.mesh = mesh;
    this.update();
  }
  update() {
    const box = new THREE.Box3().setFromObject(this.mesh);
    this.min = box.min.clone();
    this.max = box.max.clone();
  }
  intersects(other) {
    return (
      this.min.x <= other.max.x &&
      this.max.x >= other.min.x &&
      this.min.y <= other.max.y &&
      this.max.y >= other.min.y &&
      this.min.z <= other.max.z &&
      this.max.z >= other.min.z
    );
  }
}

class ThreeEngine {
  constructor({
    containerId = "three-canvas",
    width = window.innerWidth,
    height = window.innerHeight,
  } = {}) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // State
    this.objects = [];
    this.aabbs = [];
    this.running = false;
    this.lastTime = 0;

    // Resize handling
    window.addEventListener("resize", () => this.onWindowResize());
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  addObject(mesh) {
    this.scene.add(mesh);
    this.objects.push(mesh);
    this.aabbs.push(new AABB(mesh));
  }

  removeObject(mesh) {
    const idx = this.objects.indexOf(mesh);
    if (idx !== -1) {
      this.scene.remove(mesh);
      this.objects.splice(idx, 1);
      this.aabbs.splice(idx, 1);
    }
  }

  // Simple physics step – resolves AABB collisions by separating overlapping objects
  physicsStep(delta) {
    // Update AABBs
    this.aabbs.forEach((aabb) => aabb.update());
    // O(n²) collision detection (acceptable for modest object counts)
    for (let i = 0; i < this.aabbs.length; i++) {
      for (let j = i + 1; j < this.aabbs.length; j++) {
        const a = this.aabbs[i];
        const b = this.aabbs[j];
        if (a.intersects(b)) {
          // Compute penetration depth on each axis
          const penetration = new THREE.Vector3(
            Math.min(a.max.x - b.min.x, b.max.x - a.min.x),
            Math.min(a.max.y - b.min.y, b.max.y - a.min.y),
            Math.min(a.max.z - b.min.z, b.max.z - a.min.z),
          );
          const correction = penetration.multiplyScalar(0.5);
          a.mesh.position.sub(correction);
          b.mesh.position.add(correction);
        }
      }
    }
  }

  // Main render loop (requestAnimationFrame based)
  renderLoop = (time) => {
    if (!this.running) return;
    const delta = (time - this.lastTime) / 1000; // seconds
    this.lastTime = time;

    // Physics update
    this.physicsStep(delta);

    // Hook for external per‑frame logic
    if (this.onUpdate) this.onUpdate(delta);

    // Render
    this.renderer.render(this.scene, this.camera);

    // Schedule next frame
    requestAnimationFrame(this.renderLoop);
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.renderLoop);
  }

  stop() {
    this.running = false;
  }
}

// Export for CommonJS environments; also attach to window for direct script usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ThreeEngine };
} else {
  window.ThreeEngine = ThreeEngine;
}
