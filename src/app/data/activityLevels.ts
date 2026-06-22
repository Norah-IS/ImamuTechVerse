import { ActivityType } from './mockData';

export interface ActivityLevel {
  index: number;
  minHours: number;
  titleAr: string;
  titleEn: string;
}

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  {
    index: 0,
    minHours: 0,
    titleAr: 'طالب مشارك',
    titleEn: 'Participant',
  },
  {
    index: 1,
    minHours: 5,
    titleAr: 'طالب نشِط',
    titleEn: 'Active Participant',
  },
  {
    index: 2,
    minHours: 15,
    titleAr: 'طالب متميّز في المشاركة المجتمعية',
    titleEn: 'Distinguished in Community Engagement',
  },
  {
    index: 3,
    minHours: 30,
    titleAr: 'سفير الحياة الجامعية',
    titleEn: 'Campus Life Ambassador',
  },
];

export const HOURS_BY_TYPE: Record<ActivityType, number> = {
  'دورة تدريبية':   6,
  'يوم تطوعي':      5,
  'مسابقة':          4,
  'ورشة عمل':       3,
  'محاضرة':          2,
  'ندوة':            2,
  'معرض':            2,
  'نشاط ترفيهي': 1.5,
};

export function getLevelForHours(hours: number): ActivityLevel {
  let level = ACTIVITY_LEVELS[0];
  for (const l of ACTIVITY_LEVELS) {
    if (hours >= l.minHours) level = l;
  }
  return level;
}

export function getNextLevel(current: ActivityLevel): ActivityLevel | null {
  return ACTIVITY_LEVELS[current.index + 1] ?? null;
}
