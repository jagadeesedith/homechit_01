import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      {/* Ambient fintech glows (visual only) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-[340px] -left-24 h-[320px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[-140px] h-[360px] w-[560px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>
      <Sidebar />
      <main className="min-h-screen p-4 sm:p-6 lg:p-8 lg:ml-[280px]">
        {children}
      </main>
    </div>
  );
}
