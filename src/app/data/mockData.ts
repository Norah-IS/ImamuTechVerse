export type ActivityType =
  | 'ورشة عمل'
  | 'محاضرة'
  | 'مسابقة'
  | 'يوم تطوعي'
  | 'معرض'
  | 'ندوة'
  | 'دورة تدريبية'
  | 'فعالية ترفيهية';

export type AudienceGroup =
  | 'students'
  | 'teaching_staff'
  | 'administrative_staff'
  | 'researchers'
  | 'alumni';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  activityType: ActivityType;
  needsVolunteers: boolean;
  audienceType: 'general' | 'restricted';
  allowedAudience: AudienceGroup[];
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

/** Returns true once the event's end time has passed. */
export function hasEventEnded(event: Pick<Event, 'date' | 'time' | 'status'>): boolean {
  if (event.status === 'completed' || event.status === 'cancelled') return true;
  const today = new Date().toISOString().split('T')[0];
  if (event.date < today) return true;
  if (event.date === today) {
    const parts = event.time.split('-');
    const endStr = parts[parts.length - 1].trim();
    const [h, m] = endStr.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const end = new Date();
      end.setHours(h, m, 0, 0);
      return new Date() > end;
    }
  }
  return false;
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
  registrationRole: 'attendee' | 'volunteer';
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
    id: '4',
    name: 'نورة عبدالرحمن السهلي',
    email: 'noura.s@imamu.edu.sa',
    password: 'student123',
    studentId: '2023004',
    college: 'كلية علوم الحاسب',
    interests: ['تقني', 'فني'],
    role: 'student',
  },
  {
    id: '5',
    name: 'فاطمة محمد الدوسري',
    email: 'fatima.d@imamu.edu.sa',
    password: 'student123',
    studentId: '2023005',
    college: 'كلية الهندسة',
    interests: ['علمي', 'تطوعي'],
    role: 'student',
  },
  {
    id: '6',
    name: 'عمر سعد الغامدي',
    email: 'omar.g@imamu.edu.sa',
    password: 'student123',
    studentId: '2023006',
    college: 'كلية إدارة الأعمال',
    interests: ['ريادة أعمال', 'رياضي'],
    role: 'student',
  },
  {
    id: '7',
    name: 'ريم أحمد الزهراني',
    email: 'reem.z@imamu.edu.sa',
    password: 'student123',
    studentId: '2024007',
    college: 'كلية العلوم',
    interests: ['علمي', 'ثقافي'],
    role: 'student',
  },
  {
    id: '8',
    name: 'أحمد خالد العمري',
    email: 'ahmed.e@imamu.edu.sa',
    password: 'student123',
    studentId: '2023008',
    college: 'كلية علوم الحاسب',
    interests: ['تقني', 'رياضي'],
    role: 'student',
  },
  {
    id: '9',
    name: 'لينا عبدالله العتيبي',
    email: 'lina.a@imamu.edu.sa',
    password: 'student123',
    studentId: '2024009',
    college: 'كلية الآداب',
    interests: ['فني', 'ثقافي'],
    role: 'student',
  },
  {
    id: '10',
    name: 'خالد فهد الرشيدي',
    email: 'khalid.r@imamu.edu.sa',
    password: 'student123',
    studentId: '2022010',
    college: 'كلية الطب',
    interests: ['علمي', 'تطوعي'],
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
export const mockAdmin: User = mockUsersDB[10];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'ورشة تطوير تطبيقات الويب',
    description: 'ورشة عملية لتعلم أساسيات تطوير تطبيقات الويب باستخدام React و Node.js، مع تطبيقات عملية على مشاريع حقيقية وتوجيه من مطورين محترفين.',
    date: '2026-04-10',
    time: '14:00 - 17:00',
    location: 'مركز الابتكار - القاعة A',
    category: 'تقني',
    activityType: 'ورشة عمل',
    needsVolunteers: false,
    audienceType: 'restricted',
    allowedAudience: ['students'],
    capacity: 50,
    registeredCount: 48,
    waitlistCount: 7,
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    organizer: 'نادي البرمجة',
    college: 'كلية علوم الحاسب',
    status: 'completed',
    requiresFeedback: true,
    lat: 24.6877,
    lng: 46.7219,
  },
  {
    id: '2',
    title: 'مسابقة الهاكاثون الجامعي',
    description: 'مسابقة برمجية لمدة 48 ساعة لحل تحديات مجتمعية باستخدام التقنية. فرصة لتطوير مهاراتك وبناء شبكة علاقاتك المهنية والفوز بجوائز قيّمة.',
    date: '2026-05-10',
    time: '09:00 - 18:00',
    location: 'مبنى المختبرات - الطابق الثاني',
    category: 'تقني',
    activityType: 'مسابقة',
    needsVolunteers: true,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 120,
    registeredCount: 120,
    waitlistCount: 28,
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    organizer: 'عمادة شؤون الطلاب',
    college: 'جميع الكليات',
    status: 'completed',
    requiresFeedback: true,
    lat: 24.6890,
    lng: 46.7230,
  },
  {
    id: '3',
    title: 'يوم التطوع المجتمعي',
    description: 'يوم تطوعي لخدمة المجتمع وتنظيف الحدائق العامة وزراعة الأشجار في إطار مبادرة الجامعة للمسؤولية الاجتماعية. سيُمنح المتطوعون شهادات تقدير رسمية.',
    date: '2026-03-15',
    time: '07:00 - 12:00',
    location: 'حديقة الملك فهد',
    category: 'تطوعي',
    activityType: 'يوم تطوعي',
    needsVolunteers: true,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 80,
    registeredCount: 76,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800',
    organizer: 'نادي الخدمة المجتمعية',
    college: 'جميع الكليات',
    status: 'completed',
    requiresFeedback: false,
    lat: 24.6800,
    lng: 46.7100,
  },
  {
    id: '4',
    title: 'محاضرة: مستقبل الذكاء الاصطناعي',
    description: 'محاضرة تفاعلية حول آخر التطورات في مجال الذكاء الاصطناعي وتطبيقاته في شتى المجالات مع نخبة من الخبراء المتخصصين من كبرى الشركات التقنية.',
    date: '2026-02-20',
    time: '16:00 - 18:00',
    location: 'المدرّج الكبير',
    category: 'علمي',
    activityType: 'محاضرة',
    needsVolunteers: false,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 200,
    registeredCount: 187,
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
    title: 'دورة ريادة الأعمال المكثّفة',
    description: 'دورة تدريبية لمدة 5 أيام حول أساسيات ريادة الأعمال وبدء المشاريع وبناء نموذج الأعمال الناجح وكيفية الحصول على التمويل من المستثمرين الملائكيين.',
    date: '2026-07-20',
    time: '10:00 - 14:00',
    location: 'مركز ريادة الأعمال - الدور الثالث',
    category: 'ريادة أعمال',
    activityType: 'دورة تدريبية',
    needsVolunteers: false,
    audienceType: 'restricted',
    allowedAudience: ['students'],
    capacity: 40,
    registeredCount: 31,
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
    description: 'مباراة نهائية لبطولة كرة القدم بين كليات الجامعة. تعال وشجع فريقك وعش أجواء الحماس والمنافسة الشريفة بين أبطال الجامعة.',
    date: '2026-04-30',
    time: '17:00 - 19:00',
    location: 'الملعب الرئيسي',
    category: 'رياضي',
    activityType: 'فعالية ترفيهية',
    needsVolunteers: true,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 500,
    registeredCount: 312,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    organizer: 'إدارة النشاط الرياضي',
    college: 'جميع الكليات',
    status: 'completed',
    requiresFeedback: false,
    lat: 24.6900,
    lng: 46.7250,
  },
  {
    id: '7',
    title: 'معرض الفنون الجامعي السنوي',
    description: 'معرض فنون سنوي يستعرض أعمال الطلاب الإبداعية في الرسم والتصوير والفنون الرقمية والحرف اليدوية. الدخول مفتوح للجميع.',
    date: '2026-08-10',
    time: '11:00 - 21:00',
    location: 'القاعة الثقافية - المبنى الرئيسي',
    category: 'فني',
    activityType: 'معرض',
    needsVolunteers: false,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 300,
    registeredCount: 88,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800',
    organizer: 'نادي الفنون',
    college: 'كلية الآداب',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6870,
    lng: 46.7240,
  },
  {
    id: '8',
    title: 'ندوة الثقافة والهوية الوطنية',
    description: 'ندوة علمية حول الهوية الوطنية والإسلامية ودور الجامعة في تعزيز القيم الأصيلة في ضوء المستجدات المعاصرة وتحديات العصر الرقمي.',
    date: '2026-03-05',
    time: '15:00 - 18:00',
    location: 'قاعة المؤتمرات الكبرى',
    category: 'ثقافي',
    activityType: 'ندوة',
    needsVolunteers: false,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 150,
    registeredCount: 134,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
    organizer: 'نادي الثقافة والفكر',
    college: 'جميع الكليات',
    status: 'completed',
    requiresFeedback: true,
    lat: 24.6865,
    lng: 46.7215,
  },
  {
    id: '9',
    title: 'ورشة تصميم واجهات المستخدم UX/UI',
    description: 'ورشة متخصصة في أساسيات تصميم تجربة المستخدم وواجهاته باستخدام أدوات Figma و Adobe XD، مع تطبيقات عملية على مشاريع فعلية.',
    date: '2026-07-22',
    time: '13:00 - 16:00',
    location: 'مختبر التصميم - كلية علوم الحاسب',
    category: 'تقني',
    activityType: 'ورشة عمل',
    needsVolunteers: false,
    audienceType: 'restricted',
    allowedAudience: ['students'],
    capacity: 35,
    registeredCount: 27,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
    organizer: 'نادي البرمجة',
    college: 'كلية علوم الحاسب',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6877,
    lng: 46.7219,
  },
  {
    id: '10',
    title: 'ملتقى التوظيف والخريجين السنوي',
    description: 'الملتقى السنوي الذي يجمع أكثر من 40 شركة رائدة مع طلاب الجامعة وخريجيها للتعرف على فرص العمل والتدريب المتاحة في مختلف القطاعات.',
    date: '2026-08-20',
    time: '09:00 - 17:00',
    location: 'قاعة الملك عبدالعزيز للمؤتمرات',
    category: 'ريادة أعمال',
    activityType: 'معرض',
    needsVolunteers: true,
    audienceType: 'general',
    allowedAudience: ['students', 'alumni'],
    capacity: 600,
    registeredCount: 243,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
    organizer: 'عمادة شؤون الطلاب',
    college: 'جميع الكليات',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6885,
    lng: 46.7225,
  },
  {
    id: '11',
    title: 'دورة الأمن السيبراني المتقدمة',
    description: 'دورة تدريبية في أمن المعلومات والشبكات تغطي أساسيات اختبار الاختراق وتأمين الأنظمة والاستجابة للحوادث الأمنية، بشهادة معتمدة للمشاركين.',
    date: '2026-07-01',
    time: '10:00 - 13:00',
    location: 'مختبر الأمن السيبراني - الطابق الثالث',
    category: 'تقني',
    activityType: 'دورة تدريبية',
    needsVolunteers: false,
    audienceType: 'restricted',
    allowedAudience: ['students'],
    capacity: 30,
    registeredCount: 29,
    waitlistCount: 8,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    organizer: 'قسم أمن المعلومات',
    college: 'كلية علوم الحاسب',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6877,
    lng: 46.7219,
  },
  {
    id: '12',
    title: 'يوم المهن الصحية',
    description: 'يوم توعوي يستعرض مجالات العلوم الصحية وطب الأسنان والصيدلة وعلم التمريض، مع جلسات تعريفية بمتطلبات القبول وفرص التخصص.',
    date: '2026-03-10',
    time: '09:00 - 15:00',
    location: 'مبنى كلية الطب',
    category: 'علمي',
    activityType: 'معرض',
    needsVolunteers: true,
    audienceType: 'general',
    allowedAudience: ['students'],
    capacity: 200,
    registeredCount: 178,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    organizer: 'كلية الطب',
    college: 'كلية الطب',
    status: 'completed',
    requiresFeedback: false,
    lat: 24.6860,
    lng: 46.7210,
  },
  {
    id: '13',
    title: 'ورشة مهارات الخطابة والتواصل',
    description: 'ورشة تدريبية لتطوير مهارات الإلقاء والتواصل الفعّال وأساليب الإقناع، مع تدريب عملي وتغذية راجعة من متخصصين في فن الخطابة.',
    date: '2026-01-20',
    time: '14:00 - 17:00',
    location: 'قاعة التدريب - عمادة شؤون الطلاب',
    category: 'ثقافي',
    activityType: 'ورشة عمل',
    needsVolunteers: false,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 60,
    registeredCount: 57,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    organizer: 'نادي الخطابة',
    college: 'جميع الكليات',
    status: 'completed',
    requiresFeedback: true,
    lat: 24.6875,
    lng: 46.7220,
  },
  {
    id: '14',
    title: 'مسابقة الروبوتات وذكاء الآلة',
    description: 'منافسة تقنية بين فرق الطلاب في تصميم وبرمجة روبوتات ذكية قادرة على إنجاز مهام محددة. مفتوح لجميع طلاب الجامعة بفرق من 3-5 أشخاص.',
    date: '2026-09-10',
    time: '09:00 - 18:00',
    location: 'مركز الابتكار - القاعة الكبرى',
    category: 'تقني',
    activityType: 'مسابقة',
    needsVolunteers: true,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 80,
    registeredCount: 42,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    organizer: 'نادي الروبوتات',
    college: 'كلية الهندسة',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6877,
    lng: 46.7219,
  },
  {
    id: '15',
    title: 'ورشة البرمجة بالذكاء الاصطناعي التوليدي',
    description: 'ورشة متقدمة تغطي تقنيات الذكاء الاصطناعي التوليدي وكيفية بناء تطبيقات ذكية باستخدام نماذج اللغة الكبيرة (LLMs) وواجهات API، مع أمثلة تطبيقية على مشاريع حقيقية.',
    date: '2026-07-28',
    time: '13:00 - 17:00',
    location: 'مختبر الذكاء الاصطناعي - كلية علوم الحاسب',
    category: 'تقني',
    activityType: 'ورشة عمل',
    needsVolunteers: false,
    audienceType: 'restricted',
    allowedAudience: ['students'],
    capacity: 40,
    registeredCount: 36,
    waitlistCount: 5,
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
    organizer: 'نادي البرمجة',
    college: 'كلية علوم الحاسب',
    status: 'upcoming',
    requiresFeedback: true,
    lat: 24.6877,
    lng: 46.7219,
  },
  {
    id: '16',
    title: 'معرض كليات الجامعة المفتوح',
    description: 'يوم مفتوح تستعرض فيه كليات الجامعة مشاريعها البحثية وإنجازاتها وفرص الانتساب المتاحة. فرصة مثالية للطلاب للتعرف على مسارات الدراسة والتخصص والبحث العلمي.',
    date: '2026-08-05',
    time: '10:00 - 16:00',
    location: 'الساحة المركزية - المبنى الرئيسي',
    category: 'علمي',
    activityType: 'معرض',
    needsVolunteers: true,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 500,
    registeredCount: 187,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800',
    organizer: 'عمادة شؤون الطلاب',
    college: 'جميع الكليات',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6875,
    lng: 46.7222,
  },
  {
    id: '17',
    title: 'يوم التطوع الوطني — نظافة الأحياء',
    description: 'مبادرة تطوعية بالتعاون مع أمانة منطقة الرياض لتنظيف الأحياء المجاورة للجامعة وزراعة الأشجار وتوزيع لوحات توعوية بيئية. تُمنح شهادات تقدير لجميع المتطوعين.',
    date: '2026-07-10',
    time: '06:30 - 11:00',
    location: 'تجمع عند البوابة الرئيسية',
    category: 'تطوعي',
    activityType: 'يوم تطوعي',
    needsVolunteers: true,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 150,
    registeredCount: 98,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800',
    organizer: 'نادي الخدمة المجتمعية',
    college: 'جميع الكليات',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6855,
    lng: 46.7205,
  },
  {
    id: '18',
    title: 'محاضرة في علوم القرآن الكريم وتفسيره',
    description: 'محاضرة علمية متخصصة تتناول أحدث المناهج في علوم التفسير وأسباب النزول والإعجاز القرآني، يلقيها أستاذ متخصص من كلية الشريعة مع نقاش مفتوح.',
    date: '2026-09-15',
    time: '17:30 - 19:30',
    location: 'قاعة المحاضرات الكبرى - كلية الشريعة',
    category: 'ثقافي',
    activityType: 'محاضرة',
    needsVolunteers: false,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 250,
    registeredCount: 143,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800',
    organizer: 'قسم الدراسات الإسلامية',
    college: 'كلية الشريعة',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6870,
    lng: 46.7230,
  },
  {
    id: '19',
    title: 'دوري كرة السلة بين الكليات',
    description: 'دوري كرة سلة داخلي يجمع فرق الكليات المختلفة في منافسات متنوعة على مدى أسبوعين. يُرحَّب بالمشجعين وتُقدَّم جوائز قيّمة للفرق الفائزة.',
    date: '2026-07-25',
    time: '16:00 - 20:00',
    location: 'صالة الألعاب الرياضية - المبنى الرياضي',
    category: 'رياضي',
    activityType: 'مسابقة',
    needsVolunteers: true,
    audienceType: 'general',
    allowedAudience: [],
    capacity: 200,
    registeredCount: 76,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    organizer: 'إدارة النشاط الرياضي',
    college: 'جميع الكليات',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6900,
    lng: 46.7250,
  },
  {
    id: '20',
    title: 'ورشة تصميم الجرافيك والهوية البصرية',
    description: 'ورشة تدريبية لتعلم أساسيات التصميم الجرافيكي وبناء الهوية البصرية باستخدام برامج Adobe Illustrator وPhotoshop، تنتهي بتصميم هوية بصرية متكاملة لمشروع حقيقي.',
    date: '2026-08-18',
    time: '11:00 - 15:00',
    location: 'مختبر الفنون الرقمية - كلية الآداب',
    category: 'فني',
    activityType: 'ورشة عمل',
    needsVolunteers: false,
    audienceType: 'restricted',
    allowedAudience: ['students'],
    capacity: 30,
    registeredCount: 22,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=800',
    organizer: 'نادي الفنون',
    college: 'كلية الآداب',
    status: 'upcoming',
    requiresFeedback: false,
    lat: 24.6870,
    lng: 46.7240,
  },
  {
    id: '21',
    title: 'ملتقى ريادة الأعمال الشبابي',
    description: 'منصة تفاعلية تجمع رواد الأعمال الشباب مع المستثمرين والمرشدين من القطاع الخاص لعرض الأفكار الريادية وتلقي التغذية الراجعة وبناء شراكات استراتيجية.',
    date: '2026-09-01',
    time: '09:00 - 16:00',
    location: 'مركز ريادة الأعمال - قاعة الاجتماعات الكبرى',
    category: 'ريادة أعمال',
    activityType: 'ندوة',
    needsVolunteers: true,
    audienceType: 'general',
    allowedAudience: ['students', 'alumni'],
    capacity: 120,
    registeredCount: 54,
    waitlistCount: 0,
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
    organizer: 'مركز ريادة الأعمال',
    college: 'كلية إدارة الأعمال',
    status: 'upcoming',
    requiresFeedback: true,
    lat: 24.6850,
    lng: 46.7200,
  },
  {
    id: '22',
    title: 'معسكر تطوير المهارات القيادية',
    description: 'برنامج تدريبي مكثّف لمدة يومين يركز على بناء مهارات القيادة والتفاوض وإدارة الفرق وحل النزاعات، يتضمن تمارين عملية وحالات دراسية من بيئة العمل السعودية.',
    date: '2026-07-15',
    time: '08:00 - 17:00',
    location: 'مركز التطوير والتدريب - الطابق الثاني',
    category: 'ثقافي',
    activityType: 'دورة تدريبية',
    needsVolunteers: false,
    audienceType: 'restricted',
    allowedAudience: ['students'],
    capacity: 50,
    registeredCount: 38,
    waitlistCount: 3,
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
    organizer: 'عمادة شؤون الطلاب',
    college: 'جميع الكليات',
    status: 'upcoming',
    requiresFeedback: true,
    lat: 24.6880,
    lng: 46.7215,
  },
];

