import { useEffect, useState } from 'react';
import { CheckCircle, Mail, X, Calendar, MapPin, Clock, Hash } from 'lucide-react';
import { Logo } from './logo';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'registration' | 'waitlist';
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  registrationId?: string;
  waitlistPosition?: number;
}

export function EmailConfirmationModal({
  isOpen,
  onClose,
  type,
  recipientEmail,
  recipientName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  registrationId,
  waitlistPosition,
}: EmailConfirmationModalProps) {
  const [step, setStep] = useState<'sending' | 'sent'>('sending');

  useEffect(() => {
    if (isOpen) {
      setStep('sending');
      const timer = setTimeout(() => setStep('sent'), 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isRegistration = type === 'registration';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div
          className="px-6 pt-8 pb-6 text-center relative"
          style={{ background: isRegistration ? 'linear-gradient(135deg, #1E2652, #5C2D91)' : 'linear-gradient(135deg, #d97706, #ea580c)' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {step === 'sending' ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 relative">
                <Mail className="w-8 h-8 text-white animate-bounce" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                </div>
              </div>
              <p className="text-white font-bold text-lg">جاري إرسال البريد...</p>
              <div className="flex gap-1 mt-3">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  ></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <CheckCircle className="w-9 h-9" style={{ color: isRegistration ? '#1E2652' : '#ea580c' }} />
              </div>
              <h3 className="text-white font-black text-xl mb-1">
                {isRegistration ? 'تم التسجيل بنجاح!' : 'تم الإضافة للانتظار!'}
              </h3>
              <p className="text-white/80 text-sm">
                تم إرسال بريد التأكيد إلى بريدك الإلكتروني
              </p>
            </div>
          )}
        </div>

        {/* Email Preview */}
        {step === 'sent' && (
          <div className="p-6">
            {/* To address */}
            <div className="flex items-center gap-3 p-3 bg-muted/60 rounded-xl mb-4 border border-border">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">إلى</p>
                <p className="text-sm font-bold text-foreground truncate">{recipientEmail}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg font-bold border border-green-200 shrink-0">تم الإرسال</span>
            </div>

            {/* Email Content Preview */}
            <div className="bg-muted/30 rounded-2xl border border-border/60 overflow-hidden">
              {/* Email Subject Bar */}
              <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <p className="text-xs font-bold text-foreground">
                  {isRegistration
                    ? `✅ تأكيد تسجيلك في: ${eventTitle}`
                    : `⏳ تم إضافتك لقائمة الانتظار: ${eventTitle}`}
                </p>
              </div>
              {/* Email Body */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-foreground font-medium">عزيزي {recipientName}،</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRegistration
                    ? 'يسعدنا إعلامك بأنه تم تأكيد تسجيلك في النشاط التالي:'
                    : 'تمت إضافتك لقائمة الانتظار، وسيتم إرسال إشعار فوري عند توفر مقعد:'}
                </p>
                <div className="bg-card rounded-xl p-3 border border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{eventDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span className="text-foreground font-medium">{eventTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#00ADEF' }} />
                    <span className="text-foreground font-medium">{eventLocation}</span>
                  </div>
                  {registrationId && (
                    <div className="flex items-center gap-2 text-xs">
                      <Hash className="w-3.5 h-3.5 shrink-0" style={{ color: '#8C61AF' }} />
                      <span className="text-foreground font-medium">رقم التسجيل: {registrationId}</span>
                    </div>
                  )}
                  {waitlistPosition && (
                    <div className="flex items-center gap-2 text-xs">
                      <Hash className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="text-foreground font-medium">ترتيبك في القائمة: #{waitlistPosition}</span>
                    </div>
                  )}
                </div>
                {/* Footer */}
                <div className="flex items-center gap-2 pt-1">
                  <Logo variant="university" className="h-5 w-auto" />
                  <Logo variant="project" className="h-4 w-auto opacity-70" />
                  <p className="text-xs text-muted-foreground">فريق Imamu TechVerse – جامعة الإمام</p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-5 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              حسنًا، شكرًا!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
