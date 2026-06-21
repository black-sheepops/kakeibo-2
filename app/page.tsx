"use client";


import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // カレンダーのCSSをインポート
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; // 1行でこれだけ！
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import HistoryList from "../components/HistoryList";
import CalendarCard from '../components/CalendarCard'
import ReportSection from '../components/ReportSection';
import InputForm from '../components/InputForm';
import SettingForm from '../components/SettingForm';
import QuickButtonManager from '../components/QuickButtonManager';
import RecurringScheduleManager from '../components/RecurringScheduleManager';
import Card from '../components/Card';
import AppButton from '@/components/AppButton';
import { AutoButton } from '../types/index';

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
  const [editingBtnId, setEditingBtnId] = useState<string | null>(null);
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
  const [scheduleLabel, setScheduleLabel] = useState<string>("");
  const [scheduleAmount, setScheduleAmount] = useState<string>("");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editingSchId, setEditingSchId] = useState<string | null>(null); // 追加

  // スケジュール登録フォーム用
  const [schLabel, setSchLabel] = useState<string>("");
  const [schAmount, setSchAmount] = useState<string>("");
  const [schCategory, setSchCategory] = useState<string>("");
  const [schMemo, setSchMemo] = useState<string>("");
  const [schPayment, setSchPayment] = useState<string>("現金");
  const [schInterval, setSchInterval] = useState<"monthly" | "weekly">("monthly");
  const [schDay, setSchDay] = useState<string>("1");
  const [editingId, setEditingId] = useState<string | null>(null);

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

    // 2. グラフ表示（過去6か月）に必要な一番古い「5か月前の1日」を計算する
    const sixMonthsAgoDate = new Date(year, month - 1 - 5, 1);
    const startDate = `${sixMonthsAgoDate.getFullYear()}-${String(sixMonthsAgoDate.getMonth() + 1).padStart(2, "0")}-01`;

    // 今月の最終日を計算する
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // 💡今月だけでなく、過去6か月分のデータをまとめてSupabaseから取得します！
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
        alert("📝 データを修正しました！");
        setEditingId(null);
      } else {
        await supabase.from("kakeibo").insert([{
          amount: parseInt(amount, 10), category: selectedCategory, memo, payment_method: paymentMethod, date: date
        }]);
        alert("🎉 データベースに保存しました！");
      }
      setAmount(""); setMemo(""); setSelectedCategory(""); setPaymentMethod("現金"); setDate(getTodayString());
      await fetchData();
    } catch (error) {
      alert("エラーが発生しました");
    } finally { setIsLoading(false); }
  };


  // スケジュール登録処理
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleLabel || !scheduleAmount) { // 変数名を修正
      alert("名前と金額は必須です");
      return;
    }
    try {
      if (editingScheduleId) {
        await supabase.from("auto_schedules").update({
          label: scheduleLabel,
          amount: parseInt(scheduleAmount, 10)
        }).eq("id", editingScheduleId);
      } else {
        await supabase.from("auto_schedules").insert([{
          label: scheduleLabel,
          amount: parseInt(scheduleAmount, 10),
          category: "",
          interval_type: "monthly",
          target_day: 1
        }]);
      }
      setScheduleLabel("");
      setScheduleAmount("");
      setEditingScheduleId(null);
      await fetchData();
    } catch (error) {
      alert("保存に失敗しました");
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



  // 💡選択されている年・月(targetYear, targetMonth)を基準にして過去6か月分の配列を作ります
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(targetYear, targetMonth - 1);
    d.setMonth(d.getMonth() - i);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }).reverse();

  // 💡Supabaseから多めに取得しておいた records 全体から、各月の合計を正しく計算します
  const last6MonthsTotals = last6Months.map(m => {
    const targetPrefix = `${m.year}-${String(m.month).padStart(2, "0")}`;
    return records
      .filter(r => r.date && r.date.startsWith(targetPrefix))
      .reduce((sum, r) => sum + Number(r.amount), 0);
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
  const handleDeleteButton = async (id: string) => {
    if (!confirm("このワンタップボタンを削除しますか？")) return;
    await supabase.from("auto_buttons").delete().eq("id", id);
    await fetchData();
  };
  return (
    // 画面全体を中央に配置する設定
    <main className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-6">

      {/* コンテンツの最大幅を指定し、縦に並べる */}
      

        <header className="py-4 text-center">
          <h1 className="text-2xl font-black text-emerald-700">🍀コツコツ家計簿🍀</h1>
        </header>

        {/* 設定ボタン */}
          <div className="flex justify-end w-full max-w-md mx-auto px-4 mb-4">
            <AppButton 
              variant="sub" 
              onClick={() => setIsSettingMode(!isSettingMode)}
              className="!w-auto text-[10px] font-bold px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
            >
              {isSettingMode ? "⬅ 戻る" : "⚙ 設定・定期管理"}
            </AppButton>
          </div>
        
        <div className="my-card">
          {isSettingMode ? (
            // 設定モード
            <>
             <Card>
                <QuickButtonManager
                  buttons={autoButtons} onDelete={handleDeleteButton} onSubmit={handleButtonSubmit}
                  editingBtnId={editingBtnId} setEditingBtnId={setEditingBtnId}
                  btnLabel={btnLabel} setBtnLabel={setBtnLabel}
                  btnAmount={btnAmount} setBtnAmount={setBtnAmount}
                  btnCategory={btnCategory} setBtnCategory={setBtnCategory}
                  btnMemo={btnMemo} setBtnMemo={setBtnMemo}
                  btnPayment={btnPayment} setBtnPayment={setBtnPayment}
                  quickCategories={quickCategories} paymentMethods={paymentMethods}
                  autoButtons={autoButtons} handleAutoSelect={handleAutoSelect}
                />
            </Card>
              <Card>
                <RecurringScheduleManager
                  schedules={schedules} onDelete={handleDeleteSchedule} onSubmit={handleScheduleSubmit}
                  schLabel={schLabel} setSchLabel={setSchLabel}
                  quickCategories={quickCategories} paymentMethods={paymentMethods}
                  weekDays={weekDays} editingSchId={editingSchId} setEditingSchId={setEditingSchId}
                  schAmount={schAmount} setSchAmount={setSchAmount}
                  schCategory={schCategory} setSchCategory={setSchCategory}
                  schMemo={schMemo} setSchMemo={setSchMemo}
                  schPayment={schPayment} setSchPayment={setSchPayment}
                  schInterval={schInterval} setSchInterval={setSchInterval}
                  schDay={schDay} setSchDay={setSchDay}
                />
              </Card>
            </>
          ) : (
            // 通常モード
            <>
              <Card>
                <InputForm
                  autoButtons={autoButtons} handleAutoSelect={handleAutoSelect} handleSubmit={handleSubmit}
                  date={date} setDate={setDate} amount={amount} setAmount={setAmount}
                  selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                  selectedPayment={selectedPayment} setSelectedPayment={setSelectedPayment}
                  memo={memo} setMemo={setMemo} quickCategories={quickCategories} paymentMethods={paymentMethods}
                />
              </Card>
              <Card>
                <ReportSection
                  targetYear={targetYear} setTargetYear={setTargetYear}
                  targetMonth={targetMonth} setTargetMonth={setTargetMonth}
                  monthlyTotal={monthlyTotal} doughnutData={doughnutData} barData={barData}
                  quickCategories={quickCategories} categoryTotals={categoryTotals}
                  paymentMethods={paymentMethods} paymentTotals={paymentTotals}
                />
              </Card>
              <Card>
                {isMounted && (
                  <CalendarCard
                    viewDate={currentViewDate}
                    onDateChange={(date: Date | null) => {
                      if (date) {
                        setTargetYear(date.getFullYear());
                        setTargetMonth(date.getMonth() + 1);
                        setCurrentViewDate(date);
                      }
                    }}
                    tileContent={tileContent}
                  />
                )}
                <HistoryList records={filteredRecords} targetMonth={targetMonth} onDelete={handleDelete} startEdit={startEdit} />
              </Card>
            </>
          )}
        </div>
      </div>
    </main>
  );
}