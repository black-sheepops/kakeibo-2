"use client";


import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // カレンダーのCSSをインポート
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; // 1行でこれだけ！
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";


ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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

export default function Home() {
  // --- ① すべての useState（状態管理）をコンポーネントのトップレベルに綺麗に並べる ---
  const [isMounted, setIsMounted] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [activeButtonId, setActiveButtonId] = useState<number | null>(null);
  const [autoButtons, setAutoButtons] = useState<AutoButton[]>([]);
  const [btnLabel, setBtnLabel] = useState<string>("");
  const [btnAmount, setBtnAmount] = useState<string>("");
  const [btnCategory, setBtnCategory] = useState<string>("");
  const [btnMemo, setBtnMemo] = useState<string>("");
  const [btnPayment, setBtnPayment] = useState<string>("現金");
  const [editingBtnId, setEditingBtnId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [date, setDate] = useState(getTodayString());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [records, setRecords] = useState<KakeiboRecord[]>([]);
  const [schedules, setSchedules] = useState<AutoSchedule[]>([]);
  const [isSettingMode, setIsSettingMode] = useState<boolean>(false);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth() + 1);

  // スケジュール登録フォーム用
  const [schLabel, setSchLabel] = useState<string>("");
  const [schAmount, setSchAmount] = useState<string>("");
  const [schCategory, setSchCategory] = useState<string>("");
  const [schMemo, setSchMemo] = useState<string>("");
  const [schPayment, setSchPayment] = useState<string>("現金");
  const [schInterval, setSchInterval] = useState<"monthly" | "weekly">("monthly");
  const [schDay, setSchDay] = useState<string>("1");
  const [editingId, setEditingId] = useState<number | null>(null);

  const quickPresets = [
    { label: "練習", amount: "500", category: "バドミントン" },
    { label: "コンビニ", amount: "300", category: "食費" },
  ];

  const quickCategories = ["食費", "外食", "日用品", "バドミントン", "自動車", "交通費", "固定費", "その他"];
  const paymentMethods = ["現金", "クレジットカード", "QR決済", "その他"];
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  // --- ② 起動時にスケジュールをチェックして自動入力するコアロジック ---
  const checkAndTriggerAutoInput = async (currentSchedules: any[]) => {
    const today = new Date();
    const todayStr = getTodayString();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const currentDay = today.getDate();
    const currentDayOfWeek = today.getDay();

    const newInserts = [];
    const updatedScheduleIds: number[] = [];

    for (const sch of currentSchedules) {
      let targetDateStr;
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

      if (shouldExecute) {
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
          last_executed_at: sch.interval_type === "monthly" ? currentMonthStr : todayStr 
        }).eq("id", id);
      }));
      
      fetchData(); // ここで下のfetchDataを呼び出す
      alert("🤖 定期自動入力を実行しました！");
    }
  };

  // --- ③ データを取得する本体の関数（1つに綺麗にまとめました！） ---
  const fetchData = React.useCallback(async (dateArg?: Date) => {
    // 1. 表示したい年と月を正しく取得する
    const year = dateArg ? dateArg.getFullYear() : targetYear;
    const month = dateArg ? dateArg.getMonth() + 1 : targetMonth;

    // 2. その月の「始まりの日(1日)」と「正しい終わりの日(最終日)」を計算する
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    
    // JSの裏技: 翌月の0日目を指定すると、その月の本当の最終日（30日や28日、31日）が自動で手に入ります！
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

    const { data: schData } = await supabase
      .from("auto_schedules")
      .select("*")
      .order("id", { ascending: true });
    
    if (schData) {
      setSchedules(schData);
      await checkAndTriggerAutoInput(schData);
    }

    const { data: btnData } = await supabase
      .from("auto_buttons")
      .select("*")
      .order("sort_order", { ascending: true });
    
    if (btnData) setAutoButtons(btnData);
  }, [targetYear, targetMonth]);

  // --- ④ データの変化を監視して自動実行する部分 ---
  useEffect(() => {
    setIsMounted(true);
  }, []);   

  useEffect(() => {
    const dateObj = new Date(targetYear, targetMonth - 1);
    fetchData(dateObj);
  }, [targetYear, targetMonth, fetchData]); // ★監視対象に「targetYear」と「targetMonth」を追加！

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseInt(amount, 10) <= 0 || !selectedCategory || !date) {
  alert("正しい金額とカテゴリ、日付を入力してください！");
  return;
    }
    setIsLoading(true);
    try {
      if (editingId !== null) {
        await supabase.from("kakeibo").update({ 
          amount: parseInt(amount, 10), category: selectedCategory, memo, payment_method: paymentMethod, date: date
        }).eq("id", editingId);
        alert("📝 データを修正しました！");
        setEditingId(null);
      } else {
        await supabase.from("kakeibo").insert([{ 
          amount: parseInt(amount, 10), category: selectedCategory, memo, payment_method: paymentMethod, date: date
        }]);
        alert("🎉 データベースに保存しました！");
      }
      setAmount(""); setMemo(""); setPaymentMethod("現金"); setDate(getTodayString());
      await fetchData();
    } catch (error) {
      alert("エラーが発生しました");
    } finally { setIsLoading(false); }
  };

  // スケジュール登録処理
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schLabel || !schAmount || !schCategory) {
      alert("名前、金額、カテゴリは必須です");
      return;
    }
    try {
      await supabase.from("auto_schedules").insert([{
        label: schLabel,
        amount: parseInt(schAmount, 10),
        category: schCategory,
        memo: schMemo,
        payment_method: schPayment,
        interval_type: schInterval,
        target_day: parseInt(schDay, 10),
        last_executed_at: null
      }]);
      alert("🗓️ 自動入力スケジュールを登録しました！");
      setSchLabel(""); setSchAmount(""); setSchCategory(""); setSchMemo(""); setSchPayment("現金");
      await fetchData();
    } catch (error) {
      alert("スケジュールの保存に失敗しました");
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("この自動入力スケジュールを削除しますか？")) return;
    await supabase.from("auto_schedules").delete().eq("id", id);
    await fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("このデータを履歴から削除しますか？")) return;
    try {
      await supabase.from("kakeibo").delete().eq("id", id);
      alert("🗑️ データを削除しました");
      await fetchData(); // これを呼ぶと、fetchData内で setRecords が走り、
                      // その結果 dailyTotals が再計算され、
                      // key={records.length} によってカレンダーが更新されます。
  } catch (error) {
    alert("削除に失敗しました");
  }
};

  const startEdit = (rec: KakeiboRecord) => {
    setEditingId(rec.id); setAmount(rec.amount.toString()); setSelectedCategory(rec.category); setMemo(rec.memo);
    setPaymentMethod(rec.payment_method || "現金"); setDate(rec.date || getTodayString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredRecords = records.filter(r => {
    if (!r.date) return false;
    const [y, m] = r.date.split("-");
    return parseInt(y, 10) === targetYear && parseInt(m, 10) === targetMonth;
  });

  const monthlyTotal = filteredRecords.reduce((sum, r) => sum + r.amount, 0);

  // ボタン・カレンダー集計ロジック
    const dailyTotals = filteredRecords.reduce((acc, rec) => {
    const dateStr = rec.date;
    acc[dateStr] = (acc[dateStr] || 0) + Number(rec.amount);
    return acc;
  }, {} as Record<string, number>);

  // 修正版 tileContent
  const tileContent = React.useMemo(() => {
  return ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      // toLocaleDateString('en-CA') は "YYYY-MM-DD" を返すので
      // タイムゾーンによるズレが起きません
      const dateStr = date.toLocaleDateString('en-CA');
      
      const total = dailyTotals[dateStr];
      
      return total ? (
        <div style={{ fontSize: '10px', color: '#25b330', fontWeight: 'bold' }}>
          ￥{total.toLocaleString()}
        </div>
      ) : null;
    }
  };
}, [dailyTotals]);

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
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }).reverse();

  const last6MonthsTotals = last6Months.map(m => {
    const targetPrefix = `${m.year}-${String(m.month).padStart(2, "0")}`;
    return records
      .filter(r => r.date && r.date.startsWith(targetPrefix))
      .reduce((sum, r) => sum + r.amount, 0);
  });

  const doughnutData = {
    labels: quickCategories.filter(c => (categoryTotals[c] || 0) > 0),
    datasets: [
      {
        data: quickCategories.map(c => categoryTotals[c] || 0).filter(v => v > 0),
        backgroundColor: ["#ff6384", "#36a2eb", "#cc65fe", "#ffce56", "#4bc0c0", "#ff9f40", "#a0aec0", "#48bb78"],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: last6Months.map(m => `${m.month}月`),
    datasets: [
      {
        label: "支出合計 (円)",
        data: last6MonthsTotals,
        backgroundColor: "rgba(99, 102, 241, 0.6)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
      },
    ],
  };
  // ボタン選択時の動作
 const handleAutoSelect = (btn: any) => { 
    setAmount(btn.amount.toString());
    setSelectedCategory(btn.category);
    setMemo(btn.memo);
    const method = btn.payment_method || "現金";
    setPaymentMethod(method);
    setSelectedPayment(method); // 支払い方法ボタンのUI表示を同期させる
    setDate(getTodayString());
  }
;

  // ボタンの追加・更新
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
        alert("🔘 ボタンを修正しました！");
        setEditingBtnId(null);
      } else {
        await supabase.from("auto_buttons").insert([{
          label: btnLabel, amount: parseInt(btnAmount, 10), category: btnCategory, memo: btnMemo, payment_method: btnPayment, sort_order: autoButtons.length + 1
        }]);
        alert("🆕 新しいボタンを追加しました！");
      }
      setBtnLabel(""); setBtnAmount(""); setBtnCategory(""); setBtnMemo(""); setBtnPayment("現金");
      await fetchData();
    } catch (error) { alert("ボタンの保存に失敗しました"); }
  };

  // ボタン削除
  const handleDeleteButton = async (id: number) => {
    if (!confirm("このワンタップボタンを削除しますか？")) return;
    await supabase.from("auto_buttons").delete().eq("id", id);
    await fetchData();
  };

  

