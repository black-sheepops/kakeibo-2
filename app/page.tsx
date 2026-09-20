"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import 'react-calendar/dist/Calendar.css';

import QuickInputForm from "@/components/QuickInputForm";
import SettingManager from "@/components/SettingManager";
import ReportView from "@/components/ReportView";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [targetDate, setTargetDate] = useState(new Date()); // カレンダー用の現在選択日
  const [isSettingMode, setIsSettingMode] = useState(false);
  
  // データ群
  const [records, setRecords] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [autoButtons, setAutoButtons] = useState([]);

  // 通常入力フォーム用
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [date, setDate] = useState(getTodayString());
  const [editingId, setEditingId] = useState(null);

  // ワンタップボタン設定用
  const [btnLabel, setBtnLabel] = useState("");
  const [btnAmount, setBtnAmount] = useState("");
  const [btnCategory, setBtnCategory] = useState("");
  const [btnMemo, setBtnMemo] = useState("");
  const [btnPayment, setBtnPayment] = useState("現金");
  const [editingBtnId, setEditingBtnId] = useState(null);

  // 定期ルール（固定費）設定用
  const [schLabel, setSchLabel] = useState("");
  const [schAmount, setSchAmount] = useState("");
  const [schCategory, setSchCategory] = useState("");
  const [schMemo, setSchMemo] = useState("");
  const [schPayment, setSchPayment] = useState("現金");
  const [schInterval, setSchInterval] = useState("monthly");
  const [schDay, setSchDay] = useState("1");
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  const quickCategories = ["食費", "外食", "日用品", "バドミントン", "自動車", "交通費", "固定費", "その他"];
  const paymentMethods = ["現金", "クレジットカード", "QR決済", "その他"];
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  // 月変更時に targetDate も同期する
  const handleSetTargetDate = (newDate: Date) => {
    setTargetDate(newDate);
    setTargetYear(newDate.getFullYear());
    setTargetMonth(newDate.getMonth() + 1);
  };

  // 自動入力チェックロジック
  const checkAndTriggerAutoInput = async (currentSchedules) => {
    const today = new Date();
    const todayStr = getTodayString();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const currentDay = today.getDate();
    const currentDayOfWeek = today.getDay();

    const newInserts = [];
    const updatedScheduleIds = [];

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
        const autoMemoText = `[自動] ${sch.memo || sch.label}`;
        const { data: existing } = await supabase
          .from("kakeibo")
          .select("id")
          .eq("memo", autoMemoText)
          .eq("date", targetDateStr)
          .maybeSingle();

        if (!existing) {
          newInserts.push({
            amount: sch.amount,
            category: sch.category,
            memo: autoMemoText,
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
    }
  };

  // データ取得ロジック
  const fetchData = useCallback(async (dateArg?: Date) => {
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

  // アクション系
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !selectedCategory || !date) {
      alert("金額、カテゴリ、日付を入力してください！");
      return;
    }
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
    }
  };

  const handleButtonSubmit = async (e) => {
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

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!schLabel || !schAmount || !schCategory) {
      alert("名前、金額、カテゴリは必須です");
      return;
    }
    try {
      if (editingScheduleId !== null) {
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

  const handleDelete = async (id) => {
    if (!confirm("このデータを履歴から削除しますか？")) return;
    await supabase.from("kakeibo").delete().eq("id", id);
    await fetchData();
  };

  const handleDeleteButton = async (id) => {
    if (!confirm("このワンタップボタンを削除しますか？")) return;
    await supabase.from("auto_buttons").delete().eq("id", id);
    await fetchData();
  };

  const handleDeleteSchedule = async (id) => {
    if (!confirm("この自動入力スケジュールを削除しますか？")) return;
    await supabase.from("auto_schedules").delete().eq("id", id);
    await fetchData();
  };

  const startEdit = (rec) => {
    setEditingId(String(rec.id)); setAmount(rec.amount.toString()); setSelectedCategory(rec.category); setMemo(rec.memo); setPaymentMethod(rec.payment_method || "現金"); setDate(rec.date || getTodayString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAutoSelect = (btn) => {
    setAmount(btn.amount.toString());
    setSelectedCategory(btn.category);
    setMemo(btn.memo);
    setPaymentMethod(btn.payment_method || "現金");
    setDate(getTodayString());
  };

  // 集計データ
  const filteredRecords = records.filter(r => {
    if (!r.date) return false;
    const [y, m] = r.date.split("-");
    return parseInt(y, 10) === targetYear && parseInt(m, 10) === targetMonth;
  });

  const dailyTotals = filteredRecords.reduce((acc, rec) => {
    const dateStr = rec.date;
    acc[dateStr] = (acc[dateStr] || 0) + Number(rec.amount);
    return acc;
  }, {});

  const categoryTotals = filteredRecords.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount;
    return acc;
  }, {});

  const paymentTotals = filteredRecords.reduce((acc, r) => {
    const method = r.payment_method || "現金";
    acc[method] = (acc[method] || 0) + r.amount;
    return acc;
  }, {});

  // 過去6ヶ月分のバーグラフ用データ生成
  const barLabels: string[] = [];
  const barValues: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(targetYear, targetMonth - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    barLabels.push(`${m}月`);

    const monthSum = records
      .filter(r => {
        if (!r.date) return false;
        const [ry, rm] = r.date.split("-");
        return parseInt(ry, 10) === y && parseInt(rm, 10) === m;
      })
      .reduce((sum, r) => sum + r.amount, 0);
    barValues.push(monthSum);
  }
  const barData = {
    labels: barLabels,
    datasets: [{ data: barValues }]
  };

  const doughnutData = {
    labels: quickCategories.filter(c => (categoryTotals[c] || 0) > 0),
    datasets: [{
      data: quickCategories.map(c => categoryTotals[c] || 0).filter(v => v > 0),
      backgroundColor: ["#ff6384", "#36a2eb", "#cc65fe", "#ffce56", "#4bc0c0", "#ff9f40", "#a0aec0", "#48bb78"],
      borderWidth: 1,
    }],
  };

  if (!isMounted) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p>読込中...</p></div>;

  return (
    <main className="min-h-screen w-full bg-gray-50 flex flex-col items-center p-4 overflow-x-hidden">
      <div className="w-full max-w-md flex flex-col gap-6 h-full flex-1">
        <header className="flex justify-between items-center py-2">
          <h1 className="text-xl font-black text-emerald-700">🍀コツコツ家計簿🍀</h1>
          <button onClick={() => setIsSettingMode(!isSettingMode)} className="text-xs font-bold px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition active:scale-95">
            {isSettingMode ? "⬅ 戻る" : "⚙ 設定"}
          </button>
        </header>

        {isSettingMode ? (
          <SettingManager
            autoButtons={autoButtons}
            schedules={schedules}
            quickCategories={quickCategories}
            paymentMethods={paymentMethods}
            weekDays={weekDays}
            btnLabel={btnLabel} setBtnLabel={setBtnLabel}
            btnAmount={btnAmount} setBtnAmount={setBtnAmount}
            btnCategory={btnCategory} setBtnCategory={setBtnCategory}
            btnMemo={btnMemo} setBtnMemo={setBtnMemo}
            btnPayment={btnPayment} setBtnPayment={setBtnPayment}
            editingBtnId={editingBtnId}
            handleButtonSubmit={handleButtonSubmit}
            startEditButton={(btn) => {
              setEditingBtnId(btn.id);
              setBtnLabel(btn.label);
              setBtnAmount(btn.amount.toString());
              setBtnCategory(btn.category);
              setBtnMemo(btn.memo);
              setBtnPayment(btn.payment_method || "現金");
            }}
            cancelEditButton={() => {
              setEditingBtnId(null);
              setBtnLabel(""); setBtnAmount(""); setBtnCategory(""); setBtnMemo(""); setBtnPayment("現金");
            }}
            handleDeleteButton={handleDeleteButton}
            schLabel={schLabel} setSchLabel={setSchLabel}
            schAmount={schAmount} setSchAmount={setSchAmount}
            schCategory={schCategory} setSchCategory={setSchCategory}
            schMemo={schMemo} setSchMemo={setSchMemo}
            schPayment={schPayment} setSchPayment={setSchPayment}
            schInterval={schInterval} setSchInterval={setSchInterval}
            schDay={schDay} setSchDay={setSchDay}
            editingScheduleId={editingScheduleId}
            handleScheduleSubmit={handleScheduleSubmit}
            startEditSchedule={(s) => {
              setEditingScheduleId(s.id);
              setSchLabel(s.label);
              setSchAmount(s.amount.toString());
              setSchCategory(s.category);
              setSchPayment(s.payment_method || "現金");
              setSchInterval(s.interval_type);
              setSchDay(s.target_day.toString());
              setSchMemo(s.memo || "");
            }}
            cancelEditSchedule={() => {
              setEditingScheduleId(null);
              setSchLabel(""); setSchAmount(""); setSchCategory(""); setSchMemo(""); setSchPayment("現金");
            }}
            handleDeleteSchedule={handleDeleteSchedule}
          />
        ) : (
          <div className="flex flex-col gap-6 flex-1 w-full">
            <QuickInputForm
              autoButtons={autoButtons}
              handleAutoSelect={handleAutoSelect}
              date={date} setDate={setDate}
              amount={amount} setAmount={setAmount}
              quickCategories={quickCategories}
              selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
              paymentMethods={paymentMethods}
              paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
              memo={memo} setMemo={setMemo}
              handleSubmit={handleSubmit}
              editingId={editingId}
              cancelEdit={() => {
                setEditingId(null);
                setAmount(""); setMemo(""); setSelectedCategory(""); setPaymentMethod("現金"); setDate(getTodayString());
              }}
            />
            <ReportView
              targetYear={targetYear}
              targetMonth={targetMonth}
              targetDate={targetDate}
              setTargetDate={handleSetTargetDate}
              isMounted={isMounted}
              dailyTotals={dailyTotals}
              barData={barData}
              categoryTotals={categoryTotals}
              doughnutData={doughnutData}
              paymentTotals={paymentTotals}
              filteredRecords={filteredRecords}
              allRecords={records}
              startEdit={startEdit}
              deleteRecord={handleDelete}
            />
          </div>
        )}
      </div>
    </main>
  );
}