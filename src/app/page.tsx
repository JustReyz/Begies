'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import PinModal from '@/components/PinModal';
import CashFlowDashboard from '@/components/CashFlowDashboard';
import ScheduleNotifier from '@/components/ScheduleNotifier';
import BottomNav from '@/components/BottomNav';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUserId, setActiveUserId] = useState<number>(1);
  const [activeUserName, setActiveUserName] = useState<string>('Bewwy');
  const [activeTab, setActiveTab] = useState<'cashflow' | 'schedule'>('cashflow');

  useEffect(() => {
    const authStatus = localStorage.getItem('begies_pin_auth');
    const storedUserId = localStorage.getItem('begies_user_id');
    const storedUserName = localStorage.getItem('begies_user_name');

    if (authStatus === 'true' && storedUserId && storedUserName) {
      setIsAuthenticated(true);
      setActiveUserId(parseInt(storedUserId, 10));
      setActiveUserName(storedUserName);
    }
  }, []);

  const handleAuthenticated = (userId: number, userName: string) => {
    setIsAuthenticated(true);
    setActiveUserId(userId);
    setActiveUserName(userName);
  };

  const handleLock = () => {
    localStorage.removeItem('begies_pin_auth');
    setIsAuthenticated(false);
  };

  const handleSwitchUser = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Global PIN Security Gate Modal */}
      <PinModal
        isOpen={!isAuthenticated}
        onAuthenticated={handleAuthenticated}
      />

      {isAuthenticated && (
        <>
          <Header
            activeUserId={activeUserId}
            activeUserName={activeUserName}
            onSwitchUser={handleSwitchUser}
            onLock={handleLock}
          />

          <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
            {activeTab === 'cashflow' ? (
              <CashFlowDashboard activeUserId={activeUserId} />
            ) : (
              <ScheduleNotifier activeUserId={activeUserId} />
            )}
          </main>

          <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
        </>
      )}
    </div>
  );
}
