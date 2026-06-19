# تهيئة بيئة العمل السيادية لـ TheSource
Write-Host "🛡️ [Sovereign-Kernel] Initiating Hardening..." -ForegroundColor Cyan

# 1. إصلاح مسارات الموديول
$Env:NODE_PATH = "C:\tools\workspace\TheSource\package"
$Env:NODE_ENV = "production"

# 2. إنشاء هيكلية الذاكرة المعرفية (إذا كانت مفقودة)
if (!(Test-Path ".agents/memory/cognitive_logs")) {
    New-Item -ItemType Directory -Path ".agents/memory/cognitive_logs" -Force
}

# 3. التأكد من سلامة ملفات البناء (Build Integrity)
Write-Host "🔍 [Sovereign-Kernel] Validating Maps..."
if (Test-Path "package/cli.js.map") {
    Write-Host "✅ Maps Synchronized." -ForegroundColor Green
} else {
    Write-Host "⚠️ CLI Source Maps missing. Rebuilding..." -ForegroundColor Yellow
    npm run build
}

# 4. تفعيل وضع التطوير السيادي
Write-Host "🚀 [Sovereign-Kernel] V44.0-Singularity Active." -ForegroundColor Magenta