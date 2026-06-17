import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { mockEvents, mockRegistrations, mockAttendanceData, Event, ActivityType, AudienceGroup, colleges, interests } from '../data/mockData';
import {
  Calendar,
  Users,
  TrendingUp,
  Plus,
  Edit,
  FileText,
  Award,
  LogOut,
  Bell,
  BarChart3,
  ChevronLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Mail,
  UserX,
  RefreshCw,
  Trash2,
  ShieldAlert,
  Clock,
  Send,
  BadgeCheck,
  Eye,
  X,
  MapPin,
  Building2,
  ListChecks,
  Download,
  Wrench,
  Mic2,
  Trophy,
  Heart,
  LayoutGrid,
  MessageSquare,
  BookOpen,
  Sparkles,
  ScanLine,
  QrCode,
} from 'lucide-react';
import { LogoGroup } from './logo';
import {
  getEmailLogs,
  EmailLog,
  getBlockedUsers,
  BlockedUser,
  clearEmailLogs,
  sendWaitlistPromotion,
  sendCertificateEmail,
} from '../services/emailService';
import { recordAbsenceWithNotification, getAbsenceCount } from '../services/absenceService';
import { autoIssueCertificatesForEvent, getIssuedCerts, markCertIssued } from '../services/certificateService';
import { CertificateModal } from './CertificateModal';
import { TopBar, PageFooter } from './PageShell';

// ─── Local event storage (CRUD) ───────────────────────────────────────────────
const EVENTS_STORAGE_KEY = 'imamu_events';

export function getStoredEvents(): Event[] {
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return mockEvents;
}

