import React from 'react';
import { AutoButton } from '../types/index';
import AppButton from './AppButton';

// ★ここに定義を移動または追加してください
interface QuickButtonManagerProps {
  buttons: AutoButton[];
  onDelete: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  editingBtnId: string | null;
  setEditingBtnId: (id: string | null) => void;
  btnLabel: string;
  setBtnLabel: (val: string) => void;
  btnAmount: string;
  setBtnAmount: (val: string) => void;
  btnCategory: string;
  setBtnCategory: (val: string) => void;
  btnMemo: string;
  setBtnMemo: (val: string) => void;
  btnPayment: string;
  setBtnPayment: (val: string) => void;
  quickCategories: string[];
  paymentMethods: string[];
  autoButtons: AutoButton[];
  handleAutoSelect: (btn: AutoButton) => void;
}
export default function QuickButtonManager({
  onDelete,
  onSubmit,
  editingBtnId, setEditingBtnId,
  btnLabel, setBtnLabel,
  btnAmount, setBtnAmount,
  btnCategory, setBtnCategory,
  btnMemo, setBtnMemo,
  btnPayment, setBtnPayment,
  quickCategories,
  paymentMethods,
  autoButtons,
  handleAutoSelect
}: QuickButtonManagerProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 mb-2">ワンタップ登録</p>

        <div className="grid grid-cols-4 gap-2 w-full">
          {autoButtons?.map((btn) => (
            <div key={btn.id} className="relative w-full min-w-0">
              <AppButton
                onClick={() => handleAutoSelect?.(btn)}
                className="w-full h-16 flex flex-col justify-center items-center bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-500 transition"
              >
                <span className="font-bold text-[11px] truncate w-full px-1 text-gray-700">{btn.label}</span>
                <span className="text-[10px] font-semibold text-emerald-600">￥{btn.amount.toLocaleString()}</span>
              </AppButton>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // プロップスの型定義に従い、必要に応じて String() またはそのまま渡す
                  onDelete(String(btn.id)); 
                }}
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-100 text-red-800 text-[10px] rounded-full hover:bg-red-200 shadow-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    
      <form onSubmit={onSubmit} className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
        <h3 className="text-sm font-bold text-indigo-800">ボタンの編集・作成</h3>
        <input type="text" placeholder="ボタン名" value={btnLabel} onChange={(e) => setBtnLabel(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
        <input type="number" placeholder="金額" value={btnAmount} onChange={(e) => setBtnAmount(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
        
        <select value={btnCategory} onChange={(e) => setBtnCategory(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white">
          <option value="">-- カテゴリ --</option>
          {quickCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <select value={btnPayment} onChange={(e) => setBtnPayment(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white">
          {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        
        <input type="text" placeholder="メモ" value={btnMemo} onChange={(e) => setBtnMemo(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
        
        {/* 送信ボタンは form の中にあるため type="submit" で自動的に onSubmit が発火します */}
        <AppButton variant="main" type="submit" className="w-full py-2">
          {editingBtnId ? "ボタンを更新" : "ボタンを追加"}
        </AppButton>
      </form>
    </div>
  );
}