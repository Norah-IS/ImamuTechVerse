import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  UserX,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldOff,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  Users,
  Calendar,
  MapPin,
  Ban,
  ArrowRight,
  Inbox,
  PartyPopper,
  LogIn,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'waitlist' | 'block';

interface Step {
  id: number;
  actor: 'system' | 'admin' | 'student' | 'waitlisted';
  title: string;
  description: string;
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

// ─── Shared Mock Data ─────────────────────────────────────────────────────────
const EVENT = {
  title: 'مسابقة الهاكاثون الجامعي',
  date: '2026-06-05',
  time: '09:00 - 18:00',
  location: 'مبنى المختبرات',
  capacity: 100,
  registered: 100,
  waitlist: 20,
};

const STUDENT_CANCEL = { name: 'سارة خالد المطيري', id: '2024002', email: 'sara.m@imamu.edu.sa' };
const WAITLIST_STUDENT = { name: 'محمد عبدالله القحطاني', id: '2024003', email: 'm.qhtani@imamu.edu.sa', position: 1 };
const ABSENT_STUDENT = { name: 'أحمد محمد العلي', id: '2024001', email: 'ahmed.ali@imamu.edu.sa', studentId: '2024001' };

// ─── Reusable Sub-components ─────────────────────────────────────────────────

function PanelCard({ title, icon, color, children }: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border overflow-hidden h-full" style={{ borderColor: color + '33' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: color + '15' }}>
        <span style={{ color }}>{icon}</span>
        <span className="font-semibold text-sm" style={{ color }}>{title}</span>
      </div>
      <div className="p-4 space-y-3 bg-white">{children}</div>
    </div>
  );
}

function EmailPreview({ subject, from, to, body, type }: {
  subject: string;
  from: string;
  to: string;
  body: string;
  type?: 'promotion' | 'block' | 'warning';
}) {
  const accent = type === 'promotion' ? '#00ADEF' : type === 'block' ? '#dc2626' : '#f59e0b';
  return (
    <div className="rounded-lg border bg-gray-50 overflow-hidden text-sm">
      <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: accent + '18', borderBottom: `2px solid ${accent}` }}>
        <Mail size={14} style={{ color: accent }} />
        <span className="font-bold" style={{ color: accent }}>{subject}</span>
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="text-xs text-gray-500">من: {from}</div>
        <div className="text-xs text-gray-500">إلى: {to}</div>
      </div>
      <div className="px-3 pb-3">
        <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function NotificationBubble({ title, message, type }: {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
}) {
  const cfg = {
    success: { bg: '#00ADEF18', border: '#00ADEF', icon: <Bell size={16} style={{ color: '#00ADEF' }} /> },
    warning: { bg: '#f59e0b18', border: '#f59e0b', icon: <AlertTriangle size={16} style={{ color: '#f59e0b' }} /> },
    error: { bg: '#dc262618', border: '#dc2626', icon: <ShieldOff size={16} style={{ color: '#dc2626' }} /> },
  }[type];
  return (
    <div className="rounded-lg p-3 border text-sm" style={{ backgroundColor: cfg.bg, borderColor: cfg.border + '55' }}>
      <div className="flex items-start gap-2">
        {cfg.icon}
        <div>
          <div className="font-semibold text-gray-800">{title}</div>
          <div className="text-xs text-gray-600 mt-0.5">{message}</div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ full, waitlistCount }: { full?: boolean; waitlistCount?: number }) {
  return (
    <div className="rounded-lg border p-3 bg-white shadow-sm text-sm">
      <div className="font-bold text-[#1E2652] mb-2">{EVENT.title}</div>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1"><Calendar size={12} />{EVENT.date} — {EVENT.time}</div>
        <div className="flex items-center gap-1"><MapPin size={12} />{EVENT.location}</div>
        <div className="flex items-center gap-1"><Users size={12} />
          {full
            ? <span className="text-red-600 font-semibold">مكتمل ({EVENT.capacity}/{EVENT.capacity}) — قائمة الانتظار: {waitlistCount ?? EVENT.waitlist}</span>
            : <span className="text-green-600 font-semibold">مقعد متاح (99/{EVENT.capacity})</span>
          }
        </div>
      </div>
    </div>
  );
}

