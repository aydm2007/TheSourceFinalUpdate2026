// ThreeEngine.js – Robust WebGL canvas rendering loop with basic physics collision handling
// ------------------------------------------------------------
// Dependencies: three (npm), three/examples/jsm/controls/OrbitControls, three/examples/jsm/libs/stats.module.js
// ------------------------------------------------------------
const THREE = require("three");
const { OrbitControls } = require("three/examples/jsm/controls/OrbitControls");
const Stats = require("three/examples/jsm/libs/stats.module");

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
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 5, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.stats = new Stats();
    this.container.appendChild(this.stats.dom);

    this._setupScene();
    this._bindEvents();
    this._animate();
  }

  _setupScene() {
    // Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemi.position.set(0, 20, 0);
    this.scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(-3, 10, -10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshPhongMaterial({
      color: 0x999999,
      depthWrite: false,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Sample dynamic objects – cubes that will collide
    this.movingObjects = [];
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x156289,
      emissive: 0x072534,
      flatShading: true,
    });
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(boxGeo, boxMat);
      mesh.position.set(
        Math.random() * 10 - 5,
        5 + i * 2,
        Math.random() * 10 - 5,
      );
      mesh.castShadow = true;
      mesh.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        -0.02,
        (Math.random() - 0.5) * 0.1,
      );
      this.scene.add(mesh);
      this.movingObjects.push({ mesh, aabb: new AABB(mesh) });
    }
  }

  _bindEvents() {
    window.addEventListener("resize", () => {
      this.camera.aspect =
        this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(
        this.container.clientWidth,
        this.container.clientHeight,
      );
    });
  }

  _animate() {
    this.renderer.setAnimationLoop(() => {
      this._updatePhysics();
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.stats.update();
    });
  }

  _updatePhysics() {
    const floorY = 0.5; // half cube height
    // Apply gravity, move objects, and handle floor collision
    for (const obj of this.movingObjects) {
      const { mesh, aabb } = obj;
      mesh.position.add(mesh.velocity);
      mesh.velocity.y -= 0.001; // gravity
      if (mesh.position.y < floorY) {
        mesh.position.y = floorY;
        mesh.velocity.y *= -0.5; // damped bounce
      }
      aabb.update();
    }
    // Naïve O(n^2) AABB collision detection
    for (let i = 0; i < this.movingObjects.length; i++) {
      for (let j = i + 1; j < this.movingObjects.length; j++) {
        const a = this.movingObjects[i];
        const b = this.movingObjects[j];
        if (a.aabb.intersects(b.aabb)) {
          // Simple elastic response – swap velocities
          const temp = a.mesh.velocity.clone();
          a.mesh.velocity.copy(b.mesh.velocity);
          b.mesh.velocity.copy(temp);
          // Separate objects slightly to avoid sticking
          const overlap = a.aabb.max.clone().sub(b.aabb.min);
          a.mesh.position.addScalar(overlap.length() * 0.01);
          b.mesh.position.subScalar(overlap.length() * 0.01);
        }
      }
    }
  }

  // Public API to add custom meshes at runtime
  addObject(mesh, velocity = new THREE.Vector3()) {
    mesh.castShadow = true;
    this.scene.add(mesh);
    mesh.velocity = velocity.clone();
    this.movingObjects.push({ mesh, aabb: new AABB(mesh) });
  }
}

module.exports = ThreeEngine;
