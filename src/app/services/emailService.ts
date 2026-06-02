export interface EmailLog {
  id: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  type:
    | 'registration_confirmation'
    | 'waitlist_notification'
    | 'waitlist_promotion'
    | 'reminder'
    | 'certificate'
    | 'block_notification'
    | 'absence_warning';
  eventTitle: string;
  eventDate: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
  body: string;
}

export interface BlockedUser {
  userId: string;
  name: string;
  email: string;
  studentId: string;
  reason: string;
  blockedAt: string;
  blockedUntil: string; // ISO date string — 1 month from blockedAt
  blockedBy: string;
}

export interface StudentNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'block' | 'waitlist_promo' | 'reminder' | 'info' | 'absence_warning';
  read: boolean;
  createdAt: string;
}

const EMAIL_LOGS_KEY = 'imamu_email_logs';
const BLOCKED_USERS_KEY = 'imamu_blocked_users';
const STUDENT_NOTIFICATIONS_KEY = 'imamu_student_notifications';

function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Email Logs ────────────────────────────────────────────────────────────────
export function getEmailLogs(): EmailLog[] {
  try {
    return JSON.parse(localStorage.getItem(EMAIL_LOGS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveEmailLog(log: EmailLog): void {
  const logs = getEmailLogs();
  logs.unshift(log);
  if (logs.length > 200) logs.pop();
  localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(logs));
}

export function clearEmailLogs(): void {
  localStorage.removeItem(EMAIL_LOGS_KEY);
}

// ─── Student Notifications ─────────────────────────────────────────────────────
export function getStudentNotifications(userId: string): StudentNotification[] {
  try {
    const all: StudentNotification[] = JSON.parse(
      localStorage.getItem(STUDENT_NOTIFICATIONS_KEY) || '[]'
    );
    return all.filter((n) => n.userId === userId);
  } catch {
    return [];
  }
}

export function getUnreadCount(userId: string): number {
  return getStudentNotifications(userId).filter((n) => !n.read).length;
}

function saveStudentNotification(notif: StudentNotification): void {
  const all: StudentNotification[] = JSON.parse(
    localStorage.getItem(STUDENT_NOTIFICATIONS_KEY) || '[]'
  );
  all.unshift(notif);
  localStorage.setItem(STUDENT_NOTIFICATIONS_KEY, JSON.stringify(all));
}

export function markNotificationsRead(userId: string): void {
  const all: StudentNotification[] = JSON.parse(
    localStorage.getItem(STUDENT_NOTIFICATIONS_KEY) || '[]'
  );
  const updated = all.map((n) =>
    n.userId === userId ? { ...n, read: true } : n
  );
  localStorage.setItem(STUDENT_NOTIFICATIONS_KEY, JSON.stringify(updated));
}

// ─── Blocked Users ─────────────────────────────────────────────────────────────
export function getBlockedUsers(): BlockedUser[] {
  try {
    return JSON.parse(localStorage.getItem(BLOCKED_USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function blockUser(user: BlockedUser): void {
  const users = getBlockedUsers();
  // Remove any existing block entry first
  const filtered = users.filter((u) => u.userId !== user.userId);
  filtered.push(user);
  localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(filtered));
}

export function unblockUser(userId: string): void {
  const users = getBlockedUsers().filter((u) => u.userId !== userId);
  localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(users));
}

export function isUserBlocked(userId: string): boolean {
  const blocked = getBlockedUsers().find((u) => u.userId === userId);
  if (!blocked) return false;
  // Check if block has expired (1 month)
  const now = new Date();
  const blockedUntil = new Date(blocked.blockedUntil);
  if (now > blockedUntil) {
    // Auto-unblock
    unblockUser(userId);
    return false;
  }
  return true;
}

export function getBlockEntry(userId: string): BlockedUser | null {
  const blocked = getBlockedUsers().find((u) => u.userId === userId);
  if (!blocked) return null;
  // Check expiry
  const now = new Date();
  const blockedUntil = new Date(blocked.blockedUntil);
  if (now > blockedUntil) {
    unblockUser(userId);
    return null;
  }
  return blocked;
}

// ─── Email Functions ────────────────────────────────────────────────────────────
export function sendRegistrationConfirmation(params: {
  recipientName: string;
  recipientEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  registrationId: string;
}): EmailLog {
  const log: EmailLog = {
    id: generateId(),
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    subject: `✅ تأكيد تسجيلك في فعالية: ${params.eventTitle}`,
    type: 'registration_confirmation',
    eventTitle: params.eventTitle,
    eventDate: params.eventDate,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    body: `عزيزي ${params.recipientName}،\n\nيسعدنا إعلامك بأنه تم تأكيد تسجيلك في:\n📌 ${params.eventTitle}\n📅 ${params.eventDate}\n⏰ ${params.eventTime}\n📍 ${params.eventLocation}\n🔑 رقم التسجيل: ${params.registrationId}\n\nيرجى الحضور قبل 15 دقيقة من الموعد.\n\nمع تحيات فريق Imamu TechVerse`,
  };
  saveEmailLog(log);
  // Push in-app notification
  saveStudentNotification({
    id: generateId(),
    userId: '', // filled by caller if needed
    title: '✅ تم التسجيل بنجاح',
    message: `تسجيلك في "${params.eventTitle}" مؤكد. موعد الفعالية: ${params.eventDate}`,
    type: 'info',
    read: false,
    createdAt: new Date().toISOString(),
  });
  return log;
}

export function sendWaitlistConfirmation(params: {
  recipientName: string;
  recipientEmail: string;
  eventTitle: string;
  eventDate: string;
  waitlistPosition: number;
}): EmailLog {
  const log: EmailLog = {
    id: generateId(),
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    subject: `⏳ تم إضافتك لقائمة الانتظار: ${params.eventTitle}`,
    type: 'waitlist_notification',
    eventTitle: params.eventTitle,
    eventDate: params.eventDate,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    body: `عزيزي ${params.recipientName}،\n\nتمت إضافتك لقائمة الانتظار:\n📋 ترتيبك: #${params.waitlistPosition}\n📅 تاريخ الفعالية: ${params.eventDate}\n\nسيتم إرسال إشعار فوري عند توفر مقعد.\n\nمع تحيات فريق Imamu TechVerse`,
  };
  saveEmailLog(log);
  return log;
}

export function sendWaitlistPromotion(params: {
  recipientName: string;
  recipientEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  userId?: string;
}): EmailLog {
  const log: EmailLog = {
    id: generateId(),
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    subject: `🎉 تم ترقيتك! مقعد متاح في: ${params.eventTitle}`,
    type: 'waitlist_promotion',
    eventTitle: params.eventTitle,
    eventDate: params.eventDate,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    body: `عزيزي ${params.recipientName}،\n\nخبر سار! أصبح مقعد متاح لك في:\n📌 ${params.eventTitle}\n📅 ${params.eventDate}\n⏰ ${params.eventTime}\n📍 ${params.eventLocation}\n\nيُرجى تأكيد حضورك خلال 24 ساعة وإلا سيُمنح المقعد للتالي.\n\nمع تحيات فريق Imamu TechVerse`,
  };
  saveEmailLog(log);
  // Push in-app notification
  if (params.userId) {
    saveStudentNotification({
      id: generateId(),
      userId: params.userId,
      title: '🎉 مقعد متاح لك!',
      message: `أصبح مقعد شاغر في "${params.eventTitle}". أكد حضورك خلال 24 ساعة.`,
      type: 'waitlist_promo',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  return log;
}

export function sendCertificateEmail(params: {
  recipientName: string;
  recipientEmail: string;
  eventTitle: string;
  eventDate: string;
  userId?: string;
}): EmailLog {
  const log: EmailLog = {
    id: generateId(),
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    subject: `🏆 شهادة حضورك جاهزة: ${params.eventTitle}`,
    type: 'certificate',
    eventTitle: params.eventTitle,
    eventDate: params.eventDate,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    body: `عزيزي ${params.recipientName}،\n\nتهانينا! شهادة حضورك في "${params.eventTitle}" جاهزة للتحميل من قسم "خزنة الشهادات".\n\nمع تحيات فريق Imamu TechVerse`,
  };
  saveEmailLog(log);
  return log;
}

export function sendReminderEmail(params: {
  recipientName: string;
  recipientEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  userId?: string;
}): EmailLog {
  const log: EmailLog = {
    id: generateId(),
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    subject: `⏰ تذكير: فعالية "${params.eventTitle}" غداً`,
    type: 'reminder',
    eventTitle: params.eventTitle,
    eventDate: params.eventDate,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    body: `عزيزي ${params.recipientName}،\n\nتذكير بأن فعالية "${params.eventTitle}" ستُقام غداً:\n📅 ${params.eventDate}\n⏰ ${params.eventTime}\n📍 ${params.eventLocation}\n\nيرجى الحضور قبل 15 دقيقة من الموعد.\n\nمع تحيات فريق Imamu TechVerse`,
  };
  saveEmailLog(log);
  if (params.userId) {
    saveStudentNotification({
      id: generateId(),
      userId: params.userId,
      title: '⏰ تذكير بفعالية غداً',
      message: `فعالية "${params.eventTitle}" ستبدأ غداً في ${params.eventTime} — ${params.eventLocation}`,
      type: 'reminder',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  return log;
}

// ─── Block Notification (Req 41) ───────────────────────────────────────────────
export function sendBlockNotification(params: {
  recipientName: string;
  recipientEmail: string;
  userId: string;
  absenceCount: number;
  blockedUntil: string;
  reason: string;
}): EmailLog {
  const blockedUntilDate = new Date(params.blockedUntil).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const log: EmailLog = {
    id: generateId(),
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    subject: '🚫 تم تعليق حسابك مؤقتاً في منصة Imamu TechVerse',
    type: 'block_notification',
    eventTitle: '—',
    eventDate: new Date().toISOString().split('T')[0],
    sentAt: new Date().toISOString(),
    status: 'delivered',
    body: `عزيزي ${params.recipientName}،\n\nنأسف لإبلاغك بأنه تم تعليق حسابك مؤقتاً في منصة Imamu TechVerse.\n\n📋 السبب: ${params.reason}\n📊 عدد الغيابات المسجلة: ${params.absenceCount} / 3\n📅 مدة التعليق: حتى ${blockedUntilDate}\n\nلرفع الحظر مبكراً، يرجى التواصل مع إدارة شؤون الطلاب مباشرةً.\n\nمع تحيات فريق Imamu TechVerse\nجامعة الإمام محمد بن سعود الإسلامية`,
  };
  saveEmailLog(log);

  // Save in-app notification for student (Req 41)
  saveStudentNotification({
    id: generateId(),
    userId: params.userId,
    title: '🚫 تم تعليق حسابك',
    message: `تم تعليق حسابك بسبب ${params.absenceCount} غيابات غير مبررة. المدة: حتى ${blockedUntilDate}. للاستفسار راجع إدارة شؤون الطلاب.`,
    type: 'block',
    read: false,
    createdAt: new Date().toISOString(),
  });

  return log;
}

export function sendAbsenceWarningEmail(params: {
  recipientName: string;
  recipientEmail: string;
  userId: string;
  absenceCount: number;
  eventTitle: string;
}): EmailLog {
  const remaining = 3 - params.absenceCount;
  const log: EmailLog = {
    id: generateId(),
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    subject: `⚠️ تحذير: ${params.absenceCount} غياب مسجل بحسابك`,
    type: 'absence_warning',
    eventTitle: params.eventTitle,
    eventDate: new Date().toISOString().split('T')[0],
    sentAt: new Date().toISOString(),
    status: 'delivered',
    body: `عزيزي ${params.recipientName}،\n\nنودّ إعلامك بأن عدد غياباتك وصل إلى ${params.absenceCount} غياب.\n⚠️ تبقّى لك ${remaining} غياب(ات) قبل تعليق حسابك لمدة شهر.\n\nفعالية "${params.eventTitle}" سُجّلت ضمن غياباتك.\n\nنرجو الالتزام بالحضور والتواصل مع المنظمين إذا كان هناك عذر.\n\nمع تحيات فريق Imamu TechVerse`,
  };
  saveEmailLog(log);

  // Save in-app warning notification
  saveStudentNotification({
    id: generateId(),
    userId: params.userId,
    title: `⚠️ تحذير: ${params.absenceCount} غياب مسجل`,
    message: `تم تسجيل غياب جديد في "${params.eventTitle}". تبقّى ${remaining} غياب(ات) قبل تعليق حسابك.`,
    type: 'absence_warning',
    read: false,
    createdAt: new Date().toISOString(),
  });

  return log;
}
