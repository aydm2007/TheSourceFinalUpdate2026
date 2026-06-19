// Hook يُنفَّذ قبل أي أداة كتابة (FileWrite / FileEdit / غيرها)
// يتحقق من صلاحيات الأداة وفقاً لملف src/config/permissions.json
// يتحقق من عدم وجود أسرار أو مفاتيح حساسة في المدخلات

/**
 * يُستدعى من داخل executeTool قبل تنفيذ الأداة.
 * إذا تم اكتشاف سرية، يُسجَّل Task عبر TodoWrite ويُرفع خطأ.
 */
export async function preToolUse(toolName: string, args: any): Promise<void> {
  // Load permission config (fallback to allow all)
  let permissionConfig: { default: string; restrictedTools: string[] } = { default: 'allow', restrictedTools: [] };
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile('src/config/permissions.json', { encoding: 'utf-8' });
    permissionConfig = JSON.parse(raw);
  } catch (_) {
    // ignore – keep defaults
  }
  // Enforce permission if default is deny or tool is listed as restricted
  if (
    permissionConfig.default === 'deny' ||
    permissionConfig.restrictedTools.includes(toolName)
  ) {
    throw new Error(`🚫 Permission denied for tool ${toolName}`);
  }
  if (['FileWrite', 'FileEdit'].includes(toolName)) {
    const secretRegex = /(sk-[A-Za-z0-9]{20,}|SECRET_KEY|password\s*=)/g;
    const matches = JSON.stringify(args).match(secretRegex);
    if (matches) {
      // تسجيل المهمة الأمنية – نستعمل TodoWrite إذا كانت متوفرة في المشروع
      try {
        const { todoWrite } = await import('../../utils/todo');
        await todoWrite({
          task_id: 'SEC001',
          description: `سرية تم اكتشافها في ${toolName}: ${matches.join(', ')}`,
          status: 'open',
        });
      } catch (_) {
        // إذا لم توجد أداة TodoWrite، نتجاهل فقط (لكن نرفع الخطأ)
      }
      throw new Error('🚨 Secret detected – operation aborted');
    }
  }
  // يمكن إضافة فحوصات أخرى (quota, rate‑limit …) هنا
}
