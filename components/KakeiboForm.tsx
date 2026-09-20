"use client";

import React from "react";

interface KakeiboFormProps {
  date: string;
  setDate: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  memo: string;
  setMemo: (val: string) => void;
  editingId: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  quickCategories: string[];
  paymentMethods: string[];
  AppButton: any; // 共通ボタンコンポーネントを受け取る
}

export default function KakeiboForm({
  date,
  setDate,
  amount,
  setAmount,
  selectedCategory,
  setSelectedCategory,
  paymentMethod,
  setPaymentMethod,
  memo,
  setMemo,
  editingId,
  onSubmit,
  onCancelEdit,
  quickCategories,
  paymentMethods,
  AppButton,
}: KakeiboFormProps) {
  return (
    <form onSubmit={onSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-5">
      <div className="flex gap-3">
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="flex-1 p-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-400 transition" 
        />
      </div>
      
      <input 
        type="text" 
        inputMode="numeric" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} 
        placeholder="金額を入力" 
        className="w-full p-4 border-2 border-emerald-400 rounded-2xl text-3xl font-black text-center text-emerald-700 bg-emerald-50/20 focus:outline-none focus:ring-4 focus:ring-emerald-50 transition" 
      />
      
      <div>
        <p className="text-[10px] font-bold text-gray-400 mb-2 px-1">カテゴリ</p>
        <div className="grid grid-cols-4 gap-2">
          {quickCategories.map((cat) => (
            <AppButton 
              type="button" 
              key={cat} 
              onClick={() => setSelectedCategory(cat)} 
              variant={selectedCategory === cat ? "main" : "sub"} 
              className="py-2.5 text-[10px]"
            >
              {cat}
            </AppButton>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-gray-400 mb-2 px-1">支払い方法</p>
        <div className="grid grid-cols-4 gap-2">
          {paymentMethods.map((method) => (
            <AppButton 
              type="button" 
              key={method} 
              onClick={() => setPaymentMethod(method)} 
              variant={paymentMethod === method ? "main" : "sub"} 
              className="py-2.5 text-[10px]"
            >
              {method}
            </AppButton>
          ))}
        </div>
      </div>

      <input 
        type="text" 
        placeholder="メモを入力 (任意)" 
        value={memo} 
        onChange={(e) => setMemo(e.target.value)} 
        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition" 
      />
      
      <div className="flex gap-3 pt-2">
        <AppButton type="submit" variant="main" className="flex-1 py-4 text-base">
          {editingId ? "🔄 更新する" : "✨ 記録する"}
        </AppButton>
        {editingId && (
          <AppButton type="button" onClick={onCancelEdit} className="w-1/3 py-4 text-sm">
            キャンセル
          </AppButton>
        )}
      </div>
    </form>
  );
}