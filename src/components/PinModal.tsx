'use client';

import React, { useState } from 'react';
import { Lock, UserCheck, KeyRound } from 'lucide-react';
import { USERS } from '@/lib/constants';

interface PinModalProps {
  isOpen: boolean;
  onAuthenticated: (userId: number, userName: string) => void;
}

export default function PinModal({ isOpen, onAuthenticated }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [selectedUser, setSelectedUser] = useState<number>(1);
  const [error, setError] = useState('');
  const defaultPin = process.env.NEXT_PUBLIC_APP_PIN || '1234';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === defaultPin) {
      const user = USERS.find((u) => u.id === selectedUser) || USERS[0];
      localStorage.setItem('begies_pin_auth', 'true');
      localStorage.setItem('begies_user_id', user.id.toString());
      localStorage.setItem('begies_user_name', user.name);
      onAuthenticated(user.id, user.name);
      setPin('');
      setError('');
    } else {
      setError('PIN salah! Silakan coba lagi. (Default: 1234)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Keamanan Begies</h2>
          <p className="text-sm text-slate-500 mt-1">Masukkan PIN 4-digit & pilih profil Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Pilih Profil Pengguna
            </label>
            <div className="grid grid-cols-2 gap-3">
              {USERS.map((user) => {
                const isSelected = selectedUser === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUser(user.id)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <UserCheck className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {user.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Masukkan PIN Global
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-xl tracking-[0.5em] font-mono text-slate-800"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-rose-500 mt-2 font-medium">{error}</p>}
            <p className="text-[11px] text-slate-400 mt-1">Hint: PIN default adalah <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">1234</code></p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all text-sm"
          >
            Masuk Aplikasi
          </button>
        </form>
      </div>
    </div>
  );
}
