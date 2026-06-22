import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  MapPin, X, CheckCircle, AlertTriangle, Loader2, RefreshCw,
  UserX, Camera, CameraOff, ScanLine,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { parseEventQR, isEventQRActive, getEventQRPayload } from '../services/eventQRService';

type Step = 'camera' | 'scanning' | 'verifying_location' | 'success' | 'qr_inactive' | 'wrong_event' | 'location_error';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onAcceptAbsent: () => void;
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  isQRActive: boolean;
  eventDate: string;
  eventTime: string;
  eventStatus: string;
  eventLat?: number;
  eventLng?: number;
}

const CHECKIN_RADIUS_METERS = 500;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function CheckInModal({
  isOpen, onClose, onSuccess, onAcceptAbsent,
  eventId, eventTitle, eventLocation, isQRActive,
  eventDate, eventTime, eventStatus,
  eventLat, eventLng,
}: CheckInModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('camera');
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      scannerRef.current?.stop().catch(() => {});
      setStep('camera');
      setCameraError('');
    }
  }, [isOpen]);

  // Unmount cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  if (!isOpen) return null;

  const startCamera = () => {
    setCameraError('');
    setStep('scanning');

    const qr = new Html5Qrcode('checkin-qr-reader');
    scannerRef.current = qr;

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decoded) => {
        qr.stop().catch(() => {});
        handleScanned(decoded);
      },
      () => {}
    ).catch(() => {
      if (mountedRef.current) {
        setCameraError(t('تعذّر الوصول للكاميرا. تأكد من منح الإذن.', 'Camera access denied. Please grant permission.'));
        setStep('camera');
      }
    });
  };

  const stopCamera = () => {
    scannerRef.current?.stop().catch(() => {});
    setStep('camera');
  };

  const handleScanned = (raw: string) => {
    const scannedEventId = parseEventQR(raw);

    if (!scannedEventId) {
      // Not an Imamu event QR at all
      setStep('wrong_event');
      return;
    }

    if (scannedEventId !== eventId) {
      setStep('wrong_event');
      return;
    }

    // Check activation
    const active = isEventQRActive({ id: eventId, status: eventStatus, date: eventDate, time: eventTime });
    if (!active) {
      setStep('qr_inactive');
      return;
    }

    // QR valid → verify location
    setStep('verifying_location');
    verifyLocation();
  };

  const verifyLocation = () => {
    if (!navigator.geolocation) { setStep('location_error'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // If the organizer hasn't set coordinates, skip distance check
        if (eventLat == null || eventLng == null) {
          setStep('success');
          return;
        }
        const dist = haversineDistance(
          pos.coords.latitude, pos.coords.longitude,
          eventLat, eventLng
        );
        setStep(dist <= CHECKIN_RADIUS_METERS ? 'success' : 'location_error');
      },
      () => setStep('location_error'),
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSuccess = () => { onSuccess(); onClose(); };
  const handleAcceptAbsent = () => { onAcceptAbsent(); onClose(); };
  const handleRetry = () => { setCameraError(''); setStep('camera'); };

  /* ─── Gradient per step ─────────────────────────────────────────────── */
  const headerBg =
    step === 'success'           ? 'linear-gradient(135deg,#16a34a,#15803d)' :
    step === 'location_error' ||
    step === 'wrong_event' ||
    step === 'qr_inactive'       ? 'linear-gradient(135deg,#dc2626,#b91c1c)' :
                                   'linear-gradient(135deg,#1E2652,#5C2D91)';

  const stepTitle = {
    camera:            t('مسح رمز QR للحضور', 'Scan QR to Check In'),
    scanning:          t('جارٍ المسح...', 'Scanning...'),
    verifying_location:t('التحقق من الموقع...', 'Verifying location...'),
    success:           t('تم تأكيد الحضور!', 'Check-In Confirmed!'),
    qr_inactive:       t('الباركود غير نشط', 'QR Not Active'),
    wrong_event:       t('رمز غير صالح', 'Invalid QR Code'),
    location_error:    t('خطأ في التحقق من الموقع', 'Location Verification Failed'),
  }[step];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-card rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="px-6 pt-7 pb-5 text-center relative" style={{ background: headerBg }}>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="absolute top-4 left-4 w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex justify-center mb-3">
            {(step === 'camera' || step === 'scanning') && (
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                {step === 'scanning'
                  ? <ScanLine className="w-9 h-9 text-white animate-pulse" />
                  : <Camera className="w-9 h-9 text-white" />}
              </div>
            )}
            {step === 'verifying_location' && (
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <MapPin className="w-9 h-9 text-white animate-pulse" />
              </div>
            )}
            {step === 'success' && (
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            )}
            {(step === 'location_error' || step === 'wrong_event' || step === 'qr_inactive') && (
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            )}
          </div>

          <h3 className="text-white font-black text-lg mb-1">{stepTitle}</h3>
          <p className="text-white/75 text-sm">{eventTitle}</p>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* ── Camera / Scan step ── */}
          {(step === 'camera' || step === 'scanning') && (
            <div className="space-y-4">
              {/* Camera viewfinder */}
              <div className="relative rounded-2xl overflow-hidden bg-black min-h-[220px] flex items-center justify-center">
                <div id="checkin-qr-reader" className={step === 'scanning' ? 'w-full' : 'hidden'} />
                {step === 'camera' && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    {cameraError
                      ? <><CameraOff className="w-10 h-10 text-red-400" /><p className="text-red-400 text-xs text-center px-4">{cameraError}</p></>
                      : <><Camera className="w-10 h-10 text-white/40" /><p className="text-white/40 text-sm">{t('اضغط لتشغيل الكاميرا', 'Tap to start camera')}</p></>
                    }
                  </div>
                )}
                {/* Corner guides when scanning */}
                {step === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                      <div key={i} className={`absolute ${pos} w-6 h-6 border-2 border-white opacity-70 ${i < 2 ? 'border-b-0' : 'border-t-0'} ${i % 2 === 0 ? 'border-r-0' : 'border-l-0'}`} />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-2xl p-3 border border-border text-xs text-muted-foreground flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>{t('الموقع', 'Location')}: {eventLocation}</span>
              </div>

              {step === 'camera' ? (
                <div className="space-y-2">
                  <button
                    onClick={startCamera}
                    className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    {t('تشغيل الكاميرا ومسح الباركود', 'Open Camera & Scan')}
                  </button>
                  <button
                    onClick={() => handleScanned(getEventQRPayload(eventId))}
                    className="w-full py-2.5 bg-muted border border-border text-muted-foreground font-bold rounded-xl hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <ScanLine className="w-4 h-4" />
                    {t('محاكاة المسح — للعرض فقط', 'Simulate Scan — Demo Only')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={stopCamera}
                  className="w-full py-3 bg-muted border border-border text-muted-foreground font-bold rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all text-sm"
                >
                  {t('إلغاء', 'Cancel')}
                </button>
              )}
            </div>
          )}

          {/* ── Verifying location ── */}
          {step === 'verifying_location' && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <p className="font-bold text-foreground">
                {t('جارٍ التحقق من موقعك الجغرافي', 'Verifying your location...')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('نتأكد من أنك داخل نطاق النشاط', 'Confirming you are within the activity area')}
              </p>
              <div className="flex justify-center gap-1 mt-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Success ── */}
          {step === 'success' && (
            <div className="text-center space-y-5">
              <div>
                <p className="font-bold text-foreground text-lg mb-2">
                  {t('تم التحقق من الموقع بنجاح ✅', 'Location verified ✅')}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(
                    'تم تسجيل حضورك. لا تنسَ تسجيل المغادرة عند انتهاء النشاط.',
                    'Your attendance is recorded. Remember to check out when the activity ends.'
                  )}
                </p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm font-bold text-green-700">{eventLocation}</p>
              </div>
              <button
                onClick={handleSuccess}
                className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md"
              >
                {t('رائع، شكراً!', 'Great, thanks!')}
              </button>
            </div>
          )}

          {/* ── QR Inactive ── */}
          {step === 'qr_inactive' && (
            <div className="text-center space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="font-bold text-amber-700 mb-1">
                  {t('الباركود غير مفعّل حالياً', 'QR code is not active yet')}
                </p>
                <p className="text-xs text-amber-600">
                  {t(
                    'يُفعَّل الباركود تلقائياً خلال وقت النشاط، أو عند تفعيل المنظّم له.',
                    'The QR activates automatically during event time, or when the organizer enables it.'
                  )}
                </p>
              </div>
              <button onClick={handleRetry} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {t('حاول مجدداً', 'Try Again')}
              </button>
            </div>
          )}

          {/* ── Wrong event QR ── */}
          {step === 'wrong_event' && (
            <div className="text-center space-y-5">
              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
                <p className="font-bold text-destructive mb-1">
                  {t('الرمز لا ينتمي لهذا النشاط', 'This QR does not belong to this activity')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'تأكد من مسح الباركود الصحيح المعروض في مدخل هذا النشاط.',
                    'Make sure you scan the correct QR displayed at this activity\'s entrance.'
                  )}
                </p>
              </div>
              <button onClick={handleRetry} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {t('مسح مجدداً', 'Scan Again')}
              </button>
            </div>
          )}

          {/* ── Location error ── */}
          {step === 'location_error' && (
            <div className="text-center space-y-5">
              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
                <p className="font-bold text-destructive mb-1">
                  "You must be at the event location to check-in."
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    `يجب أن تكون داخل نطاق النشاط (${eventLocation}) لتأكيد الحضور.`,
                    `You must be within the activity area (${eventLocation}) to confirm attendance.`
                  )}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('هل تريد إعادة المحاولة أو قبول تسجيلك كـ "غائب"؟', 'Retry or accept being marked absent?')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRetry}
                  className="flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('إعادة المحاولة', 'Retry')}
                </button>
                <button
                  onClick={handleAcceptAbsent}
                  className="flex items-center justify-center gap-2 py-3 bg-muted text-muted-foreground border border-border font-bold rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all text-sm"
                >
                  <UserX className="w-4 h-4" />
                  {t('قبول "غائب"', 'Accept Absent')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
