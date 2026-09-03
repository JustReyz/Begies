'use client';

import React from 'react';
import { Wallet, CalendarCheck } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'cashflow' | 'schedule';
  onChangeTab: (tab: 'cashflow' | 'schedule') => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 px-6 py-2 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        <button
          onClick={() => onChangeTab('cashflow')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'cashflow'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Wallet className={`w-5 h-5 ${activeTab === 'cashflow' ? 'scale-110' : ''}`} />
          <span className="text-[11px]">Arus Kas</span>
        </button>

        <button
          onClick={() => onChangeTab('schedule')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'schedule'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <CalendarCheck className={`w-5 h-5 ${activeTab === 'schedule' ? 'scale-110' : ''}`} />
          <span className="text-[11px]">Jadwal Kelas</span>
        </button>
      </div>
    </nav>
  );
}
