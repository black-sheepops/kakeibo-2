import React from "react";
import AppButton from "./AppButton";
import { AutoButton } from '../types/index';

// データ構造に応じた型定義


interface InputFormProps {
  autoButtons: AutoButton[];
  handleAutoSelect: (btn: AutoButton) => void;
  handleSubmit: (e: React.FormEvent) => void;
  date: string;
  setDate: (date: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedPayment: string;
  setSelectedPayment: (payment: string) => void;
  memo: string;
  setMemo: (memo: string) => void;
  quickCategories: string[];
  paymentMethods: string[];
}

export default function InputForm({
  autoButtons, handleAutoSelect, handleSubmit,
  date, setDate, amount, setAmount,
  selectedCategory, setSelectedCategory,
  selectedPayment, setSelectedPayment,
  memo, setMemo, quickCategories, paymentMethods
}: InputFormProps) {
  return (
    <div className="space-y-6">
      {/* ⚡ クイック入力ボタン群 */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 mb-2">ワンタップ登録</p>

        <div className="grid grid-cols-4 gap-2">
          {autoButtons.map((btn, index) => (
            <AppButton
              key={index}
              onClick={() => handleAutoSelect?.(btn)}
              className="w-full h-16 flex flex-col justify-center items-center bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-500 transition px-1"
            >
              <div className="w-full text-center px-0.5">
                <span className="block font-bold text-[10px] text-gray-700 leading-tight break-words">
                  {btn.label}
                </span>
                <span className="block text-[10px] font-semibold text-emerald-600 mt-0.5">
                  ￥{btn.amount.toLocaleString()}
                </span>
              </div>
            </AppButton>
          ))}
        </div>
      </div>

      {/* 📝 入力フォーム */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="space-y-6">
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="w-full p-5 border border-gray-200 rounded-xl text-lg font-bold"
          />
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="金額を入力"
            className="w-full p-5 border border-gray-200 rounded-xl text-3xl font-bold text-center"
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 mb-2">カテゴリ</p>
            <div className="grid grid-cols-3 gap-2">
              {quickCategories.map((cat) => (
                <AppButton key={cat} onClick={() => setSelectedCategory(cat)}
                  variant={selectedCategory === cat ? "main" : "sub"} className="text-[10px]">
                  {cat}
                </AppButton>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 mb-2">支払い方法</p>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => (
                <AppButton key={method} onClick={() => setSelectedPayment(method)}
                  variant={selectedPayment === method ? "main" : "sub"} className="text-[10px]">
                  {method}
                </AppButton>
              ))}
            </div>
          </div>
        </div>

        <input type="text" placeholder="メモ" value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full p-3 border rounded-xl text-xs" />
        <AppButton type="submit" variant="main" className="w-full py-4 text-lg">✨ 登録する</AppButton>
      </form>
    </div>
  );
}