import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockEvents, mockRegistrations } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  LogOut,
  User as UserIcon,
  ChevronLeft,
  Sparkles,
  Bell,
  X,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import { UniversityLogo } from './UniversityLogo';
import { isUserBlocked, getBlockEntry } from '../services/emailService';
import { getAbsenceCount } from '../services/absenceService';
import { NotificationPanel } from './NotificationPanel';

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'registered' | 'past'>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showBlockedBanner, setShowBlockedBanner] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }
    if (user && isUserBlocked(user.id)) {
      setShowBlockedBanner(true);
    }
  }, [user, navigate]);

  const myRegistrations = mockRegistrations.filter((r) => r.userId === user?.id);
  const registeredEventIds = myRegistrations.filter(r => r.status !== 'cancelled').map((r) => r.eventId);

  const filteredEvents = useMemo(() => {
    let events = mockEvents;

    if (activeTab === 'recommended') {
      events = events.filter((e) => e.status === 'upcoming');
      if (user?.interests && user.interests.length > 0) {
        const matchingEvents = events.filter((e) => user.interests.includes(e.category));
        if (matchingEvents.length > 0) {
          events = matchingEvents;
        }
      }
    } else if (activeTab === 'all') {
      events = events.filter((e) => e.status === 'upcoming');
    } else if (activeTab === 'registered') {
      events = events.filter((e) => registeredEventIds.includes(e.id));
    } else if (activeTab === 'past') {
      events = events.filter((e) => e.status === 'completed');
    }

    if (searchQuery) {
      events = events.filter(
        (e) =>
          e.title.includes(searchQuery) ||
          e.description.includes(searchQuery) ||
          e.category.includes(searchQuery) ||
          e.organizer.includes(searchQuery)
      );
    }

    if (selectedCategory) {
      events = events.filter((e) => e.category === selectedCategory);
    }

    if (selectedCollege) {
      events = events.filter((e) => e.college === selectedCollege || e.college === 'جميع الكليات');
    }

    if (selectedDate) {
      events = events.filter((e) => e.date === selectedDate);
    }

    return events;
  }, [activeTab, searchQuery, selectedCategory, selectedCollege, selectedDate, registeredEventIds, user]);

  const categories = Array.from(new Set(mockEvents.map((e) => e.category)));
  const colleges = Array.from(new Set(mockEvents.map((e) => e.college)));
  const activeFiltersCount = [selectedCategory, selectedCollege, selectedDate].filter(Boolean).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (user?.role === 'admin') {
    return null;
  }

  const absenceCount = user ? getAbsenceCount(user.id) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="bg-primary border-b-4 border-secondary sticky top-0 z-20 shadow-xl shadow-primary/10">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl p-1.5 shadow-inner">
                <UniversityLogo size={36} variant="icon" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-white text-lg font-bold leading-tight">Imamu TechVerse</h1>
                <p className="text-xs font-semibold" style={{ color: '#00ADEF' }}>جامعة الإمام محمد بن سعود الإسلامية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              {absenceCount > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 border border-orange-400/40 rounded-full">
                  <Bell className="w-4 h-4 text-orange-300" />
                  <span className="text-xs font-bold text-orange-200">غياب: {absenceCount}/3</span>
                </div>
              )}
              {/* Notification panel for students */}
              {user && <NotificationPanel userId={user.id} />}
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
                title="ملفي الشخصي"
              >
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-white leading-none">{user?.name}</p>
                  <p className="text-xs text-white/70 mt-1">{user?.college}</p>
                </div>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center hover:bg-destructive/20 text-white hover:text-destructive rounded-xl transition-all"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Blocked Banner */}
      {showBlockedBanner && (
        <div className="bg-destructive text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">
              تم حظر حسابك مؤقتاً لمدة شهر بسبب تجاوز حد الغيابات المسموح به (3 غيابات). يرجى مراجعة إدارة شؤون الطلاب.
            </p>
          </div>
          <button onClick={() => setShowBlockedBanner(false)} className="shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <div className="relative bg-primary text-white py-14 md:py-20 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1771930122139-3b576211e722?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyZWVuJTIwZ29sZCUyMHBhdHRlcm58ZW53JTIwZ29sZHxlbnwwfHww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Pattern"
              className="w-full h-full object-cover opacity-10 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/90 to-transparent"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4 border backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,173,239,0.15)', color: '#00ADEF', borderColor: 'rgba(0,173,239,0.3)' }}>
              <Sparkles className="w-4 h-4" />
              منصة الفعاليات الأكاديمية والأنشطة
            </span>
            <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
              مرحباً، {user?.name?.split(' ')[0]}
              <br className="hidden md:block" />
              <span style={{ color: '#00ADEF' }}>اكتشف فعالياتك المميزة</span>
            </h2>
            <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto font-medium">
              بوابة جامعة الإمام محمد بن سعود الإسلامية الموحدة لجميع الأنشطة اللامنهجية والمؤتمرات والدورات التدريبية.
            </p>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-6 mt-8">
              {[
                { label: 'فعالية قادمة', value: mockEvents.filter(e => e.status === 'upcoming').length },
                { label: 'مسجل بها', value: myRegistrations.filter(r => r.status === 'registered').length },
                { label: 'شهادة', value: myRegistrations.filter(r => r.certificateIssued).length },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-black" style={{ color: '#00ADEF' }}>{stat.value}</p>
                  <p className="text-xs text-white/70 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 py-10 -mt-6 relative z-20 w-full">
          {/* Controls */}
          <div className="bg-card rounded-2xl shadow-xl shadow-black/5 border border-border p-4 md:p-5 mb-8">
            
            {/* Tabs */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-4">
              <div className="flex w-full lg:w-auto p-1 bg-muted rounded-xl overflow-x-auto">
                {[
                  { id: 'recommended', label: 'موصى بها', icon: Sparkles },
                  { id: 'all', label: 'الكل', icon: Calendar },
                  { id: 'registered', label: 'مسجل بها', badge: myRegistrations.filter(r => r.status === 'registered').length },
                  { id: 'past', label: 'الأرشيف' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-none px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] bg-secondary text-white rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex w-full lg:w-auto gap-3">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن فعالية..."
                    className="w-full pr-10 pl-4 py-2.5 bg-input-background border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm font-medium"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                    showFilters || activeFiltersCount > 0
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary/40'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">تصفية</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 bg-white text-primary rounded-full text-[10px] font-black flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
                <div className="relative">
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-muted/30 border-2 border-border rounded-xl focus:outline-none focus:border-primary text-sm font-medium appearance-none"
                  >
                    <option value="">كل التصنيفات</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-muted/30 border-2 border-border rounded-xl focus:outline-none focus:border-primary text-sm font-medium appearance-none"
                  >
                    <option value="">كل الكليات</option>
                    {colleges.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-muted/30 border-2 border-border rounded-xl focus:outline-none focus:border-primary text-sm font-medium"
                  />
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => { setSelectedCategory(''); setSelectedCollege(''); setSelectedDate(''); }}
                    className="sm:col-span-3 flex items-center justify-center gap-2 py-2 text-sm font-bold text-destructive hover:bg-destructive/5 rounded-xl border border-destructive/20 transition-all"
                  >
                    <X className="w-4 h-4" /> مسح الفلاتر
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recommended Section Header */}
          {activeTab === 'recommended' && user?.interests && user.interests.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-xl">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span className="text-sm font-bold text-secondary">بناءً على اهتماماتك:</span>
                {user.interests.slice(0, 3).map(interest => (
                  <span key={interest} className="px-2 py-0.5 bg-secondary text-white rounded-lg text-xs font-bold">{interest}</span>
                ))}
              </div>
            </div>
          )}

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="bg-card rounded-3xl border border-border p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">لا توجد فعاليات مطابقة</h3>
              <p className="text-muted-foreground">جرب تغيير خيارات البحث أو تصفح الأقسام الأخرى.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const registration = myRegistrations.find((r) => r.eventId === event.id);
                const isFull = event.registeredCount >= event.capacity;

                return (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="group bg-card rounded-2xl border-2 border-border/50 overflow-hidden hover:border-secondary hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer flex flex-col"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors z-10"></div>
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      <div className="absolute top-4 right-4 z-20 flex gap-2">
                        <span className="px-3 py-1.5 bg-white/95 backdrop-blur text-primary rounded-lg text-xs font-bold shadow-sm border border-white/20">
                          {event.category}
                        </span>
                        {registration && registration.status !== 'cancelled' && (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm backdrop-blur ${
                            registration.status === 'registered' ? 'bg-secondary text-white' :
                            registration.status === 'waitlist' ? 'bg-orange-500 text-white' :
                            registration.status === 'attended' ? 'bg-green-500 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {registration.status === 'registered' && 'مسجل'}
                            {registration.status === 'waitlist' && 'قائمة الانتظار'}
                            {registration.status === 'attended' && 'حضور مؤكد'}
                          </span>
                        )}
                      </div>
                      
                      <div className="absolute bottom-4 right-4 left-4 z-20 flex items-center justify-between">
                        <div className="flex -space-x-2 rtl:space-x-reverse">
                           <div className="w-8 h-8 rounded-full border-2 border-white bg-secondary flex items-center justify-center">
                             <Users className="w-4 h-4 text-white" />
                           </div>
                           <div className="h-8 px-3 rounded-full border-2 border-white bg-white text-xs font-bold flex items-center shadow-sm">
                             {event.registeredCount} مشارك
                           </div>
                        </div>
                        {isFull && !registration && (
                           <span className="px-3 py-1 bg-destructive/90 text-white text-xs font-bold rounded-lg backdrop-blur">
                             مكتمل العدد
                           </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#8C61AF' }}>
                         <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#8C61AF' }}></span>
                         {event.organizer}
                      </p>
                      <h3 className="text-lg font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-5 line-clamp-2 flex-1">
                        {event.description}
                      </p>

                      <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-sm font-medium pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate text-xs">{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-5 py-3.5 bg-muted/50 border-t border-border flex items-center justify-between group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="text-sm font-bold">عرض التفاصيل</span>
                      <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}