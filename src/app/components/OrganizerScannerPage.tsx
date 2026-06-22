import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { mockRegistrations } from '../data/mockData';
import { getStoredEvents } from './AdminDashboard';
import {
  getEventQRPayload,
  isEventQRActive,
  isManuallyActivated,
  activateEventQR,
  deactivateEventQR,
} from '../services/eventQRService';
import {
  ArrowRight, QrCode, Radio, RadioTower, Users, Calendar, Clock, MapPin,
  Maximize2, Minimize2, CheckCircle2,
} from 'lucide-react';
import { LogoGroup } from './logo';

export function OrganizerScannerPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const events = getStoredEvents();
  const upcomingEvents = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing');

  const [selectedEventId, setSelectedEventId] = useState(upcomingEvents[0]?.id ?? '');
  const [manualActive, setManualActive] = useState(false);
  const [checkinCount, setCheckinCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [now, setNow] = useState(new Date());

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Sync activation state when event changes
  useEffect(() => {
    if (selectedEventId) setManualActive(isManuallyActivated(selectedEventId));
  }, [selectedEventId]);

  // Live clock + refresh check-in count every 5 s
  useEffect(() => {
    const refresh = () => {
      setNow(new Date());
      setCheckinCount(
        mockRegistrations.filter(r => r.eventId === selectedEventId && r.checkedIn).length
      );
    };
    refresh();
    const tick = setInterval(refresh, 5000);
    return () => clearInterval(tick);
  }, [selectedEventId]);

  const toggleActivation = useCallback(() => {
    if (!selectedEventId) return;
    if (manualActive) {
      deactivateEventQR(selectedEventId);
      setManualActive(false);
    } else {
      activateEventQR(selectedEventId);
      setManualActive(true);
    }
  }, [selectedEventId, manualActive]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (user?.role !== 'admin') return null;

  const active = selectedEvent
    ? isEventQRActive({ id: selectedEvent.id, status: selectedEvent.status, date: selectedEvent.date, time: selectedEvent.time })
    : false;

  const qrPayload = selectedEventId ? getEventQRPayload(selectedEventId) : '';

  const timeStr = now.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  // Recently checked-in attendees
  const recentCheckins = mockRegistrations
    .filter(r => r.eventId === selectedEventId && r.checkedIn)
    .slice(-5)
    .reverse();

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <header className="bg-[#045D84] border-b-4 border-[#B7A362] sticky top-0 z-20 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-white font-bold text-sm leading-tight">{t('عرض QR النشاط', 'Activity QR Display')}</span>
              <span className="text-white/50 text-[11px]">{t('يمسح الحاضرون الكود بأنفسهم', 'Attendees self-scan this code')}</span>
            </div>
            <LogoGroup uniSize="h-7" projSize="h-9" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full">
        <div className="grid lg:grid-cols-2 gap-6">

          {/* ── Left: Event selector + instructions ── */}
          <div className="space-y-4">

            {/* Event selector */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-bold text-foreground mb-2">
                {t('اختر النشاط', 'Select Activity')}
              </label>
              <select
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                className="w-full px-4 py-3 bg-muted border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-secondary transition-all appearance-none text-foreground"
              >
                {upcomingEvents.length === 0 && (
                  <option value="">{t('لا توجد أنشطة نشطة', 'No active activities')}</option>
                )}
                {upcomingEvents.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>

              {selectedEvent && (
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-primary" />{selectedEvent.date}</span>
                  <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary" />{selectedEvent.time}</span>
                  <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" />{selectedEvent.location}</span>
                </div>
              )}
            </div>

            {/* Activation toggle */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-foreground text-sm">{t('حالة رمز QR', 'QR Code Status')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('فعّل الرمز قبل بدء النشاط', 'Activate before the activity starts')}
                  </p>
                </div>
                <button
                  onClick={toggleActivation}
                  disabled={!selectedEventId}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-2 disabled:opacity-40 ${
                    active
                      ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                      : 'bg-muted border-border text-muted-foreground hover:border-secondary/40'
                  }`}
                >
                  {active
                    ? <><Radio className="w-4 h-4 animate-pulse" /> {t('نشط', 'Active')}</>
                    : <><RadioTower className="w-4 h-4" /> {t('تفعيل', 'Activate')}</>}
                </button>
              </div>
              <div className={`rounded-xl p-3 text-xs font-medium ${active ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-muted border border-border text-muted-foreground'}`}>
                {active
                  ? t('✅ الرمز نشط — يمكن للحاضرين المسح الآن', '✅ QR is active — attendees can scan now')
                  : t('⏸ الرمز غير نشط — الحاضرون لن يتمكنوا من المسح', '⏸ QR inactive — attendees cannot scan yet')}
              </div>
            </div>

            {/* Attendance stats */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className="font-bold text-foreground text-sm mb-3">{t('إحصائيات الحضور', 'Attendance Stats')}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-3 text-center">
                  <p className="text-3xl font-black text-secondary tabular-nums">{checkinCount}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" />
                    {t('سجّلوا الحضور', 'Checked in')}
                  </p>
                </div>
                <div className="bg-muted border border-border rounded-xl p-3 text-center">
                  <p className="text-3xl font-black text-foreground tabular-nums">{timeStr}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('الوقت الحالي', 'Current time')}</p>
                </div>
              </div>

              {/* Recent check-ins */}
              {recentCheckins.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground">{t('آخر الحضور', 'Recent check-ins')}</p>
                  {recentCheckins.map(r => (
                    <div key={r.id} className="flex items-center gap-2 text-xs text-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <span className="font-medium truncate">{r.userId}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions card */}
            <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-5">
              <p className="font-bold text-secondary text-sm mb-3">{t('كيف يعمل النظام', 'How it works')}</p>
              <ol className="space-y-2 text-xs text-foreground">
                {[
                  t('فعّل رمز QR هذا قبل بدء النشاط', 'Activate this QR code before the activity starts'),
                  t('اعرض رمز QR على الشاشة في مدخل القاعة', 'Display the QR code on a screen at the venue entrance'),
                  t('كل حاضر يفتح التطبيق → تفاصيل النشاط → "مسح QR للحضور"', 'Each attendee opens the app → Activity details → "Scan QR to Check In"'),
                  t('النظام يتحقق تلقائياً من الموقع الجغرافي ويسجّل الحضور', 'System auto-verifies GPS location and records attendance'),
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-secondary text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* ── Right: QR Code display ── */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#0a2540] rounded-3xl p-6 flex flex-col items-center gap-5 shadow-xl">

              {/* Event name */}
              {selectedEvent ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <LogoGroup variant="bare" uniSize="h-7" projSize="h-5" />
                  </div>
                  <h2 className="text-white font-black text-lg leading-tight">{selectedEvent.title}</h2>
                  <p className="text-white/50 text-xs mt-1">{selectedEvent.date} · {selectedEvent.time}</p>
                </div>
              ) : (
                <p className="text-white/40 text-sm">{t('اختر نشاطاً', 'Select an activity')}</p>
              )}

              {/* QR Code */}
              {selectedEventId ? (
                <div className="relative">
                  {active && (
                    <div className="absolute inset-0 rounded-3xl blur-3xl bg-secondary/40 scale-110" />
                  )}
                  <div className={`relative p-5 bg-white rounded-3xl shadow-2xl transition-all duration-500 ${
                    active ? 'ring-4 ring-secondary/60' : 'opacity-40 grayscale'
                  }`}>
                    <QRCodeSVG
                      value={qrPayload}
                      size={240}
                      level="H"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#045D84"
                    />
                  </div>
                  {!active && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/80 text-white font-black text-base px-5 py-3 rounded-2xl text-center">
                        {t('غير نشط', 'Inactive')}
                        <p className="text-xs font-normal mt-1 text-white/60">
                          {t('فعّل الرمز أولاً', 'Activate the QR first')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-60 h-60 bg-white/5 border-2 border-dashed border-white/20 rounded-3xl flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-white/20" />
                </div>
              )}

              {/* Instructions under QR */}
              <div className="text-center">
                <p className="text-white/90 font-bold text-sm">
                  {t('افتح التطبيق واضغط "مسح QR للحضور"', 'Open the app and tap "Scan QR to Check In"')}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  {t('تفاصيل النشاط ← مسح QR للحضور', 'Activity details → Scan QR to Check In')}
                </p>
              </div>

              {/* Fullscreen button */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                {isFullscreen ? t('إنهاء ملء الشاشة', 'Exit Fullscreen') : t('ملء الشاشة', 'Fullscreen')}
              </button>
            </div>

            {/* Link to dedicated fullscreen display */}
            {selectedEventId && (
              <button
                onClick={() => navigate(`/admin/event/${selectedEventId}/qr`)}
                className="w-full py-3 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Maximize2 className="w-4 h-4" />
                {t('فتح عرض الشاشة الكاملة', 'Open Full-Screen Display')}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
