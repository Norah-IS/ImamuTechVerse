import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, mockUsersDB } from '../data/mockData';
import { isUserBlocked } from '../services/emailService';
import { getAbsenceCount } from '../services/absenceService';
import { getActivityRecord, ActivityRecord } from '../services/activityService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasCompletedPreferences: boolean;
  completePreferences: (college: string, interests: string[]) => void;
  updateUserInterests: (interests: string[]) => void;
  absenceCount: number;
  refreshAbsenceCount: () => void;
  activityRecord: ActivityRecord | null;
  refreshActivityRecord: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasCompletedPreferences, setHasCompletedPreferences] = useState(false);
  const [absenceCount, setAbsenceCount] = useState(0);
  const [activityRecord, setActivityRecord] = useState<ActivityRecord | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedPrefs = localStorage.getItem('preferencesCompleted');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as User;
      setUser(parsedUser);
      // Admins don't need preferences
      if (parsedUser.role === 'admin') {
        setHasCompletedPreferences(true);
      } else {
        setHasCompletedPreferences(savedPrefs === 'true');
        setAbsenceCount(getAbsenceCount(parsedUser.id));
        setActivityRecord(getActivityRecord(parsedUser.id));
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Validate credentials against mock DB
    const foundUser = mockUsersDB.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!foundUser) {
      return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مرة أخرى.' };
    }

    // Check if user is blocked (students only)
    if (foundUser.role === 'student' && isUserBlocked(foundUser.id)) {
      return { success: false, error: 'تم حظر حسابك مؤقتاً بسبب 3 غيابات متكررة. يرجى مراجعة إدارة شؤون الطلاب.' };
    }

    setUser(foundUser);
    localStorage.setItem('currentUser', JSON.stringify(foundUser));

    if (foundUser.role === 'admin') {
      setHasCompletedPreferences(true);
    } else {
      const prefsCompleted = localStorage.getItem('preferencesCompleted') === 'true';
      setHasCompletedPreferences(prefsCompleted);
      setAbsenceCount(getAbsenceCount(foundUser.id));
      setActivityRecord(getActivityRecord(foundUser.id));
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setHasCompletedPreferences(false);
    setAbsenceCount(0);
    setActivityRecord(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('preferencesCompleted');
  };

  const completePreferences = (college: string, selectedInterests: string[]) => {
    setHasCompletedPreferences(true);
    localStorage.setItem('preferencesCompleted', 'true');
    if (user) {
      const updatedUser = { ...user, college, interests: selectedInterests };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const updateUserInterests = (interests: string[]) => {
    if (user) {
      const updatedUser = { ...user, interests };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const refreshAbsenceCount = () => {
    if (user) setAbsenceCount(getAbsenceCount(user.id));
  };

  const refreshActivityRecord = () => {
    if (user) setActivityRecord(getActivityRecord(user.id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        hasCompletedPreferences,
        completePreferences,
        updateUserInterests,
        absenceCount,
        refreshAbsenceCount,
        activityRecord,
        refreshActivityRecord,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
