import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { mockRegistrations, mockAttendanceData, mockUsersDB } from '../data/mockData';
import { getStoredEvents } from './AdminDashboard';
import {
  ScanLine, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Users,
  Camera, CameraOff, Search, Clock,
} from 'lucide-react';
import { LogoGroup } from './logo';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

// ─── Types ─────────────────────────────────────────────────────────────────────
type ScanResult =
  | { type: 'success'; studentName: string; studentId: string; college: string; eventTitle: string }
  | { type: 'already_checked_in'; studentName: string; checkinTime: string }
  | { type: 'wrong_event' }
  | { type: 'invalid' }
  | { type: 'cancelled' }
  | { type: 'not_found' };

interface RecentScan {
  studentName: string;
  studentId: string;
  time: string;
  success: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function parseQR(raw: string): { eventId: string; regId: string; userId: string } | null {
  const parts = raw.split(':');
  if (parts.length !== 4 || parts[0] !== 'IMAMU') return null;
  return { eventId: parts[1], regId: parts[2], userId: parts[3] };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function OrganizerScannerPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const events = getStoredEvents();
  const upcomingEvents = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing');

  const [selectedEventId, setSelectedEventId] = useState(upcomingEvents[0]?.id ?? '');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [manualId, setManualId] = useState('');
  const [registrations, setRegistrations] = useState(mockRegistrations);
  const [attendance, setAttendance] = useState(mockAttendanceData);
  const [cameraError, setCameraError] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const selectedEvent = events.find(e => e.id === selectedEventId);
  const checkedInCount = attendance.filter(a => a.eventId === selectedEventId && a.checkedIn).length;

  // ─── QR Scanner ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scanning) {
      scannerRef.current?.stop().catch(() => {});
      return;
    }

