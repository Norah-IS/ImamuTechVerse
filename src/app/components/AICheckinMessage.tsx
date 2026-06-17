import { useEffect, useState } from 'react';
import { CheckCircle, Sparkles, X, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getCheckinMessage } from '../services/aiService';
import { mockEvents } from '../data/mockData';
import type { Event, User } from '../data/mockData';
import type { ActivityRecord } from '../services/activityService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  attendedEvent: Event;
  user: User;
  activityRecord: ActivityRecord | null;
}

function buildFallback(eventTitle: string, userName: string): string {
  const firstName = userName.split(' ')[0];
  return `أحسنت ${firstName}! تسجيل حضورك في "${eventTitle}" خطوة رائعة نحو تطوير مسيرتك الأكاديمية. استمر في المشاركة الفعّالة وبناء سجلك الجامعي!`;
}

export function AICheckinMessage({ isOpen, onClose, attendedEvent, user, activityRecord }: Props) {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setMessage('');

    const profileContext = {
      name: user.name,
      college: user.college,
      interests: user.interests,
      totalHours: activityRecord?.totalHours ?? 0,
      activitiesAttended: activityRecord?.entries?.length ?? 0,
    };

    const eventContext = {
      title: attendedEvent.title,
      category: attendedEvent.category,
      activityType: attendedEvent.activityType,
      organizer: attendedEvent.organizer,
    };

    const upcoming = mockEvents
      .filter((e) => e.status === 'upcoming' && e.id !== attendedEvent.id)
      .slice(0, 3)
      .map((e) => ({ title: e.title, category: e.category, date: e.date, activityType: e.activityType }));

    getCheckinMessage(profileContext, eventContext, upcoming)
      .then((result) => {
        setMessage(result);
        setLoading(false);
      })
      .catch(() => {
        setMessage(buildFallback(attendedEvent.title, user.name));
        setLoading(false);
      });
  }, [isOpen, attendedEvent.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0D1130] to-[#045D84] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 border border-green-400/30 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">
                {t('تم تسجيل حضورك!', 'Check-in Successful!')}
              </h2>
              <p className="text-white/60 text-xs mt-0.5 line-clamp-1">{attendedEvent.title}</p>
            </div>
          </div>
        </div>

        {/* AI Message */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#00ADEF]" />
            <span className="text-xs font-bold text-[#00ADEF] tracking-wide">
              {t('رسالة شخصية', 'Personal Message')}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-full" />
              <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-11/12" />
              <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-4/5" />
              <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-3/5" />
            </div>
          ) : (
            <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full bg-[#0D1130] hover:bg-[#045D84] text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {t('متابعة', 'Continue')}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}