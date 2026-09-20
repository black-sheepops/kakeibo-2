// components/ReportSection.tsx
import React from 'react';
import { Bar, Doughnut } from "react-chartjs-2";

// 1. Propsの型を定義
interface ReportSectionProps {
  targetYear: number;
  setTargetYear: (year: number) => void;
  targetMonth: number;
  setTargetMonth: (month: number) => void;
  monthlyTotal: number;
  doughnutData: any; // Chart.jsのデータ形式は複雑なため、一旦anyとしています
  barData: any;
  quickCategories: string[];
  categoryTotals: { [key: string]: number }; // キーが文字列、値が数値のオブジェクト
  paymentMethods: string[];
  paymentTotals: { [key: string]: number };
}

// 2. 引数に型を適用
export default function ReportSection({ 
  targetYear, setTargetYear, targetMonth, setTargetMonth, 
  monthlyTotal, doughnutData, barData, quickCategories, 
  categoryTotals, paymentMethods, paymentTotals 
}: ReportSectionProps) {
  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 mt-6 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-base font-bold text-gray-800">📊 支出レポート</h2>
        <div className="flex items-center gap-1">
          <select 
            value={targetYear} 
            onChange={(e) => setTargetYear(parseInt(e.target.value, 10))} 
            className="p-1 text-xs border rounded bg-gray-50 font-bold"
          >
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select 
            value={targetMonth} 
            onChange={(e) => setTargetMonth(parseInt(e.target.value, 10))} 
            className="p-1 text-xs border rounded bg-gray-50 font-bold"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
          </select>
        </div>
      </div>

      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
        <span className="text-xs font-bold text-emerald-950">{targetMonth}月の総合計支出:</span>
        <span className="text-xl font-black text-emerald-600">{monthlyTotal.toLocaleString()} 円</span>
      </div>

      {monthlyTotal > 0 ? (
        <div className="space-y-2">
          <div className="w-48 h-48 mx-auto">
            <Doughnut data={doughnutData} options={{ plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } } }} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-center text-gray-400 py-4">※選択された年月のデータがありません</p>
      )}

      <div className="border-t pt-4 space-y-2">
        <p className="text-xs font-bold text-gray-400">【過去6ヶ月推移】</p>
        <div className="w-full h-40">
          <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      {/* カテゴリ別・支払い別合計エリアはそのまま */}
      <div className="border-t pt-4">
        <p className="text-[12px] font-bold text-gray-400 mb-2">【合計(カテゴリ別) ({targetMonth}月)】</p>
        <div className="grid grid-cols-2 gap-3">
          {quickCategories.map(c => (
            <div key={c} className="bg-gray-50 p-3 rounded-lg border text-[10px] flex justify-between">
              <span className="font-bold text-gray-500">{c}:</span>
              <span className="font-bold text-gray-800">{(categoryTotals[c] || 0).toLocaleString()} 円</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-[12px] font-bold text-gray-400 mb-2">【合計(支払い方法別) ({targetMonth}月)】</p>
        <div className="grid grid-cols-2 gap-3">
          {paymentMethods.map(m => (
            <div key={m} className="bg-gray-50 p-3 rounded-lg border text-[9.5px] flex justify-between">
              <span className="font-bold text-gray-500">{m}:</span>
              <span className="font-bold text-gray-800">{(paymentTotals[m] || 0).toLocaleString()} 円</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}