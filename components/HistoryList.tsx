// components/HistoryList.tsx
import React from "react";
import { AutoButton } from '../types/index';
import AppButton from './AppButton';

// ここでpage.tsxからデータや関数を受け取る設定をします
export default function HistoryList({
  records,
  targetMonth,
  onDelete,
  startEdit
}: {
  records: any[];
  targetMonth: number;
  onDelete: (id: number) => void;
  startEdit: (rec: any) => void;
}) {
  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 mt-6">
      <p className="text-xs font-bold text-gray-400 mb-2">リスト({targetMonth}月)</p>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {records.map((rec) => (
          <div key={rec.id} className="p-2.5 bg-gray-50 rounded-xl border text-xs flex justify-between items-center w-full">

            {/* 左側：min-w-0 を追加して、幅を制限する */}
            <div className="space-y-1 min-w-0 flex-1 pr-3">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded shrink-0">
                  {rec.date ? rec.date.replace(/^\d{4}-/, "") : "なし"}
                </span>
                <span className="px-1.5 py-0.5 font-bold bg-indigo-100 text-indigo-700 rounded truncate">
                  {rec.category}
                </span>
                <span className="px-1.5 py-0.5 font-bold bg-emerald-100 text-emerald-800 rounded truncate">
                  {rec.payment_method || "現金"}
                </span>
              </div>
              <div className="text-gray-500 pl-0.5 truncate">{rec.memo}</div>
            </div>

            {/* 右側：w-24 など固定幅にして、配置を揃える */}
            <div className="flex items-center gap-1 shrink-0 w-18 justify-end">
              <span className="font-bold">￥{Number(rec.amount || 0).toLocaleString()}</span>
              <div className="flex flex-col gap-1">
                <AppButton variant="sub" onClick={() => startEdit(rec)} className="text-amber-600 font-bold text-[10px] bg-amber-100 px-2 py-0.5 rounded">編集</AppButton>
                <AppButton variant="danger" onClick={() => onDelete(rec.id)} className="text-red-500 font-bold text-[10px] bg-red-100 px-2 py-0.5 rounded">削除</AppButton>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}