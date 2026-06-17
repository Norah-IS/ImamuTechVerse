import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colleges, interests } from '../data/mockData';
import { Check, ChevronDown, UserCircle, Building } from 'lucide-react';
import { Logo } from './logo';

export function PreferencesPage() {
  const { user, completePreferences } = useAuth();
  const navigate = useNavigate();
  const [selectedCollege, setSelectedCollege] = useState(user?.college || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);

  // Redirect admins immediately (Req 42)
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  if (user?.role === 'admin') return null;

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completePreferences(selectedCollege, selectedInterests);
    navigate('/');
  };

  const interestIcons: Record<string, string> = {
    'تقني': '💻',
    'تطوعي': '🤝',
    'رياضي': '⚽',
    'علمي': '🔬',
    'ريادة أعمال': '🚀',
    'ثقافي': '📚',
    'فني': '🎨',
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" style={{ backgroundColor: 'rgba(30,38,82,0.05)' }}></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" style={{ backgroundColor: 'rgba(92,45,145,0.07)' }}></div>

      <header className="bg-primary/95 backdrop-blur border-b-4 border-secondary sticky top-0 z-20 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 md:py-4 flex items-center justify-center gap-3">
          <div className="bg-white rounded-xl p-1.5 shadow-inner">
            <Logo variant="university" className="h-9 w-auto" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">Imamu TechVerse</h2>
            <p className="text-xs font-semibold" style={{ color: '#00ADEF' }}>جامعة الإمام محمد بن سعود الإسلامية</p>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-card rounded-3xl mx-auto mb-6 shadow-xl shadow-primary/10 border-2 border-primary/20 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
            <UserCircle className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-black mb-3 text-foreground tracking-tight">أهلاً بك، {user?.name}</h1>
          <p className="text-muted-foreground text-lg">
            خطوة أخيرة لنقدم لك تجربة مخصصة لاهتماماتك وتخصصك
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-3xl shadow-xl shadow-black/5 border border-border p-8 md:p-10 space-y-10 relative overflow-hidden">
          <div className="relative z-10 space-y-10">
            <div>
              <label className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
                <span className="w-1.5 h-6 bg-secondary rounded-full"></span>
                كليتك الحالية
              </label>
              <div className="relative group">
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="w-full px-5 py-4 bg-muted/30 border-2 border-border rounded-2xl appearance-none focus:outline-none focus:border-primary focus:bg-card transition-all text-base font-bold text-foreground cursor-pointer shadow-sm group-hover:border-primary/40"
                  required
                >
                  <option value="" disabled className="text-muted-foreground">الرجاء اختيار الكلية من القائمة</option>
                  {colleges.filter(c => c !== 'جميع الكليات').map((college) => (
                    <option key={college} value={college} className="font-medium text-foreground py-2">
                      {college}
                    </option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-border rounded-lg flex items-center justify-center pointer-events-none shadow-sm">
                  <ChevronDown className="w-5 h-5 text-primary" />
                </div>
                <Building className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-lg font-bold text-foreground mb-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                مجالات اهتمامك
              </label>
              <p className="text-sm text-muted-foreground mb-6 font-medium">
                بناءً على اختياراتك، سنقترح لك الفعاليات والدورات الأكثر صلة بمسارك الأكاديمي والمهني (يمكنك اختيار أكثر من مجال).
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {interests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-5 py-4 rounded-2xl border-2 transition-all font-bold text-sm flex flex-col items-center justify-center gap-3 active:scale-95 relative overflow-hidden group ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                          : 'bg-muted/30 text-foreground border-border hover:border-primary/40 hover:bg-card shadow-sm'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-secondary text-white rounded-full flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <span className="text-xl">{interestIcons[interest] || '📌'}</span>
                      <span>{interest}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={!selectedCollege || selectedInterests.length === 0}
                className="w-full bg-secondary text-white py-4 rounded-2xl hover:bg-secondary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-secondary text-lg font-black shadow-xl shadow-secondary/20 active:scale-[0.98] border border-white/20"
              >
                حفظ وإكمال الإعداد
              </button>
              {selectedInterests.length === 0 && (
                <p className="text-center text-sm text-muted-foreground mt-3">يرجى اختيار مجال اهتمام واحد على الأقل</p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
