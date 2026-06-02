import { AttendanceEntry } from '../data/mockData';
import { sendCertificateEmail } from './emailService';

const ISSUED_CERTS_KEY = 'imamu_issued_certs';

export function getIssuedCerts(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(ISSUED_CERTS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function markCertIssued(registrationId: string): void {
  const certs = getIssuedCerts();
  certs[registrationId] = true;
  localStorage.setItem(ISSUED_CERTS_KEY, JSON.stringify(certs));
}

/**
 * Automatically issues certificates to all students who checked in to a completed event.
 * Called when an event's status is changed to 'completed' by the admin.
 * Skips students whose certificates were already issued.
 */
export function autoIssueCertificatesForEvent(
  event: { id: string; title: string; date: string },
  attendanceData: AttendanceEntry[]
): { issuedCount: number; studentNames: string[] } {
  const issuedCerts = getIssuedCerts();
  const studentNames: string[] = [];

  const attendees = attendanceData.filter(
    (a) => a.eventId === event.id && a.checkedIn
  );

  for (const entry of attendees) {
    if (issuedCerts[entry.registrationId]) continue;

    sendCertificateEmail({
      recipientName: entry.studentName,
      recipientEmail: `${entry.studentId}@imamu.edu.sa`,
      eventTitle: event.title,
      eventDate: event.date,
      userId: entry.userId,
    });

    markCertIssued(entry.registrationId);
    studentNames.push(entry.studentName);
  }

  return { issuedCount: studentNames.length, studentNames };
}
