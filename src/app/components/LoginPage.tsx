import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ChevronLeft, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { UniversityLogo, UniversityLogoWhite } from './UniversityLogo';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const navigateAfterLogin = (role: 'student' | 'admin', hasPrefs: boolean) => {
    if (role === 'admin') {
      navigate('/admin');
    } else if (hasPrefs) {
      navigate('/');
    } else {
      navigate('/preferences');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Determine navigation target
        const savedPrefs = localStorage.getItem('preferencesCompleted') === 'true';
        const savedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        navigateAfterLogin(savedUser.role, savedPrefs);
      } else {
        setError(result.error || 'فشل تسجيل الدخول. حاول مرة أخرى.');
      }
    } catch {
      setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'student' | 'admin') => {
    setIsLoading(true);
    setError('');
    const demoEmail = role === 'admin' ? 'admin@university.edu.sa' : 'student@university.edu.sa';
    const result = await login(demoEmail, 'demo123');
    if (result.success) {
      const savedPrefs = localStorage.getItem('preferencesCompleted') === 'true';
      navigateAfterLogin(role, savedPrefs);
    } else {
      setError(result.error || 'حدث خطأ.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left side: Background Image & Branding */}
      <div className="md:w-1/2 relative hidden md:flex flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-primary/95 z-0">
          <img
            src="https://images.unsplash.com/photo-1700671562333-f71286a7c748?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc3Njk5MTkzOHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="University Campus"
            className="w-full h-full object-cover mix-blend-overlay opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur rounded-2xl p-2.5 border border-white/30 shadow-lg">
            <UniversityLogoWhite size={48} />
          </div>
          <h2 className="text-white font-bold text-xl leading-snug">جامعة الإمام محمد<br/>بن سعود الإسلامية</h2>
        </div>

        <div className="relative z-10 text-white max-w-md">
          <h1 className="text-4xl font-black mb-4 leading-tight" style={{ color: '#00ADEF' }}>
            نظام إدارة الفعاليات
            <br />
            <span className="text-white">Imamu TechVerse</span>
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">
            بوابة متكاملة لاكتشاف والتسجيل في الفعاليات الأكاديمية والتقنية والأنشطة الطلابية بكل سهولة.
          </p>
          <div className="flex items-center gap-4 text-sm text-primary-foreground/70 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            <ShieldCheck className="w-6 h-6" style={{ color: '#00ADEF' }} />
            <p>تسجيل دخول آمن وموحد لمنسوبي الجامعة والطلاب</p>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md">
          
          <div className="md:hidden flex flex-col items-center text-center mb-8">
            <div className="mb-4 p-3 bg-primary/5 rounded-3xl border border-primary/10 shadow-md">
              <UniversityLogo size={64} variant="icon" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-1">Imamu TechVerse</h1>
            <p className="text-muted-foreground text-sm">جامعة الإمام محمد بن سعود الإسلامية</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-foreground">تسجيل الدخول</h2>
            <p className="text-muted-foreground">أدخل بيانات الحساب الجامعي للمتابعة</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">البريد الإلكتروني الجامعي</label>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-12 pl-4 py-3.5 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                  placeholder="name@imamu.edu.sa"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">كلمة المرور</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-12 pl-4 py-3.5 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm font-medium border border-destructive/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">فشل تسجيل الدخول</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            )}

            {error && (
              <button
                type="button"
                onClick={() => { setError(''); setEmail(''); setPassword(''); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-muted text-muted-foreground hover:text-foreground rounded-xl border border-border text-sm font-medium transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] font-bold text-lg disabled:opacity-70 flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
            >
              {isLoading ? 'جاري التحقق...' : 'دخول'}
              {!isLoading && <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Credentials hint */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border text-xs text-muted-foreground">
            <p className="font-bold mb-2 text-foreground">بيانات تجريبية:</p>
            <p>طالب: <span className="font-medium text-foreground">ahmed.ali@imamu.edu.sa</span> / <span className="font-medium text-foreground">student123</span></p>
            <p className="mt-1">مسؤول: <span className="font-medium text-foreground">sarah.admin@imamu.edu.sa</span> / <span className="font-medium text-foreground">admin123</span></p>
          </div>

          <div className="mt-6 pt-6 border-t border-border/60">
            <p className="text-center text-sm text-muted-foreground font-medium mb-4">دخول تجريبي سريع</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDemoLogin('student')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <UniversityLogo size={28} variant="icon" className="group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">بوابة الطالب</span>
              </button>
              <button
                onClick={() => handleDemoLogin('admin')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-border hover:border-secondary hover:bg-secondary/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-secondary/10 flex items-center justify-center transition-colors">
                  <ShieldCheck className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                </div>
                <span className="text-sm font-bold text-foreground group-hover:text-secondary transition-colors">بوابة الإدارة</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
