import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Sun, Moon, Search, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence, motion } from 'motion/react';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { userProfile, user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const displayName = userProfile?.username || user?.email?.split('@')[0] || 'مستخدم';
  const displayRole = userProfile?.role === 'admin' ? 'مدير النظام' : 'توقع جديد';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const notifications = [
    { id: 1, text: "مرحباً بك في منصة التوقعات!", time: "منذ ٥ دقائق", read: false },
    { id: 2, text: "تم تحديث إعدادات النظام بنجاح.", time: "منذ ساعتين", read: true },
  ];

  return (
    <header className="h-[88px] bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/60 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between transition-colors">
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden lg:flex items-center relative group">
          <Search className="w-5 h-5 absolute right-4 text-neutral-400 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="ابحث عن ديربي، دوري، أو صديق..." 
            className="w-80 lg:w-[360px] bg-neutral-100/80 dark:bg-neutral-900/80 text-neutral-900 dark:text-white rounded-2xl py-3 pr-12 pl-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all border border-transparent focus:bg-white dark:focus:bg-neutral-900 placeholder:text-neutral-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 w-auto">
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all group"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all group relative"
          >
            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-neutral-900"></span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-2xl overflow-hidden z-50 text-right"
              >
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                  <h3 className="font-bold text-neutral-900 dark:text-white">التنبيهات</h3>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">جديد</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">{notification.text}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-neutral-100 dark:border-neutral-800">
                  <button className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline transition-all">تحديد الكل كمقروء</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-800 mx-2 hidden sm:block"></div>

        <button 
          onClick={() => signOut()}
          className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
          title="تسجيل الخروج"
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-2xl pr-2">
          <img 
            src={userProfile?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${displayName}&backgroundColor=d1fae5`}
            alt="User Avatar" 
            className="w-10 h-10 rounded-xl bg-neutral-200 object-cover shadow-sm border border-neutral-200 dark:border-neutral-800"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${displayName}&backgroundColor=d1fae5` }}
          />
          <div className="hidden sm:flex flex-col text-right mr-1 min-w-[80px]">
            <span className="text-sm font-bold text-neutral-900 dark:text-white leading-tight mb-0.5">{displayName}</span>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 leading-tight">{displayRole}</span>
          </div>
        </div>
      </div>

    </header>
  );
}