function RegistrationRow({ name, status }: { name: string; status: 'registered' | 'cancelled' | 'waitlist' | 'promoted' }) {
  const cfg = {
    registered: { label: 'مسجّل', color: '#16a34a' },
    cancelled: { label: 'ألغى', color: '#dc2626' },
    waitlist: { label: 'انتظار #1', color: '#f59e0b' },
    promoted: { label: 'مُرقَّى ✓', color: '#00ADEF' },
  }[status];
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border text-sm">
      <span className="text-gray-700">{name}</span>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

function SystemLog({ messages, highlight }: { messages: string[]; highlight?: number }) {
  return (
    <div className="rounded-lg border bg-gray-900 p-3 font-mono text-xs space-y-1 overflow-hidden">
      {messages.map((m, i) => (
        <div key={i} className={i === highlight ? 'text-[#00ADEF]' : 'text-gray-400'}>{`> ${m}`}</div>
      ))}
    </div>
  );
}

function AbsenceBadge({ count }: { count: number }) {
  const colors = ['#16a34a', '#f59e0b', '#ea580c', '#dc2626'];
  const c = colors[Math.min(count, 3)];
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map(n => (
        <div key={n} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
          style={{ backgroundColor: n <= count ? c + '20' : '#f3f4f6', borderColor: n <= count ? c : '#d1d5db', color: n <= count ? c : '#9ca3af' }}>
          {n}
        </div>
      ))}
      <span className="text-xs text-gray-500">غياب</span>
    </div>
  );
}

