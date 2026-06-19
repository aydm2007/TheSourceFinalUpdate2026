# خطة تحصين وبيئة تشغيل محمولة ومعزولة لوكيل Antigravity (APEX-PORTABLE)

تهدف هذه الخطة إلى تحويل بيئة تشغيل وكيل **Antigravity** إلى بيئة محمولة بالكامل (**Portable**)، معزولة أمنياً (**Isolated Sandbox**)، مع توفير لوحة تحكم موحدة بالمتغيرات السيادية (الهوية الرقمية، اسم الجهاز، وعنوان IP المزور/الافتراضي)، بالإضافة إلى تطبيق حزمة ضبط الأداء الفائقة لمنع استهلاك الذاكرة وتجميد واجهة التطوير.

---

## مراجعة المستخدم المطلوبة (إقرار القائد)

> [!IMPORTANT]
> يرجى مراجعة آليات محاكاة الهوية وتغيير اسم الجهاز وعنوان IP المقترحة أدناه للتأكد من ملاءمتها للمتطلبات العسكرية المعزولة قبل البدء بالتنفيذ.

> [!WARNING]
> تعديل الهوية واسم الجهاز على مستوى العمليات (Process-Level Spoofing) هو الطريقة الأكثر أماناً لحماية سلامة النظام المضيف من الانهيار، وتفادي حدوث تعارض مع الخدمات الأمنية الأخرى. تغيير هذه الإعدادات على مستوى النظام بالكامل قد يؤدي إلى إعادة تشغيل الخادم وقطع الاتصال. سنعتمد مبدئياً المحاكاة على مستوى العملية (Process-Level Simulation & Sandboxing).

---

## أسئلة مفتوحة

> [!NOTE]
> - هل تفضل تشغيل البيئة المعزولة تحت اسم مستخدم (Identity) وهمي محدد أم تفضل توليده عشوائياً في كل تشغيل؟
> - هل سيتم ربط البيئة بشبكة اتصال افتراضية (VPN/VLAN) معينة، أم نكتفي بعزل كرت الشبكة الحالي وحظر المنافذ الخارجية عبر جدار الحماية (Firewall Sandboxing)؟

---

## التغييرات المقترحة

سنقوم بإنشاء بيئة معزولة ومحمولة تحت المسار التالي:
`C:\tools\workspace\ForensicAudit\AntigravityPortable\`

### 1. المكون الأول: الإعدادات الموحدة (Unified Configuration)
#### [NEW] [portable_config.json](file:///C:/tools/workspace/ForensicAudit/AntigravityPortable/portable_config.json)
ملف التكوين الموحد لحفظ كافة متغيرات الهوية والشبكة والتحسين.
```json
{
  "Identity": {
    "SpoofUsername": "SovereignAgent_APEX",
    "SpoofUserProfile": "C:\\tools\\workspace\\ForensicAudit\\AntigravityPortable\\Profile",
    "SpoofComputerName": "SEC-SANDBOX-01"
  },
  "Network": {
    "SpoofIP": "10.240.10.150",
    "SandboxMode": "High",
    "BlockOutboundPorts": [80, 443, 9999, 8080],
    "ProxyAddress": "127.0.0.1:8118"
  },
  "PerformanceTuning": {
    "VMOptimizations": {
      "Xms_MB": 2048,
      "Xmx_MB": 4096,
      "MaxMetaspaceSize_MB": 512,
      "UseG1GC": true,
      "DisableExplicitGC": true
    },
    "IDESettings": {
      "DisableFileWatching": true,
      "MaxIndexerThreads": 2,
      "MemoryLimit_MB": 4096
    }
  }
}
```

### 2. المكون الثاني: محرك التشغيل المحمول والمعزول (Sovereign Runner)
#### [NEW] [run_portable_antigravity.ps1](file:///C:/tools/workspace/ForensicAudit/AntigravityPortable/run_portable_antigravity.ps1)
بروتوكول التشغيل والتحصين بالصلاحيات الأمنية. يقوم بـ:
1. قراءة `portable_config.json`.
2. حظر وتأمين مسار الملفات (Folder ACLs) للوصول المحلي فقط.
3. تطبيق جدار الحماية لعزل العمليات وحظر المنافذ المحددة أوتوماتيكياً.
4. محاكاة الهوية واسم الجهاز في بيئة تشغيل العملية (Environment Variables Spoofing).
5. تشغيل وكيل Antigravity بشكل معزول ومحمول.
6. سحب تقرير فوري لحالة الموارد بعد انتهاء التشغيل.
7. استرجاع الإعدادات الافتراضية بأمان.

### 3. المكون الثالث: تحسين أداء بيئة التطوير (IDE Optimization)
#### [NEW] [ide_performance_tweaks.json](file:///C:/tools/workspace/ForensicAudit/AntigravityPortable/ide_performance_tweaks.json)
تكوين خاص لملف `settings.json` لـ VS Code/Cursor لمنع التجميد وتقليص الفهرسة.
```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/.nexus/**": true
  },
  "search.followSymlinks": false,
  "editor.largeFileOptimizations": true,
  "eslint.run": "onSave"
}
```

---

## خطة التحقق (Verification Plan)

### الاختبارات التلقائية
- تشغيل اختبار فحص بيئة المحاكاة عبر تشغيل سكربت الفحص المخصص والتحقق من التغييرات في المتغيرات:
  ```powershell
  powershell -ExecutionPolicy Bypass -File C:\tools\workspace\ForensicAudit\AntigravityPortable\run_portable_antigravity.ps1 --test-dry
  ```
- مراجعة تقرير التشغيل `portable_execution_report.html` للتأكد من تسجيل استهلاك الذاكرة وحالة الحظر والشبكة.

### التحقق اليدوي
- فحص المتغيرات البيئية داخل العملية للتحقق من قراءة اسم الجهاز المزور وعنوان IP المحاكى.
