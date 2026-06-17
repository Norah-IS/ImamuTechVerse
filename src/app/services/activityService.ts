import { ActivityType } from '../data/mockData';
import { HOURS_BY_TYPE, getLevelForHours } from '../data/activityLevels';

const STORAGE_KEY = 'imamu_activity_records';

export interface ActivityEntry {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  activityType: ActivityType;
  hours: number;
  recordedAt: string;
}

export interface ActivityRecord {
  userId: string;
  totalHours: number;
  levelIndex: number;
  entries: ActivityEntry[];
}

function getAllRecords(): Record<string, ActivityRecord> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getActivityRecord(userId: string): ActivityRecord {
  return getAllRecords()[userId] ?? {
    userId,
    totalHours: 0,
    levelIndex: 0,
    entries: [],
  };
}

export interface RecordActivityResult {
  record: ActivityRecord;
  previousLevelIndex: number;
  levelChanged: boolean;
}

export function recordActivity(
  userId: string,
  params: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    activityType: ActivityType;
  }
): RecordActivityResult {
  const all = getAllRecords();
  const existing: ActivityRecord = all[userId] ?? {
    userId,
    totalHours: 0,
    levelIndex: 0,
    entries: [],
  };

  // Idempotent — ignore duplicate check-ins for the same event
  if (existing.entries.some(e => e.eventId === params.eventId)) {
    return { record: existing, previousLevelIndex: existing.levelIndex, levelChanged: false };
  }

  const hours = HOURS_BY_TYPE[params.activityType] ?? 2;
  const newTotal = existing.totalHours + hours;
  const newLevel = getLevelForHours(newTotal);
  const previousLevelIndex = existing.levelIndex;

  const entry: ActivityEntry = {
    ...params,
    hours,
    recordedAt: new Date().toISOString(),
  };

  const updated: ActivityRecord = {
    userId,
    totalHours: newTotal,
    levelIndex: newLevel.index,
    entries: [entry, ...existing.entries],
  };

  all[userId] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  return {
    record: updated,
    previousLevelIndex,
    levelChanged: newLevel.index > previousLevelIndex,
  };
}
