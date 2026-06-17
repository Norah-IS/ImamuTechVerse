import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getEventRelevance } from '../services/aiService';
import type { Event, User } from '../data/mockData';
import type { ActivityRecord } from '../services/activityService';

interface Props {
  event: Event;
  user: User;
  activityRecord: ActivityRecord | null;
  registeredCount: number;
}

function buildFallback(event: Event, user: User): string {
  if (user.interests.includes(event.category)) {
    return `بما أن اهتماماتك تشمل ${event.category}، فإن هذا النشاط فرصة مثالية لتعزيز مهاراتك وبناء شبكة علاقاتك الأكاديمية في هذا المجال.`;
  }
  return `يُتيح لك هذا النشاط اكتساب خبرات جديدة وتوسيع مداركك الأكاديمية والمهنية في بيئة جامعية داعمة ومحفّزة.`;
}

export function AIEventRelevance({ event, user, activityRecord, registeredCount }: Props) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setText('');

    const eventContext = {
      title: event.title,
      category: event.category,
      activityType: event.activityType,
      description: event.description,
      college: event.college,
      organizer: event.organizer,
    };

    const profileContext = {
      name: user.name,
      college: user.college,
      interests: user.interests,
      totalHours: activityRecord?.totalHours ?? 0,
      activitiesAttended: activityRecord?.entries?.length ?? 0,
      alreadyRegistered: registeredCount > 0,
    };

    getEventRelevance(eventContext, profileContext)
      .then((result) => {
        if (!cancelled) {
          setText(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setText(buildFallback(event, user));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [event.id]);

  return (
    <div className="bg-gradient-to-br from-[#00ADEF]/5 to-[#0D1130]/5 border border-[#00ADEF]/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-[#00ADEF]/10 rounded-lg flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#00ADEF]" />
        </div>
        <h3 className="text-sm font-bold text-[#0D1130]">
          {t('لماذا هذا النشاط مناسب لك؟', 'Why this event is for you?')}
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-3 bg-[#00ADEF]/10 rounded-full animate-pulse w-full" />
          <div className="h-3 bg-[#00ADEF]/10 rounded-full animate-pulse w-4/5" />
          <div className="h-3 bg-[#00ADEF]/10 rounded-full animate-pulse w-3/5" />
        </div>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
      )}
    </div>
  );
}