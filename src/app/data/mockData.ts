export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  capacity: number;
  registeredCount: number;
  waitlistCount: number;
  image: string;
  organizer: string;
  college: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  requiresFeedback: boolean;
  lat?: number;
  lng?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  studentId: string;
  college: string;
  interests: string[];
  role: 'student' | 'admin';
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  status: 'registered' | 'waitlist' | 'attended' | 'cancelled' | 'absent';
  checkedIn: boolean;
  checkedOut: boolean;
  feedbackSubmitted: boolean;
  certificateIssued: boolean;
}

// ─── Mock Users (for login validation) ─────────────────────────────────────
export const mockUsersDB: User[] = [
  {
    id: '1',
    name: 'سمية محمد العلي',
    email: 'samiya.ali@imamu.edu.sa',
    password: 'student123',
    studentId: '2024001',
    college: 'كلية علوم الحاسب',
    interests: ['تقني', 'تطوعي', 'ريادة أعمال'],
    role: 'student',
  },
  {
    id: '2',
    name: 'سارة خالد المطيري',
    email: 'sara.m@imamu.edu.sa',
    password: 'student123',
    studentId: '2024002',
    college: 'كلية الهندسة',
    interests: ['علمي', 'تقني'],
    role: 'student',
  },
  {
    id: '3',
    name: 'محمد عبدالله القحطاني',
    email: 'm.qhtani@imamu.edu.sa',
    password: 'student123',
    studentId: '2024003',
    college: 'كلية إدارة الأعمال',
    interests: ['ريادة أعمال', 'ثقافي'],
    role: 'student',
  },
  {
    id: 'admin1',
    name: 'د. سارة أحمد',
    email: 'sarah.admin@imamu.edu.sa',
    password: 'admin123',
    studentId: 'ADMIN001',
    college: 'إدارة الفعاليات',
    interests: [],
    role: 'admin',
  },
  // Demo shortcuts
  {
    id: '1',
    name: 'سمية محمد العلي',
    email: 'student@university.edu.sa',
    password: 'demo123',
    studentId: '2024001',
    college: 'كلية علوم الحاسب',
    interests: ['تقني', 'تطوعي', 'ريادة أعمال'],
    role: 'student',
  },
  {
    id: 'admin1',
    name: 'د. سارة أحمد',
    email: 'admin@university.edu.sa',
    password: 'demo123',
    studentId: 'ADMIN001',
    college: 'إدارة الفعاليات',
    interests: [],
    role: 'admin',
  },
];

export const mockUser: User = mockUsersDB[0];
export const mockAdmin: User = mockUsersDB[3];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'ورشة تطوير تطبيقات الويب',
    description: 'ورشة عملية لتعلم أساسيات تطوير تطبيقات الويب باستخدام React و Node.js، مع تطبيقات عملية على مشاريع حقيقية.',
    date: '2026-05-20',
    time: '14:00 - 17:00',
    location: 'مركز الابتكار - القاعة A',
    category: 'تقني',
    capacity: 50,
    registeredCount: 35,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    organizer: 'نادي البرمجة',
    college: 'كلية علوم الحاسب',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6877,
    lng: 46.7219,
  },
  {
    id: '2',
    title: 'مسابقة الهاكاثون الجامعي',
    description: 'مسابقة برمجية لمدة 48 ساعة لحل تحديات مجتمعية باستخدام التقنية. فرصة لتطوير مهاراتك وبناء شبكة علاقاتك المهنية.',
    date: '2026-06-05',
    time: '09:00 - 18:00',
    location: 'مبنى المختبرات',
    category: 'تقني',
    capacity: 100,
    registeredCount: 100,
    waitlistCount: 20,
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    organizer: 'عمادة شؤون الطلاب',
    college: 'جميع الكليات',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6890,
    lng: 46.7230,
  },
  {
    id: '3',
    title: 'يوم التطوع المجتمعي',
    description: 'يوم تطوعي لخدمة المجتمع المحلي وتنظيف الحدائق العامة وزراعة الأشجار في إطار مبادرة الجامعة للمسؤولية الاجتماعية.',
    date: '2026-05-25',
    time: '07:00 - 12:00',
    location: 'حديقة الملك فهد',
    category: 'تطوعي',
    capacity: 80,
    registeredCount: 60,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800',
    organizer: 'نادي الخدمة المجتمعية',
    college: 'جميع الكليات',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6800,
    lng: 46.7100,
  },
  {
    id: '4',
    title: 'محاضرة: مستقبل الذكاء الاصطناعي',
    description: 'محاضرة تفاعلية حول آخر التطورات في مجال الذكاء الاصطناعي وتطبيقاته في شتى المجالات مع نخبة من الخبراء المتخصصين.',
    date: '2026-04-20',
    time: '16:00 - 18:00',
    location: 'امدرج الكبير',
    category: 'علمي',
    capacity: 200,
    registeredCount: 150,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    organizer: 'قسم علوم الحاسب',
    college: 'كلية علوم الحاسب',
    status: 'completed',
    requiresFeedback: true,
    lat: 24.6877,
    lng: 46.7219,
  },
  {
    id: '5',
    title: 'دورة ريادة الأعمال',
    description: 'دورة تدريبية لمدة 5 أيام حول أساسيات ريادة الأعمال وبدء المشاريع وبناء نموذج الأعمال الناجح وكيفية الحصول على التمويل.',
    date: '2026-06-10',
    time: '10:00 - 14:00',
    location: 'مركز ريادة الأعمال',
    category: 'ريادة أعمال',
    capacity: 40,
    registeredCount: 30,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    organizer: 'مركز ريادة الأعمال',
    college: 'جميع الكليات',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6850,
    lng: 46.7200,
  },
  {
    id: '6',
    title: 'بطولة كرة القدم الجامعية',
    description: 'مباراة نهائية لبطولة كرة القدم بين كليات الجامعة. تعال وشجع فريقك وعش أجواء الحماس والمنافسة الشر��فة.',
    date: '2026-05-30',
    time: '17:00 - 19:00',
    location: 'الملعب الرئيسي',
    category: 'رياضي',
    capacity: 500,
    registeredCount: 200,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    organizer: 'إدارة النشاط الرياضي',
    college: 'جميع الكليات',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6900,
    lng: 46.7250,
  },
  {
    id: '7',
    title: 'معرض الفنون الجامعي',
    description: 'معرض فنون سنوي يستعرض أعمال الطلاب الإبداعية في الرسم والتصوير والفنون الرقمية والحرف اليدوية.',
    date: '2026-06-15',
    time: '11:00 - 21:00',
    location: 'القاعة الثقافية - المبنى الرئيسي',
    category: 'فني',
    capacity: 300,
    registeredCount: 120,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1561839561-b13bcfe95249?w=800',
    organizer: 'نادي الفنون',
    college: 'كلية الآداب',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6870,
    lng: 46.7240,
  },
  {
    id: '8',
    title: 'ندوة الثقافة والهوية',
    description: 'ندوة علمية حول ثقافة الهوية الوطنية والإسلامية دور الجامعة في تعزيز القيم الأصيلة في ضوء المستجدات المعاصرة.',
    date: '2026-05-28',
    time: '15:00 - 18:00',
    location: 'قاعة المؤتمرات الكبرى',
    category: 'ثقافي',
    capacity: 150,
    registeredCount: 90,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
    organizer: 'نادي الثقافة والفكر',
    college: 'جميع الكليات',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6865,
    lng: 46.7215,
  },
];