function saveEvents(events: Event[]) {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

// ─── Mock students for User Control ───────────────────────────────────────────
const MOCK_STUDENTS = [
  { id: '1', name: 'أحمد محمد العلي', email: 'ahmed.ali@imamu.edu.sa', studentId: '2024001', college: 'كلية علوم الحاسب' },
  { id: '2', name: 'سارة خالد المطيري', email: 'sara.m@imamu.edu.sa', studentId: '2024002', college: 'كلية الهندسة' },
  { id: '3', name: 'محمد عبدالله القحطاني', email: 'm.qhtani@imamu.edu.sa', studentId: '2024003', college: 'كلية إدارة الأعمال' },
  { id: '4', name: 'فاطمة أحمد العمري', email: 'f.omari@imamu.edu.sa', studentId: '2024004', college: 'كلية الطب' },
  { id: '5', name: 'عمر سعد الزهراني', email: 'o.zahrani@imamu.edu.sa', studentId: '2024005', college: 'كلية العلوم' },
  { id: '6', name: 'نوف محمد الحربي', email: 'n.harbi@imamu.edu.sa', studentId: '2024006', college: 'كلية الآداب' },
  { id: '7', name: 'يوسف إبراهيم الشمري', email: 'y.shimri@imamu.edu.sa', studentId: '2024007', college: 'كلية الهندسة' },
  { id: '8', name: 'ريم سلطان العنزي', email: 'r.anazi@imamu.edu.sa', studentId: '2024008', college: 'كلية العلوم' },
];

// ─── Activity types for step-1 selector ──────────────────────────────────────
const ACTIVITY_TYPES: { value: ActivityType; icon: React.ElementType; color: string; bg: string }[] = [
  { value: 'ورشة عمل',       icon: Wrench,        color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
  { value: 'محاضرة',         icon: Mic2,          color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200 hover:border-purple-400' },
  { value: 'مسابقة',         icon: Trophy,        color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200 hover:border-yellow-400' },
  { value: 'يوم تطوعي',      icon: Heart,         color: 'text-red-600',    bg: 'bg-red-50 border-red-200 hover:border-red-400' },
  { value: 'معرض',           icon: LayoutGrid,    color: 'text-green-600',  bg: 'bg-green-50 border-green-200 hover:border-green-400' },
  { value: 'ندوة',           icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400' },
  { value: 'دورة تدريبية',   icon: BookOpen,      color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200 hover:border-orange-400' },
  { value: 'فعالية ترفيهية', icon: Sparkles,      color: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200 hover:border-pink-400' },
];

// ─── Blank event template ─────────────────────────────────────────────────────
const blankEvent = (): Omit<Event, 'id'> => ({
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  category: 'تقني',
  activityType: 'ورشة عمل',
  needsVolunteers: false,
  audienceType: 'general' as const,
  allowedAudience: [] as AudienceGroup[],
  capacity: 50,
  registeredCount: 0,
  waitlistCount: 0,
  image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
  organizer: '',
  college: 'جميع الكليات',
  status: 'upcoming',
  requiresFeedback: true,
});

// ─── Email helpers ─────────────────────────────────────────────────────────────
function getEmailTypeLabel(type: EmailLog['type']): string {
  const labels: Record<string, string> = {
    registration_confirmation: 'تأكيد التسجيل',
    waitlist_notification: 'قائمة الانتظار',
    waitlist_promotion: 'ترقية الانتظار',
    reminder: 'تذكير',
    certificate: 'شهادة',
    block_notification: 'إشعار حظر',
    absence_warning: 'تحذير غياب',
  };
  return labels[type] || type;
}
function getEmailTypeStyle(type: EmailLog['type']): string {
  const styles: Record<string, string> = {
    registration_confirmation: 'bg-primary/10 text-primary border-primary/20',
    waitlist_notification: 'bg-orange-50 text-orange-600 border-orange-200',
    waitlist_promotion: 'bg-green-50 text-green-600 border-green-200',
    reminder: 'bg-blue-50 text-blue-600 border-blue-200',
    certificate: 'bg-secondary/10 text-secondary border-secondary/20',
    block_notification: 'bg-destructive/10 text-destructive border-destructive/20',
    absence_warning: 'bg-orange-50 text-orange-700 border-orange-300',
  };
  return styles[type] || 'bg-muted text-muted-foreground border-border';
}
function getEmailTypeIcon(type: EmailLog['type']) {
  const icons: Record<string, React.ReactNode> = {
    registration_confirmation: <BadgeCheck className="w-4 h-4" />,
    waitlist_notification: <Clock className="w-4 h-4" />,
    waitlist_promotion: <TrendingUp className="w-4 h-4" />,
    reminder: <Bell className="w-4 h-4" />,
    certificate: <Award className="w-4 h-4" />,
    block_notification: <ShieldAlert className="w-4 h-4" />,
    absence_warning: <AlertTriangle className="w-4 h-4" />,
  };
  return icons[type] || <Mail className="w-4 h-4" />;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'attendance' | 'reports' | 'notifications' | 'users'>('overview');

  // Events CRUD state
  const [events, setEvents] = useState<Event[]>(getStoredEvents());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState<Omit<Event, 'id'>>(blankEvent());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [eventSearch, setEventSearch] = useState('');

  // Attendance tab
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState(mockAttendanceData);
  // Certificate issuance from attendance tab — persisted via certificateService
  const [issuedCertsMap, setIssuedCertsMap] = useState<Record<string, boolean>>(() => ({
    r6: true, // pre-issued for سارة in event 4
    ...getIssuedCerts(),
  }));
  const [adminCertModal, setAdminCertModal] = useState<{
    studentName: string;
    studentId: string;
    eventTitle: string;
    eventDate: string;
    studentEmail: string;
  } | null>(null);

  // Reports — per-event filter
  const [selectedReportEventId, setSelectedReportEventId] = useState('');

  // Notification Center
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailFilter, setEmailFilter] = useState<string>('all');

  // User Monitoring — read-only, blocking is system-only (Req 40-41)
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'notifications') setEmailLogs(getEmailLogs());
    if (activeTab === 'users') setBlockedUsers(getBlockedUsers());
    if (activeTab === 'attendance' && !selectedEventForAttendance && events.length > 0) {
      setSelectedEventForAttendance(events[0].id);
    }
  }, [activeTab]);

  if (user?.role !== 'admin') return null;

  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => e.status === 'upcoming').length;
  const totalRegistrations = mockRegistrations.length;
  const totalAttendees = mockRegistrations.filter((r) => r.status === 'attended').length;

  const handleLogout = () => { logout(); navigate('/login'); };

  // ─── Event CRUD ──────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEventForm(blankEvent());
    setEditingEvent(null);
    setCreateStep(1);
    setShowCreateModal(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category,
      activityType: event.activityType,
      needsVolunteers: event.needsVolunteers,
      audienceType: event.audienceType,
      allowedAudience: event.allowedAudience,
      capacity: event.capacity,
      registeredCount: event.registeredCount,
      waitlistCount: event.waitlistCount,
      image: event.image,
      organizer: event.organizer,
      college: event.college,
      status: event.status,
      requiresFeedback: event.requiresFeedback,
    });
    setCreateStep(2);
    setShowCreateModal(true);
  };

  const handleSaveEvent = () => {
    if (!eventForm.title || !eventForm.date || !eventForm.location) {
      alert('يرجى ملء الحقول الإلزامية: اسم النشاط، التاريخ، والموقع.');
      return;
    }

    const becomingCompleted =
      editingEvent &&
      editingEvent.status !== 'completed' &&
      eventForm.status === 'completed';

    let updated: Event[];
    if (editingEvent) {
      updated = events.map(e => e.id === editingEvent.id ? { ...eventForm, id: editingEvent.id } : e);
    } else {
      const newEvent: Event = { ...eventForm, id: `evt_${Date.now()}` };
      updated = [newEvent, ...events];
    }
    setEvents(updated);
    saveEvents(updated);

    // Auto-issue certificates when event is marked as completed
    if (becomingCompleted) {
      const { issuedCount, studentNames } = autoIssueCertificatesForEvent(
        { id: editingEvent.id, title: eventForm.title, date: eventForm.date },
        attendanceData
      );
      setIssuedCertsMap(getIssuedCerts());
      setEmailLogs(getEmailLogs());
      if (issuedCount > 0) {
        alert(
          `✅ تم إنهاء الفعالية "${eventForm.title}".\n\n🏆 صدرت شهادات الحضور تلقائياً لـ ${issuedCount} طالب:\n${studentNames.map(n => `• ${n}`).join('\n')}\n\nتم إرسال إشعار بريدي وإشعار داخلي لكل طالب.`
        );
      } else {
        alert(`✅ تم إنهاء الفعالية "${eventForm.title}". لا يوجد طلاب مسجّلون بحضور لإصدار شهادات لهم.`);
      }
    }

    setShowCreateModal(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveEvents(updated);
    setShowDeleteConfirm(null);
  };

  // ─── Waitlist notification ────────────────────────────────────────────────────
  const handleNotifyWaitlist = (event: Event) => {
    sendWaitlistPromotion({
      recipientName: 'الطالب المنتظر',
      recipientEmail: 'waitlist@university.edu.sa',
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
    });
    setEmailLogs(getEmailLogs());
    alert(`تم إرسال ${event.waitlistCount} إشعار لمتقدمي قائمة الانتظار في فعالية "${event.title}"`);
  };

  // ─── Attendance data ──────────────────────────────────────────────────────────
  const getAttendanceForEvent = (eventId: string) => {
    return attendanceData.filter(a => a.eventId === eventId);
  };

  // Mark a student absent manually (Req 36-37, 40-41)
  const handleMarkAbsent = (entry: typeof mockAttendanceData[0]) => {
    if (entry.checkedIn) {
      alert('هذا الطالب قد حضر بالفعل، لا يمكن تسجيله غائباً.');
      return;
    }
    const updated = attendanceData.map(a =>
      a.registrationId === entry.registrationId ? { ...a, status: 'absent' as const } : a
    );
    setAttendanceData(updated);

    // Record absence with full notification + possible auto-block
    const { wasBlocked } = recordAbsenceWithNotification(entry.userId, {
      studentName: entry.studentName,
      studentEmail: `${entry.studentId}@imamu.edu.sa`,
      studentId: entry.studentId,
      eventTitle: events.find(e => e.id === entry.eventId)?.title || '',
    });

    setEmailLogs(getEmailLogs());
    setBlockedUsers(getBlockedUsers());

    if (wasBlocked) {
      alert(`⚠️ تم حجب الزائر "${entry.studentName}" تلقائياً لمدة شهر بسبب تجاوز حد الغيابات (3 غيابات). تم إرسال إشعار تفصيلي.`);
    } else {
      const count = getAbsenceCount(entry.userId);
      alert(`تم تسجيل الزائر "${entry.studentName}" غائباً. إجمالي غياباته: ${count}/3. تم إرسال تحذير بريدي.`);
    }
  };

  // Issue certificate directly from attendance tab
  const handleIssueCertificate = (entry: typeof mockAttendanceData[0]) => {
    const event = events.find(e => e.id === entry.eventId);
    if (!event) return;
    const studentEmail = `${entry.studentId}@imamu.edu.sa`;

    // Send certificate email
    sendCertificateEmail({
      recipientName: entry.studentName,
      recipientEmail: studentEmail,
      eventTitle: event.title,
      eventDate: event.date,
    });

    // Mark as issued (in state + persistent storage)
    markCertIssued(entry.registrationId);
    setIssuedCertsMap(prev => ({ ...prev, [entry.registrationId]: true }));
    setEmailLogs(getEmailLogs());

    // Open preview modal
    setAdminCertModal({
      studentName: entry.studentName,
      studentId: entry.studentId,
      eventTitle: event.title,
      eventDate: event.date,
      studentEmail,
    });
  };

  // ─── User control ─────────────────────────────────────────────────────────────
  const filteredStudents = MOCK_STUDENTS.filter(
    (s) =>
      s.name.includes(userSearch) ||
      s.studentId.includes(userSearch) ||
      s.email.includes(userSearch)
  );

  const filteredLogs =
    emailFilter === 'all'
      ? emailLogs
      : emailLogs.filter((l) => l.type === emailFilter);

  const filteredEvents = events.filter(
    e => e.title.includes(eventSearch) || e.category.includes(eventSearch) || e.organizer.includes(eventSearch)
  );

  // ─── Generate Report ──────────────────────────────────────────────────────────
  const handleGenerateReport = () => {
    const isEn = lang === 'en';
    const dir  = isEn ? 'ltr' : 'rtl';

    const reportEvents = selectedReportEventId
      ? events.filter(e => e.id === selectedReportEventId)
      : events;

    const rows = reportEvents.map(event => {
      const regs          = mockRegistrations.filter(r => r.eventId === event.id);
      const attendedCount = regs.filter(r => r.status === 'attended').length;
      const feedbackCount = regs.filter(r => r.feedbackSubmitted).length;
      const attRate       = event.registeredCount > 0 ? Math.round((attendedCount / event.registeredCount) * 100) : 0;
      const fbRate        = attendedCount > 0 ? Math.round((feedbackCount / attendedCount) * 100) : 0;
      return { event, regs: event.registeredCount, attended: attendedCount, feedback: feedbackCount, attRate, fbRate };
    });

    const scopedRegs      = rows.reduce((s, r) => s + r.regs, 0);
    const scopedAttendees = rows.reduce((s, r) => s + r.attended, 0);
    const overallAttRate  = scopedRegs > 0 ? Math.round((scopedAttendees / scopedRegs) * 100) : 0;
    const reportTitle     = selectedReportEventId && reportEvents[0]
      ? (isEn ? `Activity Report — ${reportEvents[0].title}` : `تقرير فعالية: ${reportEvents[0].title}`)
      : (isEn ? 'Activities Report — Imamu TechVerse' : 'تقرير الأنشطة — Imamu TechVerse');
    const now = new Date().toLocaleDateString(isEn ? 'en-US' : 'ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
<meta charset="UTF-8">
<title>${reportTitle}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: ${isEn ? "'Segoe UI', Arial, sans-serif" : "'Tajawal', 'Segoe UI', Arial, sans-serif"}; direction: ${dir}; color: #1a1a2e; background: #fff; padding: 32px; font-size: 13px; }
  .header { display: flex; align-items: center; gap: 20px; border-bottom: 4px solid #00ADEF; padding-bottom: 20px; margin-bottom: 24px; }
  .header-text h1 { font-size: 22px; font-weight: 900; color: #045D84; }
  .header-text p  { font-size: 12px; color: #666; margin-top: 4px; }
  .meta { display: flex; gap: 32px; background: #f8f9fb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
  .meta-item label { font-size: 11px; color: #888; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px; }
  .meta-item .val  { font-size: 24px; font-weight: 900; color: #045D84; }
  .section-title { font-size: 14px; font-weight: 800; color: #045D84; border-${isEn ? 'left' : 'right'}: 4px solid #00ADEF; padding-${isEn ? 'left' : 'right'}: 12px; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  thead tr { background: #045D84; color: #fff; }
  th { padding: 10px 14px; font-size: 12px; font-weight: 700; text-align: ${isEn ? 'left' : 'right'}; }
  td { padding: 9px 14px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
  tr:nth-child(even) { background: #f8f9fb; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .badge-green  { background: #d1fae5; color: #065f46; }
  .badge-blue   { background: #dbeafe; color: #1e40af; }
  .badge-orange { background: #ffedd5; color: #9a3412; }
  .badge-gray   { background: #f3f4f6; color: #374151; }
  .footer { text-align: center; color: #aaa; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 8px; }
  @media print { body { padding: 16px; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="header">
  <div style="width:56px;height:56px;background:#045D84;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
    <span style="color:#00ADEF;font-weight:900;font-size:18px">IT</span>
  </div>
  <div class="header-text">
    <h1>${reportTitle}</h1>
    <p>${isEn ? 'Imam Mohammad Ibn Saud Islamic University' : 'جامعة الإمام محمد بن سعود الإسلامية'}</p>
    <p style="margin-top:6px;color:#00ADEF;font-size:11px">${isEn ? 'Generated:' : 'تاريخ الإصدار:'} ${now}</p>
  </div>
  <button class="no-print" onclick="window.print()" style="margin-${isEn ? 'left' : 'right'}:auto;padding:10px 24px;background:#045D84;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer">
    ${isEn ? '🖨 Print / Save PDF' : '🖨 طباعة / حفظ PDF'}
  </button>
</div>

<!-- Summary -->
<div class="meta">
  ${[
    { label: isEn ? 'Activities' : 'عدد الأنشطة', val: rows.length },
    { label: isEn ? 'Registrations' : 'التسجيلات', val: scopedRegs },
    { label: isEn ? 'Attendees' : 'الحاضرون', val: scopedAttendees },
    { label: isEn ? 'Attendance Rate' : 'معدل الحضور', val: overallAttRate + '%' },
  ].map(s => `<div class="meta-item"><label>${s.label}</label><div class="val">${s.val}</div></div>`).join('')}
</div>

<!-- Detailed table -->
<div class="section-title">${isEn ? 'Detailed Activity Report' : 'تفاصيل الأنشطة'}</div>
<table>
  <thead>
    <tr>
      <th>${isEn ? '#' : '#'}</th>
      <th>${isEn ? 'Activity Name' : 'اسم النشاط'}</th>
      <th>${isEn ? 'Type' : 'النوع'}</th>
      <th>${isEn ? 'Date' : 'التاريخ'}</th>
      <th>${isEn ? 'Capacity' : 'السعة'}</th>
      <th>${isEn ? 'Registered' : 'المسجّلون'}</th>
      <th>${isEn ? 'Attended' : 'الحاضرون'}</th>
      <th>${isEn ? 'Attendance %' : 'نسبة الحضور'}</th>
      <th>${isEn ? 'Feedback %' : 'نسبة التقييم'}</th>
      <th>${isEn ? 'Status' : 'الحالة'}</th>
    </tr>
  </thead>
  <tbody>
    ${rows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="font-weight:700;max-width:200px">${r.event.title}</td>
      <td>${r.event.activityType}</td>
      <td>${r.event.date}</td>
      <td>${r.event.capacity}</td>
      <td>${r.regs}</td>
      <td>${r.attended}</td>
      <td><span class="badge ${r.attRate >= 75 ? 'badge-green' : r.attRate >= 50 ? 'badge-blue' : 'badge-orange'}">${r.attRate}%</span></td>
      <td><span class="badge ${r.fbRate >= 75 ? 'badge-green' : r.fbRate >= 50 ? 'badge-blue' : 'badge-gray'}">${r.fbRate}%</span></td>
      <td><span class="badge ${r.event.status === 'completed' ? 'badge-green' : r.event.status === 'upcoming' ? 'badge-blue' : 'badge-gray'}">
        ${r.event.status === 'completed' ? (isEn ? 'Completed' : 'مكتمل') : r.event.status === 'upcoming' ? (isEn ? 'Upcoming' : 'قادم') : r.event.status === 'ongoing' ? (isEn ? 'Ongoing' : 'جارٍ') : (isEn ? 'Cancelled' : 'ملغى')}
      </span></td>
    </tr>`).join('')}
  </tbody>
</table>

<div class="footer">
  Imamu TechVerse &nbsp;·&nbsp; ${isEn ? 'Imam Mohammad Ibn Saud Islamic University' : 'جامعة الإمام محمد بن سعود الإسلامية'} &nbsp;·&nbsp; ${now}
</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1100,height=800,scrollbars=yes');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans flex flex-col">
      <TopBar />
      {/* ─── Header ─── */}
      <header className="bg-[#045D84] border-b-4 border-[#00ADEF] sticky top-0 z-20 shadow-xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LogoGroup uniSize="h-9" projSize="h-7" />
              <div className="hidden sm:block">
                <h1 className="text-white text-lg font-bold leading-tight">{t('بوابة المنظّم', 'Organizer Portal')} | Imamu TechVerse</h1>
                <p className="text-xs font-semibold" style={{ color: '#00ADEF' }}>{t('جامعة الإمام محمد بن سعود الإسلامية', 'Imam Mohammad Ibn Saud Islamic University')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">م</span>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-white leading-none">{user?.name}</p>
                  <p className="text-xs text-white/70 mt-1">{t('منظّم الفعاليات', 'Organizer')}</p>
                </div>
              </div>
              <button
                onClick={toggleLang}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all"
                title="Switch language"
              >
                {lang === 'ar' ? 'EN' : 'ع'}
              </button>
              <button
                onClick={() => navigate('/admin/scan')}
                className="flex items-center gap-2 px-3 py-2 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-all text-sm shadow-md"
                title={t('عرض QR الفعالية', 'Event QR Display')}
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">{t('عرض QR الفعالية', 'Event QR')}</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center hover:bg-destructive/20 text-white hover:text-destructive rounded-xl transition-all"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex flex-col">
        {/* ─── Navigation Tabs ─── */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-2 mb-8 flex overflow-x-auto gap-1">
          {[
            { id: 'overview',      icon: BarChart3,   label: t('لوحة القيادة',    'Dashboard') },
            { id: 'events',        icon: Calendar,    label: t('إدارة الأنشطة',   'Activities') },
            { id: 'attendance',    icon: ListChecks,  label: t('الحضور والغياب',  'Attendance') },
            { id: 'reports',       icon: FileText,    label: t('التقارير',        'Reports') },
            { id: 'notifications', icon: Bell,        label: t('الإشعارات',       'Notifications'), badge: emailLogs.length },
            { id: 'users',         icon: UserX,       label: t('متابعة الزوار',   'Visitors'), badge: blockedUsers.length > 0 ? blockedUsers.length : undefined },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${
                  activeTab === tab.id ? 'bg-white text-primary' : 'bg-secondary text-white'
                }`}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Overview Tab ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: t('إجمالي الأنشطة', 'Total Activities'), value: totalEvents, icon: Calendar, color: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-50' },
                { label: t('الأنشطة القادمة', 'Upcoming'), value: upcomingEvents, icon: TrendingUp, color: 'bg-secondary', text: 'text-secondary', bg: 'bg-secondary/10' },
                { label: t('إجمالي التسجيلات', 'Registrations'), value: totalRegistrations, icon: Users, color: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10' },
                { label: t('إجمالي الحضور', 'Attendees'), value: totalAttendees, icon: CheckCircle2, color: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-card border-2 border-border rounded-2xl p-6 relative overflow-hidden group hover:border-border/80 transition-all hover:shadow-lg">
                  <div className={`absolute top-0 right-0 w-2 h-full ${stat.color}`}></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-muted-foreground mb-1">{stat.label}</p>
                      <h3 className="text-4xl font-black text-foreground">{stat.value}</h3>
                    </div>
                    <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`w-7 h-7 ${stat.text}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-2 h-6 bg-secondary rounded-full"></span>
                  أحدث الأنشطة
                </h3>
                <button onClick={() => setActiveTab('events')} className="text-sm font-bold text-primary hover:text-secondary transition-colors">
                  عرض الكل
                </button>
              </div>
              <div className="space-y-4">
                {events.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-2xl border border-transparent hover:border-border hover:bg-card transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <img src={event.image} alt="" className="w-16 h-16 rounded-xl object-cover shadow-sm hidden sm:block" />
                      <div>
                        <h4 className="font-bold text-foreground mb-1 line-clamp-1">{event.title}</h4>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> {event.date}
                          <span className="w-1 h-1 bg-border rounded-full"></span>
                          <Users className="w-3 h-3" /> {event.registeredCount} مسجل
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg ${event.status === 'upcoming' ? 'bg-primary/10 text-primary' : event.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                        {event.status === 'upcoming' ? 'قادمة' : event.status === 'cancelled' ? 'ملغاة' : 'مكتملة'}
                      </span>
                      <button
                        onClick={() => navigate(`/admin/event/${event.id}`)}
                        className="w-10 h-10 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Events Tab ─── */}
        {activeTab === 'events' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <span className="w-3 h-8 bg-secondary rounded-full block"></span>
                {t('إدارة الأنشطة', 'Activity Management')}
              </h3>
              <div className="flex w-full md:w-auto gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={e => setEventSearch(e.target.value)}
                    placeholder="بحث عن فعالية..."
                    className="w-full pr-10 pl-4 py-2.5 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary text-sm font-medium"
                  />
                </div>
                <button
                  onClick={openCreateModal}
                  className="flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold shadow-md shadow-primary/20"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">{t('نشاط جديد', 'New Activity')}</span>
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-bold">الفعالية</th>
                      <th className="px-6 py-4 font-bold">التاريخ والوقت</th>
                      <th className="px-6 py-4 font-bold hidden md:table-cell">المنظم</th>
                      <th className="px-6 py-4 font-bold">التسجيل</th>
                      <th className="px-6 py-4 font-bold">الحالة</th>
                      <th className="px-6 py-4 font-bold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className={`hover:bg-muted/30 transition-colors ${event.status === 'cancelled' ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-border hidden sm:block">
                              <img src={event.image} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground line-clamp-1">{event.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{event.category} · {event.college}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          {event.date}
                          <br />
                          <span className="text-xs text-muted-foreground">{event.time}</span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-foreground">
                            {event.organizer}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold">{event.registeredCount}</span>
                              <span className="text-muted-foreground">/ {event.capacity}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${event.registeredCount >= event.capacity ? 'bg-destructive' : 'bg-primary'}`}
                                style={{ width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%` }}
                              ></div>
                            </div>
                            {event.registeredCount >= event.capacity && event.waitlistCount > 0 && (
                              <span className="text-[10px] font-bold text-orange-500 flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3" />
                                {event.waitlistCount} في الانتظار
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            event.status === 'upcoming'
                              ? 'bg-primary/5 text-primary border-primary/20'
                              : event.status === 'cancelled'
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}>
                            {event.status === 'upcoming' ? 'نشطة' : event.status === 'cancelled' ? 'ملغاة' : 'منتهية'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/admin/event/${event.id}`)}
                              className="p-2 bg-white border border-border text-foreground hover:bg-blue-500 hover:text-white hover:border-blue-500 rounded-lg transition-all"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/admin/event/${event.id}/qr`)}
                              className="p-2 bg-white border border-border text-foreground hover:bg-secondary hover:text-white hover:border-secondary rounded-lg transition-all"
                              title="عرض باركود الدخول"
                            >
                              <ScanLine className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedEventForAttendance(event.id); setActiveTab('attendance'); }}
                              className="p-2 bg-white border border-border text-foreground hover:bg-green-500 hover:text-white hover:border-green-500 rounded-lg transition-all"
                              title="قائمة الحضور"
                            >
                              <ListChecks className="w-4 h-4" />
                            </button>
                            {event.registeredCount >= event.capacity && event.waitlistCount > 0 && (
                              <button
                                onClick={() => handleNotifyWaitlist(event)}
                                className="p-2 bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary hover:text-white rounded-lg transition-all"
                                title="تنبيه قائمة الانتظار"
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(event)}
                              className="p-2 bg-white border border-border text-foreground hover:bg-primary hover:text-white hover:border-primary rounded-lg transition-all"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(event.id)}
                              className="p-2 bg-white border border-border text-foreground hover:bg-destructive hover:text-white hover:border-destructive rounded-lg transition-all"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── Attendance Tab (Req 36-37) ─── */}
        {activeTab === 'attendance' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-8 bg-green-500 rounded-full block"></span>
                  الحضور والغياب
                </h3>
                <p className="text-sm text-muted-foreground mt-1">مراقبة الحضور الفعلي لكل فعالية والتحقق من السجلات</p>
              </div>
              <div className="relative">
                <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  value={selectedEventForAttendance}
                  onChange={e => setSelectedEventForAttendance(e.target.value)}
                  className="pr-10 pl-4 py-2.5 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary text-sm font-medium appearance-none min-w-[240px]"
                >
                  <option value="">اختر الفعالية</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedEventForAttendance ? (() => {
              const selectedEvent = events.find(e => e.id === selectedEventForAttendance);
              const attendanceList = getAttendanceForEvent(selectedEventForAttendance);
              const checkedInCount = attendanceList.filter(a => a.checkedIn).length;
              const checkedOutCount = attendanceList.filter(a => a.checkedOut).length;
              const absentCount = attendanceList.filter(a => !a.checkedIn && a.status === 'registered').length;

              return (
                <div className="space-y-6">
                  {selectedEvent && (
                    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <img src={selectedEvent.image} alt="" className="w-20 h-20 rounded-xl object-cover border border-border hidden sm:block" />
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-foreground">{selectedEvent.title}</h4>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {selectedEvent.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {selectedEvent.time}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedEvent.location}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attendance Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'إجمالي المسجلين', value: attendanceList.length, color: 'text-primary', bg: 'bg-primary/10' },
                      { label: 'حضروا', value: checkedInCount, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'غادروا', value: checkedOutCount, color: 'text-secondary', bg: 'bg-secondary/10' },
                      { label: 'غائب', value: absentCount, color: 'text-destructive', bg: 'bg-destructive/10' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-card border border-border rounded-2xl p-4 text-center">
                        <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
                        <div className={`w-10 h-1.5 rounded-full mx-auto mt-2 ${stat.bg.replace('/10', '').replace('bg-', 'bg-')}`}
                          style={{ backgroundColor: i === 0 ? '#1E2652' : i === 1 ? '#16a34a' : i === 2 ? '#5C2D91' : '#dc2626', opacity: 0.4 }}
                        ></div>
                      </div>
                    ))}
                  </div>

                  {/* Attendance Table (Req 36) */}
                  <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                      <h4 className="font-bold text-foreground">قائمة الحضور التفصيلية</h4>
                      <button
                        onClick={handleGenerateReport}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        {t('تصدير التقرير', 'Export Report')}
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                          <tr>
                            <th className="px-6 py-3 font-bold">{t('الزائر', 'Visitor')}</th>
                            <th className="px-6 py-3 font-bold">{t('الرقم الجامعي', 'ID')}</th>
                            <th className="px-6 py-3 font-bold hidden md:table-cell">{t('الكلية', 'College')}</th>
                            <th className="px-6 py-3 font-bold">{t('تسجيل الحضور', 'Check-In')}</th>
                            <th className="px-6 py-3 font-bold">{t('المغادرة', 'Check-Out')}</th>
                            <th className="px-6 py-3 font-bold">{t('التقييم', 'Feedback')}</th>
                            <th className="px-6 py-3 font-bold">{t('الحالة', 'Status')}</th>
                            <th className="px-6 py-3 font-bold text-center">{t('الشهادة', 'Certificate')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {attendanceList.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground font-medium">
                                لا توجد بيانات حضور لهذه الفعالية
                              </td>
                            </tr>
                          ) : attendanceList.map((entry) => {
                            const certIssued = issuedCertsMap[entry.registrationId] ?? false;
                            const canIssueCert = entry.checkedIn; // attended = can get cert
                            return (
                            <tr key={entry.registrationId} className="hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                                    {entry.studentName.charAt(0)}
                                  </div>
                                  <span className="font-bold text-foreground">{entry.studentName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">{entry.studentId}</td>
                              <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">{entry.college}</td>
                              <td className="px-6 py-4">
                                {entry.checkedIn ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-200">
                                    <CheckCircle2 className="w-3 h-3" /> حضر
                                    {entry.checkinTime && <span className="opacity-60 mr-1 text-[10px]">{new Date(entry.checkinTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-bold border border-border">
                                    <XCircle className="w-3 h-3" /> لم يحضر
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {entry.checkedOut ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-bold border border-secondary/20">
                                    <CheckCircle2 className="w-3 h-3" /> غادر
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {entry.feedbackSubmitted ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-200">
                                    <BadgeCheck className="w-3 h-3" /> قُيِّم
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">لم يُقيَّم</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${
                                    entry.status === 'attended'
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : entry.status === 'absent'
                                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                                      : 'bg-primary/5 text-primary border-primary/20'
                                  }`}>
                                    {entry.status === 'attended' ? 'حاضر' : entry.status === 'absent' ? 'غائب' : 'مسجل'}
                                  </span>
                                  {entry.status === 'registered' && !entry.checkedIn && (
                                    <button
                                      onClick={() => handleMarkAbsent(entry)}
                                      className="px-2 py-1 bg-destructive/10 text-destructive text-[10px] font-bold rounded-lg border border-destructive/20 hover:bg-destructive hover:text-white transition-all whitespace-nowrap"
                                    >
                                      تسجيل غياب
                                    </button>
                                  )}
                                  {(() => {
                                    const ac = getAbsenceCount(entry.userId);
                                    return ac > 0 ? (
                                      <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-full border ${ac >= 3 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                        {ac}/3 غياب
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                              </td>

                              {/* ── Certificate column ── */}
                              <td className="px-6 py-4 text-center">
                                {!canIssueCert ? (
                                  <span className="text-muted-foreground text-xs">—</span>
                                ) : certIssued ? (
                                  <button
                                    onClick={() => {
                                      const ev = events.find(e => e.id === entry.eventId);
                                      if (!ev) return;
                                      setAdminCertModal({
                                        studentName: entry.studentName,
                                        studentId: entry.studentId,
                                        eventTitle: ev.title,
                                        eventDate: ev.date,
                                        studentEmail: `${entry.studentId}@imamu.edu.sa`,
                                      });
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-bold border border-secondary/20 hover:bg-secondary hover:text-white transition-all"
                                    title="عرض الشهادة"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                    عرض
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleIssueCertificate(entry)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-secondary/90 transition-all shadow-sm whitespace-nowrap"
                                    title="إصدار شهادة حضور"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                    إصدار
                                  </button>
                                )}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="bg-card border border-border rounded-3xl p-16 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ListChecks className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <p className="font-bold text-foreground text-lg mb-1">اختر فعالية لعرض قائمة الحضور</p>
                <p className="text-sm text-muted-foreground">ستظهر هنا تفاصيل الحضور والغياب بشكل فوري</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Reports Tab ─── */}
        {activeTab === 'reports' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-2xl font-bold flex items-center gap-3 mb-6">
              <span className="w-3 h-8 bg-secondary rounded-full block"></span>
              {t('التقارير والإحصائيات', 'Reports & Statistics')}
            </h3>

            {/* ── Event selector ── */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-bold text-foreground mb-1">{t('اختر الفعالية', 'Select Activity')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('اختر فعالية محددة لعرض تقريرها، أو اتركها فارغة لتقرير شامل.', 'Pick a specific activity for its report, or leave blank for an overall report.')}
                </p>
              </div>
              <select
                value={selectedReportEventId}
                onChange={e => setSelectedReportEventId(e.target.value)}
                className="w-full sm:w-72 px-4 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('— جميع الفعاليات —', '— All Activities —')}</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            {/* ── Generate card ── */}
            <div className="mb-6">
              <div className="bg-gradient-to-br from-[#045D84] to-primary rounded-3xl p-8 text-white relative overflow-hidden shadow-lg group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center shrink-0">
                    <FileText className="w-7 h-7 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold mb-1">
                      {selectedReportEventId
                        ? (events.find(e => e.id === selectedReportEventId)?.title ?? t('تقرير الفعالية', 'Activity Report'))
                        : t('تقرير الأنشطة الشامل', 'Full Activities Report')}
                    </h4>
                    <p className="text-white/70 text-sm">
                      {selectedReportEventId
                        ? t('تقرير مفصّل لهذه الفعالية: التسجيلات، الحضور، معدل الحضور، والتقييمات.', 'Detailed report for this activity: registrations, attendance, rate, and feedback.')
                        : t('تقرير شامل لجميع الأنشطة الجامعية.', 'Comprehensive report for all university activities.')}
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateReport}
                    className="shrink-0 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-secondary hover:text-white transition-colors shadow-lg"
                  >
                    {t('توليد التقرير', 'Generate Report')}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Summary table (respects filter) ── */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  {selectedReportEventId ? t('أداء الفعالية المختارة', 'Selected Activity Performance') : t('ملخص أداء الفعاليات', 'All Activities Performance')}
                </h4>
                {selectedReportEventId && (
                  <button
                    onClick={() => setSelectedReportEventId('')}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    {t('عرض الكل', 'Show all')}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-bold">{t('الفعالية', 'Activity')}</th>
                      <th className="px-6 py-3 font-bold">{t('التسجيل', 'Registered')}</th>
                      <th className="px-6 py-3 font-bold">{t('الحضور', 'Attended')}</th>
                      <th className="px-6 py-3 font-bold">{t('التقييمات', 'Feedback')}</th>
                      <th className="px-6 py-3 font-bold">{t('معدل الحضور', 'Attendance %')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(selectedReportEventId ? events.filter(e => e.id === selectedReportEventId) : events).map(event => {
                      const eventRegs = mockRegistrations.filter(r => r.eventId === event.id);
                      const attended = eventRegs.filter(r => r.status === 'attended').length;
                      const feedback = eventRegs.filter(r => r.feedbackSubmitted).length;
                      const rate = event.registeredCount > 0 ? Math.round((attended / event.registeredCount) * 100) : 0;
                      return (
                        <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-3">
                            <p className="font-bold text-foreground line-clamp-1">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.date} · {event.activityType}</p>
                          </td>
                          <td className="px-6 py-3 font-medium">{event.registeredCount} / {event.capacity}</td>
                          <td className="px-6 py-3 font-bold text-green-600">{attended}</td>
                          <td className="px-6 py-3 font-bold text-secondary">{feedback}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: `${rate}%` }}></div>
                              </div>
                              <span className="text-xs font-bold">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── Notification Center Tab ─── */}
        {activeTab === 'notifications' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-8 bg-secondary rounded-full block"></span>
                  مركز الإشعارات والبريد الإلكتروني
                </h3>
                <p className="text-sm text-muted-foreground mt-1">سجل كامل لجميع الرسائل المُرسَلة تلقائياً من النظام</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEmailLogs(getEmailLogs())}
                  className="flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-border text-foreground text-sm font-bold rounded-xl hover:bg-muted transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </button>
                <button
                  onClick={() => { clearEmailLogs(); setEmailLogs([]); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-destructive border-2 border-destructive/20 rounded-xl hover:bg-destructive/5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح السجل
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
              {[
                { type: 'all', label: 'الكل', count: emailLogs.length, style: 'bg-muted text-foreground border-border' },
                { type: 'registration_confirmation', label: 'تأكيد التسجيل', count: emailLogs.filter(l => l.type === 'registration_confirmation').length, style: 'bg-primary/5 text-primary border-primary/20' },
                { type: 'waitlist_notification', label: 'قائمة الانتظار', count: emailLogs.filter(l => l.type === 'waitlist_notification').length, style: 'bg-orange-50 text-orange-600 border-orange-200' },
                { type: 'waitlist_promotion', label: 'ترقية الانتظار', count: emailLogs.filter(l => l.type === 'waitlist_promotion').length, style: 'bg-green-50 text-green-600 border-green-200' },
                { type: 'certificate', label: 'الشهادات', count: emailLogs.filter(l => l.type === 'certificate').length, style: 'bg-secondary/10 text-secondary border-secondary/20' },
                { type: 'block_notification', label: 'إشعارات الحظر', count: emailLogs.filter(l => l.type === 'block_notification').length, style: 'bg-destructive/10 text-destructive border-destructive/20' },
                { type: 'absence_warning', label: 'تحذيرات الغياب', count: emailLogs.filter(l => l.type === 'absence_warning').length, style: 'bg-orange-50 text-orange-700 border-orange-300' },
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => setEmailFilter(item.type)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 text-center transition-all ${
                    emailFilter === item.type
                      ? item.style + ' shadow-sm scale-[1.02]'
                      : 'bg-card border-border text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <span className="text-xl font-black">{item.count}</span>
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              ))}
            </div>

            {filteredLogs.length === 0 ? (
              <div className="bg-card border border-border rounded-3xl p-16 text-center">
                <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <p className="font-bold text-foreground text-lg mb-1">لا توجد سجلات إشعارات</p>
                <p className="text-sm text-muted-foreground">ستظهر هنا الرسائل المُرسَلة عند تسجيل الطلاب في الفعاليات</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-bold">نوع الإشعار</th>
                        <th className="px-6 py-4 font-bold">المستلم</th>
                        <th className="px-6 py-4 font-bold">الفعالية</th>
                        <th className="px-6 py-4 font-bold">وقت الإرسال</th>
                        <th className="px-6 py-4 font-bold">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getEmailTypeStyle(log.type)}`}>
                              {getEmailTypeIcon(log.type)}
                              {getEmailTypeLabel(log.type)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-foreground">{log.recipientName}</p>
                            <p className="text-xs text-muted-foreground">{log.recipientEmail}</p>
                          </td>
                          <td className="px-6 py-4 max-w-[200px]">
                            <p className="font-medium text-foreground line-clamp-1">{log.eventTitle}</p>
                            <p className="text-xs text-muted-foreground">{log.eventDate}</p>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">
                            {new Date(log.sentAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                            <br />
                            {new Date(log.sentAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              log.status === 'delivered'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : log.status === 'failed'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-blue-50 text-blue-600 border-blue-200'
                            }`}>
                              {log.status === 'delivered' && <CheckCircle2 className="w-3 h-3" />}
                              {log.status === 'failed' && <XCircle className="w-3 h-3" />}
                              {log.status === 'sent' && <Send className="w-3 h-3" />}
                              {log.status === 'delivered' ? 'تم التسليم' : log.status === 'failed' ? 'فشل' : 'مرسل'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Student Monitoring Tab (read-only, system auto-blocks) ─── */}
        {activeTab === 'users' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-8 bg-primary rounded-full block"></span>
                  متابعة الطلاب
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  عرض سجل الغيابات وحالة الطلاب — الحجب يتم تلقائياً بواسطة النظام عند بلوغ 3 غيابات
                </p>
              </div>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو الرقم الجامعي..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pr-10 pl-4 py-2.5 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary text-sm font-medium w-72"
                />
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{MOCK_STUDENTS.length}</p>
                  <p className="text-xs text-muted-foreground font-medium">إجمالي الطلاب</p>
                </div>
              </div>
              <div className="bg-card border border-orange-200 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-orange-600">
                    {MOCK_STUDENTS.filter(s => getAbsenceCount(s.id) > 0 && getAbsenceCount(s.id) < 3).length}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">طلاب لديهم غيابات</p>
                </div>
              </div>
              <div className="bg-card border border-destructive/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-11 h-11 bg-destructive/10 rounded-xl flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-black text-destructive">{blockedUsers.length}</p>
                  <p className="text-xs text-muted-foreground font-medium">طلاب موقوفون تلقائياً</p>
                </div>
              </div>
            </div>

            {/* System notice */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">آلية الحجب التلقائي</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  يقوم النظام تلقائياً بحجب الطالب لمدة شهر كامل عند وصول عدد غياباته إلى 3 غيابات،
                  ويُرسل إشعاراً فورياً بالبريد الإلكتروني والتطبيق يوضح السبب ومدة الحجب. لا يملك الإداري صلاحية الحجب أو رفعه يدوياً.
                </p>
              </div>
            </div>

            {/* Students table — read-only */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-bold">الطالب</th>
                      <th className="px-6 py-4 font-bold">الرقم الجامعي</th>
                      <th className="px-6 py-4 font-bold hidden md:table-cell">الكلية</th>
                      <th className="px-6 py-4 font-bold">الغيابات (نظام)</th>
                      <th className="px-6 py-4 font-bold">الحالة</th>
                      <th className="px-6 py-4 font-bold hidden lg:table-cell">سبب الحجب / انتهاؤه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.map((student) => {
                      const blockedEntry = blockedUsers.find((b) => b.userId === student.id);
                      const isBlocked = !!blockedEntry;
                      const studentAbsences = getAbsenceCount(student.id);
                      return (
                        <tr key={student.id} className={`hover:bg-muted/30 transition-colors ${isBlocked ? 'bg-destructive/[0.02]' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${
                                isBlocked ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                              }`}>
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-foreground">{student.name}</p>
                                <p className="text-xs text-muted-foreground">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">{student.studentId}</td>
                          <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">{student.college}</td>

                          {/* Absence indicator — system-tracked */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {[1, 2, 3].map(n => (
                                  <div
                                    key={n}
                                    className={`w-3 h-3 rounded-full transition-colors ${
                                      n <= studentAbsences
                                        ? studentAbsences >= 3 ? 'bg-destructive' : 'bg-orange-400'
                                        : 'bg-muted border border-border'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className={`text-xs font-bold ${
                                studentAbsences >= 3 ? 'text-destructive' :
                                studentAbsences > 0 ? 'text-orange-600' : 'text-muted-foreground'
                              }`}>
                                {studentAbsences}/3
                              </span>
                            </div>
                          </td>

                          {/* Status — system-set only */}
                          <td className="px-6 py-4">
                            {isBlocked ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 text-destructive rounded-lg text-xs font-bold border border-destructive/20">
                                <XCircle className="w-3 h-3" />
                                موقوف تلقائياً
                              </span>
                            ) : studentAbsences > 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold border border-orange-200">
                                <AlertTriangle className="w-3 h-3" />
                                تحت المراقبة
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-200">
                                <CheckCircle2 className="w-3 h-3" />
                                نشط
                              </span>
                            )}
                          </td>

                          {/* Block details — read-only */}
                          <td className="px-6 py-4 hidden lg:table-cell">
                            {blockedEntry ? (
                              <div>
                                <p className="text-xs text-destructive font-medium line-clamp-1 max-w-[200px]">
                                  {blockedEntry.reason}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  ينتهي تلقائياً: {new Date(blockedEntry.blockedUntil).toLocaleDateString('ar-SA', {
                                    year: 'numeric', month: 'short', day: 'numeric'
                                  })}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── Create / Edit Event Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-border">

            {/* Header */}
            <div className="px-6 py-4 bg-muted/50 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  {editingEvent ? <Edit className="w-4 h-4 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    {editingEvent ? 'تعديل النشاط' : createStep === 1 ? 'اختر نوع النشاط' : 'تفاصيل النشاط'}
                  </h3>
                  {!editingEvent && (
                    <p className="text-xs text-muted-foreground">
                      {createStep === 1 ? 'الخطوة ١ من ٢' : 'الخطوة ٢ من ٢'}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setEditingEvent(null); }}
                className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step progress bar (new events only) */}
            {!editingEvent && (
              <div className="h-1 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: createStep === 1 ? '50%' : '100%' }}
                />
              </div>
            )}

            {/* ── Step 1: Activity Type Selection ── */}
            {!editingEvent && createStep === 1 ? (
              <div className="p-6 overflow-y-auto flex-1">
                <p className="text-sm text-muted-foreground text-center mb-6">اختر نوع النشاط لتحديد الإعدادات المناسبة للفعالية</p>
                <div className="grid grid-cols-2 gap-3">
                  {ACTIVITY_TYPES.map(({ value, icon: Icon, color, bg }) => (
                    <button
                      key={value}
                      onClick={() => { setEventForm({ ...eventForm, activityType: value }); setCreateStep(2); }}
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.97] ${bg}`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                      <span className={`font-bold text-sm ${color}`}>{value}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Step 2: Event Details Form ── */
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-5">

                  {/* Selected type badge (new events) */}
                  {!editingEvent && (
                    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                      {(() => {
                        const t = ACTIVITY_TYPES.find(a => a.value === eventForm.activityType);
                        return t ? <t.icon className={`w-5 h-5 ${t.color}`} /> : null;
                      })()}
                      <span className="font-bold text-sm text-primary flex-1">{eventForm.activityType}</span>
                      <button
                        onClick={() => setCreateStep(1)}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        تغيير النوع
                      </button>
                    </div>
                  )}

                  {/* Activity type select (edit mode) */}
                  {editingEvent && (
                    <div>
                      <label className="block text-sm font-bold mb-2">نوع النشاط</label>
                      <select
                        value={eventForm.activityType}
                        onChange={e => setEventForm({ ...eventForm, activityType: e.target.value as ActivityType })}
                        className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium appearance-none"
                      >
                        {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Volunteers toggle */}
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                    <input
                      type="checkbox"
                      id="needsVolunteers"
                      checked={eventForm.needsVolunteers}
                      onChange={e => setEventForm({ ...eventForm, needsVolunteers: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-border accent-teal-600"
                    />
                    <label htmlFor="needsVolunteers" className="text-sm font-bold cursor-pointer flex-1">
                      يقبل تسجيل متطوعين (Attendees + Volunteers)
                    </label>
                  </div>

                  {/* Audience type */}
                  <div>
                    <label className="block text-sm font-bold mb-2">الجمهور المستهدف</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {([
                        { value: 'general',    label: 'عام',    sub: 'لجميع منسوبي الجامعة' },
                        { value: 'restricted', label: 'مقيّد',  sub: 'حدّد الفئات المسموح لها' },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEventForm({ ...eventForm, audienceType: opt.value, allowedAudience: [] })}
                          className={`flex flex-col gap-1 p-4 rounded-xl border-2 text-right transition-all ${
                            eventForm.audienceType === opt.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <span className="font-bold text-sm text-foreground">{opt.label}</span>
                          <span className="text-xs text-muted-foreground">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                    {eventForm.audienceType === 'restricted' && (
                      <div className="grid grid-cols-2 gap-2 p-4 bg-muted/30 rounded-xl border border-border/60">
                        {([
                          { id: 'students',             label: 'الطلبة' },
                          { id: 'teaching_staff',       label: 'أعضاء هيئة التدريس' },
                          { id: 'administrative_staff', label: 'الكوادر الإدارية' },
                          { id: 'researchers',          label: 'الباحثون' },
                          { id: 'alumni',               label: 'الخريجون' },
                        ] as { id: AudienceGroup; label: string }[]).map(g => (
                          <label key={g.id} className="flex items-center gap-2 cursor-pointer text-sm py-1">
                            <input
                              type="checkbox"
                              checked={eventForm.allowedAudience.includes(g.id)}
                              onChange={e => {
                                const next = e.target.checked
                                  ? [...eventForm.allowedAudience, g.id]
                                  : eventForm.allowedAudience.filter(x => x !== g.id);
                                setEventForm({ ...eventForm, allowedAudience: next });
                              }}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="font-medium text-foreground">{g.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">اسم النشاط <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                      placeholder="مثال: ورشة عمل الذكاء الاصطناعي"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الوصف</label>
                    <textarea
                      value={eventForm.description}
                      onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium resize-none"
                      rows={3}
                      placeholder="وصف مفصل عن أهداف ومحتوى الفعالية..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">التاريخ <span className="text-destructive">*</span></label>
                      <input
                        type="date"
                        value={eventForm.date}
                        onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                        className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">الوقت</label>
                      <input
                        type="text"
                        value={eventForm.time}
                        onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
                        className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                        placeholder="10:00 - 14:00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الموقع / القاعة <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                      className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                      placeholder="مثال: مبنى المؤتمرات - القاعة الكبرى"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">المنظم</label>
                    <input
                      type="text"
                      value={eventForm.organizer}
                      onChange={e => setEventForm({ ...eventForm, organizer: e.target.value })}
                      className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                      placeholder="مثال: نادي البرمجة"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">الفئة</label>
                      <select
                        value={eventForm.category}
                        onChange={e => setEventForm({ ...eventForm, category: e.target.value })}
                        className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium appearance-none"
                      >
                        {interests.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">الكلية</label>
                      <select
                        value={eventForm.college}
                        onChange={e => setEventForm({ ...eventForm, college: e.target.value })}
                        className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium appearance-none"
                      >
                        {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">الطاقة الاستيعابية</label>
                      <input
                        type="number"
                        value={eventForm.capacity}
                        onChange={e => setEventForm({ ...eventForm, capacity: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">الحالة</label>
                      <select
                        value={eventForm.status}
                        onChange={e => setEventForm({ ...eventForm, status: e.target.value as Event['status'] })}
                        className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium appearance-none"
                      >
                        <option value="upcoming">قادمة</option>
                        <option value="ongoing">جارية</option>
                        <option value="completed">منتهية</option>
                        <option value="cancelled">ملغاة</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">رابط صورة الفعالية</label>
                    <input
                      type="url"
                      value={eventForm.image}
                      onChange={e => setEventForm({ ...eventForm, image: e.target.value })}
                      className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                    <input
                      type="checkbox"
                      id="requiresFeedback"
                      checked={eventForm.requiresFeedback}
                      onChange={e => setEventForm({ ...eventForm, requiresFeedback: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-border accent-secondary"
                    />
                    <label htmlFor="requiresFeedback" className="text-sm font-bold cursor-pointer">
                      التقييم إلزامي للحصول على الشهادة
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 bg-muted/50 border-t border-border flex gap-3 shrink-0">
              {!editingEvent && createStep === 1 ? (
                <button
                  onClick={() => { setShowCreateModal(false); }}
                  className="flex-1 py-3 bg-white border-2 border-border text-foreground font-bold rounded-xl hover:bg-muted transition-colors"
                >
                  إلغاء
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (!editingEvent && createStep === 2) { setCreateStep(1); }
                      else { setShowCreateModal(false); setEditingEvent(null); }
                    }}
                    className="flex-1 py-3 bg-white border-2 border-border text-foreground font-bold rounded-xl hover:bg-muted transition-colors"
                  >
                    {!editingEvent ? 'رجوع' : 'إلغاء'}
                  </button>
                  <button
                    onClick={handleSaveEvent}
                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                  >
                    {editingEvent ? 'حفظ التعديلات' : 'نشر النشاط'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Admin Certificate Preview Modal ─── */}
      {adminCertModal && (
        <CertificateModal
          isOpen={!!adminCertModal}
          onClose={() => setAdminCertModal(null)}
          studentName={adminCertModal.studentName}
          eventTitle={adminCertModal.eventTitle}
          eventDate={adminCertModal.eventDate}
          studentId={adminCertModal.studentId}
        />
      )}

      {/* ─── Delete Confirm Modal ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl w-full max-w-sm shadow-2xl border border-border overflow-hidden animate-in zoom-in-95">
            <div className="px-6 pt-7 pb-5 border-b border-border text-center">
              <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">حذف الفعالية</h3>
              <p className="text-sm text-muted-foreground">هل أنت متأكد من حذف هذه الفعالية؟ لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
            <div className="p-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 bg-white border-2 border-border text-foreground font-bold rounded-xl hover:bg-muted transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDeleteEvent(showDeleteConfirm)}
                className="flex-1 py-3 bg-destructive text-white font-bold rounded-xl hover:bg-destructive/90 transition-colors shadow-md"
              >
                حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      <PageFooter />
    </div>
  );
}
