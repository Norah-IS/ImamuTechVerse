import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getStoredEvents } from './AdminDashboard';
import { mockRegistrations } from '../data/mockData';
import {
  getEventQRPayload,
  isEventQRActive,
  isManuallyActivated,
  activateEventQR,
  deactivateEventQR,
} from '../services/eventQRService';
import {
  ArrowRight, Maximize2, Minimize2, Users, Radio, RadioTower, Clock, Calendar, MapPin,
} from 'lucide-react';
import { LogoGroup } from './logo';

export function EventQRDisplayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const [events, setEvents] = useState(getStoredEvents());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [manualActive, setManualActive] = useState(false);
  const [checkinCount, setCheckinCount] = useState(0);
  const [now, setNow] = useState(new Date());

  const event = events.find((e) => e.id === id);

  // Live clock + refresh check-in count every 5 s
  useEffect(() => {
    const tick = setInterval(() => {
      setNow(new Date());
      setEvents(getStoredEvents());
      const count = mockRegistrations.filter(
        (r) => r.eventId === id && r.checkedIn
      ).length;
      setCheckinCount(count);
    }, 5000);
    // Initial count
    setCheckinCount(mockRegistrations.filter((r) => r.eventId === id && r.checkedIn).length);
    return () => clearInterval(tick);
  }, [id]);

  // Sync manual activation state
  useEffect(() => {
    if (id) setManualActive(isManuallyActivated(id));
  }, [id]);

  const toggleActivation = useCallback(() => {
    if (!id) return;
    if (manualActive) {
      deactivateEventQR(id);
      setManualActive(false);
    } else {
      activateEventQR(id);
      setManualActive(true);
    }
  }, [id, manualActive]);

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
  if (!event) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">{t('النشاط غير موجود', 'Activity not found')}</p>
    </div>
  );

  const qrPayload = getEventQRPayload(event.id);
  const active = isEventQRActive(event);
  const timeStr = now.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      className="min-h-screen bg-[#0f1326] flex flex-col font-sans select-none"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          {t('لوحة التحكم', 'Dashboard')}
        </button>

        <div className="flex items-center gap-3">
          {/* Active / Inactive toggle */}
          <button
            onClick={toggleActivation}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
              active
                ? 'bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30'
                : 'bg-white/5 border-white/20 text-white/50 hover:bg-white/10'
            }`}
          >
            {active
              ? <><Radio className="w-4 h-4 animate-pulse" /> {t('نشط', 'Active')}</>
              : <><RadioTower className="w-4 h-4" /> {t('تفعيل', 'Activate')}</>}
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all"
            title={t('ملء الشاشة', 'Full Screen')}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">

        {/* Event title */}
        <div className="text-center max-w-2xl">
          <div className="flex items-center justify-center gap-3 mb-3">
            <LogoGroup variant="bare" uniSize="h-8" projSize="h-6" />
            <span className="text-white/50 text-sm tracking-wider uppercase">
              {t('جامعة الإمام محمد بن سعود الإسلامية', 'Imam Mohammad Ibn Saud Islamic University')}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
            {event.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-white/50 text-sm flex-wrap">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{event.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{event.time}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{event.location}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="relative">
          {/* Glow behind QR when active */}
          {active && (
            <div className="absolute inset-0 rounded-3xl blur-3xl bg-secondary/30 scale-110" />
          )}
          <div className={`relative p-6 bg-white rounded-3xl shadow-2xl transition-all duration-500 ${
            active ? 'ring-4 ring-secondary/60' : 'opacity-40 grayscale'
          }`}>
            <QRCodeSVG
              value={qrPayload}
              size={280}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#1E2652"
            />
          </div>
          {!active && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/80 text-white font-black text-lg px-6 py-3 rounded-2xl text-center">
                {t('غير نشط', 'Inactive')}
                <p className="text-xs font-normal mt-1 text-white/60">
                  {t('فعّل الباركود للسماح بالدخول', 'Activate to allow entry')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center space-y-1">
          <p className="text-white/90 font-bold text-lg">
            {t('افتح التطبيق واضغط "مسح رمز QR للحضور"', 'Open the app and tap "Scan QR to Check In"')}
          </p>
          <p className="text-white/40 text-sm">
            {t(
              'افتح التطبيق → تفاصيل النشاط → مسح رمز QR للحضور',
              'Open app → Activity details → Scan QR to Check In'
            )}
          </p>
        </div>

        {/* Live counter */}
        <div className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl">
          <Users className="w-5 h-5 text-secondary" />
          <div>
            <p className="text-white font-black text-2xl tabular-nums">{checkinCount}</p>
            <p className="text-white/40 text-xs">{t('سجّلوا الحضور', 'Checked in')}</p>
          </div>
          <div className="w-px h-10 bg-white/10 mx-2" />
          <div>
            <p className="text-white/60 font-bold tabular-nums text-lg">{timeStr}</p>
            <p className="text-white/40 text-xs">{t('الوقت الحالي', 'Current time')}</p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/10 text-center">
        <p className="text-white/20 text-xs">
          Imamu TechVerse · {t('بوابة إدارة الأنشطة الجامعية', 'University Activity Management Platform')}
        </p>
      </div>
    </div>
  );
}
