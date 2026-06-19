---
name: flutter-fixer
description: "تشخيص وإصلاح مشاكل Flutter/Dart — Widgets, State Management, Navigation, وأداء التطبيقات"
user-invocable: true
when_to_use: "استخدم هذه المهارة عند مواجهة مشاكل Flutter: widgets لا تعرض، state management، build errors، أو مشاكل أداء."
version: 15.0-Apex
allowed-tools:
  - Grep
  - FileRead
  - FileEdit
  - FileWrite
  - Glob
  - Bash
  - Agent
  - TodoWrite
  - WebFetch
  - WebSearch
  - Mcp
---

# Flutter Fixer — تشخيص وإصلاح سيادي لتطبيقات الجوال
# Identity: Aether-Prime | Specialist: Claude-Ops 4.6

> هذه المهارة جزء من منظومة **AETHER-ZENITH V15.0-Apex** وتعمل بنمط **Zero-Trust**.
> 📌 للتفعيل الكامل: الالتزام بمعايير **Mobile Rich Aesthetics**.

## 🚀 بروتوكول التهيئة الأولية (Bootstrap Protocol)
إذا تم استدعاء هذه المهارة في بيئة جديدة، تحقق من توفر Flutter CLI وملفات المشروع الأساسية:

```bash
# bootstrap_flutter_fixer.sh
if ! command -v flutter &> /dev/null; then
  echo "⚠️ Flutter CLI غير مثبت أو غير موجود في الـ PATH."
fi
if [ ! -f "pubspec.yaml" ]; then
  echo "⚠️ ملف pubspec.yaml مفقود. هل أنت في جذر مشروع Flutter؟"
else
  echo "✅ بيئة Flutter جاهزة للعمل."
fi
```

## 🎨 معايير الجماليات الغنية (Mobile Rich Aesthetics)

عند إصلاح أو تطوير واجهات Flutter:
1. **الاستجابة الفائقة**: استخدام `CustomPainter` و `ImplicitAnimations` و `Slivers`.
2. **الاتساق البصري**: دعم الـ Dynamic Theming والـ Dark Mode والـ RTL افتراضياً.
3. **الدقة المؤسسية**: الالتزام بمعايير Google Fonts وتصميم الهوية البصرية السيادية.

## 🩺 التشخيص السيادي للجوال
1. فحص التبعيات في `pubspec.yaml` بحثاً عن أي ثغرات أمنية.
2. تتبع تدفق البيانات في الـ State Management (BLoC/Provider) لضمان "النزاهة المالية" في التطبيقات المرتبطة بالـ ERP.
```
Glob(pattern: "**/pubspec.yaml")
‖ Glob(pattern: "**/lib/**/*.dart")
‖ Grep(pattern: "class.*extends.*State", glob: "*.dart", output_mode: "content", -C: 3)
‖ Grep(pattern: "class.*extends.*Widget", glob: "*.dart", output_mode: "files_with_matches")
```

## ٢. فحص State Management
```
Grep(pattern: "Provider|Riverpod|Bloc|GetX|setState", glob: "*.dart", output_mode: "content")
‖ Grep(pattern: "ChangeNotifier|ValueNotifier|StreamBuilder", glob: "*.dart", output_mode: "content")
‖ Grep(pattern: "context\\.read|context\\.watch|ref\\.watch", glob: "*.dart", output_mode: "content")
```

## ٣. أنماط الإصلاح

### Widget لا يتحدث (setState missing)
```dart
// ❌ خطأ — تعديل مباشر بدون setState
items.add(newItem);

// ✅ إصلاح
setState(() {
  items.add(newItem);
});

// الكشف: Grep(pattern: "\\.add\\(|\\.remove\\(|\\.clear\\(", glob: "*.dart", output_mode: "content", -B: 5)
// → تحقق أن setState يلف التعديل
```

### Build Error: const vs final
```dart
// ❌ خطأ — const مع قيمة runtime
const DateTime now = DateTime.now();

// ✅ إصلاح
final DateTime now = DateTime.now();

// الكشف: Grep(pattern: "const.*DateTime\\.now|const.*Random", glob: "*.dart", output_mode: "content")
```

### Navigator Issues
```dart
// ❌ خطأ — push بدون await
Navigator.push(context, MaterialPageRoute(builder: (_) => Page()));

// ✅ إصلاح — await للحصول على نتيجة
final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => Page()));

// الكشف: Grep(pattern: "Navigator\\.push|Navigator\\.pop", glob: "*.dart", output_mode: "content", -C: 3)
```

### Performance: Unnecessary Rebuilds
```dart
// ❌ خطأ — build method ثقيل
Widget build(BuildContext context) {
  final data = expensiveComputation(); // يُعاد كل rebuild!
  return ...;
}

// ✅ إصلاح — cache في initState أو مع const
late final data = expensiveComputation();

// الكشف: Grep(pattern: "Widget build.*context", glob: "*.dart", output_mode: "content", -A: 10)
// → ابحث عن عمليات ثقيلة داخل build
```

### Null Safety Issues
```
Grep(pattern: "!\\.|as\\s+\\w+\\?|\\?\\.", glob: "*.dart", output_mode: "content", -C: 2)
→ ابحث عن force unwrap (!) وcast خطير
```

## ٤. BLoC / Cubit Pattern Issues
```
Grep(pattern: "class.*extends.*Bloc|class.*extends.*Cubit", glob: "*.dart", output_mode: "content", -C: 5)
‖ Grep(pattern: "BlocProvider|BlocBuilder|BlocListener|BlocConsumer", glob: "*.dart", output_mode: "content", -C: 3)
‖ Grep(pattern: "emit\\(|yield\\s", glob: "*.dart", output_mode: "content", -C: 3)
→ مشاكل شائعة:
  - emit() بعد async gap بدون mounted check
  - BlocProvider في مكان خاطئ (يجب أن يكون فوق الـ widget الذي يستخدمه)
  - mapEventToState مهمل — استخدم on<Event> بدلاً منه
```

## ٥. Platform Channels
```
Grep(pattern: "MethodChannel|EventChannel|BasicMessageChannel", glob: "*.dart", output_mode: "content", -C: 5)
→ تأكد من:
  - try/catch حول كل invokeMethod
  - PlatformException handling
  - fallback لـ web platform
```

## ٦. فحص التبعيات
```
FileRead(file_path: "pubspec.yaml")
Bash(command: "flutter pub outdated 2>&1 | head -30", description: "Check outdated packages")
Bash(command: "dart analyze 2>&1 | tail -20", description: "Run Dart analyzer")
```

## ٧. التحقق
```
Bash(command: "flutter analyze", description: "Static analysis", timeout: 60000)
Bash(command: "flutter test --coverage", description: "Run tests with coverage", timeout: 120000)
Bash(command: "flutter build apk --debug 2>&1 | tail -10", description: "Test build", timeout: 180000)
```

---

## 🧪 Test Suite — التحقق من صحة المهارة

```bash
#!/bin/bash
# test_flutter_fixer.sh
echo "🔍 فحص بيئة Flutter Fixer..."
command -v flutter >/dev/null 2>&1 && echo "✅ Flutter CLI متاح" || echo "❌ Flutter غير متاح"
if [ -f "pubspec.yaml" ]; then
  grep -q "flutter:" pubspec.yaml && echo "✅ مشروع Flutter سليم" || echo "⚠️ محتوى pubspec.yaml غير متوافق"
else
  echo "⚠️ لا يوجد pubspec.yaml في المسار الحالي"
fi
```

---
*Flutter Fixer — 15.0-Apex Certified. Zero-Trust Enabled.*

