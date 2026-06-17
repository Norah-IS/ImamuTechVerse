import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Info, Zap, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { mockEvents, mockRegistrations } from '../data/mockData';
import { ACTIVITY_LEVELS } from '../data/activityLevels';
import type { ActivityRecord } from '../services/activityService';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StudentCtx {
  name: string;
  college: string;
  interests: string[];
  activityRecord: ActivityRecord | null;
  levelTitle: string;
  registeredEventIds: string[];
}

// ─── Keyword helper ──────────────────────────────────────────────────────────

function has(msg: string, ...words: string[]): boolean {
  return words.some((w) => msg.includes(w));
}

// ─── Student rule engine ─────────────────────────────────────────────────────

function studentResponse(msg: string, ctx: StudentCtx): string {
  const upcoming = mockEvents.filter((e) => e.status === 'upcoming');

  // Category filters — checked before broad "أنشطة" to avoid swallowing them
  if (has(msg, 'تقني', 'برمج', 'برمجة', 'هندس', 'تكنولوج', 'هاكاثون', 'ذكاء', 'tech')) {
    const evs = upcoming.filter((e) => e.category === 'تقني');
    return evs.length
      ? `الأنشطة التقنية القادمة (${evs.length}):\n\n${evs.map((e) => `• ${e.title}\n  ${e.date} — ${e.location}`).join('\n\n')}`
      : 'لا توجد أنشطة تقنية قادمة حالياً. راجع المنصة قريباً!';
  }

  if (has(msg, 'تطوع', 'تطوعي', 'خدم', 'مجتمع')) {
    const evs = upcoming.filter((e) => e.category === 'تطوعي');
    return evs.length
      ? `الأنشطة التطوعية القادمة:\n\n${evs.map((e) => `• ${e.title} — ${e.date}`).join('\n')}`
      : 'لا توجد أنشطة تطوعية قادمة حالياً.';
  }

  if (has(msg, 'ثقافي', 'ثقاف', 'أدبي', 'ادبي', 'خطاب', 'فن')) {
    const evs = upcoming.filter((e) => e.category === 'ثقافي');
    return evs.length
      ? `الأنشطة الثقافية القادمة:\n\n${evs.map((e) => `• ${e.title} — ${e.date}`).join('\n')}`
      : 'لا توجد أنشطة ثقافية قادمة حالياً.';
  }

  if (has(msg, 'ريادة', 'ريادي', 'أعمال', 'اعمال', 'مشروع', 'شركة')) {
    const evs = upcoming.filter((e) => e.category === 'ريادة أعمال');
    return evs.length
      ? `أنشطة ريادة الأعمال القادمة:\n\n${evs.map((e) => `• ${e.title} — ${e.date}`).join('\n')}`
      : 'لا توجد أنشطة ريادة أعمال قادمة حالياً.';
  }

  if (has(msg, 'علمي', 'علم', 'بحث', 'أكاديمي', 'ندوة')) {
    const evs = upcoming.filter((e) => e.category === 'علمي');
    return evs.length
      ? `الأنشطة العلمية والأكاديمية القادمة:\n\n${evs.map((e) => `• ${e.title} — ${e.date}`).join('\n')}`
      : 'لا توجد أنشطة علمية قادمة حالياً.';
  }

  // All upcoming events
  if (has(msg, 'قادم', 'قادمة', 'متاح', 'موجود', 'جميع', 'كل', 'أنشطة', 'انشطة', 'فعاليات', 'ماذا')) {
    if (upcoming.length === 0) return 'لا توجد أنشطة قادمة حالياً. تابع المنصة لمعرفة الجديد.';
    const list = upcoming
      .slice(0, 4)
      .map((e) => `• ${e.title}\n  ${e.date} — ${e.location}`)
      .join('\n\n');
    return `الأنشطة القادمة المتاحة (${upcoming.length}):\n\n${list}${upcoming.length > 4 ? '\n\n…وأكثر — استكشف الصفحة الرئيسية لرؤيتها جميعاً.' : ''}`;
  }

  // Recommendation
  if (has(msg, 'اقترح', 'انصح', 'يناسبني', 'مناسب', 'أنسب', 'توصية')) {
    const matched = upcoming.filter((e) => ctx.interests.includes(e.category));
    if (matched.length > 0) {
      return `بناءً على اهتماماتك (${ctx.interests.join('، ')})، أنصحك بـ:\n\n${matched
        .slice(0, 3)
        .map((e) => `• ${e.title} — ${e.date}`)
        .join('\n')}`;
    }
    if (upcoming.length > 0) {
      return `إليك بعض الأنشطة المتاحة:\n\n${upcoming
        .slice(0, 3)
        .map((e) => `• ${e.title} — ${e.date}`)
        .join('\n')}`;
    }
    return 'لا توجد أنشطة متاحة حالياً، لكن يمكنك تحديث اهتماماتك من ملفك الشخصي لتلقي توصيات أفضل.';
  }

  // Registration
  if (has(msg, 'سجّل', 'أسجل', 'تسجيل', 'انضم', 'اشتراك', 'أشارك', 'اشترك', 'كيف')) {
    return 'لتسجيل نفسك في نشاط:\n\n1. اذهب إلى الصفحة الرئيسية\n2. اضغط على النشاط الذي يهمك\n3. اختر "تسجيل كحضور" أو "تسجيل كمتطوع"\n4. ستصلك رسالة تأكيد على بريدك الجامعي فور التسجيل.';
  }

  // Activity record / hours
  if (has(msg, 'ساعة', 'ساعات', 'سجل', 'نشاطاتي', 'أنشطتي', 'حضرت', 'مشاركاتي', 'مستوى')) {
    if (!ctx.activityRecord || ctx.activityRecord.entries.length === 0) {
      return 'لا يوجد سجل نشاط بعد. سجّل حضورك في الأنشطة لتبدأ رحلة التطوير وتراكم الساعات!';
    }
    return `سجل نشاطك:\n\n• إجمالي الساعات: ${ctx.activityRecord.totalHours.toFixed(1)} ساعة\n• عدد الأنشطة: ${ctx.activityRecord.entries.length}\n• المستوى الحالي: ${ctx.levelTitle}`;
  }

  // Certificates
  if (has(msg, 'شهادة', 'شهادات', 'certificate', 'وثيقة')) {
    return 'تُصدر الشهادات تلقائياً بعد انتهاء النشاط وتسجيل حضورك. يمكنك تحميلها من صفحة تفاصيل النشاط أو من ملفك الشخصي.';
  }

  // Absence
  if (has(msg, 'غياب', 'غيابات', 'حظر', 'محظور', 'تعليق')) {
    return 'يُسمح بـ 3 غيابات كحد أقصى. عند التجاوز يتم تعليق الحساب مؤقتاً. راجع إدارة شؤون الطلاب لرفع التعليق.';
  }

  // QR / check-in
  if (has(msg, 'باركود', 'qr', 'كيوار', 'حضور', 'تسجيل الحضور', 'مسح')) {
    return 'لتسجيل حضورك:\n\n1. افتح صفحة تفاصيل النشاط\n2. اضغط على زر "تسجيل الحضور"\n3. امسح رمز QR المعروض على شاشة المنظّم\n4. النظام يتحقق من موقعك تلقائياً (في نطاق 500 متر من مكان النشاط).';
  }

  // Waitlist
  if (has(msg, 'انتظار', 'قائمة انتظار', 'ممتلئ', 'مكتمل', 'مقعد')) {
    return 'إذا كان النشاط ممتلئاً يمكنك الانضمام لقائمة الانتظار. ستصلك إشعار تلقائي فور تحرر مقعد.';
  }

  // Volunteer
  if (has(msg, 'متطوع', 'تطوع', 'volunteer')) {
    const needVol = upcoming.filter((e) => e.needsVolunteers);
    return needVol.length
      ? `الأنشطة التي تحتاج متطوعين:\n\n${needVol.map((e) => `• ${e.title} — ${e.date}`).join('\n')}`
      : 'لا توجد أنشطة تحتاج متطوعين حالياً.';
  }

  // Profile
  if (has(msg, 'ملفي', 'بياناتي', 'حسابي', 'اهتمامات', 'كليتي')) {
    return `مرحباً ${ctx.name.split(' ')[0]}!\n• كليتك: ${ctx.college}\n• اهتماماتك: ${ctx.interests.join('، ') || 'لم تُحدَّد بعد'}\n\nلتعديل اهتماماتك، اذهب إلى ملفك الشخصي من القائمة العلوية.`;
  }

  // My registered events
  if (has(msg, 'مسجل', 'مسجّل', 'سجلت', 'نشاطاتي المسجلة')) {
    const myEvents = mockEvents.filter((e) => ctx.registeredEventIds.includes(e.id));
    return myEvents.length
      ? `أنشطتك المسجلة:\n\n${myEvents.map((e) => `• ${e.title} — ${e.date}`).join('\n')}`
      : 'لم تسجّل في أي نشاط بعد. استكشف الأنشطة القادمة!';
  }

  // Greeting
  if (has(msg, 'مرحب', 'أهلاً', 'اهلا', 'السلام', 'هلا', 'مساء', 'صباح', 'hello', 'hi')) {
    return `أهلاً ${ctx.name.split(' ')[0]}! أنا هنا لمساعدتك في:\n• اكتشاف الأنشطة القادمة\n• الاستفسار عن التسجيل والحضور\n• متابعة سجل نشاطك وساعاتك\n\nاسألني أي شيء أو اضغط على أحد الاقتراحات أدناه.`;
  }

  return `يمكنني مساعدتك في:\n• الأنشطة القادمة وتصفيتها بالفئة\n• كيفية التسجيل وتسجيل الحضور\n• ساعاتك وسجل نشاطك\n• الشهادات والغيابات\n\nجرّب الاقتراحات أدناه أو اسألني مباشرة.`;
}

