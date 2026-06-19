/**
 * 🗺️ Arabic Error Mapper (SRE v2.0)
 * Intercepts linter, compiler, and system error logs and translates them to friendly Arabic.
 */

const ERROR_DICTIONARY = {
    'ENOENT': 'الملف أو المجلد المستهدف غير موجود في هذا المسار.',
    'EACCES': 'صلاحيات غير كافية للوصول إلى الملف أو تعديله (تأكد من تشغيل الصلاحيات المناسبة).',
    'EADDRINUSE': 'المنفذ المطلوب محجوز بالفعل بواسطة عملية أو خدمة أخرى قيد التشغيل.',
    'ECONNREFUSED': 'تم رفض الاتصال بالخادم المضيف بشكل قاطع (تأكد من تشغيل الخدمة).',
    'ETIMEDOUT': 'انتهت المهلة المحددة للطلب قبل تلقي استجابة كاملة من الخادم.',
    'CWE-GRP-01': 'انتهاك معايير البناء الحتمية: تم اكتشاف استخدام حقول عائمة غير آمنة بدلاً من الحقول العشرية الدقيقة.',
    'CWE-': 'انتهاك معايير الأمان العامة (CWE): تم الكشف عن ثغرة أمنية محتملة.',
    'SyntaxError': 'خطأ في صياغة وقواعد بناء الكود البرمجي (Syntax Error) يمنع المترجم من المتابعة.',
    'TypeError': 'خطأ في مطابقة الأنواع (TypeError): تم استدعاء دالة أو متغير بنوع غير مطابق للمتوقع.',
    'ReferenceError': 'خطأ إسناد (ReferenceError): تم استدعاء متغير أو دالة غير معرفة في هذا النطاق.',
    'API rate limit exceeded': 'تم تجاوز الحد المسموح به لمعدل الطلبات على واجهة البرمجة (Rate Limit).'
};

class ArabicErrorMapper {
    /**
     * Translates a raw error message or stack trace to simplified Arabic.
     * @param {Error|string} error The raw error object or string message.
     * @returns {string} The translated Arabic description.
     */
    static translate(error) {
        if (!error) return 'خطأ غير معروف.';
        const message = typeof error === 'string' ? error : (error.message || '');
        const code = typeof error === 'object' ? (error.code || '') : '';

        // Check by error code first
        if (code && ERROR_DICTIONARY[code]) {
            return `[${code}] ${ERROR_DICTIONARY[code]}`;
        }

        // Search for patterns inside the message text
        for (const [key, translation] of Object.entries(ERROR_DICTIONARY)) {
            if (message.includes(key)) {
                return `[${key}] ${translation} (التفصيل: ${message})`;
            }
        }

        return `خطأ غير مصنف: ${message}`;
    }

    /**
     * Integrates semantic assimilation of project documentation to diagnose the error and suggest/apply patches.
     * @param {Error|string} error The raw error.
     * @param {string} targetFile The file path where the error occurred.
     * @returns {Promise<object>} The diagnostic and patch suggestion.
     */
    static async diagnoseAndPatch(error, targetFile) {
        const path = require('path');
        const fs = require('fs');
        const { DataAssimilator } = require('../swarm/DataAssimilator.js');
        const { SovereignReasoningEngine } = require('../bridge/SovereignReasoningEngine.js');

        const translation = this.translate(error);
        
        const assimilator = new DataAssimilator();
        const docsResult = await assimilator.assimilateWorkspace(['docs/**/*.md', '*.md']);

        const engine = new SovereignReasoningEngine();
        const taskPrompt = `خطأ النظام المستهدف: ${error.message || error}\nترجمة الخطأ: ${translation}\nيرجى اقتراح كود بديل وإصلاح للمشكلة في الملف المذكور.`;
        
        let fileContent = '';
        if (targetFile && fs.existsSync(targetFile)) {
            fileContent = fs.readFileSync(targetFile, 'utf8');
        }

        const synthesis = await engine.synthesizeCode(taskPrompt, '', targetFile || 'system', fileContent || docsResult.context);

        return {
            error: error.message || error,
            translation_ar: translation,
            patch_suggested: synthesis.success,
            proposed_code: synthesis.code,
            explanation_ar: `تم الكشف عن الخطأ واستيعاب سياق المشروع بنجاح. نوع المعالجة المقترحة: ${synthesis.success ? 'إصلاح برمي تلقائي' : 'مراجعة هيكلية'}`,
            cot_trace: synthesis.cotTrace
        };
    }
}

module.exports = ArabicErrorMapper;

