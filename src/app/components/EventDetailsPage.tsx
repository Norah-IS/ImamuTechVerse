import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockEvents, mockRegistrations, mockUsersDB, Registration, AudienceGroup } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Download,
  Star,
  Share2,
  Info,
  LogOut,
  Ban,
  QrCode,
  ChevronRight,
} from 'lucide-react';

import { Toaster } from 'sonner';
import { TopBar, PageFooter } from './PageShell';
import { LogoGroup } from './logo';
import { EmailConfirmationModal } from './EmailConfirmationModal';
import { CheckInModal } from './CheckInModal';
import { CertificateModal } from './CertificateModal';
import { AIEventRelevance } from './AIEventRelevance';
import { AICheckinMessage } from './AICheckinMessage';
import { sendRegistrationConfirmation, sendWaitlistConfirmation, sendWaitlistPromotion, isUserBlocked } from '../services/emailService';
import { recordAbsenceWithNotification, getAbsenceCount } from '../services/absenceService';
import { recordActivity } from '../services/activityService';
import { ACTIVITY_LEVELS } from '../data/activityLevels';
import { isEventQRActive } from '../services/eventQRService';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';

interface EventDetailsPageProps {
  adminView?: boolean;
}

export function EventDetailsPage({ adminView = false }: EventDetailsPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshAbsenceCount, refreshActivityRecord, activityRecord } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const [registrations, setRegistrations] = useState(mockRegistrations);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'event' | 'organizer'>('event');
  const [organizerRating, setOrganizerRating] = useState(0);

  // Email Confirmation Modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalType, setEmailModalType] = useState<'registration' | 'waitlist'>('registration');
  const [newRegistrationId, setNewRegistrationId] = useState('');
  const [waitlistPosition, setWaitlistPosition] = useState(1);

  // CheckIn Modal
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  // AI post-checkin message
  const [showAICheckin, setShowAICheckin] = useState(false);

  // Certificate Modal
  const [showCertModal, setShowCertModal] = useState(false);

  const event = mockEvents.find((e) => e.id === id);
  const myRegistration = registrations.find(
    (r) => r.eventId === id && r.userId === user?.id
  );

  const isBlocked = user ? isUserBlocked(user.id) : false;
  const absenceCount = user ? getAbsenceCount(user.id) : 0;
  const qrActive = event ? isEventQRActive({ id: event.id, status: event.status, date: event.date, time: event.time }) : false;

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">{t('عذراً، النشاط غير موجود', 'Activity Not Found')}</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-sm">{t('يبدو أن النشاط الذي تبحث عنه قد تم إلغاؤه أو إزالة الرابط الخاص به.', 'The activity you are looking for may have been cancelled or its link removed.')}</p>
        <button
          onClick={() => navigate(adminView ? '/admin' : '/')}
          className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <ArrowRight className="w-5 h-5" />
          العودة
        </button>
      </div>
    );
  }

  const isFull = event.registeredCount >= event.capacity;
  const isRegistered = myRegistration?.status === 'registered';
  const isWaitlisted = myRegistration?.status === 'waitlist';
  const hasAttended = myRegistration?.status === 'attended';
  const isCancelled = myRegistration?.status === 'cancelled';
  const isAbsent = myRegistration?.status === 'absent';
  const checkedIn = myRegistration?.checkedIn || false;
  const checkedOut = myRegistration?.checkedOut || false;

  const AUDIENCE_LABELS: Record<AudienceGroup, string> = {
    students:             'الطلبة',
    teaching_staff:       'أعضاء هيئة التدريس',
    administrative_staff: 'الكوادر الإدارية',
    researchers:          'الباحثين',
    alumni:               'الخريجين',
  };

  const doRegister = (role: 'attendee' | 'volunteer') => {
    if (isBlocked) {
      alert('لا يمكنك التسجيل حاليًا. تم حظر حسابك بسبب تجاوز حد الغيابات.');
      return;
    }
    // Time-conflict check: block if user already has a confirmed registration
    // on the same date that overlaps this event's time window.
    const parseMinutes = (timeStr: string): { start: number; end: number } | null => {
      const parts = timeStr.split(' - ').map(s => s.trim());
      if (parts.length !== 2) return null;
      const toMins = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return isNaN(h) || isNaN(m) ? null : h * 60 + m;
      };
      const start = toMins(parts[0]);
      const end = toMins(parts[1]);
      return start !== null && end !== null ? { start, end } : null;
    };

    const thisTime = parseMinutes(event.time);
    if (thisTime) {
      const conflictingEvent = registrations
        .filter(r => r.userId === user!.id && r.status === 'registered')
        .map(r => mockEvents.find(e => e.id === r.eventId))
        .find(e => {
          if (!e || e.id === event.id || e.date !== event.date) return false;
          const t = parseMinutes(e.time);
          return t !== null && thisTime.start < t.end && t.start < thisTime.end;
        });
      if (conflictingEvent) {
        alert(
          `لا يمكنك التسجيل — لديك تعارض في الوقت مع:\n"${conflictingEvent.title}"\n\nCannot register — time conflict with:\n"${conflictingEvent.title}"`
        );
        return;
      }
    }

    if (event.audienceType === 'restricted' && event.allowedAudience.length > 0) {
      const userGroup: AudienceGroup = user?.role === 'student' ? 'students' : 'teaching_staff';
      if (!event.allowedAudience.includes(userGroup)) {
        const allowed = event.allowedAudience.map(g => AUDIENCE_LABELS[g]).join('، ');
        alert(`هذا النشاط مخصص لـ: ${allowed} فقط.`);
        return;
      }
    }
    const newId = `r${Date.now()}`;
    const isWaitlist = isFull;
    const newRegistration: Registration = {
      id: newId,
      userId: user!.id,
      eventId: event.id,
      status: isWaitlist ? 'waitlist' : 'registered',
      registrationRole: role,
      checkedIn: false,
      checkedOut: false,
      feedbackSubmitted: false,
      certificateIssued: false,
    };
    setRegistrations([...registrations, newRegistration]);

    if (isWaitlist) {
      const wPos = event.waitlistCount + 1;
      setWaitlistPosition(wPos);
      sendWaitlistConfirmation({
        recipientName: user!.name,
        recipientEmail: user!.email,
        eventTitle: event.title,
        eventDate: event.date,
        waitlistPosition: wPos,
      });
      setEmailModalType('waitlist');
    } else {
      sendRegistrationConfirmation({
        recipientName: user!.name,
        recipientEmail: user!.email,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        registrationId: newId,
      });
      setEmailModalType('registration');
    }
    setNewRegistrationId(newId);
    setShowEmailModal(true);
  };

  const handleCancelRegistration = () => {
    if (confirm('هل أنت متأكد من رغبتك في إلغاء التسجيل في هذه الفعالية؟')) {
      setRegistrations(
        registrations.map((r) =>
          r.id === myRegistration?.id ? { ...r, status: 'cancelled' as const } : r
        )
      );

      // Notify Waitlist <<extend>> Cancel Registration — per use case diagram
      const firstWaitlisted = registrations.find(
        (r) => r.eventId === event.id && r.status === 'waitlist' && r.userId !== user?.id
      );
      if (firstWaitlisted) {
        const waitlistedUser = mockUsersDB.find((u) => u.id === firstWaitlisted.userId);
        sendWaitlistPromotion({
          recipientName: waitlistedUser?.name ?? 'طالب قائمة الانتظار',
          recipientEmail: waitlistedUser?.email ?? `${firstWaitlisted.userId}@imamu.edu.sa`,
          eventTitle: event.title,
          eventDate: event.date,
          eventTime: event.time,
          eventLocation: event.location,
          userId: firstWaitlisted.userId,
        });
      }
    }
  };

  // Called when CheckInModal reports success
  const handleCheckInSuccess = () => {
    setRegistrations(
      registrations.map((r) =>
        r.id === myRegistration?.id
          ? { ...r, checkedIn: true, status: 'attended' as const }
          : r
      )
    );

    setShowAICheckin(true);

    if (user && event.activityType) {
      const { previousLevelIndex, levelChanged, record } = recordActivity(user.id, {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        activityType: event.activityType,
      });
      refreshActivityRecord?.();

      if (levelChanged) {
        const newLevel = ACTIVITY_LEVELS[record.levelIndex];
        toast.success(`${newLevel.titleAr}`, {
          description: `${newLevel.titleEn}  ·  ${record.totalHours.toFixed(1)} ساعة موثّقة`,
          duration: 7000,
        });
      }
    }
  };

  // Called when user accepts being marked absent (Req 27)
  const handleAcceptAbsent = () => {
    setRegistrations(
      registrations.map((r) =>
        r.id === myRegistration?.id
          ? { ...r, status: 'absent' as const }
          : r
      )
    );
    // Record absence with auto-block + notifications (Req 40-41)
    if (user) {
      const { wasBlocked } = recordAbsenceWithNotification(user.id, {
        studentName: user.name,
        studentEmail: user.email,
        studentId: user.studentId,
        eventTitle: event.title,
      });
      refreshAbsenceCount?.();
      if (wasBlocked) {
        // The block notification is already sent inside recordAbsenceWithNotification
        setTimeout(() => {
          alert(`⚠️ تنبيه مهم\n\nلقد وصلت إلى الحد الأقصى من الغيابات (3 غيابات).\nتم تعليق حسابك مؤقتاً لمدة شهر كامل.\n\nللاستفسار، تواصل مع إدارة شؤون الطلاب.\n\nتم إرسال إشعار تفصيلي إلى بريدك: ${user.email}`);
        }, 300);
      }
    }
  };

  // Checkout: show feedback modal (Req 28, 31)
  const handleCheckOut = () => {
    if (!checkedIn) {
      alert('يجب إتمام تسجيل الحضور أولاً قبل تسجيل المغادرة.');
      return;
    }
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      alert('يرجى اختيار تقييم من 1 إلى 5 نجوم');
      return;
    }
    setRegistrations(
      registrations.map((r) =>
        r.id === myRegistration?.id
          ? { ...r, feedbackSubmitted: true, certificateIssued: true, checkedOut: true }
          : r
      )
    );
    setShowFeedbackModal(false);
    setRating(0);
    setOrganizerRating(0);
    setFeedback('');
    // Submit Feedback <<include>> Download Certificate — per use case diagram
    setShowCertModal(true);
  };

  const statusBadge = () => {
    if (event.status === 'cancelled') return <span className="px-4 py-1.5 bg-destructive/80 text-white rounded-xl text-sm font-bold">{t('ملغاة', 'Cancelled')}</span>;
    if (event.status === 'completed') return <span className="px-4 py-1.5 bg-muted text-muted-foreground rounded-xl text-sm font-bold">{t('منتهية', 'Ended')}</span>;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans flex flex-col">
      <TopBar />
      <Toaster position="top-center" richColors />
      <header className="bg-primary border-b-4 border-secondary sticky top-0 z-20 shadow-xl shadow-primary/10">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(adminView ? '/admin' : '/')}
              className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur transition-all"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLang}
                className="hidden sm:flex items-center px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all"
              >
                {lang === 'ar' ? 'EN' : 'ع'}
              </button>
              <h1 className="text-white text-base md:text-lg font-bold leading-tight hidden sm:block">
                {t('تفاصيل النشاط', 'Activity Details')}{adminView ? t(' (إداري)', ' (Admin)') : ''}
              </h1>
              <LogoGroup uniSize="h-7" projSize="h-6" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-xl shadow-primary/5">
          <div className="relative h-64 md:h-96 w-full">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <button className="w-10 h-10 bg-white/20 backdrop-blur border border-white/30 text-white rounded-xl flex items-center justify-center hover:bg-white hover:text-primary transition-colors shadow-sm">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="absolute bottom-6 right-6 left-6 z-20">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-4 py-1.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg border border-white/20 backdrop-blur">
                  {event.category}
                </span>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg border border-white/20 backdrop-blur ${
                  event.audienceType === 'restricted'
                    ? 'bg-amber-700/90 text-white'
                    : 'bg-slate-600/80 text-white'
                }`}>
                  {event.audienceType === 'restricted' && event.allowedAudience.length > 0
                    ? event.allowedAudience.map(g => ({
                        students: 'الطلبة', teaching_staff: 'أعضاء التدريس',
                        administrative_staff: 'الإداريون', researchers: 'الباحثون', alumni: 'الخريجون',
                      }[g] ?? g)).join('، ') + ' فقط'
                    : 'عام — منسوبو الجامعة'}
                </span>
                {event.needsVolunteers && (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg border border-white/20 backdrop-blur bg-teal-600/90 text-white">
                    يقبل متطوعين
                  </span>
                )}
                {statusBadge()}
                {isRegistered && (
                  <span className="px-4 py-1.5 bg-secondary text-white rounded-xl text-sm font-bold shadow-lg border border-white/20 flex items-center gap-2 backdrop-blur">
                    <CheckCircle className="w-4 h-4" />
                    مسجل
                  </span>
                )}
                {isWaitlisted && (
                  <span className="px-4 py-1.5 bg-orange-500 text-white rounded-xl text-sm font-bold shadow-lg border border-white/20 flex items-center gap-2 backdrop-blur">
                    <AlertCircle className="w-4 h-4" />
                    في الانتظار
                  </span>
                )}
                {hasAttended && (
                  <span className="px-4 py-1.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg border border-white/20 flex items-center gap-2 backdrop-blur">
                    <CheckCircle className="w-4 h-4" />
                    حضر
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight drop-shadow-md">{event.title}</h1>
              <p className="text-white/90 text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-secondary" />
                تنظيم: {event.organizer}
              </p>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <div className="flex flex-col lg:flex-row gap-10">
              <div className="flex-1 space-y-8">
                <section>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground">
                    <span className="w-2 h-6 bg-secondary rounded-full"></span>
                    {t('نبذة عن النشاط', 'About This Activity')}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {event.description}
                  </p>
                </section>

                {/* Feature 2: AI relevance card — visible to visitors only */}
                {!adminView && user && user.role !== 'admin' && (
                  <AIEventRelevance
                    event={event}
                    user={user}
                    activityRecord={activityRecord ?? null}
                    registeredCount={myRegistration && myRegistration.status !== 'cancelled' ? 1 : 0}
                  />
                )}

                <section className="bg-muted/30 p-6 rounded-3xl border border-border/50">
                  <h3 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    {t('تفاصيل النشاط', 'Activity Details')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border/50 shrink-0">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-muted-foreground mb-1">{t('التاريخ', 'Date')}</p>
                        <p className="font-bold text-foreground">{event.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border/50 shrink-0">
                        <Clock className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-muted-foreground mb-1">{t('الوقت', 'Time')}</p>
                        <p className="font-bold text-foreground">{event.time}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 sm:col-span-2">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border/50 shrink-0">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-muted-foreground mb-1">{t('الموقع / القاعة', 'Location / Hall')}</p>
                        <p className="font-bold text-foreground">{event.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 sm:col-span-2">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border/50 shrink-0">
                        <Building2 className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-muted-foreground mb-1">{t('الكلية / الجهة المنظمة', 'College / Organizer')}</p>
                        <p className="font-bold text-foreground">{event.college} — {event.organizer}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Absence warning */}
                {!adminView && absenceCount > 0 && (
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    absenceCount >= 3
                      ? 'bg-destructive/10 border-destructive/30 text-destructive'
                      : 'bg-orange-50 border-orange-200 text-orange-700'
                  }`}>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">
                        {absenceCount >= 3
                          ? 'تم حظر حسابك: تجاوزت الحد المسموح به من الغيابات'
                          : `تحذير: لديك ${absenceCount} غياب(ات). عند الوصول إلى 3 غيابات سيتم تعليق حسابك.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:w-80 space-y-6">
                <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-md hover:border-primary/50 transition-colors">
                  <h4 className="text-sm font-bold text-muted-foreground mb-4">{t('حالة التسجيل والمشاركة', 'Registration & Participation')}</h4>

                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-2xl text-foreground">{event.registeredCount}</span>
                    <span className="text-sm font-medium text-muted-foreground">{t(`من ${event.capacity} مقعد`, `of ${event.capacity} seats`)}</span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-3 mb-6 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-destructive' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%` }}
                    ></div>
                  </div>
                  
                  {/* قائمة الانتظار — تظهر فقط إذا امتلأت المقاعد الأساسية */}
                  {isFull && event.waitlistCount > 0 && (
                    <div className="flex items-center justify-between text-sm font-medium text-orange-600 bg-orange-50 px-4 py-2 rounded-xl mb-6 border border-orange-100">
                      <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {t('قائمة الانتظار', 'Waitlist')}</span>
                      <span>{event.waitlistCount} {t('طالب', 'students')}</span>
                    </div>
                  )}

                  {/* Blocked User Message */}
                  {!adminView && isBlocked && (
                    <div className="w-full py-3.5 bg-destructive/10 border-2 border-destructive/30 text-destructive font-bold rounded-xl flex items-center justify-center gap-2 text-sm mb-3">
                      <Ban className="w-5 h-5" />
                      {t('حسابك محظور مؤقتاً - لا يمكن التسجيل', 'Account suspended — registration unavailable')}
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t border-border">
                    {/* Register / Waitlist button */}
                    {!adminView && !myRegistration && event.status === 'upcoming' && !isBlocked && (
                      event.needsVolunteers && !isFull ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground text-center font-medium">{t('اختر طريقة المشاركة', 'Choose participation type')}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => doRegister('attendee')}
                              className="py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm flex flex-col items-center gap-0.5"
                            >
                              <span>{t('حضور', 'Attendee')}</span>
                            </button>
                            <button
                              onClick={() => doRegister('volunteer')}
                              className="py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 text-sm flex flex-col items-center gap-0.5"
                            >
                              <span>{t('متطوع', 'Volunteer')}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => doRegister('attendee')}
                          className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${
                            isFull
                              ? 'bg-secondary text-white hover:bg-secondary/90 shadow-secondary/20'
                              : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                          }`}
                        >
                          {isFull ? t('الانضمام للانتظار', 'Join Waitlist') : t('التسجيل الآن', 'Register Now')}
                        </button>
                      )
                    )}

                    {/* ── مسجّل (حضور أو تطوع) ولم يحضر بعد ── */}
                    {!adminView && myRegistration?.status === 'registered' && (event.status === 'upcoming' || event.status === 'ongoing') && !checkedIn && (
                      <>
                        <button
                          onClick={handleCancelRegistration}
                          className="w-full py-3.5 bg-white border-2 border-border text-destructive font-bold rounded-xl hover:bg-destructive/5 hover:border-destructive/30 transition-all text-sm"
                        >
                          {t('إلغاء التسجيل', 'Cancel Registration')}
                        </button>

                        <button
                          onClick={() => setShowCheckInModal(true)}
                          className="w-full py-3.5 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <QrCode className="w-5 h-5" />
                          {t('مسح رمز QR للحضور', 'Scan QR to Check In')}
                        </button>
                      </>
                    )}

                    {/* ── سجّل حضوره ولم يغادر بعد ── يظهر بغض النظر عن حالة التسجيل ── */}
                    {!adminView && checkedIn && !checkedOut && (
                      <div className="space-y-3">
                        <div className="w-full py-3 px-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-2xl flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{t('تم تأكيد حضورك ✓', 'Attendance confirmed ✓')}</p>
                            <p className="text-xs text-green-600/80">{t('لا تنسَ تسجيل المغادرة عند انتهاء الفعالية', "Don't forget to check out when the event ends")}</p>
                          </div>
                        </div>

                        <button
                          onClick={handleCheckOut}
                          className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                        >
                          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                          {t('تسجيل المغادرة', 'Check Out')}
                        </button>
                      </div>
                    )}

                    {/* ── غادر وقيّم ── */}
                    {!adminView && checkedOut && myRegistration?.feedbackSubmitted && (
                      <div className="w-full py-3 bg-green-50 border-2 border-green-200 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
                        <CheckCircle className="w-5 h-5" />
                        {t('تم تسجيل المغادرة والتقييم', 'Checked out and evaluated')}
                      </div>
                    )}

                    {/* Download certificate */}
                    {!adminView && myRegistration?.certificateIssued && (
                      <button
                        onClick={() => setShowCertModal(true)}
                        className="w-full py-3.5 bg-white border-2 border-secondary text-secondary font-bold rounded-xl hover:bg-secondary/10 transition-all flex items-center justify-center gap-2 group"
                      >
                        <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                        {t('تحميل شهادة الحضور (PDF)', 'Download Attendance Certificate (PDF)')}
                      </button>
                    )}

                    {/* Feedback required but not submitted (lock certificate) */}
                    {!adminView && hasAttended && myRegistration?.checkedOut && !myRegistration?.feedbackSubmitted && (
                      <div className="w-full py-3 bg-muted border-2 border-border text-muted-foreground font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
                        <AlertCircle className="w-5 h-5" />
                        التقييم مطلوب لإصدار الشهادة
                      </div>
                    )}

                    {/* Waitlist actions */}
                    {!adminView && isWaitlisted && (
                      <button
                        onClick={handleCancelRegistration}
                        className="w-full py-3.5 bg-white border-2 border-border text-muted-foreground font-bold rounded-xl hover:bg-muted transition-all text-sm"
                      >
                        الخروج من قائمة الانتظار
                      </button>
                    )}

                    {/* Absent status */}
                    {!adminView && isAbsent && (
                      <div className="w-full py-3 bg-destructive/10 border-2 border-destructive/30 text-destructive font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
                        <AlertCircle className="w-5 h-5" />
                        تم تسجيلك كـ "غائب"
                      </div>
                    )}

                    {/* Admin: view attendance */}
                    {adminView && (
                      <button
                        onClick={() => navigate('/admin')}
                        className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <ChevronRight className="w-5 h-5" />
                        إدارة الفعالية
                      </button>
                    )}
                  </div>
                </div>

                {/* Attendance stats (always visible) */}
                <div className="bg-muted/40 border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">{t('إحصائيات الحضور', 'Attendance Stats')}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('المسجلون', 'Registered')}</span>
                      <span className="font-bold text-foreground">{event.registeredCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('الطاقة الاستيعابية', 'Capacity')}</span>
                      <span className="font-bold text-foreground">{event.capacity}</span>
                    </div>
                    {isFull && event.waitlistCount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600">{t('قائمة الانتظار', 'Waitlist')}</span>
                        <span className="font-bold text-orange-600">{event.waitlistCount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('المقاعد المتبقية', 'Seats remaining')}</span>
                      <span className={`font-bold ${isFull ? 'text-destructive' : 'text-green-600'}`}>
                        {isFull ? t('مكتمل', 'Full') : event.capacity - event.registeredCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feedback / Checkout Modal (Req 31-34) */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl p-0 w-full max-w-md overflow-hidden shadow-2xl border border-border flex flex-col max-h-[90vh]">
            <div className="p-8 pb-6 flex flex-col items-center text-center bg-gradient-to-br from-primary to-secondary text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-1">{t('استبيان التقييم', 'Evaluation Survey')}</h3>
              <p className="text-white/80 text-sm">{t('تقييمك إلزامي للحصول على شهادة الحضور', 'Evaluation required to receive your attendance certificate')}</p>
            </div>

            <div className="px-8 py-6 overflow-y-auto flex-1">
              {/* Tab selector */}
              <div className="flex p-1 bg-muted rounded-xl mb-6">
                <button
                  onClick={() => setFeedbackType('event')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${feedbackType === 'event' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
                >
                  {t('تقييم الفعالية', 'Event Rating')}
                </button>
                <button
                  onClick={() => setFeedbackType('organizer')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${feedbackType === 'organizer' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
                >
                  {t('تقييم المنظمين', 'Organizer Rating')}
                </button>
              </div>

              {feedbackType === 'event' && (
                <div className="space-y-5">
                  <div className="flex flex-col items-center">
                    <label className="block mb-3 font-bold text-sm text-center">{t('تقييم الفعالية الإجمالي', 'Overall Event Rating')}</label>
                    <div className="flex gap-2 justify-center" dir="ltr">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform focus:outline-none"
                        >
                          <Star
                            className={`w-10 h-10 ${
                              star <= rating
                                ? 'fill-secondary text-secondary drop-shadow-md'
                                : 'text-muted/50 fill-muted'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p className="text-sm font-bold text-secondary mt-2">
                        {['', 'ضعي��', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'][rating]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 font-bold text-sm">{t('ملاحظاتك ومقترحاتك', 'Your notes and suggestions')}</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full px-4 py-3 bg-muted/50 border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium resize-none"
                      rows={3}
                      placeholder={t('شاركنا رأيك بصدق وشفافية...', 'Share your honest feedback...')}
                    />
                  </div>
                </div>
              )}

              {feedbackType === 'organizer' && (
                <div className="space-y-5">
                  <div className="flex flex-col items-center">
                    <label className="block mb-3 font-bold text-sm text-center">{t('تقييم أداء المنظمين', 'Organizer Performance Rating')}</label>
                    <div className="flex gap-2 justify-center" dir="ltr">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setOrganizerRating(star)}
                          className="p-1 hover:scale-110 transition-transform focus:outline-none"
                        >
                          <Star
                            className={`w-10 h-10 ${
                              star <= organizerRating
                                ? 'fill-primary text-primary drop-shadow-md'
                                : 'text-muted/50 fill-muted'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {organizerRating > 0 && (
                      <p className="text-sm font-bold text-primary mt-2">
                        {['', 'ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'][organizerRating]}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center bg-muted/50 p-3 rounded-xl">
                    تقييم المنظمين اختياري. يمكنك الإرسال من تبويب "تقييم الفعالية".
                  </p>
                </div>
              )}
            </div>

            <div className="px-8 pb-8 flex gap-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 py-3.5 bg-white border-2 border-border text-foreground font-bold rounded-xl hover:bg-muted transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={rating === 0}
                className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50"
              >
                إرسال التقييم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Confirmation Modal */}
      <EmailConfirmationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        type={emailModalType}
        recipientEmail={user?.email || ''}
        recipientName={user?.name || ''}
        eventTitle={event.title}
        eventDate={event.date}
        eventTime={event.time}
        eventLocation={event.location}
        registrationId={emailModalType === 'registration' ? newRegistrationId : undefined}
        waitlistPosition={emailModalType === 'waitlist' ? waitlistPosition : undefined}
      />

      {/* CheckIn Modal (Req 24-27) */}
      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onSuccess={handleCheckInSuccess}
        onAcceptAbsent={handleAcceptAbsent}
        eventId={event.id}
        eventTitle={event.title}
        eventLocation={event.location}
        isQRActive={qrActive}
        eventDate={event.date}
        eventTime={event.time}
        eventStatus={event.status}
        eventLat={event.lat}
        eventLng={event.lng}
      />

      {/* Certificate Modal (Req 35) */}
      {user && (
        <CertificateModal
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
          studentName={user.name}
          eventTitle={event.title}
          eventDate={event.date}
          studentId={user.studentId}
        />
      )}
      <PageFooter />

      {/* Feature 3: AI post-checkin encouragement message */}
      {user && user.role !== 'admin' && (
        <AICheckinMessage
          isOpen={showAICheckin}
          onClose={() => setShowAICheckin(false)}
          attendedEvent={event}
          user={user}
          activityRecord={activityRecord ?? null}
        />
      )}
    </div>
  );
}