// Req 24-27: Check-in with QR scan simulation + geographical verification
import { useState } from 'react';
import { MapPin, QrCode, X, CheckCircle, AlertTriangle, Loader2, RefreshCw, UserX } from 'lucide-react';

type CheckInStep = 'scan' | 'verifying' | 'success' | 'location_error';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onAcceptAbsent: () => void;   // Req 27: accept being marked absent
  eventTitle: string;
  eventLocation: string;
}

export function CheckInModal({
  isOpen,
  onClose,
  onSuccess,
  onAcceptAbsent,
  eventTitle,
  eventLocation,
}: CheckInModalProps) {
  const [step, setStep] = useState<CheckInStep>('scan');
  const [scanning, setScanning] = useState(false);

  if (!isOpen) return null;

  // Req 24: Simulate QR code scan
  const handleScanQR = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setStep('verifying');
      verifyLocation();
    }, 1800);
  };

  // Req 25: Verify geographical location
  const verifyLocation = () => {
    if (!navigator.geolocation) {
      setStep('location_error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // In a real app: compare coords with event coords
        // For demo: 80% chance of success to showcase both flows
        const lat = position.coords.latitude;
        const isOnCampus = lat > 0; // simplified — always succeeds if permission granted
        if (isOnCampus) {
          setStep('success');
        } else {
          setStep('location_error');
        }
      },
      () => {
        // Req 26: location permission denied → show error
        setStep('location_error');
      },
      { timeout: 8000 }
    );
  };

  // Req 27: Retry check-in
  const handleRetry = () => {
    setStep('scan');
    setScanning(false);
  };

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleAcceptAbsent = () => {
    onAcceptAbsent();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-card rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div
          className="px-6 pt-7 pb-5 text-center relative"
          style={{
            background:
              step === 'success'
                ? 'linear-gradient(135deg, #16a34a, #15803d)'
                : step === 'location_error'
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                : 'linear-gradient(135deg, #1E2652, #5C2D91)',
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon per step */}
          <div className="flex justify-center mb-3">
            {step === 'scan' && (
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <QrCode className="w-9 h-9 text-white" />
              </div>
            )}
            {step === 'verifying' && (
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <MapPin className="w-9 h-9 text-white animate-pulse" />
              </div>
            )}
            {step === 'success' && (
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            )}
            {step === 'location_error' && (
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            )}
          </div>

          <h3 className="text-white font-black text-lg mb-1">
            {step === 'scan' && 'تأكيد الحضور'}
            {step === 'verifying' && 'التحقق من الموقع...'}
            {step === 'success' && 'تم تأكيد الحضور!'}
            {step === 'location_error' && 'خطأ في التحقق من الموقع'}
          </h3>
          <p className="text-white/75 text-sm">{eventTitle}</p>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Step: Scan QR */}
          {step === 'scan' && (
            <div className="text-center space-y-5">
              {/* Mock QR code display area */}
              <div className="w-40 h-40 mx-auto bg-muted rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
                {scanning ? (
                  <>
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-xs text-muted-foreground font-medium">جاري المسح...</p>
                  </>
                ) : (
                  <>
                    {/* Simple QR-like visual */}
                    <div className="grid grid-cols-5 gap-0.5">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-sm"
                          style={{
                            backgroundColor: Math.random() > 0.4 ? '#1E2652' : '#F8F9FA',
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">امسح رمز QR الخاص بالفعالية</p>
                  </>
                )}
              </div>
              <div className="text-right bg-muted/50 rounded-2xl p-4 border border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  الموقع: {eventLocation}
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                اضغط على الزر أدناه لمحاكاة مسح رمز QR الموجود عند مدخل الفعالية. سيتم التحقق من موقعك تلقائياً.
              </p>
              <button
                onClick={handleScanQR}
                disabled={scanning}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {scanning ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> جاري المسح...</>
                ) : (
                  <><QrCode className="w-5 h-5" /> مسح رمز QR</>
                )}
              </button>
            </div>
          )}

          {/* Step: Verifying location */}
          {step === 'verifying' && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground mb-1">جاري التحقق من موقعك الجغرافي</p>
                <p className="text-sm text-muted-foreground">نتأكد من أنك داخل نطاق الفعالية...</p>
              </div>
              <div className="flex justify-center gap-1 mt-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center space-y-5">
              <div>
                <p className="font-bold text-foreground text-lg mb-2">تم التحقق من الموقع بنجاح ✅</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  تم تسجيل حضورك في الفعالية. لا تنسَ تسجيل المغادرة عند انتهاء الفعالية.
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
                رائع، شكراً!
              </button>
            </div>
          )}

          {/* Step: Location error — Req 26-27 */}
          {step === 'location_error' && (
            <div className="text-center space-y-5">
              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
                {/* Req 26: exact error message */}
                <p className="font-bold text-destructive mb-1">
                  "You must be at the event location to check-in."
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  يجب أن تكون داخل نطاق الفعالية ({eventLocation}) لتأكيد الحضور.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                هل تريد إعادة المحاولة أو قبول تسجيلك كـ "غائب"؟
              </p>
              {/* Req 27: retry or accept absent */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRetry}
                  className="flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة المحاولة
                </button>
                <button
                  onClick={handleAcceptAbsent}
                  className="flex items-center justify-center gap-2 py-3 bg-muted text-muted-foreground border border-border font-bold rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all text-sm"
                >
                  <UserX className="w-4 h-4" />
                  قبول "غائب"
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
