import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Layout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div dir="rtl" className="flex h-[100dvh] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans overflow-hidden transition-colors duration-300 w-full selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-100">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto w-full scroll-smooth">
           <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}
