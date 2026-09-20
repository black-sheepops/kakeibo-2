"use client";

import React from "react";
import { AutoButton } from "@/types/kakeibo";

type Props = {
  autoButtons: AutoButton[];
  handleAutoSelect: (btn: AutoButton) => void;
  date: string;
  setDate: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  quickCategories: string[];
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  paymentMethods: string[];
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  qrPaymentProvider: string;
  setQrPaymentProvider: (val: string) => void;
  qrPaymentProviders: string[];
  creditCardProviders: string[];
  creditCardProvider: string;
  setCreditCardProvider: (val: string) => void;
  memo: string;
  setMemo: (val: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  editingId: string | null;
  cancelEdit: () => void;
};

export default function QuickInputForm({
  autoButtons,
  handleAutoSelect,
  date,
  setDate,
  amount,
  setAmount,
  quickCategories,
  selectedCategory,
  setSelectedCategory,
  paymentMethods,
  paymentMethod,
  setPaymentMethod,
  qrPaymentProvider,
  setQrPaymentProvider,
  qrPaymentProviders,
  creditCardProviders,
  creditCardProvider,
  setCreditCardProvider,
  memo,
  setMemo,
  handleSubmit,
  editingId,
  cancelEdit,
}: Props) {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ワンタップ横スライドエリア */}
      {autoButtons.length > 0 && (
        <div className="flex gap-3 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {autoButtons.map((btn) => (
            <button
              type="button"
              key={btn.id}
              onClick={() => handleAutoSelect(btn)}
              className="flex-shrink-0 w-[100px] h-16 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-center items-center cursor-pointer transition-all active:scale-95 active:bg-gray-50"
            >
              <div className="font-bold text-[11px] text-gray-700 w-full overflow-hidden text-ellipsis whitespace-nowrap text-center px-2">{btn.label}</div>
              <div className="text-[10px] font-bold text-emerald-600 mt-1">￥{btn.amount.toLocaleString()}</div>
            </button>
          ))}
        </div>
      )}

      {/* 入力フォームカード */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-5">
        <div className="flex gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 p-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-400 transition" />
        </div>
        <input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="金額を入力" className="w-full p-4 border-2 border-emerald-400 rounded-2xl text-3xl font-black text-center text-emerald-700 bg-emerald-50/20 focus:outline-none focus:ring-4 focus:ring-emerald-50 transition" />
        
        <div>
          <p className="text-[10px] font-bold text-gray-400 mb-2 px-1">カテゴリ</p>
          <div className="grid grid-cols-4 gap-2">
            {quickCategories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl font-bold text-[10px] transition active:scale-95 flex items-center justify-center ${selectedCategory === cat ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 mb-2 px-1">支払い方法</p>
          <div className="grid grid-cols-4 gap-2">
            {paymentMethods.map((method) => (
              <button
                type="button"
                key={method}
                onClick={() => {
                  setPaymentMethod(method);
                  setMemo("");
                  if (method !== "QR決済") {
                    setQrPaymentProvider("");
                  }
                  if (method === "クレジットカード" && !creditCardProvider) {
                    const defaultProvider = creditCardProviders[0] || "";
                    setCreditCardProvider(defaultProvider);
                    if (defaultProvider) {
                      setMemo(defaultProvider);
                    }
                  } else if (method !== "クレジットカード") {
                    setCreditCardProvider("");
                  }
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-[10px] transition active:scale-95 flex items-center justify-center ${paymentMethod === method ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {paymentMethod === "QR決済" && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 mb-2 px-1">決済会社</p>
            <div className="grid grid-cols-3 gap-2">
              {qrPaymentProviders.map((provider) => (
                <button
                  type="button"
                  key={provider}
                  onClick={() => {
                    setQrPaymentProvider(provider);
                    setMemo(provider);
                  }}
                  className={`px-3 py-2.5 rounded-xl font-bold text-[10px] transition active:scale-95 ${
                    qrPaymentProvider === provider
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>
        )}

        {paymentMethod === "クレジットカード" && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 mb-2 px-1">カード会社</p>
            <div className="grid grid-cols-2 gap-2">
              {creditCardProviders.map((provider) => (
                <button
                  type="button"
                  key={provider}
                  onClick={() => {
                    setCreditCardProvider(provider);
                    setMemo(provider);
                  }}
                  className={`px-3 py-2.5 rounded-xl font-bold text-[10px] transition active:scale-95 ${
                    creditCardProvider === provider ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>
        )}

        <input type="text" placeholder="メモを入力 (任意)" value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition" />
        
        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 py-4 text-base bg-emerald-600 text-white rounded-xl font-bold transition active:scale-95 flex items-center justify-center">
            {editingId ? "🔄 更新する" : "✨ 記録する"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="w-1/3 py-4 text-sm bg-gray-100 text-gray-600 rounded-xl font-bold transition active:scale-95 flex items-center justify-center">
              キャンセル
            </button>
          )}
        </div>
      </form>
    </div>
  );
}