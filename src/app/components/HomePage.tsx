import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockEvents, mockRegistrations, mockUsersDB, colleges as allColleges } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Calendar, Clock, MapPin, Users, Search, Filter, LogOut, User as UserIcon,
  ChevronLeft, Bell, X, Building2, SlidersHorizontal, Award, BookOpen,
  GraduationCap, Globe2, Trophy, Star,
} from 'lucide-react';
import { Logo } from './logo';
import { LanguageToggle } from './LanguageToggle';
import { isUserBlocked } from '../services/emailService';
import { getAbsenceCount } from '../services/absenceService';
import { NotificationPanel } from './NotificationPanel';

export function HomePage() {
  const { user, logout } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'registered' | 'past'>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showBlockedBanner, setShowBlockedBanner] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin');
    if (user && isUserBlocked(user.id)) setShowBlockedBanner(true);
  }, [user, navigate]);

  const myRegistrations = mockRegistrations.filter((r) => r.userId === user?.id);
  const registeredEventIds = myRegistrations.filter(r => r.status !== 'cancelled').map(r => r.eventId);
  const absenceCount = user ? getAbsenceCount(user.id) : 0;

  const filteredEvents = useMemo(() => {
    let events = mockEvents;
    if (activeTab === 'recommended') {
      events = events.filter(e => e.status === 'upcoming');
      if (user?.interests && user.interests.length > 0) {
        const matching = events.filter(e => user.interests.includes(e.category));
        if (matching.length > 0) events = matching;
      }
    } else if (activeTab === 'all') {
      events = events.filter(e => e.status === 'upcoming');
    } else if (activeTab === 'registered') {
      events = events.filter(e => registeredEventIds.includes(e.id));
    } else if (activeTab === 'past') {
      events = events.filter(e => e.status === 'completed');
    }
    if (searchQuery) events = events.filter(e =>
      e.title.includes(searchQuery) || e.description.includes(searchQuery) ||
      e.category.includes(searchQuery) || e.organizer.includes(searchQuery)
    );
    if (selectedCategory) events = events.filter(e => e.category === selectedCategory);
    if (selectedCollege) events = events.filter(e => e.college === selectedCollege || e.college === 'جميع الكليات');
    if (selectedDate) events = events.filter(e => e.date === selectedDate);
    return events;
  }, [activeTab, searchQuery, selectedCategory, selectedCollege, selectedDate, registeredEventIds, user]);

  const categories = Array.from(new Set(mockEvents.map(e => e.category)));
  const colleges = Array.from(new Set(mockEvents.map(e => e.college)));
  const activeFiltersCount = [selectedCategory, selectedCollege, selectedDate].filter(Boolean).length;

  const collegeLeaderboard = useMemo(() => {
    // Seed every college with zero scores
    const map: Record<string, { name: string; registered: number; attended: number; feedback: number }> = {};
    allColleges
      .filter(c => c !== 'جميع الكليات')
      .forEach(c => { map[c] = { name: c, registered: 0, attended: 0, feedback: 0 }; });

    // Tally by the registering student's college
    mockRegistrations
      .filter(r => r.status !== 'waitlist' && r.status !== 'cancelled')
      .forEach(r => {
        const user = mockUsersDB.find(u => u.id === r.userId);
        const college = user?.college;
        if (!college || !map[college]) return;
        if (r.status === 'attended') map[college].attended += 1;
        else if (r.status === 'registered') map[college].registered += 1;
        if (r.feedbackSubmitted) map[college].feedback += 1;
      });

    return Object.values(map)
      .map(c => ({ ...c, points: c.attended * 3 + c.registered * 1 + c.feedback * 2 }))
      .sort((a, b) => b.points - a.points);
  }, []);

  if (user?.role === 'admin') return null;

  const upcomingCount = mockEvents.filter(e => e.status === 'upcoming').length;
  const myRegCount = myRegistrations.filter(r => r.status === 'registered').length;
  const myCertCount = myRegistrations.filter(r => r.certificateIssued).length;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── Top utility bar ── */}
      <div className="bg-[#0D1130] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-white/50">
            <span className="hidden sm:flex items-center gap-1.5">
              <Globe2 className="w-3 h-3" />
              imamu.edu.sa
            </span>
            <span className="hidden sm:block opacity-30">|</span>
            <span className="hidden sm:block">
              {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {absenceCount > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] text-orange-300 font-bold">
                <Bell className="w-3 h-3" />
                {t(`غياب: ${absenceCount}/3`, `Absences: ${absenceCount}/3`)}
              </span>
            )}
            <LanguageToggle variant="light" />
          </div>
        </div>
      </div>

      {/* ── Main Header ── */}
      <header className="bg-[#13193E] border-b-4 border-[#00ADEF] shadow-2xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Identity row */}
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-white/5 rounded-2xl p-2 border border-white/10">
                  <Logo variant="university" className="h-10 w-auto" />
                </div>
                <div className="bg-white/5 rounded-xl p-1.5 border border-white/10 hidden sm:block">
                  <Logo variant="project" className="h-7 w-auto" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-white font-black text-lg leading-none tracking-tight">
                    Imamu TechVerse
                  </h1>
                  <span className="hidden sm:block text-[#00ADEF] text-[10px] font-bold bg-[#00ADEF]/10 px-2 py-0.5 rounded-full border border-[#00ADEF]/30">
                    {t('بوابة الأنشطة', 'Activities Portal')}
                  </span>
                </div>
                <p className="text-white/50 text-[11px] mt-0.5 hidden sm:block">
                  {t('جامعة الإمام محمد بن سعود الإسلامية', 'Imam Mohammad Ibn Saud Islamic University')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {user && <NotificationPanel userId={user.id} />}
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
              >
                <div className="w-8 h-8 bg-[#00ADEF]/20 border border-[#00ADEF]/30 rounded-xl flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-[#00ADEF]" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-white leading-none">{user?.name?.split(' ').slice(0, 2).join(' ')}</p>
                  <p className="text-[11px] text-white/50 mt-0.5">{t('زائر', 'Visitor')}</p>
                </div>
              </button>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                title={t('خروج', 'Sign Out')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats mini-bar */}
          <div className="flex items-center gap-6 py-2.5 overflow-x-auto">
            {[
              { icon: Calendar, value: upcomingCount, label: t('نشاط قادم', 'Upcoming') },
              { icon: BookOpen, value: myRegCount, label: t('مسجّل بها', 'Registered') },
              { icon: Award, value: myCertCount, label: t('شهادة', 'Certificate') },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-white/70 whitespace-nowrap">
                <s.icon className="w-3.5 h-3.5 text-[#00ADEF]" />
                <span className="text-[#00ADEF] font-black text-sm">{s.value}</span>
                <span className="text-[11px]">{s.label}</span>
                {i < 2 && <span className="text-white/20 mr-3">|</span>}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Blocked Banner */}
      {showBlockedBanner && (
        <div className="bg-destructive text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">
              {t(
                'تم حظر حسابك مؤقتاً لمدة شهر بسبب تجاوز حد الغيابات المسموح به (3 غيابات). يرجى مراجعة إدارة شؤون الطلاب.',
                'Your account has been temporarily suspended for exceeding the allowed absences (3). Please contact Student Affairs.'
              )}
            </p>
          </div>
          <button onClick={() => setShowBlockedBanner(false)} className="shrink-0 p-1 hover:bg-white/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #13193E 0%, #1E2652 50%, #0f1a3d 100%)' }}>
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #00ADEF, transparent)' }} />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #5C2D91, transparent)' }} />
            {/* Circuit board dots pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'radial-gradient(#00ADEF 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 md:py-14">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">

              {/* Left: Text */}
              <div className="flex-1 text-center md:text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 text-xs font-bold"
                  style={{ backgroundColor: 'rgba(0,173,239,0.12)', borderColor: 'rgba(0,173,239,0.3)', color: '#00ADEF' }}>
                  <GraduationCap className="w-3.5 h-3.5" />
                  {t('بوابة الأنشطةالجامعية', 'University Co-Curricular Activities Portal')}
                </div>

                <h2 className="text-2xl md:text-4xl font-black text-white mb-3 leading-snug">
                  {t('اكتشف. سجّل. أنجز.', 'Discover. Register. Achieve.')}
                </h2>
                <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl mx-auto md:mx-0 mb-6">
                  {t(
                    'بوابة جامعة الإمام محمد بن سعود الإسلامية الموحدة للأنشطة الأكاديمية والتقنية والاجتماعية. سجّل حضورك، احصل على شهادات موثّقة، وطور سجلك المهاري.',
                    'The unified portal of Imam Mohammad Ibn Saud Islamic University for academic, technical, and social activities. Register, earn verified certificates, and build your co-curricular record.'
                  )}
                </p>

                {/* Search bar */}
                <div className="relative max-w-md mx-auto md:mx-0">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('ابحث عن نشاط، ورشة، دورة...', 'Search for an activity, workshop, course...')}
                    className="w-full pr-11 pl-5 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:border-[#00ADEF]/60 focus:bg-white/15 transition-all"
                  />
                </div>
              </div>

              {/* Right: Logo display */}
              <div className="hidden md:flex shrink-0 items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-3xl opacity-30" style={{ background: '#00ADEF' }} />
                  <div className="relative bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur flex flex-col items-center gap-3">
                    <Logo variant="university" className="h-24 w-auto" />
                    <Logo variant="project" className="h-8 w-auto opacity-80" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom wave divider */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#F4F6F9]"
            style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
        </div>

        {/* ── College Leaderboard ── */}
        {collegeLeaderboard.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pt-6 pb-2 w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#13193E,#5C2D91)' }}>
                  <Trophy className="w-4 h-4 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-black text-[#13193E] text-base leading-tight">
                    {t('لوحة الكليات المتميزة', 'Top Colleges Leaderboard')}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t('النقاط = حضور ×٣ + تسجيل ×١ + تقييم ×٢', 'Points = Attendance ×3 + Registrations ×1 + Ratings ×2')}
                  </p>
                </div>
              </div>

              {/* Cards row */}
              <div className="flex gap-3 overflow-x-auto pb-1">
                {collegeLeaderboard.map((college, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const medalColors = [
                    'from-yellow-50 border-yellow-200',
                    'from-gray-50 border-gray-200',
                    'from-orange-50 border-orange-200',
                  ];
                  const accentColors = ['text-yellow-600', 'text-gray-500', 'text-orange-500'];
                  const medal = medals[idx] ?? `#${idx + 1}`;
                  const cardGrad = medalColors[idx] ?? 'from-blue-50 border-blue-100';
                  const accent = accentColors[idx] ?? 'text-[#00ADEF]';

                  return (
                    <div
                      key={college.name}
                      className={`flex-none min-w-[190px] bg-gradient-to-b ${cardGrad} border rounded-xl p-4 space-y-2`}
                    >
                      {/* Rank + name */}
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none">{medal}</span>
                        <p className="font-bold text-[#13193E] text-sm leading-tight line-clamp-2">{college.name}</p>
                      </div>

                      {/* Points badge */}
                      <div className={`text-2xl font-black ${accent}`}>
                        {college.points} <span className="text-xs font-bold text-gray-400">{t('نقطة', 'pts')}</span>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-1 pt-1 border-t border-black/5">
                        {[
                          { icon: Users,    value: college.attended,  label: t('حضور', 'Attended'),   mult: '×٣' },
                          { icon: Building2, value: college.registered, label: t('تسجيل', 'Registered'), mult: '×١' },
                          { icon: Star,     value: college.feedback,  label: t('تقييم', 'Ratings'),   mult: '×٢' },
                        ].map(({ icon: Icon, value, label, mult }) => (
                          <div key={label} className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Icon className="w-3 h-3 text-gray-400" />
                              <span>{label}</span>
                              <span className="text-gray-300">{mult}</span>
                            </div>
                            <span className="font-bold text-[#13193E]">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="max-w-7xl mx-auto px-4 py-8 w-full">

          {/* Controls card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-5 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">

              {/* Tabs */}
              <div className="flex p-1 bg-gray-100 rounded-xl overflow-x-auto gap-0.5 w-full lg:w-auto">
                {[
                  { id: 'recommended', label: t('موصى بها', 'Recommended') },
                  { id: 'all', label: t('جميع الأنشطة', 'All Activities') },
                  { id: 'registered', label: t('مسجّل بها', 'Registered'), badge: myRegistrations.filter(r => r.status === 'registered').length },
                  { id: 'past', label: t('الأرشيف', 'Archive') },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id
                        ? 'bg-white text-[#13193E] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] bg-[#00ADEF] text-white rounded-full font-black">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Filter button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${showFilters || activeFiltersCount > 0
                    ? 'bg-[#13193E] text-white border-[#13193E]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#13193E]/30'
                  }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {t('تصفية', 'Filter')}
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-[#00ADEF] text-white rounded-full text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="pt-4 mt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
                <div className="relative">
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00ADEF] text-sm font-medium appearance-none">
                    <option value="">{t('كل التصنيفات', 'All Categories')}</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select value={selectedCollege} onChange={e => setSelectedCollege(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00ADEF] text-sm font-medium appearance-none">
                    <option value="">{t('كل الكليات', 'All Colleges')}</option>
                    {colleges.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00ADEF] text-sm font-medium" />
                </div>
                {activeFiltersCount > 0 && (
                  <button onClick={() => { setSelectedCategory(''); setSelectedCollege(''); setSelectedDate(''); }}
                    className="sm:col-span-3 flex items-center justify-center gap-2 py-2 text-sm font-bold text-destructive hover:bg-destructive/5 rounded-xl border border-destructive/20 transition-all">
                    <X className="w-4 h-4" /> {t('مسح الفلاتر', 'Clear Filters')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recommendation banner */}
          {activeTab === 'recommended' && user?.interests && user.interests.length > 0 && (
            <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-[#13193E]/5 border border-[#13193E]/10 rounded-xl">
              <div className="w-8 h-8 bg-[#13193E]/10 rounded-xl flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-[#13193E]" />
              </div>
              <div className="flex-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[#13193E]">{t('بناءً على اهتماماتك:', 'Based on your interests:')}</span>
                {user.interests.slice(0, 3).map(i => (
                  <span key={i} className="px-2 py-0.5 bg-[#13193E] text-white rounded-lg text-xs font-bold">{i}</span>
                ))}
              </div>
            </div>
          )}

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">{t('لا توجد أنشطة مطابقة', 'No matching activities')}</h3>
              <p className="text-gray-400 text-sm">{t('جرب تغيير خيارات البحث أو تصفح الأقسام الأخرى.', 'Try changing your search or browse other tabs.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map(event => {
                const registration = myRegistrations.find(r => r.eventId === event.id);
                const isFull = event.registeredCount >= event.capacity;
                const fillPct = Math.min(100, (event.registeredCount / event.capacity) * 100);

                return (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-[#00ADEF]/50 hover:shadow-lg hover:shadow-[#13193E]/8 transition-all cursor-pointer flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-44 overflow-hidden">
                      <img src={event.image} alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 bg-white/95 text-[#13193E] rounded-lg text-[11px] font-bold shadow-sm">
                          {event.activityType}
                        </span>
                        {registration && registration.status !== 'cancelled' && (
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm ${registration.status === 'registered' ? 'bg-[#00ADEF] text-white' :
                              registration.status === 'waitlist' ? 'bg-orange-500 text-white' :
                                registration.status === 'attended' ? 'bg-green-600 text-white' :
                                  'bg-gray-500 text-white'
                            }`}>
                            {registration.status === 'registered' && t('مسجّل', 'Registered')}
                            {registration.status === 'waitlist' && t('انتظار', 'Waitlist')}
                            {registration.status === 'attended' && t('حضر', 'Attended')}
                          </span>
                        )}
                      </div>

                      {/* Capacity pill */}
                      <div className="absolute bottom-3 left-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur rounded-lg">
                          <Users className="w-3 h-3 text-white/80" />
                          <span className="text-white text-[11px] font-bold">
                            {event.registeredCount}/{event.capacity}
                          </span>
                          {isFull && !registration && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-black rounded">
                              {t('مكتمل', 'Full')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col">
                      <p className="text-[11px] font-bold text-[#5C2D91] mb-1.5 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-[#5C2D91]" />
                        {event.organizer}
                      </p>
                      <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-[#13193E] transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1 leading-relaxed">
                        {event.description}
                      </p>

                      {/* Capacity bar */}
                      <div className="mb-3">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${fillPct}%`, background: fillPct >= 90 ? '#ef4444' : '#00ADEF' }} />
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[11px] text-gray-500 font-medium border-t border-gray-100 pt-3">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-[#00ADEF]" />{event.date}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-[#00ADEF]" />{event.time}</span>
                        <span className="flex items-center gap-1.5 col-span-2 truncate">
                          <MapPin className="w-3 h-3 text-[#00ADEF] shrink-0" />{event.location}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-[#13193E] group-hover:text-white transition-colors">
                      <span className="text-sm font-bold text-gray-600 group-hover:text-white">{t('عرض التفاصيل', 'View Details')}</span>
                      <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0D1130] border-t border-white/10 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo variant="university" className="h-7 w-auto opacity-80" />
            <Logo variant="project" className="h-5 w-auto opacity-60 hidden sm:block" />
            <div>
              <p className="text-white/80 text-xs font-bold">Imamu TechVerse</p>
              <p className="text-white/30 text-[10px]">
                {t('جامعة الإمام محمد بن سعود الإسلامية', 'Imam Mohammad Ibn Saud Islamic University')}
              </p>
            </div>
          </div>
          <p className="text-white/20 text-[11px]">
            {t('جميع الحقوق محفوظة', 'All Rights Reserved')} © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
