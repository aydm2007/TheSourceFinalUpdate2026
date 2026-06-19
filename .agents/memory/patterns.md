# 🔍 الأنماط المكتشفة

<!-- APPEND -->

## نمط: Bare Error Handlers في Global Scope (2026-05-29)

- **المشكلة**: `process.on('uncaughtException', err => console.error(...))` يخفي كل معلومات Runtime الجنائية.
- **القاعدة**: **كل global error handler يجب أن يستدعي `realDecodeStackTrace` ويُسجّل في shadow_ledger**.
- **الحل**: `_forensicErrorHandler()` في `mcp_remote_server.js` يربط `originalPositionFor()` تلقائياً بكل خطأ Runtime.
- **الملفات المتأثرة**: `mcp_remote_server.js:1524+`
- **الدليل**: `originalPositionFor(gen:8:1924) → lodash-es/_listCacheClear.js:8:0` مؤكد.

## نمط: Worker Constructor Parameter Shadowing (2026-05-29)

- **المشكلة**: `new Worker(file, { workerData })` يبحث عن متغير محلي اسمه `workerData` — إذا كان المتغير المحلي اسمه `taskData` فإن `workerData` تُصبح `undefined` وكل worker يتلقى `null` كـ data.
- **القاعدة**: **دائماً اكتب `{ workerData: taskData }` صراحةً — لا تعتمد على الاختصار `{ workerData }` إذا كان اسم المتغير مختلفاً.**
- **الملفات المتأثرة**: `core/security/sovereign_engine.js:420` → `spawnWorkerTask`
- **الدليل**: قبل الإصلاح `completed:0/4` — بعده `completed:4/4 | tid:1-4`.

## نمط: VectorSearch chain requires sequential build (2026-05-29)

- **المشكلة**: استدعاء `VectorSearchEngine` قبل `VectorAstMapper` يُعيد `status: empty` دائماً.
- **القاعدة**: **`VectorAstMapper` يملأ `vectorStore` في الـ process memory — يجب أن يُستدعى أولاً في نفس الـ process.**
- **الاختبار الصحيح**: INDEX → SEARCH في نفس الـ session (وليس عبر استدعاءات منفصلة).
- **الملفات المتأثرة**: `core/security/tools_integrator.js` → `VectorAstMapper.handler`, `VectorSearchEngine.handler`

## ???: cli.js.map ?? Zero-Token Data Source (2026-05-29)

- **??????**: cli.js.map (10MB+, 4756 sources, sourcesContent=true) ?? ????? ?? Context � ??????? ?? PATH ???.
- **???????**: ?? ???? ?? sovereign_engine.js ???? ??? map ??????? ??? fs.readFileSync/getSourceMapConsumer.
- **??????? ??????? ??? ??? ?????**: realV8Remap, realTimeTravelDebug, realVisualDomMap, realPredictiveImmunize, realSandboxedChaos.
- **???????**: 0 tokens consumed ??? map content � ??? ??????? ??? JSON ???? Context.

## ???: sourcesContent Mining ??????? ??????? (2026-05-29)

- **????????**: cli.js.map ????? sourcesContent ?? 1906 ??? ???? � ??? React/TS ???? ???? ?????.
- **????????? ???????? ???????**:
  - PredictiveImmunization: 1479 ??? ?????? 50 finding ?????
  - VisualDomMapper: 572 component + 141 hook ??????? ????????
  - V8FlamegraphProfiler: 3/3 frames remapped ?? 100.0% rate
  - SandboxedChaos: 20 ??? ?????? avg_resilience=57.3%
  - TimeTravelDebugger: state_reconstructed @ \_listCacheClear.js:8
- **???????**: ?????? ??? path ?? parameter ???? cli_map_path/map_path/client_map_path.