// ─── Admin rule engine ───────────────────────────────────────────────────────

function adminResponse(msg: string): string {
  const allEvents = mockEvents;
  const allRegs = mockRegistrations;

  // Attendance
  if (has(msg, 'حضور', 'نسبة الحضور', 'حضرو', 'attendance')) {
    const attended = allRegs.filter((r) => r.status === 'attended').length;
    const active = allRegs.filter((r) => r.status !== 'cancelled').length;
    const rate = active ? Math.round((attended / active) * 100) : 0;
    return `إحصاءات الحضور:\n\n• نسبة الحضور الكلية: ${rate}%\n• المسجّلون النشطون: ${active}\n• حضروا فعلياً: ${attended}`;
  }

  // Most registered / popular
  if (has(msg, 'أكثر', 'اكثر', 'تسجيل', 'شعبي', 'مشهور', 'popular')) {
    const sorted = [...allEvents].sort((a, b) => b.registeredCount - a.registeredCount);
    return `الأنشطة الأكثر تسجيلاً:\n\n${sorted
      .slice(0, 3)
      .map((e, i) => `${i + 1}. ${e.title}\n   ${e.registeredCount} مسجّل من ${e.capacity}`)
      .join('\n\n')}`;
  }

  // Category performance
  if (has(msg, 'تصنيف', 'فئة', 'category', 'تقسيم', 'أفضل قسم')) {
    const catMap: Record<string, number> = {};
    allEvents.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.registeredCount;
    });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    return `التصنيفات حسب إجمالي التسجيل:\n\n${sorted.map(([cat, count]) => `• ${cat}: ${count} مسجّل`).join('\n')}`;
  }

  // Upcoming events
  if (has(msg, 'قادم', 'قادمة', 'upcoming', 'مجدول', 'جديد')) {
    const upcoming = allEvents.filter((e) => e.status === 'upcoming');
    if (upcoming.length === 0) return 'لا توجد أنشطة قادمة مجدولة حالياً.';
    return `الأنشطة القادمة (${upcoming.length}):\n\n${upcoming
      .map((e) => `• ${e.title}\n  ${e.date} — ${e.registeredCount}/${e.capacity} مسجّل`)
      .join('\n\n')}`;
  }

  // Full / capacity
  if (has(msg, 'ممتلئ', 'مكتمل', 'طاقة', 'capacity', 'مقاعد')) {
    const full = allEvents.filter((e) => e.registeredCount >= e.capacity);
    const nearFull = allEvents.filter(
      (e) => e.registeredCount < e.capacity && e.registeredCount / e.capacity >= 0.8
    );
    let res = '';
    if (full.length) res += `ممتلئة (${full.length}):\n${full.map((e) => `• ${e.title} — ${e.registeredCount}/${e.capacity}`).join('\n')}\n\n`;
    if (nearFull.length) res += `قريبة من الامتلاء (${nearFull.length}):\n${nearFull.map((e) => `• ${e.title} — ${e.registeredCount}/${e.capacity}`).join('\n')}`;
    return res || 'لا توجد أنشطة ممتلئة حالياً.';
  }

  // Waitlist
  if (has(msg, 'انتظار', 'قائمة انتظار', 'waitlist')) {
    const withWaitlist = allEvents.filter((e) => e.waitlistCount > 0);
    return withWaitlist.length
      ? `الأنشطة بقوائم انتظار:\n\n${withWaitlist.map((e) => `• ${e.title}: ${e.waitlistCount} في الانتظار`).join('\n')}`
      : 'لا توجد قوائم انتظار نشطة حالياً.';
  }

  // Completed events
  if (has(msg, 'منته', 'منتهي', 'مكتمل', 'أنجز', 'completed')) {
    const done = allEvents.filter((e) => e.status === 'completed');
    return done.length
      ? `الأنشطة المنتهية (${done.length}):\n\n${done.map((e) => `• ${e.title} — ${e.registeredCount} مسجّل`).join('\n')}`
      : 'لا توجد أنشطة منتهية مسجّلة.';
  }

  // Volunteers
  if (has(msg, 'متطوع', 'تطوع', 'volunteer')) {
    const needVol = allEvents.filter((e) => e.needsVolunteers && e.status === 'upcoming');
    return needVol.length
      ? `الأنشطة التي تحتاج متطوعين:\n\n${needVol.map((e) => `• ${e.title} — ${e.date}`).join('\n')}`
      : 'لا توجد أنشطة تحتاج متطوعين حالياً.';
  }

  // Total stats
  if (has(msg, 'إجمالي', 'اجمالي', 'كم', 'عدد', 'إحصاء', 'احصاء', 'ملخص', 'total', 'stats')) {
    const total = allEvents.length;
    const upcoming = allEvents.filter((e) => e.status === 'upcoming').length;
    const completed = allEvents.filter((e) => e.status === 'completed').length;
    const totalRegs = allEvents.reduce((s, e) => s + e.registeredCount, 0);
    const totalCap = allEvents.reduce((s, e) => s + e.capacity, 0);
    return `ملخص إحصاءات المنصة:\n\n• إجمالي الأنشطة: ${total}\n• قادمة: ${upcoming}\n• منتهية: ${completed}\n• إجمالي التسجيلات: ${totalRegs}\n• الطاقة الاستيعابية الكلية: ${totalCap}`;
  }

  // Greeting
  if (has(msg, 'مرحب', 'أهلاً', 'اهلا', 'السلام', 'هلا', 'hello', 'hi')) {
    return 'أهلاً! أنا مساعدك لتحليل بيانات الأنشطة. يمكنني مساعدتك في:\n• نسب الحضور والتسجيل\n• الأنشطة الأكثر شعبيةً\n• التحليل حسب التصنيف\n• الطاقة الاستيعابية وقوائم الانتظار';
  }

  return 'يمكنني مساعدتك في تحليل بيانات الأنشطة. اسألني عن:\n• نسب الحضور\n• الأنشطة الأكثر تسجيلاً\n• أداء التصنيفات\n• الطاقة الاستيعابية والانتظار';
}