export const mockRegistrations: Registration[] = [
  {
    id: 'r1',
    userId: '1',
    eventId: '1',
    status: 'attended',      // ← تسجيل الحضور تم
    checkedIn: true,         // ← دخل الفعالية
    checkedOut: false,       // ← لم يغادر بعد — يظهر زر "تسجيل المغادرة"
    feedbackSubmitted: false,
    certificateIssued: false,
  },
  {
    id: 'r2',
    userId: '1',
    eventId: '3',
    status: 'registered',
    checkedIn: false,
    checkedOut: false,
    feedbackSubmitted: false,
    certificateIssued: false,
  },
  {
    id: 'r3',
    userId: '1',
    eventId: '4',
    status: 'attended',
    checkedIn: true,
    checkedOut: true,
    feedbackSubmitted: false,
    certificateIssued: false,
  },
  // Mock attendance for admin reports
  {
    id: 'r4',
    userId: '2',
    eventId: '1',
    status: 'registered',
    checkedIn: false,
    checkedOut: false,
    feedbackSubmitted: false,
    certificateIssued: false,
  },
  {
    id: 'r5',
    userId: '3',
    eventId: '2',
    status: 'waitlist',
    checkedIn: false,
    checkedOut: false,
    feedbackSubmitted: false,
    certificateIssued: false,
  },
  {
    id: 'r6',
    userId: '2',
    eventId: '4',
    status: 'attended',
    checkedIn: true,
    checkedOut: true,
    feedbackSubmitted: true,
    certificateIssued: true,
  },
];

// Mock attendance entries for admin attendance list
export interface AttendanceEntry {
  registrationId: string;
  userId: string;
  studentName: string;
  studentId: string;
  college: string;
  eventId: string;
  status: Registration['status'];
  checkedIn: boolean;
  checkedOut: boolean;
  feedbackSubmitted: boolean;
  checkinTime?: string;
}

export const mockAttendanceData: AttendanceEntry[] = [
  { registrationId: 'r1', userId: '1', studentName: 'أحمد محمد العلي', studentId: '2024001', college: 'كلية علوم الحاسب', eventId: '1', status: 'attended', checkedIn: true, checkedOut: false, feedbackSubmitted: false, checkinTime: new Date().toISOString() },
  { registrationId: 'r4', userId: '2', studentName: 'سارة خالد المطيري', studentId: '2024002', college: 'كلية الهندسة', eventId: '1', status: 'registered', checkedIn: false, checkedOut: false, feedbackSubmitted: false },
  { registrationId: 'r3', userId: '1', studentName: 'أحمد محمد العلي', studentId: '2024001', college: 'كلية علوم الحاسب', eventId: '4', status: 'attended', checkedIn: true, checkedOut: true, feedbackSubmitted: false, checkinTime: '2026-04-20T16:05:00' },
  { registrationId: 'r6', userId: '2', studentName: 'سارة خالد المطيري', studentId: '2024002', college: 'كلية الهندسة', eventId: '4', status: 'attended', checkedIn: true, checkedOut: true, feedbackSubmitted: true, checkinTime: '2026-04-20T16:08:00' },
  { registrationId: 'r2', userId: '1', studentName: 'أحمد محمد العلي', studentId: '2024001', college: 'كلية علوم الحاسب', eventId: '3', status: 'registered', checkedIn: false, checkedOut: false, feedbackSubmitted: false },
];

export const colleges = [
  'كلية علوم الحاسب',
  'كلية الهندسة',
  'كلية إدارة الأعمال',
  'كلية الطب',
  'كلية العلوم',
  'كلية الآداب',
  'جميع الكليات',
];

export const interests = [
  'تقني',
  'تطوعي',
  'رياضي',
  'علمي',
  'ريادة أعمال',
  'ثقافي',
  'فني',
];