// ─── Waitlist Steps ────────────────────────────────────────────────────────────
function buildWaitlistSteps(): Step[] {
  return [
    {
      id: 1,
      actor: 'student',
      title: 'النشاط مكتمل — طالب يُلغي تسجيله',
      description: 'سارة مسجّلة في الهاكاثون لكنها قررت إلغاء تسجيلها. المقاعد مكتملة (100/100) وهناك 20 طالباً في قائمة الانتظار.',
      leftPanel: (
        <div className="space-y-3">
          <EventCard full waitlistCount={20} />
          <div className="space-y-1">
            <RegistrationRow name="سارة خالد المطيري" status="registered" />
            <RegistrationRow name="محمد القحطاني" status="waitlist" />
          </div>
        </div>
      ),
      rightPanel: (
        <div className="space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <UserX size={32} className="mx-auto text-red-500 mb-2" />
            <div className="font-semibold text-red-700 text-sm">سارة تضغط "إلغاء تسجيلي"</div>
            <div className="text-xs text-red-500 mt-1">ستتحرر مقعدها فوراً</div>
          </div>
          <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
            <div className="font-semibold text-gray-700">قبل الإلغاء:</div>
            <div>• المسجّلون: 100 / 100</div>
            <div>• قائمة الانتظار: 20 طالب</div>
            <div>• المقعد المتوفر: لا يوجد</div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      actor: 'system',
      title: 'النظام يكتشف مقعداً شاغراً',
      description: 'فور تأكيد الإلغاء، يتحقق النظام تلقائياً من قائمة الانتظار ويحدد الطالب الأول في الترتيب.',
      leftPanel: (
        <div className="space-y-3">
          <SystemLog
            messages={[
              'registration.cancel(userId: "2024002", eventId: "2")',
              'registeredCount: 100 → 99',
              'checking waitlist...',
              'waitlist.length = 20',
              'next in line: محمد القحطاني (pos #1)',
              'triggering: notifyWaitlist(userId: "2024003")',
            ]}
            highlight={5}
          />
          <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-xs text-amber-800">
            <strong>القاعدة:</strong> لا يُضاف الطلاب لقائمة الانتظار إلا بعد امتلاء المقاعد الأساسية. عند تحرر مقعد، يُرقَّى الأول تلقائياً.
          </div>
        </div>
      ),
      rightPanel: (
        <div className="space-y-3">
          <EventCard full={false} />
          <div className="space-y-1">
            <RegistrationRow name="سارة خالد المطيري" status="cancelled" />
            <RegistrationRow name="محمد القحطاني" status="waitlist" />
          </div>
          <div className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
            <Clock size={12} /> المعالجة تتم خلال أقل من ثانية
          </div>
        </div>
      ),
    },
    {
      id: 3,
      actor: 'system',
      title: 'إرسال إشعار الترقية للطالب',
      description: 'يُرسل النظام بريداً إلكترونياً وإشعاراً داخل التطبيق لمحمد يعلمه بأن مقعده أصبح متاحاً ويطلب منه التأكيد خلال 24 ساعة.',
      leftPanel: (
        <div className="space-y-3">
          <SystemLog
            messages={[
              'sendWaitlistPromotion({',
              '  to: "م.قحطاني@imamu.edu.sa"',
              '  event: "مسابقة الهاكاثون الجامعي"',
              '  deadline: "24 ساعة"',
              '})',
              'email.status: delivered ✓',
              'in-app notification: pushed ✓',
            ]}
            highlight={6}
          />
        </div>
      ),
      rightPanel: (
        <div className="space-y-3">
          <EmailPreview
            type="promotion"
            subject="🎉 تم ترقيتك! مقعد متاح في: مسابقة الهاكاثون"
            from="noreply@imamu.edu.sa"
            to="م.قحطاني@imamu.edu.sa"
            body={`عزيزي محمد عبدالله القحطاني،\n\nخبر سار! أصبح مقعد متاح لك في:\n📌 مسابقة الهاكاثون الجامعي\n📅 2026-06-05\n⏰ 09:00 - 18:00\n📍 مبنى المختبرات\n\nيُرجى تأكيد حضورك خلال 24 ساعة.`}
          />
          <NotificationBubble
            type="success"
            title="🎉 مقعد متاح لك!"
            message={`أصبح مقعد شاغر في "مسابقة الهاكاثون الجامعي". أكد حضورك خلال 24 ساعة.`}
          />
        </div>
      ),
    },
    {
      id: 4,
      actor: 'waitlisted',
      title: 'محمد يؤكد حضوره',
      description: 'يفتح محمد الإشعار ويضغط على "تأكيد الحضور". يتحول وضعه من قائمة الانتظار إلى مسجّل رسمياً.',
      leftPanel: (
        <div className="space-y-3">
          <SystemLog
            messages={[
              'user "2024003" confirmed attendance',
              'registration.status: waitlist → registered',
              'registeredCount: 99 → 100',
              'sendConfirmationEmail(...) ✓',
              'waitlist.remove(userId: "2024003")',
              'waitlistCount: 20 → 19',
            ]}
            highlight={1}
          />
        </div>
      ),
      rightPanel: (
        <div className="space-y-3">
          <div className="rounded-lg border border-[#00ADEF] bg-[#00ADEF10] p-4 text-center">
            <PartyPopper size={32} className="mx-auto mb-2" style={{ color: '#00ADEF' }} />
            <div className="font-semibold text-[#1E2652] text-sm">تم تأكيد مقعد محمد!</div>
            <div className="text-xs text-gray-500 mt-1">رقم التسجيل: REG-20260605-003</div>
          </div>
          <div className="space-y-1">
            <RegistrationRow name="محمد عبدالله القحطاني" status="promoted" />
          </div>
          <EventCard full waitlistCount={19} />
        </div>
      ),
    },
  ];
}

// ─── Block Steps ───────────────────────────────────────────────────────────────
function buildBlockSteps(): Step[] {
  return [
    {
      id: 1,
      actor: 'admin',
      title: 'أحمد لديه غيابان سابقان',
      description: 'أحمد سبق أن غاب عن فعاليتين مسجلاً فيهما دون إلغاء مسبق. لديه الآن 2 من 3 غيابات مسموح بها.',
      leftPanel: (
        <div className="space-y-3">
          <div className="rounded-lg border bg-amber-50 border-amber-200 p-3">
            <div className="font-semibold text-amber-800 text-sm mb-2">سجل أحمد المحمد العلي</div>
            <AbsenceBadge count={2} />
            <div className="mt-2 text-xs text-amber-700">تحذير: غياب واحد إضافي سيؤدي لتعليق الحساب</div>
          </div>
          <SystemLog messages={[
            'getAbsenceCount("1") → 2',
            'threshold: 3',
            'status: 1 absence remaining before block',
          ]} />
        </div>
      ),
      rightPanel: (
        <div className="space-y-3">
          <div className="rounded-lg border p-3 bg-white shadow-sm text-sm">
            <div className="font-bold text-[#1E2652] mb-2">صفحة أحمد — التطبيق</div>
            <NotificationBubble
              type="warning"
              title="⚠️ تحذير: 2 غياب مسجل"
              message={`تم تسجيل غياب سابق. تبقّى 1 غياب قبل تعليق حسابك.`}
            />
          </div>
          <div className="rounded-lg border p-3 bg-gray-50 text-xs text-gray-600 space-y-1">
            <div className="font-semibold">التسجيلات النشطة:</div>
            <RegistrationRow name="ورشة تطوير الويب" status="registered" />
          </div>
        </div>
      ),
    },
    {
      id: 2,
      actor: 'admin',
      title: 'المسؤول يُسجّل الغياب الثالث',
      description: 'انتهى نشاط "ورشة تطوير الويب" وأحمد لم يحضر ولم يُلغِ مسبقاً. يقوم المسؤول بتحديد حالته كـ "غائب".',
      leftPanel: (
        <div className="space-y-3">
          <PanelCard title="لوحة تحكم المسؤول — تسجيل الحضور" icon={<Users size={16} />} color="#5C2D91">
            <div className="space-y-2">
              <div className="text-xs text-gray-500">النشاط: ورشة تطوير تطبيقات الويب</div>
              <div className="flex items-center justify-between p-2 rounded bg-gray-50 border text-sm">
                <span>أحمد محمد العلي</span>
                <button className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 font-semibold cursor-default">
                  تسجيل كـ "غائب"
                </button>
              </div>
            </div>
          </PanelCard>
        </div>
      ),
      rightPanel: (
        <div className="space-y-3">
          <div className="rounded-lg border bg-gray-50 p-3 text-sm text-center text-gray-500">
            <Clock size={28} className="mx-auto mb-1 text-gray-400" />
            <div>أحمد غير متواجد في التطبيق</div>
            <div className="text-xs">النظام سيُرسل إشعاراً فور المعالجة</div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      actor: 'system',
      title: 'النظام يُسجّل الغياب الثالث ويُفعّل الحجب التلقائي',
      description: 'بمجرد تسجيل الغياب الثالث، يُفعّل النظام تلقائياً الحجب لمدة شهر ويُرسل إشعار البريد الإلكتروني.',
      leftPanel: (
        <div className="space-y-3">
          <SystemLog
            messages={[
              'recordAbsenceWithNotification({',
              '  userId: "1", count: 2+1 = 3',
              '})',
              'newCount (3) >= AUTO_BLOCK_THRESHOLD (3)',
              'blockUser({ userId:"1", duration:"1 month" })',
              'sendBlockNotification(...) ✓',
              'saveStudentNotification("block") ✓',
              'login will now return: BLOCKED',
            ]}
            highlight={4}
          />
          <AbsenceBadge count={3} />
        </div>
      ),
      rightPanel: (
        <div className="space-y-3">
          <EmailPreview
            type="block"
            subject="🚫 تم تعليق حسابك مؤقتاً في Imamu TechVerse"
            from="noreply@imamu.edu.sa"
            to="ahmed.ali@imamu.edu.sa"
            body={`عزيزي أحمد محمد العلي،\n\nنأسف لإبلاغك بأنه تم تعليق حسابك مؤقتاً.\n\n📋 السبب: تجاوز حد الغيابات\n📊 الغيابات: 3 / 3\n📅 التعليق: حتى 2026-07-16\n\nللرفع المبكر: راجع إدارة شؤون الطلاب.`}
          />
        </div>
      ),
    },
    {
      id: 4,
      actor: 'student',
      title: 'أحمد يحاول تسجيل الدخول — يُرفض',
      description: 'في اليوم التالي يحاول أحمد تسجيل الدخول، يُعرض له رسالة خطأ واضحة تشرح سبب الحجب ومدته.',
      leftPanel: (
        <div className="space-y-3">
          <SystemLog
            messages={[
              'login("ahmed.ali@imamu.edu.sa", "***")',
              'user found in DB ✓',
              'isUserBlocked("1") → true',
              'blockedUntil: 2026-07-16',
              'returning: { success: false,',
              '  error: "تم حظر حسابك..." }',
            ]}
            highlight={2}
          />
        </div>
      ),
      rightPanel: (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-center space-y-3">
            <Ban size={40} className="mx-auto text-red-500" />
            <div className="font-bold text-red-700 text-sm">لا يمكن تسجيل الدخول</div>
            <div className="text-xs text-red-600 bg-white rounded-lg p-2 border border-red-200 text-right">
              تم حظر حسابك مؤقتاً بسبب 3 غيابات متكررة. يرجى مراجعة إدارة شؤون الطلاب.
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
            <LogIn size={12} />
            <span>زر تسجيل الدخول معطّل</span>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      actor: 'admin',
      title: 'المسؤول يرفع الحجب يدوياً (اختياري)',
      description: 'يمكن للمسؤول رفع الحجب يدوياً قبل انقضاء الشهر من لوحة التحكم، أو ينتهي الحجب تلقائياً بعد 30 يوماً.',
      leftPanel: (
        <div className="space-y-3">
          <PanelCard title="لوحة التحكم — إدارة المحظورين" icon={<ShieldOff size={16} />} color="#1E2652">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-200 text-sm">
                <div>
                  <div className="font-semibold text-gray-800">أحمد محمد العلي</div>
                  <div className="text-xs text-red-600">محظور حتى: 2026-07-16</div>
                </div>
                <button className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 border border-green-200 font-semibold cursor-default">
                  رفع الحظر
                </button>
              </div>
            </div>
          </PanelCard>
          <SystemLog messages={[
            '// Option A: Admin manual unblock',
            'unblockUser("1")',
            '// Option B: Auto-expire after 30d',
            'isUserBlocked() checks blockedUntil',
            '// Either way → student can login again',
          ]} highlight={0} />
        </div>
      ),
      rightPanel: (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-[#00ADEF] bg-[#00ADEF08] p-4 text-center space-y-3">
            <CheckCircle size={40} className="mx-auto" style={{ color: '#00ADEF' }} />
            <div className="font-bold text-[#1E2652] text-sm">بعد رفع الحجب</div>
            <div className="text-xs text-gray-600 bg-white rounded-lg p-2 border">
              يستطيع أحمد تسجيل الدخول وتسجيل الأنشطة مجدداً
            </div>
          </div>
          <NotificationBubble
            type="success"
            title="✅ تم رفع تعليق حسابك"
            message="يمكنك الآن تسجيل الدخول والمشاركة في الأنشطة."
          />
        </div>
      ),
    },
  ];
}

// ─── Tab Config ────────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'waitlist', label: 'إشعار قائمة الانتظار', icon: <Bell size={16} />, color: '#00ADEF' },
  { id: 'block', label: 'حجب الطالب تلقائياً', icon: <Ban size={16} />, color: '#dc2626' },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export function WaitlistDemo() {
  const [activeTab, setActiveTab] = useState<TabId>('waitlist');
  const [currentStep, setCurrentStep] = useState(0);

  const waitlistSteps = buildWaitlistSteps();
  const blockSteps = buildBlockSteps();
  const steps = activeTab === 'waitlist' ? waitlistSteps : blockSteps;
  const step = steps[currentStep];
  const tabCfg = TABS.find(t => t.id === activeTab)!;

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setCurrentStep(0);
  };

  const actorLabels: Record<string, { label: string; color: string }> = {
    system: { label: 'النظام', color: '#5C2D91' },
    admin: { label: 'المسؤول', color: '#1E2652' },
    student: { label: 'الطالب', color: '#00ADEF' },
    waitlisted: { label: 'طالب الانتظار', color: '#16a34a' },
  };

  const actorCfg = actorLabels[step.actor];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#1E2652] to-[#5C2D91] p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            عرض تفاعلي: منطق قائمة الانتظار والحجب
          </h1>
          <p className="text-blue-200 text-sm">
            Imamu TechVerse — خطوة بخطوة
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
              style={activeTab === tab.id
                ? { backgroundColor: tab.color, color: 'white', boxShadow: `0 4px 14px ${tab.color}55` }
                : { backgroundColor: 'rgba(255,255,255,0.12)', color: 'white' }
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className="flex items-center gap-1"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2"
                style={i === currentStep
                  ? { backgroundColor: tabCfg.color, color: 'white', borderColor: tabCfg.color }
                  : i < currentStep
                    ? { backgroundColor: tabCfg.color + '30', color: tabCfg.color, borderColor: tabCfg.color + '60' }
                    : { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.2)' }
                }
              >
                {i < currentStep ? <CheckCircle size={14} /> : s.id}
              </div>
              {i < steps.length - 1 && (
                <div className="w-6 h-0.5 rounded" style={{ backgroundColor: i < currentStep ? tabCfg.color + '60' : 'rgba(255,255,255,0.15)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Step Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: tabCfg.color + '10' }}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: actorCfg.color + '20', color: actorCfg.color }}>
                {actorCfg.label}
              </span>
              <div>
                <div className="font-bold text-[#1E2652] text-base">{step.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">الخطوة {step.id} من {steps.length}</div>
              </div>
            </div>
            <div className="text-sm text-gray-500 hidden md:block max-w-xs text-left">
              {step.description}
            </div>
          </div>

          {/* Description (mobile) */}
          <div className="px-6 py-3 bg-gray-50 border-b text-sm text-gray-600 md:hidden">
            {step.description}
          </div>

          {/* Split Screen */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${currentStep}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100"
            >
              {/* Left Panel */}
              <div className="p-5">
                <div className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#5C2D91]" />
                  الجانب التقني / المسؤول
                </div>
                {step.leftPanel}
              </div>

              {/* Right Panel */}
              <div className="p-5">
                <div className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#00ADEF]" />
                  تجربة الطالب
                </div>
                {step.rightPanel}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(0)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RotateCcw size={14} />
              إعادة
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(p => Math.max(0, p - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                style={{ color: '#1E2652', borderColor: '#1E265240' }}
              >
                <ChevronRight size={16} />
                السابق
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(p => Math.min(steps.length - 1, p + 1))}
                  className="flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                  style={{ backgroundColor: tabCfg.color }}
                >
                  التالي
                  <ChevronLeft size={16} />
                </button>
              ) : (
                <div className="flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#16a34a' }}>
                  <CheckCircle size={16} />
                  اكتمل العرض
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={16} style={{ color: '#00ADEF' }} />
              <span className="font-semibold text-sm">قاعدة قائمة الانتظار</span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              لا يُضاف الطلاب لقائمة الانتظار إلا بعد امتلاء المقاعد الأساسية. عند إلغاء أي تسجيل، يُشعَر أول طالب في الانتظار تلقائياً ويُمنح 24 ساعة للتأكيد.
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Ban size={16} style={{ color: '#dc2626' }} />
              <span className="font-semibold text-sm">قاعدة الحجب التلقائي</span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              يُحجب الطالب تلقائياً لمدة شهر عند بلوغه 3 غيابات غير مبررة. يُرسَل تحذير بعد كل غياب، وإشعار الحجب عند الغياب الثالث.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
