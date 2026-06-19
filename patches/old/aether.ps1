# Aether Engine â€” Sovereign CLI Wrapper
# Patch: Sovereign MCP-Native Developer AI Platform

$c = $args[0]
$remainingArgs = @()
if ($args.Count -gt 1) {
    $remainingArgs = $args[1..($args.Count - 1)]
}

function Resolve-AetherConsoleOptions {
    param(
        [string[]]$ConsoleArgs
    )

    $model = $null
    $provider = $null
    $plannerModel = $null
    $executorModel = $null

    for ($i = 0; $i -lt $ConsoleArgs.Count; $i++) {
        $arg = $ConsoleArgs[$i]

        if ($arg -eq '--model' -and ($i + 1) -lt $ConsoleArgs.Count) {
            $model = $ConsoleArgs[$i + 1]
            $i++
            continue
        }

        if ($arg -like '--model=*') {
            $model = $arg.Split('=', 2)[1]
            continue
        }

        if ($arg -eq '--provider' -and ($i + 1) -lt $ConsoleArgs.Count) {
            $provider = $ConsoleArgs[$i + 1]
            $i++
            continue
        }

        if ($arg -like '--provider=*') {
            $provider = $arg.Split('=', 2)[1]
            continue
        }

        if ($arg -eq '--planner-model' -and ($i + 1) -lt $ConsoleArgs.Count) {
            $plannerModel = $ConsoleArgs[$i + 1]
            $i++
            continue
        }

        if ($arg -eq '--executor-model' -and ($i + 1) -lt $ConsoleArgs.Count) {
            $executorModel = $ConsoleArgs[$i + 1]
            $i++
            continue
        }

        if (-not $model -and -not $arg.StartsWith('--')) {
            $model = $arg
        }
    }

    if ($model) {
        $env:AETHER_MODEL = $model
        if (-not $plannerModel) { $env:AETHER_PLANNER_MODEL = $model }
        if (-not $executorModel) { $env:AETHER_EXECUTOR_MODEL = $model }

        if (-not $provider) {
            $lowerModel = $model.ToLowerInvariant()
            $isOpenRouterModel = $lowerModel.EndsWith(':free') -or
                $lowerModel.StartsWith('openai/') -or
                $lowerModel.StartsWith('google/') -or
                $lowerModel.StartsWith('meta/') -or
                $lowerModel.StartsWith('anthropic/') -or
                $lowerModel.StartsWith('qwen/') -or
                $lowerModel.StartsWith('mistral/') -or
                $lowerModel.StartsWith('nvidia/') -or
                $lowerModel.StartsWith('poolside/') -or
                $lowerModel.StartsWith('z-ai/') -or
                $lowerModel.StartsWith('zai/')

            $isSiliconFlowModel = $lowerModel.StartsWith('deepseek-ai/') -or $lowerModel.StartsWith('deepseek-')

            if ($isOpenRouterModel) {
                $provider = 'openrouter'
            } elseif ($isSiliconFlowModel) {
                $provider = 'siliconflow'
            }
        }
    }

    if ($provider) {
        $env:AETHER_PROVIDER = $provider
    }

    if ($plannerModel) {
        $env:AETHER_PLANNER_MODEL = $plannerModel
    }

    if ($executorModel) {
        $env:AETHER_EXECUTOR_MODEL = $executorModel
    }
}

if ($null -eq $c -or $c -eq 'help') {
    Write-Host "AETHER ENGINE PRIME -- CLI MENU"
    Write-Host "--------------------------------"
    Write-Host ".\aether.ps1 boot    : Launch Sovereign Core (Legacy Binary)"
    Write-Host ".\aether.ps1 console [model] : Launch Sovereign Developer Console"
    Write-Host "  examples:"
    Write-Host "    .\aether.ps1 console openai/gpt-oss-120b:free"
    Write-Host "    .\aether.ps1 console --model openai/gpt-oss-120b:free --provider siliconflow"
    Write-Host "    .\aether.ps1 console --model google/gemma-4-31b-it:free --provider openrouter"
    Write-Host ".\aether.ps1 health  : Check Cloud Relay Health"
    Write-Host ".\aether.ps1 test    : Run Atomic Test Suite"
    Write-Host ".\aether.ps1 clean   : Purge legacy artifacts"
    exit
}

if ($c -eq 'boot') {
    Write-Host "Booting Aether Engine Prime..."
    node .\aether-boot.js @remainingArgs
}
elseif ($c -eq 'console') {
    Resolve-AetherConsoleOptions -ConsoleArgs $remainingArgs
    $env:AETHER_PLATFORM_MODE = 'developer'
    $env:AETHER_WORKSPACE_ROOT = (Get-Location).Path
    Write-Host "Opening Sovereign Developer Console..."
    if ($env:AETHER_MODEL) { Write-Host "Model: $env:AETHER_MODEL" }
    if ($env:AETHER_PROVIDER) { Write-Host "Provider: $env:AETHER_PROVIDER" }
    Write-Host "Bootstrap: MCP runtime + provider router + context engine"
    node .\package\cli.js @remainingArgs
}
elseif ($c -eq 'health') {
    Write-Host "Checking Aether Core Health..."
    node -e "require('dotenv').config(); const {RelayBridge} = require('./relay_bridge.js'); const b = new RelayBridge(); console.log(JSON.stringify(b.healthCheck(), null, 2))"
}
elseif ($c -eq 'test') {
    Write-Host "Running Sovereign Sentinel Initialization..."
    node src/core-engine/SentinelGuard.js --initialize
    Write-Host "Running Adversarial WarGaming Scan..."
    node src/security/warGamingEngine.js --scan-plan
    Write-Host "Running Decimal Purity Verification..."
    python scripts/verify_decimal_purity.py
    Write-Host "Running Security Pre-Commit Shield Check..."
    node scripts/pre_commit_secrets_shield.js
    Write-Host "Running Semantic Memory Index Curation..."
    node scripts/auto_distill_memory.js
    Write-Host "Running Core Logic Tests..."
    node test_runner.js
}
elseif ($c -eq 'clean') {
    Write-Host "Purging legacy artifacts..."
    Remove-Item test_siliconflow_adapter.js, nexus.ps1 -ErrorAction SilentlyContinue
}
else {
    Write-Host "Unknown command: $c"
}