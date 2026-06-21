"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { supabase } from "../lib/supabaseClient";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import 'react-calendar/dist/Calendar.css';

// カレンダーのSSR（サーバーサイドレンダリング）エラーを防ぐための動的インポート
const Calendar = dynamic(() => import('react-calendar'), { ssr: false });

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// 型定義
interface KakeiboRecord {
  id: number;
  created_at: string;
  date: string;
  amount: number;
  category: string;
  memo: string;
  payment_method: string;
}

interface AutoSchedule {
  id: number;
  label: string;
  amount: number;
  category: string;
  payment_method: string;
  memo: string;
  interval_type: "monthly" | "weekly";
  target_day: number;
  last_executed_at: string | null;
}

interface AutoButton {
  id: number;
  label: string;
  amount: number;
  category: string;
  memo: string;
  payment_method: string;
  sort_order: number;
}

// 共通ボタンコンポーネント（見た目を統一するためファイル内に配置）
function AppButton({ children, onClick, type = "button", variant = "sub", className = "" }: { children: React.ReactNode, onClick?: () => void, type?: "button" | "submit" | "reset", variant?: 'main' | 'sub' | 'danger', className?: string }) {
  const getBackgroundColor = (v: string) => {
    switch (v) {
      case 'main': return '#059669'; // emerald-600
      case 'danger': return '#fef2f2'; // red-50
      default: return '#f3f4f6'; // gray-100
    }
  };
  const getTextColor = (v: string) => {
    switch (v) {
      case 'main': return '#ffffff';
      case 'danger': return '#ef4444'; // red-500
      default: return '#4b5563'; // gray-600
    }
  };
  return (
    <button
      type={type}
      onClick={onClick}
      style={{ backgroundColor: getBackgroundColor(variant), color: getTextColor(variant) }}
      className={`px-4 py-2 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center ${className}`}
    >
      {children}
    </button>
  );
}

