"use client";

import React from "react";
import { AutoButton, AutoSchedule } from "@/types/kakeibo";

type Props = {
  autoButtons: AutoButton[];
  schedules: AutoSchedule[];
  quickCategories: string[];
  paymentMethods: string[];
  weekDays: string[];
  // ボタン設定用
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
  editingBtnId: number | null;
  handleButtonSubmit: (e: React.FormEvent) => void;
  startEditButton: (btn: AutoButton) => void;
  cancelEditButton: () => void;
  handleDeleteButton: (id: number) => void;
  // 定期ルール設定用
  schLabel: string;
  setSchLabel: (val: string) => void;
  schAmount: string;
  setSchAmount: (val: string) => void;
  schCategory: string;
  setSchCategory: (val: string) => void;
  schMemo: string;
  setSchMemo: (val: string) => void;
  schPayment: string;
  setSchPayment: (val: string) => void;
  schInterval: "monthly" | "weekly";
  setSchInterval: (val: "monthly" | "weekly") => void;
  schDay: string;
  setSchDay: (val: string) => void;
  editingScheduleId: number | null;
  handleScheduleSubmit: (e: React.FormEvent) => void;
  startEditSchedule: (s: AutoSchedule) => void;
  cancelEditSchedule: () => void;
  handleDeleteSchedule: (id: number) => void;
};

export default function SettingManager({
  autoButtons,
  schedules,
  quickCategories,
  paymentMethods,
  weekDays,
  btnLabel, setBtnLabel, btnAmount, setBtnAmount, btnCategory, setBtnCategory, btnMemo, setBtnMemo, btnPayment, setBtnPayment, editingBtnId, handleButtonSubmit, startEditButton, cancelEditButton, handleDeleteButton,
  schLabel, setSchLabel, schAmount, setSchAmount, schCategory, setSchCategory, schMemo, setSchMemo, schPayment, setSchPayment, schInterval, setSchInterval, schDay, setSchDay, editingScheduleId, handleScheduleSubmit, startEditSchedule, cancelEditSchedule, handleDeleteSchedule
}: Props) {
  return (
    <div className="flex flex-col gap-6 flex-1">
      {/* ワンタップボタン設定カード */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-gray-700 border-b pb-2">🎯 ワンタップボタン設定</h2>
        <div className="grid grid-cols-2 gap-2">
          {autoButtons.map(btn => (
            <div key={btn.id} className="flex flex-col justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <button type="button" onClick={() => startEditButton(btn)} className="text-left mb-2 group active:scale-95 transition-all">
                <div className="font-bold text-indigo-600 text-xs">{btn.label}</div>
                <div className="text-[10px] text-gray-500 mt-1">{btn.category} / 💳 {btn.payment_method}</div>
                <div className="font-bold text-gray-700 text-xs mt-1">￥{btn.amount.toLocaleString()}</div>
              </button>
              <button type="button" onClick={() => handleDeleteButton(btn.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold self-end active:scale-95">🗑 削除</button>
            </div>
          ))}
        </div>
        <form onSubmit={handleButtonSubmit} className="flex flex-col gap-3 mt-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50">
          <input type="text" placeholder="ボタン名" value={btnLabel} onChange={(e) => setBtnLabel(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <input type="number" placeholder="金額" value={btnAmount} onChange={(e) => setBtnAmount(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <div className="grid grid-cols-2 gap-2">
            <select value={btnCategory} onChange={(e) => setBtnCategory(e.target.value)} className="p-2.5 text-xs border border-gray-200 rounded-xl bg-white">
              <option value="">-- カテゴリ --</option>
              {quickCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={btnPayment} onChange={(e) => setBtnPayment(e.target.value)} className="p-2.5 text-xs border border-gray-200 rounded-xl bg-white">
              {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <input type="text" placeholder="メモ" value={btnMemo} onChange={(e) => setBtnMemo(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-3 text-sm bg-emerald-600 text-white font-bold rounded-xl">{editingBtnId ? "🔄 更新" : "➕ 追加"}</button>
            {editingBtnId && <button type="button" onClick={cancelEditButton} className="flex-1 py-3 text-sm bg-gray-100 text-gray-600 font-bold rounded-xl">キャンセル</button>}
          </div>
        </form>
      </div>

      {/* 定期ルール（固定費）設定カード */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-gray-700 border-b pb-2">🔄 定期ルール（固定費）管理</h2>
        <div className="flex flex-col gap-2">
          {schedules.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">登録データがありません</p> : schedules.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <button 
                type="button" 
                onClick={() => startEditSchedule(s)} 
                className="text-left flex-1 active:scale-95 transition-all"
              >
                <div className="font-bold text-emerald-700 text-xs">{s.label} <span className="text-gray-600">({s.amount.toLocaleString()}円)</span></div>
                <div className="text-[10px] text-gray-500 mt-1">🔄 {s.interval_type === "monthly" ? `毎月${s.target_day}日` : `毎週${weekDays[s.target_day]}曜`} / 💳 {s.payment_method}</div>
              </button>
              <button type="button" onClick={() => handleDeleteSchedule(s.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold px-2 active:scale-95">🗑 削除</button>
            </div>
          ))}
        </div>
        <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-3 mt-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-50">
          <input type="text" placeholder="名前" value={schLabel} onChange={(e) => setSchLabel(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <input type="number" placeholder="金額" value={schAmount} onChange={(e) => setSchAmount(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <div className="grid grid-cols-2 gap-2">
            <select value={schCategory} onChange={(e) => setSchCategory(e.target.value)} className="p-2.5 text-xs border border-gray-200 rounded-xl bg-white">
              <option value="">-- カテゴリ --</option>
              {quickCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={schPayment} onChange={(e) => setSchPayment(e.target.value)} className="p-2.5 text-xs border border-gray-200 rounded-xl bg-white">
              {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
              <select 
                value={schInterval} 
                onChange={(e) => { 
                  setSchInterval(e.target.value as "monthly" | "weekly"); 
                  setSchDay("1"); 
                }} 
                className="p-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50 flex-1"
              >
                <option value="monthly">毎月固定</option>
                <option value="weekly">毎週固定</option>
              </select>

              <select 
                value={schDay} 
                onChange={(e) => setSchDay(e.target.value)} 
                className="p-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50 flex-1"
              >
                {schInterval === "monthly" ? (
                  Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>{d}日</option>
                  ))
                ) : (
                  <>
                    <option value="1">月曜日</option>
                    <option value="2">火曜日</option>
                    <option value="3">水曜日</option>
                    <option value="4">木曜日</option>
                    <option value="5">金曜日</option>
                    <option value="6">土曜日</option>
                    <option value="7">日曜日</option>
                  </>
                )}
              </select>
            </div>
          <input type="text" placeholder="メモ" value={schMemo} onChange={(e) => setSchMemo(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-3 text-sm bg-emerald-600 text-white font-bold rounded-xl">{editingScheduleId !== null ? "🔄 更新" : "➕ 追加"}</button>
            {editingScheduleId !== null && (
              <button type="button" onClick={cancelEditSchedule} className="flex-1 py-3 text-sm bg-gray-100 text-gray-600 font-bold rounded-xl">キャンセル</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}