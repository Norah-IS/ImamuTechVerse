interface AIPayload {
  systemPrompt: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}

async function callAI(payload: AIPayload): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`AI request failed: ${response.status}`);
  const data = await response.json();
  return data.text as string;
}

export async function getChatResponse(
  userMessage: string,
  role: 'student' | 'admin',
  context: object,
  history: { role: string; content: string }[] = []
): Promise<string> {
  const systemPrompt =
    role === 'admin' ? buildAdminSystemPrompt(context) : buildStudentSystemPrompt(context);

  return callAI({
    systemPrompt,
    messages: [...history, { role: 'user', content: userMessage }],
    maxTokens: 600,
  });
}

export async function getEventRelevance(event: object, profile: object): Promise<string> {
  return callAI({
    systemPrompt: `أنت مساعد ذكي لمنصة ImamuTechVerse بجامعة الإمام محمد بن سعود الإسلامية.
مهمتك: اكتب 2-3 جمل بالعربية تشرح لماذا هذا النشاط تحديداً مناسب لهذا الطالب.
كن شخصياً ومحدداً — استند إلى اهتماماته وتخصصه وسجل حضوره.
لا تبدأ الجواب بـ "هذا النشاط" أو "يُنصح" — ابدأ بشكل مباشر وشخصي.
اكتب 2-3 جمل فقط لا أكثر.`,
    messages: [
      {
        role: 'user',
        content: `النشاط:\n${JSON.stringify(event, null, 2)}\n\nملف الطالب:\n${JSON.stringify(profile, null, 2)}`,
      },
    ],
    maxTokens: 200,
  });
}

export async function getCheckinMessage(
  profile: object,
  attendedEvent: object,
  upcomingEvents: object[]
): Promise<string> {
  return callAI({
    systemPrompt: `أنت مساعد ذكي لمنصة ImamuTechVerse بجامعة الإمام محمد بن سعود الإسلامية.
الطالب/ة سجّل حضوره للتو في نشاط. اكتب رسالة تشتمل على:
1. جملة تهنئة شخصية تذكر اسم الطالب ونوع النشاط
2. جملة أو جملتان تُذكّر بأهمية المشاركة وتشجعه على الاستمرار
3. إن وجدت أنشطة قادمة مناسبة أوصِ بواحدة بجملة قصيرة
الرد بالعربية، قصير (4-5 جمل)، ودود ومشجع.`,
    messages: [
      {
        role: 'user',
        content: `النشاط الذي حضره:\n${JSON.stringify(attendedEvent, null, 2)}\n\nملف الطالب:\n${JSON.stringify(profile, null, 2)}\n\nأنشطة قادمة:\n${JSON.stringify(upcomingEvents, null, 2)}`,
      },
    ],
    maxTokens: 300,
  });
}

function buildStudentSystemPrompt(ctx: any): string {
  return `أنت مساعد ذكي لمنصة ImamuTechVerse بجامعة الإمام محمد بن سعود الإسلامية.
تساعد الطلاب في اكتشاف الأنشطة المناسبة وتحقيق أقصى استفادة من الحياة الجامعية.
النبرة: ودية، مشجعة، احترافية.
اللغة: أجب بالعربية دائماً ما لم يتحدث المستخدم بالإنجليزية.
الإجابات: موجزة ومفيدة (3-6 جمل).

معلومات الطالب:
- الاسم: ${ctx.userName ?? 'غير محدد'}
- الكلية: ${ctx.college ?? 'غير محدد'}
- الاهتمامات: ${(ctx.interests ?? []).join('، ') || 'غير محددة'}
- الأنشطة المسجل فيها: ${(ctx.registeredEvents ?? []).map((e: any) => e.title).join('، ') || 'لا توجد'}
- الأنشطة التي حضرها: ${ctx.attendedCount ?? 0}
- إجمالي الساعات الموثّقة: ${(ctx.totalHours ?? 0).toFixed(1)} ساعة

الأنشطة القادمة المتاحة:
${JSON.stringify(ctx.upcomingEvents ?? [], null, 2)}

سجل من أنشطة سابقة في المنصة (للاستئناس):
${JSON.stringify(ctx.pastEvents ?? [], null, 2)}`;
}

function buildAdminSystemPrompt(ctx: any): string {
  return `أنت مساعد ذكي لمنظّمي الأنشطة في منصة ImamuTechVerse بجامعة الإمام محمد بن سعود الإسلامية.
تساعد في تحليل أداء الأنشطة وتقديم توصيات لتحسين الفعاليات القادمة.
النبرة: مهنية، تحليلية، موجزة.
اللغة: أجب بالعربية دائماً ما لم يتحدث المستخدم بالإنجليزية.
الإجابات: موجزة ومحددة بالأرقام (3-6 جمل).

إحصائيات الأنشطة الحالية:
${JSON.stringify(ctx.eventStats ?? [], null, 2)}

بيانات من أنشطة سابقة:
${JSON.stringify(ctx.pastEvents ?? [], null, 2)}`;
}