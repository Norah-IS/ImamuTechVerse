// ─── Absence Tracking Service ────────────────────────────────────────────────
// Req 40-41: 3 absences = auto-block for 1 month + send notification

import {
  blockUser,
  sendBlockNotification,
  sendAbsenceWarningEmail,
  isUserBlocked,
} from './emailService';

const ABSENCE_KEY = 'imamu_absences';
export const AUTO_BLOCK_THRESHOLD = 3;

export interface AbsenceRecord {
  userId: string;
  count: number;
  lastUpdated: string;
}

export function getAbsenceCounts(): Record<string, AbsenceRecord> {
  try {
    return JSON.parse(localStorage.getItem(ABSENCE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getAbsenceCount(userId: string): number {
  return getAbsenceCounts()[userId]?.count || 0;
}

export function shouldAutoBlock(userId: string): boolean {
  return getAbsenceCount(userId) >= AUTO_BLOCK_THRESHOLD;
}

export function resetAbsences(userId: string): void {
  const counts = getAbsenceCounts();
  delete counts[userId];
  localStorage.setItem(ABSENCE_KEY, JSON.stringify(counts));
}

/**
 * Records an absence for a user.
 * Automatically:
 *  - Sends a warning email if 1 or 2 absences
 *  - Blocks the user + sends block notification if 3+ absences (Req 40-41)
 * Returns { record, wasBlocked }
 */
export function recordAbsenceWithNotification(
  userId: string,
  params: {
    studentName: string;
    studentEmail: string;
    studentId: string;
    eventTitle: string;
  }
): { record: AbsenceRecord; wasBlocked: boolean } {
  const counts = getAbsenceCounts();
  const now = new Date().toISOString();
  const existing = counts[userId] || { userId, count: 0, lastUpdated: now };
  const newCount = existing.count + 1;
  const updated: AbsenceRecord = { userId, count: newCount, lastUpdated: now };
  counts[userId] = updated;
  localStorage.setItem(ABSENCE_KEY, JSON.stringify(counts));

  let wasBlocked = false;

  if (newCount >= AUTO_BLOCK_THRESHOLD && !isUserBlocked(userId)) {
    // Auto-block for 1 month (Req 40)
    const blockedAt = new Date();
    const blockedUntil = new Date(blockedAt);
    blockedUntil.setMonth(blockedUntil.getMonth() + 1);

    const reason = `تجاوز حد الغيابات المسموح به: ${newCount} غيابات غير مبررة`;

    blockUser({
      userId,
      name: params.studentName,
      email: params.studentEmail,
      studentId: params.studentId,
      reason,
      blockedAt: blockedAt.toISOString(),
      blockedUntil: blockedUntil.toISOString(),
      blockedBy: 'النظام التلقائي',
    });

    // Send block notification email + in-app (Req 41)
    sendBlockNotification({
      recipientName: params.studentName,
      recipientEmail: params.studentEmail,
      userId,
      absenceCount: newCount,
      blockedUntil: blockedUntil.toISOString(),
      reason,
    });

    wasBlocked = true;
  } else if (newCount < AUTO_BLOCK_THRESHOLD) {
    // Send absence warning email (Req 41 — warning before block)
    sendAbsenceWarningEmail({
      recipientName: params.studentName,
      recipientEmail: params.studentEmail,
      userId,
      absenceCount: newCount,
      eventTitle: params.eventTitle,
    });
  }

  return { record: updated, wasBlocked };
}

/** Legacy simple recorder (kept for compatibility) */
export function recordAbsence(userId: string): AbsenceRecord {
  const counts = getAbsenceCounts();
  const now = new Date().toISOString();
  const existing = counts[userId] || { userId, count: 0, lastUpdated: now };
  const updated: AbsenceRecord = { userId, count: existing.count + 1, lastUpdated: now };
  counts[userId] = updated;
  localStorage.setItem(ABSENCE_KEY, JSON.stringify(counts));
  return updated;
}