return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-4 pb-12 gap-y-4">
      
      <div className="max-w-2xl mx-auto space-y-6"></div>
      {/* 🌟 1. 画面上部のタイトル */}
      <header className="w-full max-w-md py-4 text-center">
        <h1 className="text-2xl font-black text-emerald-700">🍀コツコツ家計簿🍀</h1>
      </header>
      
      {/* 🍀 メインカード */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 border border-gray-100">

        {/* 設定トグル */}
      <div className="flex justify-end w-full mb-6 bg-red-100">
          <button 
            onClick={() => setIsSettingMode(!isSettingMode)} 
            className="text-[10px] font-bold px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            {isSettingMode ? "⬅ 入力画面へ" : "⚙ 設定・定期管理"}
          </button>
        </div>
        

        {isSettingMode ? (
          /* =========================================
             ⚙️ 設定モード（裏画面）
             ワンタップボタンと定期ルールの管理をここに集約
             ========================================= */
          <div className="animate-fade-in">
            {/* --- ① ワンタップボタン管理 --- */}
            <h2 className="text-base font-bold text-gray-300 mb-4 flex items-center gap-1">⚙️管理画面⚙️</h2>
            <p className="text-[11px] text-gray-200 mb-4">クイックボタン登録</p>
            <div className="space-y-2 mb-4">
              {autoButtons.map((btn) => (
                <div key={btn.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl border text-xs">
                  <button onClick={() => { setEditingBtnId(btn.id); setBtnLabel(btn.label); setBtnAmount(btn.amount.toString()); 
                    setBtnCategory(btn.category); setBtnMemo(btn.memo); setBtnPayment(btn.payment_method || "現金"); }} 
                    className="font-bold text-indigo-600 text-left hover:underline">
                    {btn.label} <span className="text-gray-400 font-normal">({btn.category} / ￥{btn.amount})</span>
                  </button>
                  <button onClick={() => handleDeleteButton(btn.id)} className="text-red-500 font-bold px-2">削除</button>
                </div>
              ))}
            </div>
            <form onSubmit={handleButtonSubmit} className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
              <input type="text" placeholder="ボタンの表示名 (例: 家賃、ジムなど)" value={btnLabel} onChange={(e) => setBtnLabel(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
              <input type="number" placeholder="金額 (円)" value={btnAmount} onChange={(e) => setBtnAmount(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
              <select value={btnCategory} onChange={(e) => setBtnCategory(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white">
                <option value="">-- カテゴリ --</option>
                {quickCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={btnPayment} onChange={(e) => setBtnPayment(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white">
                {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input type="text" placeholder="自動入力メモ" value={btnMemo} onChange={(e) => setBtnMemo(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition">{editingBtnId ? "ボタンを更新" : "ボタンを追加"}</button>
            </form>

            <hr className="my-8 border-dashed border-gray-300" />

            {/* --- ② 定期ルール管理 --- */}
            <div className="mb-2">
              
              <p className="text-[11px] text-gray-200 mb-4">固定費の登録・編集</p>
              
              <div className="space-y-2 mb-4">
                {schedules.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2 bg-gray-50 rounded-xl border">登録されているスケジュールはありません</p>
                ) : (
                  schedules.map((sch) => (
                    <div key={sch.id} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl border text-xs">
                      <div>
                        <div className="font-bold text-gray-700">{sch.label} <span className="text-emerald-600">(￥{sch.amount.toLocaleString()})</span></div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          🔄 {sch.interval_type === "monthly" ? `毎月 ${sch.target_day} 日` : `毎週 ${weekDays[sch.target_day]}曜日`} / 💳 {sch.payment_method}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteSchedule(sch.id)} className="text-red-500 font-bold px-2 hover:underline">削除</button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleScheduleSubmit} className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-3">
                <p className="text-xs font-bold text-emerald-800">＋ 新しい定期ルールを追加</p>
                <input type="text" placeholder="名前 (例: ○○生命保険、ジム月謝)" value={schLabel} onChange={(e) => setSchLabel(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
                <input type="number" placeholder="金額 (円)" value={schAmount} onChange={(e) => setSchAmount(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
                
                <div className="grid grid-cols-2 gap-2">
                  <select value={schCategory} onChange={(e) => setSchCategory(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white">
                    <option value="">-- カテゴリ --</option>
                    {quickCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={schPayment} onChange={(e) => setSchPayment(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white">
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="bg-white p-2 rounded-lg border grid grid-cols-2 gap-2 items-center text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">繰り返しの周期</label>
                    <select value={schInterval} onChange={(e) => { setSchInterval(e.target.value as "monthly" | "weekly"); setSchDay(e.target.value === "monthly" ? "1" : "0"); }} className="w-full p-1 border rounded bg-gray-50 font-medium">
                      <option value="monthly">毎月固定</option>
                      <option value="weekly">毎週固定</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">{schInterval === "monthly" ? "指定する日付" : "指定する曜日"}</label>
                    <select value={schDay} onChange={(e) => setSchDay(e.target.value)} className="w-full p-1 border rounded bg-gray-50 font-medium">
                      {schInterval === "monthly" 
                        ? Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}日</option>)
                        : weekDays.map((w, idx) => <option key={idx} value={idx}>{w}曜日</option>)
                      }
                    </select>
                  </div>
                </div>

                <input type="text" placeholder="自動入力用のメモ (空欄でもOK)" value={schMemo} onChange={(e) => setSchMemo(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
                <button type="submit" className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition">スケジュールに登録</button>
              </form>
            </div>
          </div>
        ) : (
      
          /* =========================================
             ⚡ 通常の家計簿入力画面（表画面）
             ========================================= */
      <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid grid-cols-4 gap-2">
              {autoButtons.map((btn) => (
                <button 
                  type="button" 
                  key={btn.id} 
                  onClick={() => handleAutoSelect(btn)}
                  style={{
                    padding: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb', // border-gray-200相当
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // shadow-sm相当
                    height: '56px', // h-14相当
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}

                  // 押した時に少し沈む演出
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >

                  <div style={{ fontWeight: '800', fontSize: '11px', color: '#1f2937', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {btn.label}
                  </div>
                  <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>
                    ￥{btn.amount.toLocaleString()}
                  </div>
                </button>
              ))}
      </div>     

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">📅 日付</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">💰 金額 (円)</label>
                <input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} className="w-full p-4 border-2 border-emerald-400 rounded-2xl text-3xl font-black text-center text-emerald-700 bg-emerald-50/20" />
              </div>

              {/* 📂 カテゴリ */}
              <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">カテゴリ</p>
              <div className="grid grid-cols-4 gap-2">
                {quickCategories.map((cat) => (
                  <button 
                      type="button" 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        border: '2px solid',
                        // 選択中はエメラルド、未選択は白
                        backgroundColor: selectedCategory === cat ? '#059669' : '#ffffff',
                        color: selectedCategory === cat ? '#ffffff' : '#374151',
                        borderColor: selectedCategory === cat ? '#059669' : '#d1d5db',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s', // 色変化のみスムーズに
                        fontWeight: 'bold',
                        fontSize: '10px'
                      }}
                    >
                      {cat}
                    </button>
                ))}
              </div>
            </div>

              {/* 💳 支払い方法 */}
              <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">支払い</p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <button 
                      type="button" 
                      key={method} 
                      // 修正：ここを setSelectedPayment に変更
                      onClick={() => setSelectedPayment(method)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        border: '2px solid',
                        // 修正：選択判定を selectedPayment に変更
                        backgroundColor: selectedPayment === method ? '#059669' : '#ffffff',
                        color: selectedPayment === method ? '#ffffff' : '#374151',
                        borderColor: selectedPayment === method ? '#059669' : '#d1d5db',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        fontWeight: 'bold',
                        fontSize: '10px'
                      }}
                    >
                      {method}
                    </button>
                ))}
              </div>
            </div>


              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">メモ</label>
                <input type="text" placeholder="店名や固定費の詳細など" value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full p-2.5 border rounded-xl text-xs" />
              </div>

              {/* ✨ 登録ボタン */}
              <div className="pt-4 flex justify-center">
                <button 
                  type="submit" 
                  style={{
                    width: '50%',
                    padding: '8px 0',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    fontWeight: '900',
                    borderRadius: '10px',
                    fontSize: '10x',
                    border: 'none', // 影を削除
                    cursor: 'pointer',
                    transition: 'background-color 0.1s'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                  onMouseUp={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                >

                  ✨ 登録する
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 📊 集計・レポートカード */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 mt-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-bold text-gray-800">📊 支出レポート</h2>
          <div className="flex items-center gap-1">
            <select value={targetYear} onChange={(e) => setTargetYear(parseInt(e.target.value, 10))} className="p-1 text-xs border rounded bg-gray-50 font-bold">
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select value={targetMonth} onChange={(e) => setTargetMonth(parseInt(e.target.value, 10))} className="p-1 text-xs border rounded bg-gray-50 font-bold">
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
            <p className="text-xs font-bold text-gray-400">【カテゴリ別】</p>
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

        <div className="border-t pt-4">
          <p className="text-xs font-bold text-gray-400 mb-2">【合計(カテゴリ別) ({targetMonth}月)】</p>
          <div className="grid grid-cols-2 gap-2">
            {quickCategories.map(c => (
              <div key={c} className="bg-gray-50 p-2 rounded-lg border text-xs flex justify-between">
                <span className="font-bold text-gray-500">{c}:</span>
                <span className="font-bold text-gray-800">{(categoryTotals[c] || 0).toLocaleString()} 円</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs font-bold text-gray-400 mb-2">【合計(支払い方法別) ({targetMonth}月)】</p>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map(m => (
              <div key={m} className="bg-gray-50 p-2 rounded-lg border text-xs flex justify-between">
                <span className="font-bold text-gray-500">{m}:</span>
                <span className="font-bold text-gray-800">{(paymentTotals[m] || 0).toLocaleString()} 円</span>
              </div>
            ))}
          </div>
        </div>
      </div>


       {/* 📅 カレンダー表示をここに配置 */}

      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-3">📅 登録履歴</h2>
        {isMounted && ( // isMounted が true になるまで表示しない
          <Calendar
            onActiveStartDateChange={({ activeStartDate }) => {
              if (activeStartDate) {
                // 1. レポートや履歴リスト用の年月を先月に変更する
                setTargetYear(activeStartDate.getFullYear());
                setTargetMonth(activeStartDate.getMonth() + 1);
                // 2. ★超重要★ カレンダー自身が今見ている年月も「先月」に同期させる！
                setCurrentViewDate(activeStartDate);
              }
            }}
            tileContent={tileContent}
          />
        )}
      </div>

      {/* 🕒 最近の履歴リスト */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 mt-6">
        
        <p className="text-xs font-bold text-gray-400 mb-2"> リスト({targetMonth}月)</p>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {filteredRecords.length === 0 ? (
            <p className="text-xs text-center text-gray-400 py-4">データがありません</p>
          ) : (
            filteredRecords.map((rec) => (
              <div key={rec.id} className="p-2.5 bg-gray-50 rounded-xl border text-xs flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                      {rec.date ? rec.date.replace(/^\d{4}-/, "") : "なし"}
                    </span>
                    <span className="px-1.5 py-0.5 font-bold bg-indigo-100 text-indigo-700 rounded">{rec.category}</span>
                    <span className="px-1.5 py-0.5 font-bold bg-emerald-100 text-emerald-800 rounded">{rec.payment_method || "現金"}</span>
                  </div>
                  <div className="text-gray-500 pl-0.5">{rec.memo}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">￥{rec.amount.toLocaleString()}</span>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => startEdit(rec)} className="text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-1 rounded">編集</button>
                    <button onClick={() => handleDelete(rec.id)} className="text-red-500 font-bold text-[10px] bg-red-50 px-2 py-1 rounded">削除</button>
                  </div>
                </div>
              </div>
            ))
          )}
         </div> 
      </div>
    </main>
  );
} // ここでHomeコンポーネントを閉じる
