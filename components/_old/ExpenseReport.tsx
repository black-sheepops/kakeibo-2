"use client";

import React from "react";

interface ExpenseReportProps {
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  totalExpense: number;
  categoryTotals: { [key: string]: number };
  recentTransactions: any[];
  onEdit: (tx: any) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseReport({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  totalExpense,
  categoryTotals,
  recentTransactions,
  onEdit,
  onDelete,
}: ExpenseReportProps) {
  const years = Array.from({ length: 5 }, (_, i) => String(2024 + i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-5 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-gray-800 text-lg">📊 支出レポート</h2>
        <div className="flex gap-2">
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-gray-50 focus:outline-none"
          >
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-gray-50 focus:outline-none"
          >
            {months.map(m => <option key={m} value={m}>{m}月</option>)}
          </select>
        </div>
      </div>

      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-600">{selectedMonth}月の総合計支出</span>
        <span className="text-xl font-black text-emerald-700">￥{totalExpense.toLocaleString()}</span>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-gray-400 px-1">【カテゴリ別】</h3>
        {Object.keys(categoryTotals).length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">データがありません</p>
        ) : (
          Object.entries(categoryTotals).map(([cat, amount]) => (
            <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-xs">
              <span className="font-bold text-gray-700">{cat}</span>
              <span className="font-black text-gray-800">￥{amount.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <h3 className="text-xs font-bold text-gray-400 px-1">【最近の記録】</h3>
        {recentTransactions.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">最近の履歴はありません</p>
        ) : (
          recentTransactions.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl text-xs bg-white">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-400">{tx.date} ({tx.category})</span>
                <span className="font-bold text-gray-700">{tx.memo || "メモなし"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-gray-800">￥{Number(tx.amount).toLocaleString()}</span>
                <button onClick={() => onEdit(tx)} className="text-emerald-600 font-bold hover:underline">編集</button>
                <button onClick={() => onDelete(tx.id)} className="text-red-400 font-bold hover:underline">削除</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}