// ─── Component ───────────────────────────────────────────────────────────────

const STUDENT_SUGGESTIONS = ['الأنشطة القادمة', 'اقترح لي نشاطاً', 'ساعاتي ومستواي', 'كيف أسجّل؟'];
const ADMIN_SUGGESTIONS = ['نسب الحضور', 'أكثر نشاط تسجيلاً', 'إحصاءات المنصة', 'أنشطة قريبة الامتلاء'];

export function AIChatWidget() {
  const { user, activityRecord } = useAuth();
  const { t, lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';

  // Build greeting on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = isAdmin
        ? `أهلاً ${user?.name.split(' ')[1] ?? ''}! أنا مساعدك لتحليل بيانات الأنشطة. اسألني عن الإحصاءات أو اضغط على أحد الاقتراحات.`
        : `أهلاً ${user?.name.split(' ')[0] ?? ''}! أنا مساعدك الذكي في منصة TechVerse. كيف يمكنني مساعدتك اليوم؟`;
      setMessages([{ role: 'assistant', content: greeting }]);
      setShowSuggestions(true);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setMessages([]);
    setShowSuggestions(true);
    setInput('');
  };

  const processMessage = (text: string) => {
    const msg = text.trim().toLowerCase();
    if (!msg) return;

    setMessages((prev) => [...prev, { role: 'user', content: text.trim() }]);
    setShowSuggestions(false);
    setInput('');

    // Build context for student
    const myRegs = mockRegistrations.filter(
      (r) => r.userId === user?.id && r.status !== 'cancelled'
    );
    const levelTitle = activityRecord
      ? (ACTIVITY_LEVELS[activityRecord.levelIndex]?.titleAr ?? 'مبتدئ')
      : 'مبتدئ';

    const studentCtx: StudentCtx = {
      name: user?.name ?? '',
      college: user?.college ?? '',
      interests: user?.interests ?? [],
      activityRecord: activityRecord ?? null,
      levelTitle,
      registeredEventIds: myRegs.map((r) => r.eventId),
    };

    const reply = isAdmin ? adminResponse(msg) : studentResponse(msg, studentCtx);

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    }, 320);
  };

  const handleSend = () => {
    if (input.trim()) processMessage(input);
  };

  if (!user) return null;

  const suggestions = isAdmin ? ADMIN_SUGGESTIONS : STUDENT_SUGGESTIONS;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#0D1130] hover:bg-[#13193E] text-white rounded-2xl shadow-xl border border-white/10 transition-all active:scale-95 group"
        aria-label={t('المساعد الذكي', 'AI Assistant')}
      >
        {isOpen ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <>
            <Bot className="w-5 h-5 text-[#00ADEF]" />
            <span className="text-sm font-bold hidden sm:block">{t('المساعد الذكي', 'AI Assistant')}</span>
            <span className="flex items-center gap-1 text-[10px] bg-[#00ADEF]/20 text-[#00ADEF] px-1.5 py-0.5 rounded-full font-bold border border-[#00ADEF]/30 hidden sm:flex">
              <Zap className="w-2.5 h-2.5" />
              {t('محلي', 'Local')}
            </span>
          </>
        )}
      </button>

      {/* ── Chat panel ── */}
      {isOpen && (
        <div
          className="fixed bottom-20 left-6 z-50 w-[370px] max-w-[calc(100vw-28px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: '500px' }}
          dir={dir}
        >
          {/* Header */}
          <div className="bg-[#0D1130] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#00ADEF]/20 rounded-xl flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#00ADEF]" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none">
                  {t('مساعد TechVerse', 'TechVerse Assistant')}
                </p>
                <p className="text-white/50 text-[10px] mt-0.5">
                  {isAdmin ? t('تحليل الأنشطة', 'Event Analytics') : t('مساعدك الشخصي', 'Your Personal Guide')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* AI indicator + tooltip */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="flex items-center gap-1 text-[10px] bg-[#00ADEF]/15 text-[#00ADEF] px-2 py-1 rounded-full border border-[#00ADEF]/25 font-bold cursor-help"
                >
                  <Zap className="w-2.5 h-2.5" />
                  {t('يعمل محلياً', 'Local AI')}
                  <Info className="w-2.5 h-2.5 opacity-60" />
                </button>
                {showTooltip && (
                  <div
                    className="absolute bottom-full mb-2 right-0 w-52 bg-gray-900 text-white text-[11px] leading-relaxed rounded-xl p-3 shadow-xl z-10"
                    dir={dir}
                  >
                    {t(
                      'يعمل المساعد باستخدام بيانات المنصة المحلية. يمكن تفعيل الذكاء الاصطناعي التوليدي عبر API في بيئة الإنتاج.',
                      'Assistant runs on local platform data. Generative AI can be enabled via API in production.'
                    )}
                    <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-gray-900 rotate-45" />
                  </div>
                )}
              </div>

              <button
                onClick={handleClose}
                className="text-white/40 hover:text-white transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 bg-[#00ADEF] rounded-full flex items-center justify-center shrink-0 mb-0.5">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-[#00ADEF] text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Quick suggestions */}
            {showSuggestions && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => processMessage(s)}
                    className="text-xs px-2.5 py-1.5 bg-white border border-[#00ADEF]/30 text-[#00ADEF] rounded-xl hover:bg-[#00ADEF]/5 transition-colors font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="p-3 border-t border-gray-200 bg-white shrink-0">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={t('اكتب سؤالك...', 'Type your question...')}
                className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00ADEF]/30 text-gray-800"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-9 h-9 bg-[#00ADEF] hover:bg-[#0099d4] disabled:opacity-30 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
