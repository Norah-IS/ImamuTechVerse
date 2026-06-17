const ACTIVE_EVENTS_KEY = 'imamu_qr_active_events';

/** Canonical QR payload for an event. */
export function getEventQRPayload(eventId: string): string {
  return `IMAMU-EVENT:${eventId}`;
}

/** Returns the eventId if raw is a valid event QR, otherwise null. */
export function parseEventQR(raw: string): string | null {
  const prefix = 'IMAMU-EVENT:';
  if (!raw.startsWith(prefix)) return null;
  const eventId = raw.slice(prefix.length).trim();
  return eventId || null;
}

// ─── Manual activation ─────────────────────────────────────────────────────────

function getManuallyActive(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(ACTIVE_EVENTS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function activateEventQR(eventId: string): void {
  const s = getManuallyActive();
  s.add(eventId);
  localStorage.setItem(ACTIVE_EVENTS_KEY, JSON.stringify([...s]));
}

export function deactivateEventQR(eventId: string): void {
  const s = getManuallyActive();
  s.delete(eventId);
  localStorage.setItem(ACTIVE_EVENTS_KEY, JSON.stringify([...s]));
}

export function isManuallyActivated(eventId: string): boolean {
  return getManuallyActive().has(eventId);
}

// ─── Composite active check ────────────────────────────────────────────────────

export function isEventQRActive(event: {
  id: string;
  status: string;
  date: string;
  time: string;
}): boolean {
  if (isManuallyActivated(event.id)) return true;
  if (event.status === 'ongoing') return true;

  // Auto-activate if today's date is within the event's time window
  const today = new Date().toISOString().split('T')[0];
  if (event.date === today) {
    const parts = event.time.split('-').map((s) => s.trim());
    if (parts.length === 2) {
      const parseTime = (s: string) => {
        const [h, m] = s.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
      };
      const now = new Date();
      try {
        const start = parseTime(parts[0]);
        const end = parseTime(parts[1]);
        if (now >= start && now <= end) return true;
      } catch {
        // unparseable time string — ignore
      }
    }
  }

  return false;
}
