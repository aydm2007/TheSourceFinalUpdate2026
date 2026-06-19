# USAGE – دليل استدعاء الوكلاء الداخليين وتخزين نتائج "الإسـراب"

## 1️⃣ استدعاء وكيل داخلي (مثال: django‑doctor)
```bash
# إنشاء مهمة تحليل Django
TaskCreate(title: "Run Django Doctor", description: "تحليل نماذج وإصلاح N+1")
```
- بعد إكمال المهمة، احفظ النتائج في `bugs.md`:
```json
FileEdit(
  file_path: ".agents/memory/bugs.md",
  old_string: "<!-- APPEND -->",
  new_string: "## 2026-05-13 Django Doctor Findings\n- N+1 في Activity → استخدم select_related\n<!-- APPEND -->"
)
```
- سيُسجَّل هذا الإجراء في `shadow_ledger.jsonl` تلقائياً.

## 2️⃣ تنفيذ عملية "إسـراب" (Scraping) للبيانات الخارجية
```bash
# مثال: جلب بيانات الطقس من API خارجي
Bash(command: "curl -s https://api.weather.com/v3/wx/forecast/daily/5day?apiKey=$WEATHER_API_KEY > /tmp/weather.json")
```
- احفظ النتيجة في جلسة اليوم داخل `sessions/2026-05-13.md`:
```json
FileAppend(file_path: ".agents/memory/sessions/2026-05-13.md", new_string: "## Weather Scrape\n```json\n$(cat /tmp/weather.json)\n```\n")
```
- **ملاحظة الأمان:** لا تُدرج الـ API_KEY في الملف؛ يُستدعى عبر المتغير البيئي.

## 3️⃣ ربط النتائج مع تقارير VisualAuditReport
```json
VisualAuditReport(report_data: {
  finance_modules: [{name: "GRP Ledger", status: "OK"}],
  maturity_score: 94,
  production_ready: 1,
  recommendation: "Deploy with CloudOps 4.7 integration"
})
```
- يُنتج ملف HTML يُحفظ في `artifacts/report.html` لتوزيع الفريق.

---

### قواعد عامة
- **تحقق من ZodSchema** قبل أي `FileEdit` أو `FileWrite`.
- **لا تستخدم pop()** في أي كود Python داخل الوكلاء؛ استبدل بـ `get()`.
- **احرص على إغلاق ملفات الـ JSON** قبل حفظها لتفادي أخطاء parsing.
- **قسم التحليل الضخم** إلى طلبات فرعية لتفادي حد الـ tokens في Gemini‑Flash 3.

---

🚀 **ابدأ الآن**: نفّذ أحد الأمثلة أعلاه وتأكد من ظهور السجلات في `shadow_ledger.jsonl` و`visual audit report`.