export const mockRegistrations: Registration[] = [
  // ── User 1 (سمية) ──────────────────────────────────────────────────────
  { id: 'r1',  userId: '1', eventId: '1',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  certificateIssued: true  },
  { id: 'r2',  userId: '1', eventId: '3',  status: 'attended',    registrationRole: 'volunteer',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, certificateIssued: false },
  { id: 'r3',  userId: '1', eventId: '4',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  certificateIssued: true  },
  { id: 'r4',  userId: '1', eventId: '5',  status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  { id: 'r5',  userId: '1', eventId: '9',  status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  { id: 'r6',  userId: '1', eventId: '11', status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  // ── User 2 (سارة) ──────────────────────────────────────────────────────
  { id: 'r7',  userId: '2', eventId: '1',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  certificateIssued: true  },
  { id: 'r8',  userId: '2', eventId: '4',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  certificateIssued: true  },
  { id: 'r9',  userId: '2', eventId: '5',  status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  { id: 'r10', userId: '2', eventId: '7',  status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  // ── User 3 (محمد) ──────────────────────────────────────────────────────
  { id: 'r11', userId: '3', eventId: '2',  status: 'absent',      registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  { id: 'r12', userId: '3', eventId: '8',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, certificateIssued: false },
  { id: 'r13', userId: '3', eventId: '10', status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  // ── User 4 (نورة) ──────────────────────────────────────────────────────
  { id: 'r14', userId: '4', eventId: '1',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, certificateIssued: true  },
  { id: 'r15', userId: '4', eventId: '9',  status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  { id: 'r16', userId: '4', eventId: '14', status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  // ── User 5 (فاطمة) ─────────────────────────────────────────────────────
  { id: 'r17', userId: '5', eventId: '2',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  certificateIssued: true  },
  { id: 'r18', userId: '5', eventId: '12', status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, certificateIssued: false },
  { id: 'r19', userId: '5', eventId: '11', status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  // ── User 6 (عمر) ───────────────────────────────────────────────────────
  { id: 'r20', userId: '6', eventId: '5',  status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  { id: 'r21', userId: '6', eventId: '6',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  { id: 'r22', userId: '6', eventId: '10', status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  // ── User 7 (ريم) ───────────────────────────────────────────────────────
  { id: 'r23', userId: '7', eventId: '8',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  certificateIssued: false },
  { id: 'r24', userId: '7', eventId: '12', status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, certificateIssued: false },
  { id: 'r25', userId: '7', eventId: '13', status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, certificateIssued: false },
  // ── User 8 (أحمد) ──────────────────────────────────────────────────────
  { id: 'r26', userId: '8', eventId: '2',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  certificateIssued: true  },
  { id: 'r27', userId: '8', eventId: '6',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  { id: 'r28', userId: '8', eventId: '14', status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  // ── User 9 (لينا) ──────────────────────────────────────────────────────
  { id: 'r29', userId: '9', eventId: '8',  status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, certificateIssued: false },
  { id: 'r30', userId: '9', eventId: '7',  status: 'registered',  registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
  { id: 'r31', userId: '9', eventId: '13', status: 'attended',    registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  certificateIssued: false },
  // ── User 10 (خالد) ─────────────────────────────────────────────────────
  { id: 'r32', userId: '10', eventId: '3',  status: 'attended',   registrationRole: 'volunteer', checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, certificateIssued: false },
  { id: 'r33', userId: '10', eventId: '12', status: 'attended',   registrationRole: 'attendee',  checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, certificateIssued: false },
  { id: 'r34', userId: '10', eventId: '5',  status: 'registered', registrationRole: 'attendee',  checkedIn: false, checkedOut: false, feedbackSubmitted: false, certificateIssued: false },
];

// Mock attendance entries for admin attendance view
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
  // Event 1 - ورشة تطوير الويب (completed)
  { registrationId: 'r1',  userId: '1',  studentName: 'سمية محمد العلي',       studentId: '2024001', college: 'كلية علوم الحاسب',    eventId: '1', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  checkinTime: '2026-04-10T14:03:00' },
  { registrationId: 'r7',  userId: '2',  studentName: 'سارة خالد المطيري',     studentId: '2024002', college: 'كلية الهندسة',         eventId: '1', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  checkinTime: '2026-04-10T14:07:00' },
  { registrationId: 'r14', userId: '4',  studentName: 'نورة عبدالرحمن السهلي', studentId: '2023004', college: 'كلية علوم الحاسب',    eventId: '1', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, checkinTime: '2026-04-10T14:10:00' },
  // Event 2 - هاكاثون (completed)
  { registrationId: 'r17', userId: '5',  studentName: 'فاطمة محمد الدوسري',   studentId: '2023005', college: 'كلية الهندسة',         eventId: '2', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  checkinTime: '2026-05-10T09:05:00' },
  { registrationId: 'r26', userId: '8',  studentName: 'أحمد خالد العمري',     studentId: '2023008', college: 'كلية علوم الحاسب',    eventId: '2', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  checkinTime: '2026-05-10T09:12:00' },
  { registrationId: 'r11', userId: '3',  studentName: 'محمد عبدالله القحطاني', studentId: '2024003', college: 'كلية إدارة الأعمال', eventId: '2', status: 'absent',   checkedIn: false, checkedOut: false, feedbackSubmitted: false },
  // Event 3 - يوم التطوع (completed)
  { registrationId: 'r2',  userId: '1',  studentName: 'سمية محمد العلي',       studentId: '2024001', college: 'كلية علوم الحاسب',    eventId: '3', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, checkinTime: '2026-03-15T07:08:00' },
  { registrationId: 'r32', userId: '10', studentName: 'خالد فهد الرشيدي',     studentId: '2022010', college: 'كلية الطب',           eventId: '3', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, checkinTime: '2026-03-15T07:15:00' },
  // Event 4 - محاضرة AI (completed)
  { registrationId: 'r3',  userId: '1',  studentName: 'سمية محمد العلي',       studentId: '2024001', college: 'كلية علوم الحاسب',    eventId: '4', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  checkinTime: '2026-02-20T16:05:00' },
  { registrationId: 'r8',  userId: '2',  studentName: 'سارة خالد المطيري',     studentId: '2024002', college: 'كلية الهندسة',         eventId: '4', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  checkinTime: '2026-02-20T16:08:00' },
  // Event 6 - بطولة كرة القدم (completed)
  { registrationId: 'r21', userId: '6',  studentName: 'عمر سعد الغامدي',      studentId: '2023006', college: 'كلية إدارة الأعمال', eventId: '6', status: 'attended', checkedIn: true,  checkedOut: false, feedbackSubmitted: false, checkinTime: '2026-04-30T17:02:00' },
  { registrationId: 'r27', userId: '8',  studentName: 'أحمد خالد العمري',     studentId: '2023008', college: 'كلية علوم الحاسب',    eventId: '6', status: 'attended', checkedIn: true,  checkedOut: false, feedbackSubmitted: false, checkinTime: '2026-04-30T17:05:00' },
  // Event 8 - ندوة الثقافة (completed)
  { registrationId: 'r12', userId: '3',  studentName: 'محمد عبدالله القحطاني', studentId: '2024003', college: 'كلية إدارة الأعمال', eventId: '8', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, checkinTime: '2026-03-05T15:10:00' },
  { registrationId: 'r23', userId: '7',  studentName: 'ريم أحمد الزهراني',    studentId: '2024007', college: 'كلية العلوم',         eventId: '8', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: true,  checkinTime: '2026-03-05T15:14:00' },
  { registrationId: 'r29', userId: '9',  studentName: 'لينا عبدالله العتيبي', studentId: '2024009', college: 'كلية الآداب',         eventId: '8', status: 'attended', checkedIn: true,  checkedOut: true,  feedbackSubmitted: false, checkinTime: '2026-03-05T15:18:00' },
  // Event 12 - يوم المهن الصحية (completed)
  { registrationId: 'r18', userId: '5',  studentName: 'فاطمة محمد الدوسري',   studentId: '2023005', college: 'كلية الهندسة',         eventId: '12', status: 'attended', checkedIn: true, checkedOut: true,  feedbackSubmitted: false, checkinTime: '2026-03-10T09:20:00' },
  { registrationId: 'r24', userId: '7',  studentName: 'ريم أحمد الزهراني',    studentId: '2024007', college: 'كلية العلوم',         eventId: '12', status: 'attended', checkedIn: true, checkedOut: true,  feedbackSubmitted: false, checkinTime: '2026-03-10T09:25:00' },
  { registrationId: 'r33', userId: '10', studentName: 'خالد فهد الرشيدي',     studentId: '2022010', college: 'كلية الطب',           eventId: '12', status: 'attended', checkedIn: true, checkedOut: true,  feedbackSubmitted: false, checkinTime: '2026-03-10T09:30:00' },
  // Event 13 - ورشة الخطابة (completed)
  { registrationId: 'r25', userId: '7',  studentName: 'ريم أحمد الزهراني',    studentId: '2024007', college: 'كلية العلوم',         eventId: '13', status: 'attended', checkedIn: true, checkedOut: true,  feedbackSubmitted: false, checkinTime: '2026-01-20T14:05:00' },
  { registrationId: 'r31', userId: '9',  studentName: 'لينا عبدالله العتيبي', studentId: '2024009', college: 'كلية الآداب',         eventId: '13', status: 'attended', checkedIn: true, checkedOut: true,  feedbackSubmitted: true,  checkinTime: '2026-01-20T14:08:00' },
];

export const colleges = [
  'كلية علوم الحاسب',
  'كلية الهندسة',
  'كلية إدارة الأعمال',
  'كلية الطب',
  'كلية العلوم',
  'كلية الآداب',
  'كلية الشريعة',
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