export default function Home() {
  // ① すべての useState をトップレベルで宣言
  const [isMounted, setIsMounted] = useState(false);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [isSettingMode, setIsSettingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 取得したデータ群
  const [records, setRecords] = useState<KakeiboRecord[]>([]);
  const [schedules, setSchedules] = useState<AutoSchedule[]>([]);
  const [autoButtons, setAutoButtons] = useState<AutoButton[]>([]);

  // 📝 通常入力フォーム用
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [date, setDate] = useState(getTodayString());
  const [editingId, setEditingId] = useState<string | null>(null);

  // ⚙️ ワンタップボタン設定フォーム用
  const [btnLabel, setBtnLabel] = useState("");
  const [btnAmount, setBtnAmount] = useState("");
  const [btnCategory, setBtnCategory] = useState("");
  const [btnMemo, setBtnMemo] = useState("");
  const [btnPayment, setBtnPayment] = useState("現金");
  const [editingBtnId, setEditingBtnId] = useState<number | null>(null);

  // ⚙️ 定期ルール（固定費）設定フォーム用
  const [schLabel, setSchLabel] = useState("");
  const [schAmount, setSchAmount] = useState("");
  const [schCategory, setSchCategory] = useState("");
  const [schMemo, setSchMemo] = useState("");
  const [schPayment, setSchPayment] = useState("現金");
  const [schInterval, setSchInterval] = useState<"monthly" | "weekly">("monthly");
  const [schDay, setSchDay] = useState("1");
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);

  // 定数
  const quickCategories = ["食費", "外食", "日用品", "バドミントン", "自動車", "交通費", "固定費", "その他"];
  const paymentMethods = ["現金", "クレジットカード", "QR決済", "その他"];
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  // ② 自動入力チェックロジック
  const checkAndTriggerAutoInput = async (currentSchedules: AutoSchedule[]) => {
    const today = new Date();
    const todayStr = getTodayString();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const currentDay = today.getDate();
    const currentDayOfWeek = today.getDay();

    const newInserts = [];
    const updatedScheduleIds: number[] = [];

    for (const sch of currentSchedules) {
      let targetDateStr = "";
      let shouldExecute = false;

      if (sch.interval_type === "monthly") {
        if (currentDay >= sch.target_day && sch.last_executed_at !== currentMonthStr) {
          shouldExecute = true;
          targetDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(sch.target_day).padStart(2, "0")}`;
        }
      } else if (sch.interval_type === "weekly") {
        if (currentDayOfWeek === sch.target_day && sch.last_executed_at !== todayStr) {
          shouldExecute = true;
          targetDateStr = todayStr;
        }
      }

      if (shouldExecute && targetDateStr) {
        const { data: existing } = await supabase
          .from("kakeibo")
          .select("id")
          .eq("memo", `[自動] ${sch.memo || sch.label}`)
          .eq("date", targetDateStr)
          .single();

        if (!existing) {
          newInserts.push({
            amount: sch.amount,
            category: sch.category,
            memo: `[自動] ${sch.memo || sch.label}`,
            payment_method: sch.payment_method,
            date: targetDateStr
          });
          updatedScheduleIds.push(sch.id);
        }
      }
    }

    if (newInserts.length > 0) {
      await supabase.from("kakeibo").insert(newInserts);
      await Promise.all(updatedScheduleIds.map(id => {
        const sch = currentSchedules.find(s => s.id === id);
        return supabase.from("auto_schedules").update({
          last_executed_at: sch?.interval_type === "monthly" ? currentMonthStr : todayStr
        }).eq("id", id);
      }));
      fetchData();
      alert("🤖 定期自動入力を実行しました！");
    }
  };

  // ③ データ取得ロジック
  const fetchData = React.useCallback(async (dateArg?: Date) => {
    const year = dateArg ? dateArg.getFullYear() : targetYear;
    const month = dateArg ? dateArg.getMonth() + 1 : targetMonth;
    const sixMonthsAgoDate = new Date(year, month - 1 - 5, 1);
    const startDate = `${sixMonthsAgoDate.getFullYear()}-${String(sixMonthsAgoDate.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const { data: recData } = await supabase
      .from("kakeibo")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (recData) setRecords(recData);

    const { data: schData } = await supabase.from("auto_schedules").select("*").order("id", { ascending: true });
    if (schData) {
      setSchedules(schData);
      await checkAndTriggerAutoInput(schData);
    }

    const { data: btnData } = await supabase.from("auto_buttons").select("*").order("sort_order", { ascending: true });
    if (btnData) setAutoButtons(btnData);
  }, [targetYear, targetMonth]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const dateObj = new Date(targetYear, targetMonth - 1);
      fetchData(dateObj);
    }
  }, [targetYear, targetMonth, fetchData, isMounted]);

  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());

  // ④ アクション系関数群
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedCategory || !date) {
      alert("金額、カテゴリ、日付を入力してください！");
      return;
    }
    setIsLoading(true);
    try {
      if (editingId !== null) {
        await supabase.from("kakeibo").update({
          amount: parseInt(amount, 10), category: selectedCategory, memo, payment_method: paymentMethod, date: date
        }).eq("id", editingId);
        setEditingId(null);
      } else {
        await supabase.from("kakeibo").insert([{
          amount: parseInt(amount, 10), category: selectedCategory, memo, payment_method: paymentMethod, date: date
        }]);
      }
      setAmount(""); setMemo(""); setSelectedCategory(""); setPaymentMethod("現金"); setDate(getTodayString());
      await fetchData();
    } catch (error) {
      alert("エラーが発生しました");
    } finally { setIsLoading(false); }
  };

  const handleButtonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!btnLabel || !btnAmount || !btnCategory) {
      alert("ボタン名、金額、カテゴリは必須です");
      return;
    }
    try {
      if (editingBtnId !== null) {
        await supabase.from("auto_buttons").update({
          label: btnLabel, amount: parseInt(btnAmount, 10), category: btnCategory, memo: btnMemo, payment_method: btnPayment
        }).eq("id", editingBtnId);
        setEditingBtnId(null);
      } else {
        await supabase.from("auto_buttons").insert([{
          label: btnLabel, amount: parseInt(btnAmount, 10), category: btnCategory, memo: btnMemo, payment_method: btnPayment, sort_order: autoButtons.length + 1
        }]);
      }
      setBtnLabel(""); setBtnAmount(""); setBtnCategory(""); setBtnMemo(""); setBtnPayment("現金");
      await fetchData();
    } catch (error) { alert("ボタンの保存に失敗しました"); }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schLabel || !schAmount || !schCategory) {
      alert("名前、金額、カテゴリは必須です");
      return;
    }
    try {
      if (editingScheduleId) {
        await supabase.from("auto_schedules").update({
          label: schLabel, amount: parseInt(schAmount, 10), category: schCategory, memo: schMemo, payment_method: schPayment, interval_type: schInterval, target_day: parseInt(schDay, 10)
        }).eq("id", editingScheduleId);
      } else {
        await supabase.from("auto_schedules").insert([{
          label: schLabel, amount: parseInt(schAmount, 10), category: schCategory, memo: schMemo, payment_method: schPayment, interval_type: schInterval, target_day: parseInt(schDay, 10), last_executed_at: null
        }]);
      }
      setSchLabel(""); setSchAmount(""); setSchCategory(""); setSchMemo(""); setSchPayment("現金");
      setEditingScheduleId(null);
      await fetchData();
    } catch (error) { alert("スケジュールの保存に失敗しました"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("このデータを履歴から削除しますか？")) return;
    await supabase.from("kakeibo").delete().eq("id", id);
    await fetchData();
  };

  const handleDeleteButton = async (id: number) => {
    if (!confirm("このワンタップボタンを削除しますか？")) return;
    await supabase.from("auto_buttons").delete().eq("id", id);
    await fetchData();
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("この自動入力スケジュールを削除しますか？")) return;
    await supabase.from("auto_schedules").delete().eq("id", id);
    await fetchData();
  };

  const startEdit = (rec: KakeiboRecord) => {
    setEditingId(String(rec.id)); setAmount(rec.amount.toString()); setSelectedCategory(rec.category); setMemo(rec.memo); setPaymentMethod(rec.payment_method || "現金"); setDate(rec.date || getTodayString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ワンタップボタンが押された時の処理（ここで全項目がフォームに反映されます）
  const handleAutoSelect = (btn: AutoButton) => {
    setAmount(btn.amount.toString());
    setSelectedCategory(btn.category);
    setMemo(btn.memo);
    setPaymentMethod(btn.payment_method || "現金");
    setDate(getTodayString());
  };

  // ⑤ 集計用データ生成
  const filteredRecords = records.filter(r => {
    if (!r.date) return false;
    const [y, m] = r.date.split("-");
    return parseInt(y, 10) === targetYear && parseInt(m, 10) === targetMonth;
  });

  const monthlyTotal = filteredRecords.reduce((sum, r) => sum + r.amount, 0);

  const dailyTotals = filteredRecords.reduce((acc, rec) => {
    const dateStr = rec.date;
    acc[dateStr] = (acc[dateStr] || 0) + Number(rec.amount);
    return acc;
  }, {} as Record<string, number>);

  const categoryTotals = filteredRecords.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);

  const paymentTotals = filteredRecords.reduce((acc, r) => {
    const method = r.payment_method || "現金";
    acc[method] = (acc[method] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(targetYear, targetMonth - 1);
    d.setMonth(d.getMonth() - i);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }).reverse();

  const last6MonthsTotals = last6Months.map(m => {
    const targetPrefix = `${m.year}-${String(m.month).padStart(2, "0")}`;
    return records.filter(r => r.date && r.date.startsWith(targetPrefix)).reduce((sum, r) => sum + Number(r.amount), 0);
  });

  const doughnutData = {
    labels: quickCategories.filter(c => (categoryTotals[c] || 0) > 0),
    datasets: [{
      data: quickCategories.map(c => categoryTotals[c] || 0).filter(v => v > 0),
      backgroundColor: ["#ff6384", "#36a2eb", "#cc65fe", "#ffce56", "#4bc0c0", "#ff9f40", "#a0aec0", "#48bb78"],
      borderWidth: 1,
    }],
  };

  const barData = {
    labels: last6Months.map(m => `${m.month}月`),
    datasets: [{
      label: "支出合計 (円)",
      data: last6MonthsTotals,
      backgroundColor: "rgba(16, 185, 129, 0.6)",
      borderColor: "rgb(16, 185, 129)",
      borderWidth: 1,
    }],
  };

  const tileContent = React.useMemo(() => {
    return ({ date, view }: { date: Date; view: string }) => {
      if (view === 'month') {
        const dateStr = date.toLocaleDateString('en-CA');
        const total = dailyTotals[dateStr];
        return total ? (
          <div style={{ fontSize: '10px', color: '#059669', fontWeight: 'bold', marginTop: '2px' }}>
            ￥{total.toLocaleString()}
          </div>
        ) : null;
      }
    };
  }, [dailyTotals]);

  // SSR回避
  if (!isMounted) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p>読み込み中...</p></div>;

  return (
    <main className="min-h-screen w-full bg-gray-50 flex flex-col items-center p-4 overflow-x-hidden">
      <div className="w-full max-w-md flex flex-col gap-6 h-full flex-1">
        
        {/* 🌟 ヘッダー */}
        <header className="flex justify-between items-center py-2">
          <h1 className="text-xl font-black text-emerald-700">🍀コツコツ家計簿🍀</h1>
          <button onClick={() => setIsSettingMode(!isSettingMode)} className="text-xs font-bold px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition active:scale-95">
            {isSettingMode ? "⬅ 戻る" : "⚙ 設定"}
          </button>
        </header>

        {isSettingMode ? (
          /* ==================================================
             ⚙️ 設定モード画面
             ================================================== */
          <div className="flex flex-col gap-6 flex-1">
            
            {/* ワンタップボタン設定カード */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-gray-700 border-b pb-2">🎯 ワンタップボタン設定</h2>
              <div className="grid grid-cols-2 gap-2">
                {autoButtons.map(btn => (
                  <div key={btn.id} className="flex flex-col justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <button type="button" onClick={() => { setEditingBtnId(btn.id); setBtnLabel(btn.label); setBtnAmount(btn.amount.toString()); setBtnCategory(btn.category); setBtnMemo(btn.memo); setBtnPayment(btn.payment_method || "現金"); }} className="text-left mb-2 group active:scale-95 transition-all">
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
                  <AppButton type="submit" variant="main" className="flex-1 py-3 text-sm">{editingBtnId ? "🔄 更新" : "➕ 追加"}</AppButton>
                  {editingBtnId && <AppButton type="button" onClick={() => { setEditingBtnId(null); setBtnLabel(""); setBtnAmount(""); setBtnCategory(""); setBtnMemo(""); setBtnPayment("現金"); }} className="flex-1 py-3 text-sm">キャンセル</AppButton>}
                </div>
              </form>
            </div>

            {/* 定期ルール（固定費）設定カード */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-gray-700 border-b pb-2">🔄 定期ルール（固定費）管理</h2>
              <div className="flex flex-col gap-2">
                {schedules.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">登録データがありません</p> : schedules.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <button type="button" onClick={() => { setEditingScheduleId(s.id); setSchLabel(s.label); setSchAmount(s.amount.toString()); setSchCategory(s.category); setSchPayment(s.payment_method || "現金"); setSchInterval(s.interval_type); setSchDay(s.target_day.toString()); setSchMemo(s.memo); }} className="text-left flex-1 active:scale-95 transition-all">
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
                <div className="grid grid-cols-2 gap-2">
                  <select value={schInterval} onChange={(e) => { setSchInterval(e.target.value as "monthly" | "weekly"); setSchDay(e.target.value === "monthly" ? "1" : "0"); }} className="p-2.5 text-xs border border-gray-200 rounded-xl bg-white">
                    <option value="monthly">毎月固定</option>
                    <option value="weekly">毎週固定</option>
                  </select>
                  <select value={schDay} onChange={(e) => setSchDay(e.target.value)} className="p-2.5 text-xs border border-gray-200 rounded-xl bg-white">
                    {schInterval === "monthly" ? Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}日</option>) : weekDays.map((w, idx) => <option key={idx} value={idx}>{w}曜日</option>)}
                  </select>
                </div>
                <input type="text" placeholder="メモ" value={schMemo} onChange={(e) => setSchMemo(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
                <div className="flex gap-2">
                  <AppButton type="submit" variant="main" className="flex-1 py-3 text-sm">{editingScheduleId ? "🔄 更新" : "➕ 追加"}</AppButton>
                  {editingScheduleId && <AppButton type="button" onClick={() => { setEditingScheduleId(null); setSchLabel(""); setSchAmount(""); setSchCategory(""); setSchMemo(""); setSchPayment("現金"); }} className="flex-1 py-3 text-sm">キャンセル</AppButton>}
                </div>
              </form>
            </div>
            
          </div>
        ) : (
          /* ==================================================
             ⚡ 通常の家計簿入力画面（表画面）
             ================================================== */
          <div className="flex flex-col gap-6 flex-1 w-full">
            
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

            {/* 📝 入力フォームカード */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-5">
              <div className="flex gap-3">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 p-3 border border-gray-200 rounded-xl text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-400 transition" />
              </div>
              <input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="金額を入力" className="w-full p-4 border-2 border-emerald-400 rounded-2xl text-3xl font-black text-center text-emerald-700 bg-emerald-50/20 focus:outline-none focus:ring-4 focus:ring-emerald-50 transition" />
              
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-2 px-1">カテゴリ</p>
                <div className="grid grid-cols-4 gap-2">
                  {quickCategories.map((cat) => (
                    <AppButton type="button" key={cat} onClick={() => setSelectedCategory(cat)} variant={selectedCategory === cat ? "main" : "sub"} className="py-2.5 text-[10px]">
                      {cat}
                    </AppButton>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-2 px-1">支払い方法</p>
                <div className="grid grid-cols-4 gap-2">
                  {paymentMethods.map((method) => (
                    <AppButton type="button" key={method} onClick={() => setPaymentMethod(method)} variant={paymentMethod === method ? "main" : "sub"} className="py-2.5 text-[10px]">
                      {method}
                    </AppButton>
                  ))}
                </div>
              </div>

              <input type="text" placeholder="メモを入力 (任意)" value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition" />
              
              <div className="flex gap-3 pt-2">
                <AppButton type="submit" variant="main" className="flex-1 py-4 text-base">{editingId ? "🔄 更新する" : "✨ 記録する"}</AppButton>
                {editingId && <AppButton type="button" onClick={() => { setEditingId(null); setAmount(""); setMemo(""); setSelectedCategory(""); setPaymentMethod("現金"); setDate(getTodayString()); }} className="w-1/3 py-4 text-sm">キャンセル</AppButton>}
              </div>
            </form>

{/* 📊 レポートカード */}
<div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
  <div className="flex justify-between items-center border-b pb-3">
    <h2 className="text-sm font-bold text-gray-700">📊 支出レポート</h2>
    <div className="flex gap-2">
      <select value={targetYear} onChange={(e) => setTargetYear(parseInt(e.target.value, 10))} className="p-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 font-bold focus:outline-none">
        {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
      </select>
      <select value={targetMonth} onChange={(e) => setTargetMonth(parseInt(e.target.value, 10))} className="p-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 font-bold focus:outline-none">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
      </select>
    </div>
  </div>

  {/* 合計表示 */}
  <div className="text-center py-2">
    <p className="text-[10px] font-bold text-gray-400">今月の合計支出</p>
    <p className="text-3xl font-black text-gray-800 tracking-tight">￥{monthlyTotal.toLocaleString()}</p>
  </div>

  {/* 円グラフ（カテゴリ合計） */}
  <div className="h-48 w-full flex justify-center">
    {doughnutData.datasets[0].data.length > 0 ? (
      <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
    ) : (
      <div className="flex items-center text-xs text-gray-400">データなし</div>
    )}
  </div>

  {/* 詳細テーブルエリア */}
  <div className="grid grid-cols-2 gap-4 text-[11px]">
    {/* カテゴリ別内訳 */}
    <div>
      <p className="font-bold text-gray-400 mb-2">カテゴリ別</p>
      <div className="space-y-1">
        {Object.entries(categoryTotals).map(([cat, total]) => (
          <div key={cat} className="flex justify-between border-b pb-1">
            <span className="text-gray-600">{cat}</span>
            <span className="font-bold">￥{total.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
    {/* 支払別内訳 */}
    <div>
      <p className="font-bold text-gray-400 mb-2">支払別</p>
      <div className="space-y-1">
        {Object.entries(paymentTotals).map(([pay, total]) => (
          <div key={pay} className="flex justify-between border-b pb-1">
            <span className="text-gray-600">{pay}</span>
            <span className="font-bold">￥{total.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>

            {/* 📅 カレンダーカード (画面いっぱいに広がるように修正) */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col flex-1 w-full min-h-[400px]">
              <h2 className="text-sm font-bold text-gray-700 mb-3 px-2">📅 登録履歴カレンダー</h2>
              <div className="flex-1 w-full h-full [&>.react-calendar]:w-full [&>.react-calendar]:h-full [&>.react-calendar]:border-none [&>.react-calendar]:font-bold [&>.react-calendar]:text-sm">
                <Calendar
                  onChange={(value) => {
                    const d = value as Date;
                    setTargetYear(d.getFullYear());
                    setTargetMonth(d.getMonth() + 1);
                    setCurrentViewDate(d);
                  }}
                  onActiveStartDateChange={({ activeStartDate }) => {
                    if (activeStartDate) {
                      setTargetYear(activeStartDate.getFullYear());
                      setTargetMonth(activeStartDate.getMonth() + 1);
                      setCurrentViewDate(activeStartDate);
                    }
                  }}
                  activeStartDate={currentViewDate}
                  tileContent={tileContent}
                />
              </div>
            </div>

            {/* 🕒 履歴リストカード */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-gray-700 border-b pb-2">🕒 最近の履歴 ({targetMonth}月)</h2>
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                {filteredRecords.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">データがありません</p>
                ) : (
                  filteredRecords.map((rec) => (
                    <div key={rec.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex flex-col gap-1 min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-500 bg-white border px-1.5 py-0.5 rounded shadow-sm">{rec.date ? rec.date.replace(/^\d{4}-/, "") : "なし"}</span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{rec.category}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{rec.payment_method || "現金"}</span>
                        </div>
                        <div className="text-xs text-gray-600 truncate">{rec.memo}</div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1.5">
                        <div className="font-bold text-sm text-gray-800">￥{rec.amount.toLocaleString()}</div>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(rec)} className="text-[10px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-600 active:scale-95">編集</button>
                          <button onClick={() => handleDelete(rec.id)} className="text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-500 active:scale-95">削除</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}