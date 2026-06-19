/**
 * Alpha-Hardware Bridge (Omega Phase)
 * Sovereign hardware integration layer substituting C++ Node Addons.
 * Provides deep biometric, environmental, and hardware telemetry.
 */

const { spawn } = require('child_process');

function runPowerShell(cmd) {
    return new Promise((resolve, reject) => {
        const ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', '-']);
        let stdout = '';
        let stderr = '';

        ps.stdout.on('data', data => stdout += data.toString());
        ps.stderr.on('data', data => stderr += data.toString());

        ps.on('close', code => {
            if (code !== 0 && stderr) {
                resolve({ error: stderr.trim() });
            } else {
                resolve(stdout.trim());
            }
        });
        
        ps.on('error', err => resolve({ error: err.message }));

        ps.stdin.write(cmd);
        ps.stdin.end();
    });
}

const HardwareBridge = {
    // 1. Biometrics (Windows Hello / Eye Tracking Stub)
    getBiometricStatus: async () => {
        const ps = `
        try {
            $sensors = Get-CimInstance -ClassName Win32_PnPEntity -ErrorAction Stop | Where-Object { $_.Caption -match 'Biometric|Tobii|Eye|Fingerprint' }
            if ($sensors) {
                $sensors | Select-Object Caption, Status | ConvertTo-Json -Compress
            } else {
                '{\\"status\\": \\"No biometric hardware detected. Using OS emulated stub.\\"}'
            }
        } catch {
            '{\\"status\\": \\"WMI Query failed\\"}'
        }
        `;
        const res = await runPowerShell(ps);
        try { return JSON.parse(res); } catch { return { raw: res }; }
    },

    requestWindowsHelloAuth: async (message = "Sovereign Auth Required") => {
        return { status: "Windows Hello / Biometric Auth Stub Triggered", message };
    },

    // 2. CPU Thermals & VRAM (Deep Hardware)
    getHardwareTelemetry: async () => {
        const ps = `
        $gpu = Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM
        $ram = Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory, TotalVisibleMemorySize
        $telemetry = @{
            GPU = $gpu.Name
            VRAM_MB = [math]::Round($gpu.AdapterRAM / 1MB, 2)
            TotalRAM_MB = [math]::Round($ram.TotalVisibleMemorySize / 1KB, 2)
            FreeRAM_MB = [math]::Round($ram.FreePhysicalMemory / 1KB, 2)
        }
        $telemetry | ConvertTo-Json -Compress
        `;
        const res = await runPowerShell(ps);
        try { return JSON.parse(res); } catch { return { raw: res }; }
    },

    getThermalThrottlingStatus: async () => {
        const ps = `
        try {
            $temp = Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace 'root/wmi' -ErrorAction Stop | Select-Object CurrentTemperature
            $celsius = ($temp.CurrentTemperature / 10) - 273.15
            '{\\"celsius\\": ' + $celsius + '}'
        } catch {
            '{\\"status\\": \\"Thermal sensors restricted by OS/OEM. Assuming 45C default.\\"}'
        }
        `;
        const res = await runPowerShell(ps);
        try { return JSON.parse(res); } catch { return { raw: res }; }
    },

    // 3. Ambient Light (Environmentals)
    getAmbientLight: async () => {
        const ps = `
        try {
            Add-Type -AssemblyName System.Runtime.WindowsRuntime
            $sensor = [Windows.Devices.Sensors.LightSensor, Windows.Devices.Sensors, ContentType = WindowsRuntime]::GetDefault()
            if ($sensor) {
                $reading = $sensor.GetCurrentReading()
                '{\\"illuminanceInLux\\": ' + $reading.IlluminanceInLux + '}'
            } else {
                '{\\"status\\": \\"No ambient light sensor found. Assuming 300 Lux.\\"}'
            }
        } catch {
            '{\\"status\\": \\"LightSensor API not accessible. Assuming 300 Lux.\\"}'
        }
        `;
        const res = await runPowerShell(ps);
        try { return JSON.parse(res); } catch { return { raw: res }; }
    },

    // 4. Edge/IoT Protocols (Bluetooth / PCI)
    getEdgeDevices: async () => {
        const ps = `
        try {
            $bt = Get-CimInstance Win32_PnPEntity | Where-Object { $_.Caption -match 'Bluetooth' } | Select-Object Caption
            $pci = Get-CimInstance Win32_PnPEntity | Where-Object { $_.DeviceID -match 'PCI' } | Select-Object Caption -First 2
            @{
                Bluetooth = @($bt.Caption)
                PCI_Samples = @($pci.Caption)
            } | ConvertTo-Json -Compress
        } catch {
            '{\\"status\\": \\"Failed to enumerate Edge devices\\"}'
        }
        `;
        const res = await runPowerShell(ps);
        try { return JSON.parse(res); } catch { return { raw: res }; }
    },
    
    // Aggregated state for the MCP Probe
    getFullOmegaTelemetry: async () => {
        const hw = await HardwareBridge.getHardwareTelemetry();
        const thermals = await HardwareBridge.getThermalThrottlingStatus();
        const light = await HardwareBridge.getAmbientLight();
        const bio = await HardwareBridge.getBiometricStatus();
        const edge = await HardwareBridge.getEdgeDevices();

        const canvasState = (global.ideState && global.ideState.canvasState) || {
            timestamp: new Date().toISOString(),
            frameHash: 'mock_canvas_webgl_frame_hash_v1',
            width: 800,
            height: 600,
            webglVendor: 'Google Inc. (Intel)',
            drawCalls: 42
        };

        return {
            timestamp: new Date().toISOString(),
            system: "AgriAsset YECO Omega-Hardware Layer",
            hardware: hw,
            thermals: thermals,
            environment: light,
            biometrics: bio,
            edgeProtocols: edge,
            canvasTelemetry: canvasState
        };
    }
};

module.exports = HardwareBridge;
