import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, Info, Sparkles, Clock, Ban } from 'lucide-react';
import {
  getStudentNotifications,
  getUnreadCount,
  markNotificationsRead,
  StudentNotification,
} from '../services/emailService';

interface NotificationPanelProps {
  userId: string;
}

export function NotificationPanel({ userId }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = () => {
    const notifs = getStudentNotifications(userId);
    setNotifications(notifs);
    setUnread(getUnreadCount(userId));
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (open) {
      markNotificationsRead(userId);
      setUnread(0);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const getIcon = (type: StudentNotification['type']) => {
    switch (type) {
      case 'block': return <Ban className="w-4 h-4 text-destructive" />;
      case 'absence_warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'waitlist_promo': return <Sparkles className="w-4 h-4 text-green-600" />;
      case 'reminder': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getBg = (type: StudentNotification['type'], read: boolean) => {
    if (read) return 'bg-card';
    switch (type) {
      case 'block': return 'bg-destructive/5 border-destructive/20';
      case 'absence_warning': return 'bg-orange-50 border-orange-200';
      case 'waitlist_promo': return 'bg-green-50 border-green-200';
      case 'reminder': return 'bg-blue-50 border-blue-200';
      default: return 'bg-primary/5 border-primary/20';
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10"
        title="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-12 w-80 bg-card rounded-2xl shadow-2xl border border-border z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">الإشعارات</h3>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 bg-destructive text-white text-[10px] font-black rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.some(n => !n.read) && (
                <button
                  onClick={() => { markNotificationsRead(userId); setUnread(0); refresh(); }}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                  title="تحديد الكل كمقروء"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 transition-colors ${!notif.read ? getBg(notif.type, false) + ' border-r-2' : 'hover:bg-muted/30'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === 'block' ? 'bg-destructive/10' :
                        notif.type === 'absence_warning' ? 'bg-orange-100' :
                        notif.type === 'waitlist_promo' ? 'bg-green-100' :
                        notif.type === 'reminder' ? 'bg-blue-100' : 'bg-primary/10'
                      }`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground leading-snug mb-0.5">{notif.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {new Date(notif.createdAt).toLocaleString('ar-SA', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
