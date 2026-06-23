import { Users, Swords, Settings, ShieldCheck, Gamepad2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const ADMIN_MENU_ITEMS = [
  { icon: Users, label: 'إدارة المستخدمين', href: '/admin/users' },
  { icon: Swords, label: 'إدارة المباريات', href: '/admin/matches' },
  { icon: Gamepad2, label: 'إدارة النتائج', href: '/admin/results' },
  { icon: Settings, label: 'الإعدادات', href: '/admin/settings' },
];

export function SidebarAdmin({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
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
        className={`fixed md:sticky top-0 right-0 h-[100dvh] w-72 bg-neutral-900 border-l border-neutral-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6 md:p-8 flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
           </div>
           <h1 className="font-bold text-xl text-white tracking-tight">
             لوحة <span className="text-rose-500">الإدارة</span>
           </h1>
        </div>

        <nav className="flex-1 px-4 md:px-6 space-y-2 mt-2 overflow-y-auto">
          {ADMIN_MENU_ITEMS.map((item, idx) => (
            <NavLink 
              key={idx}
              to={item.href}
              className={({ isActive }) => `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden ${isActive ? 'bg-rose-500/10 text-rose-400 font-bold' : 'text-neutral-400 hover:bg-neutral-800 font-medium hover:text-white'}`}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 z-10 ${isActive ? 'text-rose-400' : 'text-neutral-500 group-hover:text-white transition-colors'}`} />
                  <span className="z-10">{item.label}</span>
                  
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-rose-500 rounded-l-full"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
          
          <div className="pt-8 mt-8 border-t border-neutral-800">
             <NavLink 
               to="/"
               className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 text-neutral-400 hover:bg-neutral-800 font-medium hover:text-white"
             >
               العودة للمنصة
             </NavLink>
          </div>
        </nav>
      </aside>
    </>
  );
}
