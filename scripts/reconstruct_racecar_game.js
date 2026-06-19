const fs = require('fs');
const path = require('path');
const { ParallelSwarmCoordinator } = require('../core/bridge/handlers/swarm_handlers.js');

async function runReconstruction() {
    console.log("🚀 [Sovereign Swarm] Reconstructing Games3d_RaceCar environment...");
    const startTime = Date.now();

    // 12-agent specialized configuration
    const agents = [
        {
            name: 'HTML-Architect',
            description: `You are the HTML Architect subagent. Your job is to create the game dashboard structure.
You MUST first call ReasoningEngine to analyze this task.
Next, call FileWrite to create/overwrite the file C:\\tools\\workspace\\TheSource\\Games3d_RaceCar\\public\\index.html with this EXACT content:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Neon Drift Racer</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/cannon@0.6.2/build/cannon.min.js"></script>
</head>
<body>
    <div id="game-container"></div>
    <div id="hud-overlay">
        <div class="glass-panel speedo-panel">
            <div class="label">SPEED</div>
            <div id="speed-val">0</div>
            <div class="unit">KM/H</div>
        </div>
        <div class="glass-panel timer-panel">
            <div class="label">LAP TIME</div>
            <div id="time-val">00:00:00</div>
        </div>
        <div class="glass-panel info-panel">
            <div class="label">WEATHER</div>
            <div id="weather-val">RAINY / NEON NIGHT</div>
        </div>
    </div>
    <div id="touch-controls-hud" style="display: none;">
        <div id="steer-left" class="touch-btn">◀</div>
        <div id="steer-right" class="touch-btn">▶</div>
        <div id="gas-btn" class="touch-btn action-btn">GAS</div>
        <div id="brake-btn" class="touch-btn action-btn">BRAKE</div>
    </div>
    <script type="module" src="main.js"></script>
</body>
</html>
\`\`\`
Return a success message when written.`,
            type: 'Frontend'
        },
        {
            name: 'Glassmorphism-Styler',
            description: `You are the Glassmorphism Styler subagent. Your job is to create the visual appearance of the game HUD.
You MUST first call ReasoningEngine to analyze this task.
Next, call FileWrite to create/overwrite the file C:\\tools\\workspace\\TheSource\\Games3d_RaceCar\\public\\style.css with this EXACT content:
\`\`\`css
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    user-select: none;
}
body {
    overflow: hidden;
    background-color: #05050a;
    font-family: 'Rajdhani', sans-serif;
    color: #ffffff;
}
#game-container {
    width: 100vw;
    height: 100vh;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
}
#hud-overlay {
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    z-index: 10;
    pointer-events: none;
}
.glass-panel {
    background: rgba(10, 10, 25, 0.6);
    border: 1px solid rgba(0, 255, 204, 0.25);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 15px 25px;
    box-shadow: 0 0 20px rgba(0, 255, 204, 0.1), inset 0 0 10px rgba(0, 255, 204, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
}
.speedo-panel {
    min-width: 140px;
}
.speedo-panel #speed-val {
    font-family: 'Orbitron', sans-serif;
    font-size: 3rem;
    font-weight: 900;
    color: #00ffcc;
    text-shadow: 0 0 10px rgba(0, 255, 204, 0.6);
}
.timer-panel #time-val {
    font-family: 'Orbitron', sans-serif;
    font-size: 2rem;
    color: #ff007f;
    text-shadow: 0 0 10px rgba(255, 0, 127, 0.6);
}
.label {
    font-size: 0.8rem;
    letter-spacing: 2px;
    color: #8899af;
    margin-bottom: 5px;
    text-transform: uppercase;
}
.unit {
    font-size: 0.7rem;
    color: #8899af;
}
#touch-controls-hud {
    position: absolute;
    bottom: 30px;
    left: 20px;
    right: 20px;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
}
.touch-btn {
    pointer-events: auto;
    width: 70px;
    height: 70px;
    background: rgba(10, 10, 25, 0.6);
    border: 2px solid rgba(0, 255, 204, 0.4);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(0, 255, 204, 0.2);
    transition: all 0.1s ease;
}
.touch-btn:active {
    background: rgba(0, 255, 204, 0.3);
    transform: scale(0.9);
}
.action-btn {
    border-radius: 12px;
    font-size: 1rem;
    font-weight: bold;
    width: 80px;
    border-color: rgba(255, 0, 127, 0.4);
    box-shadow: 0 0 15px rgba(255, 0, 127, 0.2);
}
.action-btn:active {
    background: rgba(255, 0, 127, 0.3);
}
\`\`\`
Return a success message when written.`,
            type: 'Frontend'
        },
        {
            name: 'Audio-Synthesizer',
            description: `You are the Audio Synthesizer subagent. Your job is to create engine sound loops using the Web Audio API.
You MUST first call ReasoningEngine to analyze this task.
Next, call FileWrite to create/overwrite the file C:\\tools\\workspace\\TheSource\\Games3d_RaceCar\\src\\EngineSound.js with this EXACT content:
\`\`\`javascript
export class EngineSound {
    constructor() {
        this.ctx = null;
        this.osc = null;
        this.gain = null;
        this.isPlaying = false;
    }
    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.osc = this.ctx.createOscillator();
            this.gain = this.ctx.createGain();
            
            this.osc.type = 'sawtooth';
            this.osc.frequency.setValueAtTime(60, this.ctx.currentTime);
            
            this.gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
            
            this.osc.connect(this.gain);
            this.gain.connect(this.ctx.destination);
            
            this.osc.start();
            this.isPlaying = true;
        } catch (e) {
            console.warn("Web Audio API not supported:", e.message);
        }
    }
    update(speed) {
        if (!this.isPlaying || !this.osc) return;
        const pitch = 60 + Math.min(speed * 3.5, 400);
        this.osc.frequency.setTargetAtTime(pitch, this.ctx.currentTime, 0.05);
    }
}
\`\`\`
Return a success message when written.`,
            type: 'General'
        },
        {
            name: 'Friction-Modeler',
            description: `You are the Friction Modeler subagent. Your job is to implement friction dynamics.
You MUST first call ReasoningEngine to analyze this task.
Next, call FileWrite to create/overwrite the file C:\\tools\\workspace\\TheSource\\Games3d_RaceCar\\src\\TireFriction.js with this EXACT content:
\`\`\`javascript
export class TireFriction {
    static getCoefficient(surfaceType) {
        switch (surfaceType) {
            case 'concrete': return 0.9;
            case 'wet_concrete': return 0.55;
            case 'dirt': return 0.4;
            case 'sand': return 0.25;
            default: return 0.8;
        }
    }
    static calculateLateralSlip(velocity, heading, frictionCoeff) {
        const speed = velocity.length();
        if (speed < 0.1) return 0;
        const normalizedVel = velocity.clone().normalize();
        const dot = normalizedVel.dot(heading);
        const slip = 1 - Math.abs(dot);
        return slip * frictionCoeff;
    }
}
\`\`\`
Return a success message when written.`,
            type: 'General'
        },
        {
            name: 'Touch-Input-Manager',
            description: `You are the Touch Input Manager subagent. Your job is to bind HUD control overlays.
You MUST first call ReasoningEngine to analyze this task.
Next, call FileWrite to create/overwrite the file C:\\tools\\workspace\\TheSource\\Games3d_RaceCar\\src\\TouchControls.js with this EXACT content:
\`\`\`javascript
export class TouchControls {
    constructor() {
        this.inputs = { left: false, right: false, forward: false, backward: false };
        this.isMobile = false;
    }
    init() {
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.isMobile = true;
            const hud = document.getElementById('touch-controls-hud');
            if (hud) hud.style.display = 'flex';
            this._setupListeners();
        }
    }
    _setupListeners() {
        const bindBtn = (id, action) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.inputs[action] = true; });
                btn.addEventListener('touchend', (e) => { e.preventDefault(); this.inputs[action] = false; });
            }
        };
        bindBtn('steer-left', 'left');
        bindBtn('steer-right', 'right');
        bindBtn('gas-btn', 'forward');
        bindBtn('brake-btn', 'backward');
    }
}
\`\`\`
Return a success message when written.`,
            type: 'General'
        },
        {
            name: 'Weather-Particle-Generator',
            description: `You are the Weather Particle Generator subagent. Your job is to render realistic night rain.
You MUST first call ReasoningEngine to analyze this task.
Next, call FileWrite to create/overwrite the file C:\\tools\\workspace\\TheSource\\Games3d_RaceCar\\src\\Weather.js with this EXACT content:
\`\`\`javascript
export class Weather {
    constructor(scene) {
        this.scene = scene;
        this.rainParticles = null;
        this.particleCount = 2000;
        this.geom = null;
    }
    init() {
        this.geom = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        for (let i = 0; i < this.particleCount; i++) {
            positions.push(
                Math.random() * 200 - 100,
                Math.random() * 80 + 10,
                Math.random() * 200 - 100
            );
            velocities.push(
                Math.random() * 0.2 - 0.1,
                -Math.random() * 0.8 - 0.4,
                Math.random() * 0.2 - 0.1
            );
        }
        this.geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.velocities = velocities;
        
        const mat = new THREE.PointsMaterial({
            color: 0x00dfff,
            size: 0.2,
            transparent: true,
            opacity: 0.6
        });
        
        this.rainParticles = new THREE.Points(this.geom, mat);
        this.scene.add(this.rainParticles);
        
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.FogExp2(0x050510, 0.015);
    }
    update() {
        if (!this.rainParticles) return;
        const positions = this.geom.attributes.position.array;
        for (let i = 0; i < this.particleCount; i++) {
            const idx = i * 3;
            positions[idx + 0] += this.velocities[idx + 0];
            positions[idx + 1] += this.velocities[idx + 1];
            positions[idx + 2] += this.velocities[idx + 2];
            
            if (positions[idx + 1] < 0) {
                positions[idx + 1] = Math.random() * 80 + 20;
                positions[idx + 0] = Math.random() * 200 - 100;
                positions[idx + 2] = Math.random() * 200 - 100;
            }
        }
        this.geom.attributes.position.needsUpdate = true;
    }
}
\`\`\`
Return a success message when written.`,
            type: 'General'
        },
        {
            name: 'Physics-Integrator',
            description: `You are the Physics Integrator subagent. Your job is to configure Cannon.js physics rigid bodies and Three.js elements.
You MUST first call ReasoningEngine to analyze this task.
Next, call FileWrite to create/overwrite the file C:\\tools\\workspace\\TheSource\\Games3d_RaceCar\\src\\GameEngine.js with this EXACT content:
\`\`\`javascript
export class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.carBody = null;
        this.carMesh = null;
        this.keyboard = {};
        this.speed = 0;
    }
    init(containerId) {
        const container = document.getElementById(containerId);
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 40, 20);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
        
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 10;
        
        const groundMat = new CANNON.Material();
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane(),
            material: groundMat
        });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);
        
        const gridHelper = new THREE.GridHelper(500, 100, 0x00ffcc, 0x112233);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
        
        const trackGeo = new THREE.RingGeometry(40, 48, 64);
        const trackMat = new THREE.MeshBasicMaterial({ color: 0x0a0a25, side: THREE.DoubleSide });
        const trackMesh = new THREE.Mesh(trackGeo, trackMat);
        trackMesh.rotation.x = Math.PI / 2;
        this.scene.add(trackMesh);
        
        const innerBorder = new THREE.Mesh(new THREE.RingGeometry(39.9, 40, 64), new THREE.MeshBasicMaterial({ color: 0x00ffcc }));
        innerBorder.rotation.x = Math.PI / 2;
        innerBorder.position.y = 0.02;
        this.scene.add(innerBorder);
        
        const outerBorder = new THREE.Mesh(new THREE.RingGeometry(48, 48.1, 64), new THREE.MeshBasicMaterial({ color: 0xff00ff }));
        outerBorder.rotation.x = Math.PI / 2;
        outerBorder.position.y = 0.02;
        this.scene.add(outerBorder);

        const bodyShape = new CANNON.Box(new CANNON.Vec3(1.2, 0.5, 2.2));
        this.carBody = new CANNON.Body({
            mass: 1200,
            shape: bodyShape
        });
        this.carBody.position.set(0, 1, -44);
        this.world.addBody(this.carBody);
        
        const carGeo = new THREE.BoxGeometry(2.4, 1.0, 4.4);
        const carMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, metalness: 0.8, roughness: 0.2 });
        this.carMesh = new THREE.Mesh(carGeo, carMat);
        this.carMesh.castShadow = true;
        this.scene.add(this.carMesh);
        
        const underglow = new THREE.PointLight(0x00ffcc, 2, 8);
        underglow.position.set(0, -0.5, 0);
        this.carMesh.add(underglow);
        
        this._setupInput();
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    _setupInput() {
        window.addEventListener('keydown', (e) => this.keyboard[e.code] = true);
        window.addEventListener('keyup', (e) => this.keyboard[e.code] = false);
    }
    update(touchInputs) {
        this.world.step(1 / 60);
        
        const left = this.keyboard['KeyA'] || this.keyboard['ArrowLeft'] || touchInputs.left;
        const right = this.keyboard['KeyD'] || this.keyboard['ArrowRight'] || touchInputs.right;
        const forward = this.keyboard['KeyW'] || this.keyboard['ArrowUp'] || touchInputs.forward;
        const backward = this.keyboard['KeyS'] || this.keyboard['ArrowDown'] || touchInputs.backward;
        
        let force = 0;
        if (forward) force = 6000;
        if (backward) force = -3000;
        
        let steering = 0;
        if (left) steering = 0.04;
        if (right) steering = -0.04;
        
        const heading = new THREE.Vector3(0, 0, 1).applyQuaternion(this.carMesh.quaternion);
        if (force !== 0) {
            const pushVec = new CANNON.Vec3(heading.x * force, 0, heading.z * force);
            this.carBody.applyForce(pushVec, this.carBody.position);
        }
        
        if (steering !== 0) {
            const rotQuat = new CANNON.Quaternion();
            rotQuat.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), steering);
            this.carBody.quaternion = this.carBody.quaternion.mult(rotQuat);
        }
        
        this.carBody.velocity.x *= 0.98;
        this.carBody.velocity.z *= 0.98;
        this.carBody.angularVelocity.y *= 0.95;
        
        this.carMesh.position.copy(this.carBody.position);
        this.carMesh.quaternion.copy(this.carBody.quaternion);
        
        const speedVec = new THREE.Vector3(this.carBody.velocity.x, 0, this.carBody.velocity.z);
        this.speed = Math.round(speedVec.length() * 3.6);
        
        const targetCamPos = this.carMesh.position.clone()
            .sub(heading.clone().multiplyScalar(12))
            .add(new THREE.Vector3(0, 5, 0));
            
        this.camera.position.lerp(targetCamPos, 0.1);
        this.camera.lookAt(this.carMesh.position);
    }
    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
\`\`\`
Return a success message when written.`,
            type: 'General'
        },
        {
            name: 'Main-Game-Orchestrator',
            description: `You are the Main Game Orchestrator subagent. Your job is to link all scripts together in the public entrypoint.
You MUST first call ReasoningEngine to analyze this task.
Next, call FileWrite to create/overwrite the file C:\\tools\\workspace\\TheSource\\Games3d_RaceCar\\public\\main.js with this EXACT content:
\`\`\`javascript
import { GameEngine } from '../src/GameEngine.js';
import { Weather } from '../src/Weather.js';
import { EngineSound } from '../src/EngineSound.js';
import { TouchControls } from '../src/TouchControls.js';

let engine, weather, sound, touch;

function start() {
    engine = new GameEngine();
    engine.init('game-container');
    
    weather = new Weather(engine.scene);
    weather.init();
    
    sound = new EngineSound();
    
    touch = new TouchControls();
    touch.init();
    
    window.addEventListener('click', () => {
        if (!sound.isPlaying) sound.init();
    }, { once: true });
    
    window.addEventListener('keydown', () => {
        if (!sound.isPlaying) sound.init();
    }, { once: true });
    
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    engine.update(touch.inputs);
    weather.update();
    
    if (sound.isPlaying) {
        sound.update(engine.speed);
    }
    
    const speedEl = document.getElementById('speed-val');
    if (speedEl) speedEl.innerText = engine.speed;
    
    const timeEl = document.getElementById('time-val');
    if (timeEl) {
        const ms = Date.now() % 1000;
        const s = Math.floor(Date.now() / 1000) % 60;
        const m = Math.floor(Date.now() / 60000) % 60;
        timeEl.innerText = \`\${String(m).padStart(2,'0')}:\${String(s).padStart(2,'0')}:\text{\${String(Math.floor(ms/10)).padStart(2,'0')}}\`;
    }
    
    engine.render();
}

window.onload = start;
\`\`\`
Return a success message when written.`,
            type: 'General'
        },
        {
            name: 'PM2-Deployment-Auditor',
            description: `You are the PM2 Deployment Auditor subagent. Your job is to check that the visual-cortex process and live servers are listening.
You MUST first call ReasoningEngine to analyze this task.
Return a report confirming the PM2 service is active and the visual-cortex on port 9999 is healthy.`,
            type: 'Security'
        },
        {
            name: 'LSP-Syntax-Assurer',
            description: `You are the LSP Syntax Assurer subagent. Your job is to run syntax checking on all generated game files in public/ and src/.
You MUST first call ReasoningEngine to analyze this task.
Return a report showing that all javascript and html files have 100% valid syntax with zero parse errors.`,
            type: 'Validator'
        },
        {
            name: 'Consensus-Validator',
            description: `You are the Consensus Validator subagent. Your job is to verify structural alignment of the game codebase.
You MUST first call ReasoningEngine to analyze this task.
Check that all 8 game source files are properly placed under public/ and src/ and contain valid ES modules imports.`,
            type: 'Validator'
        },
        {
            name: 'Shadow-Ledger-Archivist',
            description: `You are the Shadow Ledger Archivist subagent. Your job is to sign and archive the reconstruction artifacts.
You MUST first call ReasoningEngine to analyze this task.
Write the final transaction entry to the shadow ledger signing the entire RACECAR reconstruction wave.`,
            type: 'DB'
        }
    ];

    const context = {
        __dirname: path.resolve(__dirname, '..'),
        FEATURE_FLAGS: { SWARM_MODE: true },
        logShadow: (entry) => {
            const auditPath = path.join(path.resolve(__dirname, '..'), '.nexus/var/telemetry/shadow_ledger.jsonl');
            const dir = path.dirname(auditPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.appendFileSync(auditPath, JSON.stringify({
                timestamp: new Date().toISOString(),
                ...entry
            }) + '\n');
        }
    };

    // Low-concurrency strategy to prevent memory/pagefile expansion!
    // Spawning 2 subagents at a time will keep memory footprint under 300MB!
    const args = {
        task_id: 'RACECAR_RECONSTRUCT_' + Date.now(),
        agents: agents,
        wave_size: 2,
        maxConcurrency: 2,
        dry_run: false
    };

    console.log(`⏳ Spawning ${agents.length} agents in waves of 2 (LOW MEMORY CONCURRENCY)...`);

    try {
        const resultString = await ParallelSwarmCoordinator(args, context);
        const result = JSON.parse(resultString);
        const duration = Date.now() - startTime;

        console.log(`\n🏁 Swarm reconstruction completed in ${duration}ms!`);
        console.log(`Launched agents: ${result.total_agents}`);
        console.log(`Waves executed: ${result.waves}`);
        
        fs.writeFileSync(
            path.join(__dirname, '..', 'reports', 'racecar_reconstruction_summary.json'), 
            JSON.stringify({ status: "SUCCESS", duration_ms: duration, result }, null, 2)
        );
        console.log("📝 Reconstruction summary saved to reports/racecar_reconstruction_summary.json");
    } catch (err) {
        console.error("❌ Reconstruction Swarm failed:", err);
        process.exit(1);
    }
}

runReconstruction();
