'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  Settings,
  PieChart as PieIcon,
  Tag,
} from 'lucide-react';
import { USERS, CATEGORIES_INCOME, CATEGORIES_OUTCOME } from '@/lib/constants';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CashFlowDashboardProps {
  activeUserId: number;
}

export default function CashFlowDashboard({ activeUserId }: CashFlowDashboardProps) {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);

  // Form states
  const [jenis, setJenis] = useState<'Income' | 'Outcome'>('Outcome');
  const [nominal, setNominal] = useState('');
  const [kategori, setKategori] = useState(CATEGORIES_OUTCOME[0]);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan] = useState('');
  const [txUserId, setTxUserId] = useState(activeUserId);

  const [budgetLimitInput, setBudgetLimitInput] = useState('');

  // Fetch transactions & budget
  const { data: txData, mutate: mutateTx } = useSWR(
    `/api/transaksi?month=${selectedMonth}&userId=${selectedUserFilter}`,
    fetcher
  );

  const { data: budgetData, mutate: mutateBudget } = useSWR(
    `/api/anggaran?month=${selectedMonth}`,
    fetcher
  );

  const stats = txData?.stats || { totalIncome: 0, totalOutcome: 0, netSaldo: 0 };
  const transactions = txData?.data || [];
  const budgetLimit = budgetData?.data?.batas_nominal || 3500000;

  // Budget calculations
  const budgetSpent = stats.totalOutcome;
  const budgetPercentage = Math.min(Math.round((budgetSpent / budgetLimit) * 100), 100);
  const isBudgetWarning = budgetSpent >= budgetLimit * 0.8;
  const isBudgetExceeded = budgetSpent > budgetLimit;

  // Category Breakdown
  const categoryTotals: { [key: string]: number } = {};
  transactions
    .filter((t: any) => t.jenis === 'Outcome')
    .forEach((t: any) => {
      categoryTotals[t.kategori] = (categoryTotals[t.kategori] || 0) + t.nominal;
    });

  const openAddModal = (txToEdit?: any) => {
    if (txToEdit) {
      setEditingTx(txToEdit);
      setJenis(txToEdit.jenis);
      setNominal(txToEdit.nominal.toString());
      setKategori(txToEdit.kategori);
      setTanggal(new Date(txToEdit.tanggal).toISOString().slice(0, 10));
      setCatatan(txToEdit.catatan || '');
      setTxUserId(txToEdit.id_pengguna);
    } else {
      setEditingTx(null);
      setJenis('Outcome');
      setNominal('');
      setKategori(CATEGORIES_OUTCOME[0]);
      setTanggal(new Date().toISOString().slice(0, 10));
      setCatatan('');
      setTxUserId(activeUserId);
    }
    setIsAddModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || parseFloat(nominal) <= 0) {
      alert('Masukkan nominal transaksi yang valid.');
      return;
    }

    const payload = {
      id_transaksi: editingTx?.id_transaksi,
      jenis,
      nominal: parseFloat(nominal),
      kategori,
      tanggal,
      catatan,
      id_pengguna: txUserId,
    };

    const method = editingTx ? 'PUT' : 'POST';
    const res = await fetch('/api/transaksi', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (result.success) {
      setIsAddModalOpen(false);
      mutateTx();
    } else {
      alert('Gagal menyimpan: ' + result.error);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    const res = await fetch(`/api/transaksi?id=${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      mutateTx();
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetLimitInput || parseFloat(budgetLimitInput) <= 0) return;

    const res = await fetch('/api/anggaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: selectedMonth,
        batas_nominal: parseFloat(budgetLimitInput),
      }),
    });

    const result = await res.json();
    if (result.success) {
      setIsBudgetModalOpen(false);
      mutateBudget();
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Month & User Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none"
          >
            <option value="all">Semua Pengguna</option>
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>
                Oleh {u.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Saldo */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">Sisa Net Saldo Bersama</span>
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black tracking-tight">
            Rp {stats.netSaldo.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Kalkulasi real-time Pemasukan - Pengeluaran</p>
        </div>

        {/* Total Income */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Total Pemasukan</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-800">
            Rp {stats.totalIncome.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Total Outcome */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Total Pengeluaran</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-800">
            Rp {stats.totalOutcome.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Monthly Budget Progress Card */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isBudgetExceeded
          ? 'bg-rose-50 border-rose-200'
          : isBudgetWarning
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isBudgetExceeded ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
            ) : (
              <PieIcon className="w-5 h-5 text-emerald-600" />
            )}
            <h3 className="text-sm font-bold text-slate-800">Batas Budget Bulan Ini</h3>
          </div>
          <button
            onClick={() => {
              setBudgetLimitInput(budgetLimit.toString());
              setIsBudgetModalOpen(true);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            Atur Limit
          </button>
        </div>

        <div className="flex justify-between items-baseline mb-2 text-xs">
          <span className="font-medium text-slate-600">
            Terpakai: <strong className="text-slate-900">Rp {budgetSpent.toLocaleString('id-ID')}</strong>
          </span>
          <span className="font-medium text-slate-500">
            Limit: Rp {budgetLimit.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-500 ${
              isBudgetExceeded
                ? 'bg-rose-600'
                : isBudgetWarning
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${budgetPercentage}%` }}
          />
        </div>

        {isBudgetExceeded ? (
          <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
            ⚠️ Peringatan: Pengeluaran bersama telah MELAMPAUI batas budget!
          </p>
        ) : isBudgetWarning ? (
          <p className="text-xs font-semibold text-amber-600">
            ⚠️ Perhatian: Pengeluaran telah mencapai {budgetPercentage}% dari batas budget.
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            Sisa Kuota Budget: <strong className="text-slate-700">Rp {(budgetLimit - budgetSpent).toLocaleString('id-ID')}</strong> ({100 - budgetPercentage}%)
          </p>
        )}
      </div>

      {/* Spending Breakdown by Category */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            Pengeluaran Berdasarkan Kategori
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries(categoryTotals).map(([cat, total]) => {
              const pct = Math.round((total / (stats.totalOutcome || 1)) * 100);
              return (
                <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{cat}</span>
                    <span>Rp {total.toLocaleString('id-ID')} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction History List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Riwayat Transaksi</h3>
          <span className="text-xs font-semibold text-slate-400">{transactions.length} item</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Belum ada transaksi di bulan ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx: any) => {
              const isIncome = tx.jenis === 'Income';
              const userObj = USERS.find((u) => u.id === tx.id_pengguna) || USERS[0];

              return (
                <div key={tx.id_transaksi} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{tx.kategori}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${userObj.badgeColor}`}>
                          {userObj.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(tx.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {tx.catatan && ` • ${tx.catatan}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-extrabold ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {isIncome ? '+' : '-'} Rp {tx.nominal.toLocaleString('id-ID')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAddModal(tx)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id_transaksi)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingTx ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
            </h3>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Jenis Transaksi */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setJenis('Outcome');
                    setKategori(CATEGORIES_OUTCOME[0]);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    jenis === 'Outcome' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Pengeluaran (-)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJenis('Income');
                    setKategori(CATEGORIES_INCOME[0]);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    jenis === 'Income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Pemasukan (+)
                </button>
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  placeholder="Contoh: 50000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800"
                  required
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800 bg-white"
                >
                  {(jenis === 'Outcome' ? CATEGORIES_OUTCOME : CATEGORIES_INCOME).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Diinput Oleh */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Diinput Oleh</label>
                <select
                  value={txUserId}
                  onChange={(e) => setTxUserId(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800 bg-white"
                >
                  {USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Makan siang bareng Egie"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Atur Batas Budget Bulanan</h3>
            <p className="text-xs text-slate-500 mb-4">Untuk bulan {selectedMonth}</p>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Batas Budget Maksimal (Rp)</label>
                <input
                  type="number"
                  value={budgetLimitInput}
                  onChange={(e) => setBudgetLimitInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-md"
                >
                  Simpan Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