    const qr = new Html5Qrcode('qr-reader');
    scannerRef.current = qr;

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decoded) => {
        handleScan(decoded);
        qr.stop().catch(() => {});
        setScanning(false);
      },
      () => {} // ignore per-frame errors
    ).catch((err) => {
      setCameraError('تعذّر الوصول إلى الكاميرا. تأكد من منح الإذن.');
      setScanning(false);
      console.error(err);
    });

    return () => { qr.stop().catch(() => {}); };
  }, [scanning, selectedEventId]);

  // ─── Scan Logic ──────────────────────────────────────────────────────────────
  const handleScan = (raw: string) => {
    const parsed = parseQR(raw);
    if (!parsed) { setScanResult({ type: 'invalid' }); return; }

    const { eventId, regId } = parsed;

    if (eventId !== selectedEventId) { setScanResult({ type: 'wrong_event' }); return; }

    const reg = registrations.find(r => r.id === regId && r.eventId === eventId);
    if (!reg) { setScanResult({ type: 'not_found' }); return; }
    if (reg.status === 'cancelled') { setScanResult({ type: 'cancelled' }); return; }

    const visitorUser = mockUsersDB.find(u => u.id === reg.userId);
    const studentName = visitorUser?.name ?? 'زائر';
    const studentId   = visitorUser?.studentId ?? '—';
    const college     = visitorUser?.college ?? '—';

    // Already checked in?
    const existing = attendance.find(a => a.registrationId === regId && a.checkedIn);
    if (existing) {
      setScanResult({ type: 'already_checked_in', studentName, checkinTime: existing.checkinTime ?? '' });
      return;
    }

    // Mark check-in
    setRegistrations(prev =>
      prev.map(r => r.id === regId ? { ...r, checkedIn: true, status: 'attended' as const } : r)
    );
    setAttendance(prev => {
      const exists = prev.find(a => a.registrationId === regId);
      if (exists) return prev.map(a => a.registrationId === regId ? { ...a, checkedIn: true, checkinTime: new Date().toISOString() } : a);
      return [...prev, {
        registrationId: regId,
        userId: reg.userId,
        studentName,
        studentId,
        college,
        eventId: selectedEventId,
        status: 'attended' as const,
        checkedIn: true,
        checkedOut: false,
        feedbackSubmitted: false,
        checkinTime: new Date().toISOString(),
      }];
    });

    setScanResult({ type: 'success', studentName, studentId, college, eventTitle: selectedEvent?.title ?? '' });
    setRecentScans(prev => [{ studentName, studentId, time: new Date().toLocaleTimeString('ar-SA'), success: true }, ...prev.slice(0, 4)]);

    // Play success beep
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  };

  const handleManualCheck = () => {
    const reg = registrations.find(r => {
      const u = mockUsersDB.find(u => u.studentId === manualId || u.id === manualId);
      return u && r.userId === u.id && r.eventId === selectedEventId;
    });
    if (!reg) { setScanResult({ type: 'not_found' }); return; }
    const fakeQR = `IMAMU:${selectedEventId}:${reg.id}:${reg.userId}`;
    handleScan(fakeQR);
    setManualId('');
  };

  const resetResult = () => { setScanResult(null); setCameraError(''); };

  // ─── Result colours ───────────────────────────────────────────────────────────
  const resultStyle = () => {
    if (!scanResult) return '';
    if (scanResult.type === 'success')          return 'border-green-400 bg-green-50';
    if (scanResult.type === 'already_checked_in') return 'border-yellow-400 bg-yellow-50';
    return 'border-red-400 bg-red-50';
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-[#045D84] border-b-4 border-secondary sticky top-0 z-20 shadow-xl">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/admin')}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <LanguageToggle variant="light" />
            <span className="text-white font-bold text-sm hidden sm:block">{t('ماسح الحضور', 'Attendance Scanner')}</span>
            <LogoGroup uniSize="h-7" projSize="h-6" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full space-y-5">

        {/* Event selector */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <label className="block text-sm font-bold mb-2 text-foreground">الفعالية الحالية</label>
          <select
            value={selectedEventId}
            onChange={e => { setSelectedEventId(e.target.value); resetResult(); setScanning(false); }}
            className="w-full px-4 py-3 bg-muted border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary transition-all appearance-none"
          >
            {upcomingEvents.length === 0 && <option value="">لا توجد فعاليات نشطة</option>}
            {upcomingEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          {selectedEvent && (
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedEvent.date} · {selectedEvent.time}</span>
              <span className="flex items-center gap-1 font-bold text-primary">
                <Users className="w-3 h-3" />{checkedInCount} حضروا
              </span>
            </div>
          )}
        </div>

        {/* Camera / result area */}
        <div className={`bg-card border-2 rounded-3xl overflow-hidden shadow-md transition-all ${scanResult ? resultStyle() : 'border-border'}`}>

          {/* Scan result */}
          {scanResult && (
            <div className="p-6 text-center space-y-4">
              {scanResult.type === 'success' && (
                <>
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-black text-green-700">تم تسجيل الحضور ✓</h3>
                  <div className="bg-white/70 rounded-2xl p-4 text-right space-y-1">
                    <p className="font-bold text-foreground text-lg">{scanResult.studentName}</p>
                    <p className="text-sm text-muted-foreground">{scanResult.studentId} · {scanResult.college}</p>
                  </div>
                </>
              )}
              {scanResult.type === 'already_checked_in' && (
                <>
                  <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
                  <h3 className="text-xl font-black text-yellow-700">مسجّل مسبقاً</h3>
                  <p className="text-sm text-muted-foreground">{scanResult.studentName} — دخل في {new Date(scanResult.checkinTime).toLocaleTimeString('ar-SA')}</p>
                </>
              )}
              {scanResult.type === 'wrong_event' && (
                <>
                  <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                  <h3 className="text-xl font-black text-red-700">الكود لفعالية مختلفة</h3>
                  <p className="text-sm text-muted-foreground">هذه التذكرة لا تنتمي للفعالية المحددة</p>
                </>
              )}
              {scanResult.type === 'cancelled' && (
                <>
                  <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                  <h3 className="text-xl font-black text-red-700">التسجيل ملغى</h3>
                  <p className="text-sm text-muted-foreground">قام هذا الزائر بإلغاء تسجيله</p>
                </>
              )}
              {(scanResult.type === 'invalid' || scanResult.type === 'not_found') && (
                <>
                  <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                  <h3 className="text-xl font-black text-red-700">
                    {scanResult.type === 'invalid' ? 'رمز QR غير صالح' : 'لا يوجد تسجيل مطابق'}
                  </h3>
                  <p className="text-sm text-muted-foreground">تحقق من الكود أو البحث اليدوي</p>
                </>
              )}
              <button
                onClick={() => { resetResult(); setScanning(true); }}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <ScanLine className="w-5 h-5" />
                مسح الكود التالي
              </button>
            </div>
          )}

          {/* Camera view */}
          {!scanResult && (
            <div className="relative">
              <div id="qr-reader" className={scanning ? 'w-full' : 'hidden'} />

              {!scanning && (
                <div className="p-8 flex flex-col items-center gap-5">
                  {cameraError ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <CameraOff className="w-16 h-16 text-muted-foreground" />
                      <p className="text-sm text-destructive font-medium">{cameraError}</p>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center">
                      <ScanLine className="w-12 h-12 text-primary" />
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="font-bold text-foreground mb-1">ماسح رمز QR</h3>
                    <p className="text-sm text-muted-foreground">وجّه الكاميرا نحو تذكرة الزائر</p>
                  </div>
                  <button
                    onClick={() => { if (!selectedEventId) return; setCameraError(''); setScanning(true); }}
                    disabled={!selectedEventId}
                    className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5" />
                    تشغيل الكاميرا
                  </button>
                </div>
              )}

              {scanning && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <button
                    onClick={() => setScanning(false)}
                    className="px-5 py-2 bg-black/60 text-white text-sm font-bold rounded-xl backdrop-blur"
                  >
                    إيقاف المسح
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual entry */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-bold mb-2 text-foreground">
            <Search className="w-4 h-4" />
            بحث يدوي برقم الهوية
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualId}
              onChange={e => setManualId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualCheck()}
              placeholder="أدخل رقم الهوية الجامعية..."
              className="flex-1 px-4 py-3 bg-muted border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary transition-all"
            />
            <button
              onClick={handleManualCheck}
              disabled={!manualId.trim()}
              className="px-5 py-3 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-all disabled:opacity-50"
            >
              تحقق
            </button>
          </div>
        </div>

        {/* Recent scans */}
        {recentScans.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-border">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                آخر عمليات المسح
              </h4>
            </div>
            <div className="divide-y divide-border">
              {recentScans.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.success ? 'bg-green-100' : 'bg-red-100'}`}>
                      {s.success
                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                        : <XCircle className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{s.studentName}</p>
                      <p className="text-xs text-muted-foreground">{s.studentId}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
