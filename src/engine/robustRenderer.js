// src/engine/robustRenderer.js
/**
 * Robust WebGL renderer with Three.js and physics collision handling using Cannon‑ES.
 *
 * This module exports an `initRobustRenderer` helper that creates a fully‑featured
 * rendering loop, orbit controls, and simple physics (ground + boxes). It is
 * written for a CommonJS environment (module.exports).
 *
 * Dependencies (add to package.json):
 *   "three": "^0.166.0",
 *   "cannon-es": "^0.20.0",
 *   "three/examples/jsm/controls/OrbitControls": (bundled via three)
 *
 * Usage example:
 *   const { initRobustRenderer } = require('./src/engine/robustRenderer');
 *   const { renderer, scene, camera, start, stop } = initRobustRenderer({
 *     container: document.getElementById('canvas-container')
 *   });
 *   start();
 */

const THREE = require('three');
const { OrbitControls } = require('three/examples/jsm/controls/OrbitControls');
const CANNON = require('cannon-es');

/**
 * Creates the Three.js scene, camera, renderer and physics world.
 * @param {Object} options
 * @param {HTMLElement} options.container - DOM element to which the canvas will be appended.
 * @param {number} [options.width] - Initial width (defaults to container.clientWidth).
 * @param {number} [options.height] - Initial height (defaults to container.clientHeight).
 * @returns {Object} Handles for control.
 */
function initRobustRenderer({ container, width, height }) {
  if (!container) {
    throw new Error('Container element is required for robustRenderer');
  }

  const w = width || container.clientWidth || 800;
  const h = height || container.clientHeight || 600;

  // --- Three.js setup -----------------------------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
  camera.position.set(0, 5, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // --- Lighting -----------------------------------------------------------
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(-3, 10, -10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // --- Cannon‑ES physics world --------------------------------------------
  const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
  });
  physicsWorld.broadphase = new CANNON.NaiveBroadphase();
  physicsWorld.solver.iterations = 10;

  // Helper to sync a mesh with its body each frame
  const syncList = [];
  function syncMeshBody(mesh, body) {
    syncList.push({ mesh, body });
  }

  // Ground ---------------------------------------------------------------
  const groundSize = 50;
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x777777 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane()
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  physicsWorld.addBody(groundBody);

  // Boxes ---------------------------------------------------------------
  function addBox({ size = 1, position = [0, 5, 0], color = 0x00ff00 } = {}) {
    const boxGeo = new THREE.BoxGeometry(size, size, size);
    const boxMat = new THREE.MeshStandardMaterial({ color });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.castShadow = true;
    boxMesh.position.set(...position);
    scene.add(boxMesh);

    const shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
    const body = new CANNON.Body({ mass: 1, shape });
    body.position.set(...position);
    physicsWorld.addBody(body);

    syncMeshBody(boxMesh, body);
    return { mesh: boxMesh, body };
  }

  // Example boxes
  addBox({ size: 1, position: [-2, 5, 0], color: 0xff0000 });
  addBox({ size: 1.5, position: [2, 8, 0], color: 0x0000ff });

  // --- Animation loop -----------------------------------------------------
  let animId = null;
  const fixedTimeStep = 1 / 60; // seconds
  const maxSubSteps = 3;

  function animate() {
    animId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    // Step physics – using a fixed timestep for stability
    physicsWorld.step(fixedTimeStep, delta, maxSubSteps);

    // Sync meshes with bodies
    for (const pair of syncList) {
      pair.mesh.position.copy(pair.body.position);
      pair.mesh.quaternion.copy(pair.body.quaternion);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  const clock = new THREE.Clock();

  // --- Public controls ----------------------------------------------------
  function start() {
    if (!animId) animate();
  }

  function stop() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function resize(newWidth, newHeight) {
    const w = newWidth || container.clientWidth;
    const h = newHeight || container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // Handle window resize automatically
  function onWindowResize() {
    resize();
  }
  window.addEventListener('resize', onWindowResize);

  // Cleanup helper for when the module is disposed
  function dispose() {
    stop();
    window.removeEventListener('resize', onWindowResize);
    renderer.dispose();
    // Remove all children from the container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  // Return handles for external control
  return {
    scene,
    camera,
    renderer,
    controls,
    physicsWorld,
    addBox,
    start,
    stop,
    resize,
    dispose
  };
}

module.exports = { initRobustRenderer };
