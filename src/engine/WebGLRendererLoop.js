// WebGLRendererLoop.js – Robust rendering loop with Three.js, canvas management, and basic physics collisions

const THREE = require("three");
const { OrbitControls } = require("three/examples/jsm/controls/OrbitControls.js");

/**
 * Simple physics body for collision detection.
 * Stores position, velocity and a bounding sphere radius.
 */
class PhysicsBody {
  constructor(mesh, radius = 1) {
    this.mesh = mesh;
    this.radius = radius;
    this.velocity = new THREE.Vector3();
  }

  // Update position based on velocity and delta time
  integrate(delta) {
    this.mesh.position.addScaledVector(this.velocity, delta);
  }

  // Basic sphere‑sphere collision response (elastic bounce)
  resolveCollision(other) {
    const posA = this.mesh.position;
    const posB = other.mesh.position;
    const dist = posA.distanceTo(posB);
    const minDist = this.radius + other.radius;
    if (dist < minDist) {
      // Normal vector
      const normal = new THREE.Vector3().subVectors(posB, posA).normalize();
      // Relative velocity
      const relVel = new THREE.Vector3().subVectors(this.velocity, other.velocity);
      const separatingVel = relVel.dot(normal);
      if (separatingVel < 0) {
        // Simple impulse based on equal mass
        const impulse = normal.multiplyScalar(-separatingVel);
        this.velocity.add(impulse);
        other.velocity.sub(impulse);
      }
      // Separate objects to prevent sinking
      const penetration = minDist - dist;
      const correction = normal.multiplyScalar(penetration / 2);
      this.mesh.position.add(correction.clone().negate());
      other.mesh.position.add(correction);
    }
  }
}

/**
 * Main renderer class – creates a WebGL canvas, sets up a Three.js scene,
 * runs the animation loop, and updates physics bodies.
 */
class WebGLRendererLoop {
  constructor({ containerId = "webgl-container", width = 800, height = 600 } = {}) {
    // Create canvas element if not present
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      document.body.appendChild(container);
    }

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Light setup
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // Store physics bodies
    this.bodies = [];

    // Bind the loop context
    this._animate = this._animate.bind(this);
    this._lastTime = performance.now();
  }

  /** Add a mesh with optional radius for physics */
  addMesh(mesh, radius = 1) {
    this.scene.add(mesh);
    this.bodies.push(new PhysicsBody(mesh, radius));
  }

  /** Start the rendering and physics loop */
  start() {
    requestAnimationFrame(this._animate);
  }

  /** Internal animation frame handler */
  _animate(currentTime) {
    const delta = (currentTime - this._lastTime) / 1000; // seconds
    this._lastTime = currentTime;

    // Update physics bodies
    for (let i = 0; i < this.bodies.length; i++) {
      const body = this.bodies[i];
      body.integrate(delta);
      // Check collisions with every other body
      for (let j = i + 1; j < this.bodies.length; j++) {
        body.resolveCollision(this.bodies[j]);
      }
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    requestAnimationFrame(this._animate);
  }

  /** Clean up resources */
  dispose() {
    this.renderer.dispose();
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    const parent = this.renderer.domElement.parentNode;
    if (parent) parent.removeChild(this.renderer.domElement);
  }
}

module.exports = { WebGLRendererLoop };
