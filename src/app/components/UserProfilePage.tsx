import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockRegistrations, mockEvents, hasEventEnded } from '../data/mockData';
import { getActivityRecord } from '../services/activityService';
import { ACTIVITY_LEVELS, getNextLevel, getLevelForHours } from '../data/activityLevels';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import {
  ArrowRight,
  Mail,
  BookOpen,
  Trophy,
  ShieldCheck,
  Calendar,
  Clock3,
  Award,
  CheckCircle,
  Star,
  Download,
  MapPin,
  Clock,
  Sparkles,
  GraduationCap,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import { Logo, LogoGroup } from './logo';
import { useLanguage } from '../context/LanguageContext';
import { TopBar, PageFooter } from './PageShell';
import { sendCertificateEmail } from '../services/emailService';
import { toast, Toaster } from 'sonner';
import { CertificateModal } from './CertificateModal';
import { getAbsenceCount } from '../services/absenceService';
import { isUserBlocked } from '../services/emailService';
import { NotificationPanel } from './NotificationPanel';

export function UserProfilePage() {
  const { user, logout } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'events' | 'vault' | 'record'>('events');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [certModal, setCertModal] = useState<{ eventTitle: string; eventDate: string } | null>(null);

  const myRegistrations = mockRegistrations.filter(r => r.userId === user?.id);

  // Events with any active registration where the event hasn't ended yet
  const upcomingMyEvents = mockEvents.filter(e =>
    myRegistrations.find(r => r.eventId === e.id && r.status !== 'cancelled') &&
    !hasEventEnded(e)
  );

  // Events (any registration status) where the event has already ended
  const pastMyEvents = mockEvents.filter(e =>
    myRegistrations.find(r => r.eventId === e.id && r.status !== 'cancelled') &&
    hasEventEnded(e)
  );

  // Active registered (not waitlist, not cancelled)
  const registeredEvents = mockEvents.filter(e =>
    myRegistrations.find(r => r.eventId === e.id && r.status === 'registered')
  );

  const waitlistEvents = mockEvents.filter(e =>
    myRegistrations.find(r => r.eventId === e.id && r.status === 'waitlist')
  );
  const attendedEvents = mockEvents.filter(e =>
    myRegistrations.find(r => r.eventId === e.id && r.status === 'attended')
  );
  const certificateEvents = mockEvents.filter(e =>
    myRegistrations.find(r => r.eventId === e.id && (r.certificateIssued || r.status === 'attended'))
  );

  const absenceCount = user ? getAbsenceCount(user.id) : 0;
  const blocked = user ? isUserBlocked(user.id) : false;

  // Co-curricular activity record
  const actRec = user ? getActivityRecord(user.id) : null;
  const currentLevel = actRec ? getLevelForHours(actRec.totalHours) : ACTIVITY_LEVELS[0];
  const nextLevel = getNextLevel(currentLevel);
  const progressPct = nextLevel
    ? Math.min(100, (actRec?.totalHours ?? 0) / nextLevel.minHours * 100)
    : 100;

  // Volunteer hours — cross-reference activity entries with registration role
  const volunteerEntries = (actRec?.entries ?? []).filter(entry => {
    const reg = myRegistrations.find(r => r.eventId === entry.eventId);
    return reg?.registrationRole === 'volunteer';
  });
  const volunteerHours = volunteerEntries.reduce((sum, e) => sum + e.hours, 0);

  const handleDownloadCertificate = (eventId: string, eventTitle: string, eventDate: string) => {
    setCertModal({ eventTitle, eventDate });
    setDownloadingId(eventId);
    setTimeout(() => {
      if (user) {
        sendCertificateEmail({
          recipientName: user.name,
          recipientEmail: user.email,
          eventTitle,
          eventDate,
        });
        toast.success('تم إرسال الشهادة إلى بريدك الإلكتروني!', {
          description: `📧 ${user.email}`,
          duration: 4000,
        });
      }
      setDownloadingId(null);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <TopBar />
      <Toaster position="top-center" richColors />

      {/* Certificate PDF Modal */}
      {user && certModal && (
        <CertificateModal
          isOpen={!!certModal}
          onClose={() => setCertModal(null)}
          studentName={user.name}
          eventTitle={certModal.eventTitle}
          eventDate={certModal.eventDate}
          studentId={user.studentId}
        />
      )}

      {/* Header */}
      <header className="bg-primary border-b-4 border-secondary sticky top-0 z-20 shadow-xl shadow-primary/10">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur transition-all justify-center"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-white font-bold hidden sm:block">{t('ملفي الشخصي', 'My Profile')}</span>
              {user && <NotificationPanel userId={user.id} />}
              <LogoGroup uniSize="h-7" projSize="h-9" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Profile Card */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-xl shadow-primary/5 mb-8">
          <div className="h-28 bg-gradient-to-l from-primary via-secondary to-primary relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 50%, #00ADEF 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8C61AF 0%, transparent 40%)',
              }}
            ></div>
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 -mt-14 mb-6">
              <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-xl flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/20 rounded-xl flex items-center justify-center">
                  <span className="text-3xl font-black text-primary">
                    {user?.name?.charAt(0) || 'أ'}
                  </span>
                </div>
              </div>
              <div className="sm:pt-14 sm:pb-1 flex-1 min-w-0">
                <h2 className="text-2xl font-black text-foreground leading-tight">{user?.name}</h2>
                <p className="text-muted-foreground text-sm font-medium">{user?.college}</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">
                  {blocked ? t('محظور مؤقتاً', 'Suspended') : t('طالب نشط', 'Active Student')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t('البريد الإلكتروني', 'Email')}</p>
                  <p className="text-sm font-bold text-foreground break-all">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('الرقم الجامعي', 'Student ID')}</p>
                  <p className="text-sm font-bold text-foreground">{user?.studentId || '2024001'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(0,173,239,0.1)' }}
                >
                  <Trophy className="w-4 h-4" style={{ color: '#00ADEF' }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('الأنشطة المكتملة', 'Completed Activities')}</p>
                  <p className="text-sm font-bold text-foreground">{attendedEvents.length} {t('نشاط', 'activities')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Absence / Block Warning */}
        {absenceCount > 0 && (
          <div
            className={`rounded-2xl p-4 mb-6 flex items-center gap-3 border ${
              blocked
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-orange-50 border-orange-200 text-orange-700'
            }`}
          >
            <GraduationCap className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">
              {blocked
                ? t(`حسابك محظور مؤقتاً بسبب ${absenceCount} غيابات. يرجى مراجعة إدارة شؤون الطلاب.`, `Your account is suspended due to ${absenceCount} absences. Please contact Student Affairs.`)
                : t(`لديك ${absenceCount} غياب(ات). عند الوصول لـ 3 غيابات سيتم تعليق حسابك.`, `You have ${absenceCount} absence(s). Your account will be suspended at 3 absences.`)}
            </p>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: t('المسجلة', 'Registered'), value: registeredEvents.length, color: 'text-primary', bg: 'bg-primary/10', icon: Calendar },
            { label: t('الانتظار', 'Waitlist'), value: waitlistEvents.length, color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock3 },
            { label: t('الشهادات', 'Certificates'), value: certificateEvents.length, color: 'text-secondary', bg: 'bg-secondary/10', icon: Award },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 text-center shadow-sm">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-2xl border border-border shadow-sm mb-6 p-1.5 flex">
          {[
            { id: 'events',  label: t('أنشطتي', 'My Activities'),            icon: Calendar },
            { id: 'vault',   label: t('خزنة الشهادات', 'Certificates'),      icon: Award },
            { id: 'record',  label: t('السجل اللامنهجي', 'Activity Record'), icon: ClipboardList },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-8 animate-in fade-in duration-300">

            {/* ── Section 1: Registered / Upcoming ── */}
            <div>
              <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-foreground">
                <span className="w-2 h-6 bg-primary rounded-full shrink-0"></span>
                <span>{t('مسجّل / قادم', 'Registered & Upcoming')}</span>
                <span className="mr-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{upcomingMyEvents.length}</span>
              </h3>
              {upcomingMyEvents.length === 0 ? (
                <EmptyState icon={Calendar} message={t('لا توجد أنشطة قادمة', 'No upcoming activities')} subMessage={t('سجّل في نشاط لتراه هنا', 'Register for an activity to see it here')} />
              ) : (
                <div className="space-y-3">
                  {upcomingMyEvents.map(event => {
                    const reg = myRegistrations.find(r => r.eventId === event.id)!;
                    const statusLabel = reg.status === 'waitlist' ? t('انتظار', 'Waitlist')
                      : reg.status === 'attended' ? t('في النشاط', 'Attending')
                      : t('مسجّل', 'Registered');
                    const statusColor = reg.status === 'waitlist'
                      ? 'bg-orange-50 text-orange-600 border-orange-200'
                      : reg.status === 'attended'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-primary/10 text-primary border-primary/20';
                    return (
                      <div
                        key={event.id}
                        className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-center shadow-sm cursor-pointer hover:border-primary/40 transition-all group"
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-border">
                          <img src={event.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-sm line-clamp-1">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {event.date} · {event.activityType}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColor}`}>{statusLabel}</span>
                          {reg.registrationRole === 'volunteer' && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-teal-50 text-teal-700 border-teal-200">{t('متطوع', 'Volunteer')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Section 2: Completed / Past ── */}
            <div>
              <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-foreground">
                <span className="w-2 h-6 bg-muted-foreground/40 rounded-full shrink-0"></span>
                <span>{t('مكتمل / منتهي', 'Completed & Past')}</span>
                <span className="mr-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{pastMyEvents.length}</span>
              </h3>
              {pastMyEvents.length === 0 ? (
                <EmptyState icon={CheckCircle} message={t('لا توجد أنشطة منتهية بعد', 'No past activities yet')} />
              ) : (
                <div className="space-y-3">
                  {pastMyEvents.map(event => {
                    const reg = myRegistrations.find(r => r.eventId === event.id)!;
                    return (
                      <div
                        key={event.id}
                        className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-center shadow-sm cursor-pointer hover:border-primary/30 transition-all group opacity-80"
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-border grayscale">
                          <img src={event.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-sm line-clamp-1">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {event.date} · {event.activityType}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {reg.status === 'attended' ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 inline ml-1" />{t('حضر', 'Attended')}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-muted text-muted-foreground border-border">
                              {reg.status === 'absent' ? t('غائب', 'Absent') : t('منتهية', 'Ended')}
                            </span>
                          )}
                          {reg.registrationRole === 'volunteer' && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-teal-50 text-teal-700 border-teal-200">{t('متطوع', 'Volunteer')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Certificate Vault Tab */}
        {activeTab === 'vault' && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 text-white mb-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
              <div
                className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-xl"
                style={{ backgroundColor: 'rgba(0,173,239,0.2)' }}
              ></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t('خزنة الشهادات', 'Certificate Vault')}</h3>
                  <p className="text-white/80 text-sm">{t('شهاداتك الموثقة من جامعة الإمام محمد بن سعود الإسلامية', 'Your verified certificates from Imam Muhammad ibn Saud Islamic University')}</p>
                </div>
              </div>
            </div>

            {certificateEvents.length === 0 ? (
              <EmptyState
                icon={Award}
                message={t('لا توجد شهادات متاحة حتى الآن', 'No certificates yet')}
                subMessage={t('احضر الأنشطة وقيّمها للحصول على شهادة إتمام', 'Attend and evaluate activities to earn completion certificates')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certificateEvents.map(event => {
                  const isDownloading = downloadingId === event.id;
                  return (
                    <div
                      key={event.id}
                      className="bg-card border-2 border-border rounded-2xl p-6 hover:border-secondary/50 transition-all shadow-sm group"
                    >
                      <div
                        className="w-full h-32 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #1E2652 0%, #5C2D91 100%)' }}
                      >
                        <div
                          className="absolute inset-0 opacity-10"
                          style={{
                            backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                          }}
                        ></div>
                        <div className="text-center relative z-10">
                          <Award className="w-8 h-8 text-white mx-auto mb-1" />
                          <p className="text-white/90 text-xs font-bold">{t('شهادة حضور', 'Attendance Certificate')}</p>
                        </div>
                        <div className="absolute bottom-2 left-3 right-3 flex items-center gap-1">
                          <div className="h-0.5 flex-1 rounded" style={{ backgroundColor: '#00ADEF', opacity: 0.6 }}></div>
                          <Sparkles className="w-3 h-3" style={{ color: '#00ADEF' }} />
                          <div className="h-0.5 flex-1 rounded" style={{ backgroundColor: '#00ADEF', opacity: 0.6 }}></div>
                        </div>
                      </div>
                      <h4 className="font-bold text-foreground mb-1 line-clamp-2 min-h-[40px]">{event.title}</h4>
                      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {event.date}
                      </p>
                      <button
                        onClick={() => handleDownloadCertificate(event.id, event.title, event.date)}
                        disabled={isDownloading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-all disabled:opacity-70 text-sm group-hover:shadow-md"
                      >
                        {isDownloading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            {t('جاري الإرسال...', 'Sending...')}
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            {t('تحميل وإرسال للبريد', 'Download & Send by Email')}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Activity Record Tab ── */}
        {activeTab === 'record' && (
          <div className="animate-in fade-in duration-300 space-y-5">

            {/* Official header card */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {/* Document stripe */}
              <div className="h-1.5 bg-gradient-to-l from-primary via-secondary to-primary" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-0.5">
                      سجل الأنشطة اللامنهجية
                    </p>
                    <p className="text-[11px] tracking-wider text-muted-foreground">
                      Co-Curricular Activity Record
                    </p>
                  </div>
                  <LogoGroup variant="bare" uniSize="h-10" projSize="h-7" />
                </div>

                <div className="border-t border-border/60 pt-4 mb-5">
                  <p className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wider">الطالب / Student</p>
                  <p className="font-bold text-foreground text-lg leading-tight">{user?.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{user?.studentId} · {user?.college}</p>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-muted/40 border border-border/60 rounded-xl p-4">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                      الساعات الموثّقة / Verified Hours
                    </p>
                    <p className="text-4xl font-black text-foreground tabular-nums">
                      {(actRec?.totalHours ?? 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-muted/40 border border-border/60 rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">{t('المستوى الحالي', 'Current Level')}</p>
                    <p className="text-sm font-bold text-foreground leading-snug">{currentLevel.titleAr}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{currentLevel.titleEn}</p>
                  </div>
                </div>

                {/* Volunteer hours card */}
                <div className="bg-teal-50 border border-teal-200/60 rounded-xl p-4 mb-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-teal-600/80 uppercase tracking-wider mb-0.5">
                      ساعات التطوع / Volunteer Hours
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-teal-700 tabular-nums">{volunteerHours.toFixed(1)}</p>
                      <p className="text-xs text-teal-600/70">
                        {volunteerEntries.length > 0
                          ? t(`من ${volunteerEntries.length} نشاط تطوعي`, `from ${volunteerEntries.length} volunteer activity`)
                          : t('لم تشارك كمتطوع بعد', 'No volunteer activities yet')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress to next level */}
                {nextLevel ? (
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <p className="text-xs text-muted-foreground">
                        {t('التقدم نحو:', 'Progress to:')} <span className="font-bold text-foreground">{lang === 'ar' ? nextLevel.titleAr : nextLevel.titleEn}</span>
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {(actRec?.totalHours ?? 0).toFixed(1)} / {nextLevel.minHours} {t('ساعة', 'hrs')}
                      </p>
                    </div>
                    <ProgressPrimitive.Root
                      className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
                      value={progressPct}
                    >
                      <ProgressPrimitive.Indicator
                        className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                        style={{ transform: `translateX(-${100 - progressPct}%)` }}
                      />
                    </ProgressPrimitive.Root>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-secondary/5 border border-secondary/20 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-secondary shrink-0" />
                    <p className="text-sm font-bold text-secondary">{t('أعلى مستوى — Campus Life Ambassador', 'Top Level — Campus Life Ambassador')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Levels reference */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border bg-muted/30">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">مستويات الإنجاز / Achievement Levels</p>
              </div>
              <div className="divide-y divide-border/60">
                {ACTIVITY_LEVELS.map(level => {
                  const reached = (actRec?.totalHours ?? 0) >= level.minHours;
                  return (
                    <div
                      key={level.index}
                      className={`flex items-center gap-4 px-5 py-3.5 ${reached ? '' : 'opacity-40'}`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${reached ? 'bg-primary' : 'bg-border'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{level.titleAr}</p>
                        <p className="text-[11px] text-muted-foreground">{level.titleEn}</p>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground shrink-0">{level.minHours}+ ساعة</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chronological activity log */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">سجل الأنشطة الموثّقة / Verified Activity Log</p>
                <p className="text-xs text-muted-foreground">
                  {(actRec?.entries ?? []).filter(e => {
                    const ev = mockEvents.find(ev => ev.id === e.eventId);
                    return ev ? hasEventEnded(ev) : e.eventDate < new Date().toISOString().split('T')[0];
                  }).length} {t('نشاط مكتمل', 'completed activities')}
                </p>
              </div>
              {(() => {
                const endedEntries = (actRec?.entries ?? []).filter(e => {
                  const ev = mockEvents.find(ev => ev.id === e.eventId);
                  return ev ? hasEventEnded(ev) : e.eventDate < new Date().toISOString().split('T')[0];
                });
                return endedEntries.length === 0 ? (
                  <div className="py-12 text-center">
                    <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{t('لا توجد أنشطة مكتملة ومحسوبة بعد', 'No completed activities recorded yet')}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{t('تُحسَب الساعات بعد انتهاء النشاط فقط', 'Hours are counted only after the activity ends')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {endedEntries.map((entry, i) => {
                      const isVolunteer = myRegistrations.find(
                        r => r.eventId === entry.eventId
                      )?.registrationRole === 'volunteer';
                      return (
                        <div key={i} className="flex items-center gap-4 px-5 py-4">
                          <div className="shrink-0 text-center w-10">
                            <p className="text-xl font-black text-foreground tabular-nums leading-none">{entry.hours}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{t('ساعة', 'hrs')}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-foreground truncate">{entry.eventTitle}</p>
                              {isVolunteer && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-700 border border-teal-200 shrink-0">
                                  {t('متطوع', 'Volunteer')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{entry.activityType} · {entry.eventDate}</p>
                          </div>
                          <div className="shrink-0 text-left">
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {new Date(entry.recordedAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

          </div>
        )}

        {/* Logout Button */}
        <div className="mt-10 pt-6 border-t border-border">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full py-3.5 bg-white border-2 border-border text-muted-foreground font-bold rounded-xl hover:bg-destructive/5 hover:border-destructive/30 hover:text-destructive transition-all text-sm"
          >
            {t('تسجيل الخروج', 'Sign Out')}
          </button>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  message,
  subMessage,
}: {
  icon: React.ElementType;
  message: string;
  subMessage?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-12 text-center">
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <p className="font-bold text-foreground mb-1">{message}</p>
      {subMessage && <p className="text-sm text-muted-foreground">{subMessage}</p>}
    </div>
  );
}

const statusColors = {
  registered: 'bg-primary/10 text-primary border-primary/20',
  waitlist: 'bg-orange-50 text-orange-600 border-orange-200',
  attended: 'bg-green-50 text-green-600 border-green-200',
  cancelled: 'bg-muted text-muted-foreground border-border',
  absent: 'bg-destructive/10 text-destructive border-destructive/20',
} as const;

const statusLabels = {
  registered: 'مسجل',
  waitlist: 'قائمة الانتظار',
  attended: 'حضر',
  cancelled: 'ملغي',
  absent: 'غائب',
} as const;

function EventCard({
  event,
  status,
  onView,
}: {
  event: any;
  status: keyof typeof statusColors;
  onView: () => void;
}) {
  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-center hover:border-primary/30 transition-all shadow-sm cursor-pointer group"
      onClick={onView}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border">
        <img src={event.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h4>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-lg text-xs font-bold border shrink-0 ${statusColors[status]}`}>
        {statusLabels[status]}
      </span>
    </div>
  );
}
