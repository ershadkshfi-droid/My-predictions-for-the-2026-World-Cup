import { Home, CalendarDays, Target, Trophy, Medal, ShieldAlert, ListOrdered } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MENU_ITEMS = [
  { icon: Home, label: 'اللوحة الرئيسية', href: '/' },
  { icon: CalendarDays, label: 'جدول المباريات', href: '/matches' },
  { icon: ListOrdered, label: 'ترتيب المجموعات', href: '/groups' },
  { icon: Target, label: 'توقعاتي', href: '/predictions' },
  { icon: Medal, label: 'المتصدرين', href: '/leaderboard' },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Container */}
      <aside 
        className={`fixed md:sticky top-0 right-0 h-[100dvh] w-72 bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800/60 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6 md:p-8 flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Trophy className="w-6 h-6 text-white" />
           </div>
           <h1 className="font-bold text-2xl text-neutral-900 dark:text-white tracking-tight">
             توقعات <span className="text-emerald-500">2026</span>
           </h1>
        </div>

        <nav className="flex-1 px-4 md:px-6 space-y-1.5 mt-2 overflow-y-auto">
          {MENU_ITEMS.map((item, idx) => (
            <NavLink 
              key={idx}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/80 font-medium'}`}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 z-10 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-emerald-500 transition-colors'}`} />
                  <span className="z-10">{item.label}</span>
                  
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-500 rounded-l-full"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-800">
               <NavLink 
                 to="/admin"
                 onClick={onClose}
                 className={({ isActive }) => `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold`}
               >
                 <ShieldAlert className="w-5 h-5" />
                 <span>لوحة الإدارة</span>
               </NavLink>
            </div>
          )}
        </nav>

        <div className="p-6 mt-auto">
           <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-3xl text-white relative overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-emerald-500/30 transition-all">
              <div className="relative z-10">
                <p className="text-sm font-medium text-emerald-100/90 mb-1">نقاطي الكلية</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight">{userProfile?.total_points || 0}</span>
                  <span className="text-sm font-medium text-emerald-100">نقطة</span>
                </div>
              </div>
              
              {/* Decorative Blur Circles */}
              <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
              <div className="absolute -right-10 -top-10 w-24 h-24 bg-teal-300/20 rounded-full blur-xl group-hover:bg-teal-300/30 transition-all duration-500"></div>
           </div>
        </div>
      </aside>
    </>
  );
}
