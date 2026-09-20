"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import 'react-calendar/dist/Calendar.css';

import QuickInputForm from "@/components/QuickInputForm";
import SettingManager from "@/components/SettingManager";
import ReportView from "@/components/ReportView";
import AuthPanel from "@/components/AuthPanel";
import { AutoButton, AutoSchedule, RecordItem } from "@/types/kakeibo";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getJapaneseHolidays = (year: number) => {
  const holidays = new Set<string>();
  const toKey = (date: Date) => getJapaneseDateKey(date);
  const add = (month: number, day: number) => {
    holidays.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  };
  const addNthMonday = (month: number, nth: number) => {
    const first = new Date(year, month - 1, 1);
    add(month, 1 + ((8 - first.getDay()) % 7) + (nth - 1) * 7);
  };

  add(1, 1);
  addNthMonday(1, 2);
  add(2, 11);
  add(2, 23);
  add(3, Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
  add(4, 29);
  add(5, 3);
  add(5, 4);
  add(5, 5);
  addNthMonday(7, 3);
  add(8, 11);
  addNthMonday(9, 3);
  add(9, Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
  addNthMonday(10, 2);
  add(11, 3);
  add(11, 23);

  // 国民の休日（祝日に挟まれた平日）を追加する。
  for (let month = 1; month <= 12; month += 1) {
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 2; day < daysInMonth; day += 1) {
      const date = new Date(year, month - 1, day);
      const previous = new Date(year, month - 1, day - 1);
      const next = new Date(year, month - 1, day + 1);
      const key = toKey(date);
      const previousKey = toKey(previous);
      const nextKey = toKey(next);
      if (date.getDay() !== 0 && holidays.has(previousKey) && holidays.has(nextKey)) holidays.add(key);
    }
  }

  // 日曜祝日の振替休日を、次の休日（土日・祝日）でない平日に設定する。
  [...holidays].forEach((holiday) => {
    const date = new Date(`${holiday}T00:00:00`);
    if (date.getDay() !== 0) return;
    const substitute = new Date(date);
    do {
      substitute.setDate(substitute.getDate() + 1);
    } while (substitute.getDay() === 0 || substitute.getDay() === 6 || holidays.has(toKey(substitute)));
    holidays.add(toKey(substitute));
  });
  return holidays;
};

const getJapaneseDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getNearestJapaneseBusinessDay = (date: Date, direction: "forward" | "backward") => {
  const holidays = getJapaneseHolidays(date.getFullYear());
  const result = new Date(date);
  const isBusinessDay = () => {
    const key = getJapaneseDateKey(result);
    return result.getDay() !== 0 && result.getDay() !== 6 && !holidays.has(key);
  };
  while (!isBusinessDay()) result.setDate(result.getDate() + (direction === "forward" ? 1 : -1));
  return result;
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [targetDate, setTargetDate] = useState(new Date()); // カレンダー用の現在選択日
  const [isSettingMode, setIsSettingMode] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const autoInputRunning = useRef(false);
  
  // データ群
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [schedules, setSchedules] = useState<AutoSchedule[]>([]);
  const [autoButtons, setAutoButtons] = useState<AutoButton[]>([]);
  const [quickCategories, setQuickCategories] = useState(["食費", "外食", "日用品", "バドミントン", "自動車", "交通費", "固定費", "その他"]);
  const [paymentMethods, setPaymentMethods] = useState(["現金", "クレジットカード", "QR決済", "その他"]);
  const [qrPaymentProviders, setQrPaymentProviders] = useState(["PayPay", "楽天ペイ", "d払い", "au PAY", "メルペイ", "その他"]);
  const [creditCardProviders, setCreditCardProviders] = useState(["楽天カード", "三井住友カード", "PayPayカード", "その他"]);
  const [newCategory, setNewCategory] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newQrPaymentProvider, setNewQrPaymentProvider] = useState("");
  const [newCreditCardProvider, setNewCreditCardProvider] = useState("");

  // 通常入力フォーム用
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("現金");
  const [qrPaymentProvider, setQrPaymentProvider] = useState("");
  const [creditCardProvider, setCreditCardProvider] = useState("");
  const [date, setDate] = useState(getTodayString());
  const [editingId, setEditingId] = useState<string | null>(null);

  // ワンタップボタン設定用
  const [btnLabel, setBtnLabel] = useState("");
  const [btnAmount, setBtnAmount] = useState("");
  const [btnCategory, setBtnCategory] = useState("");
  const [btnMemo, setBtnMemo] = useState("");
  const [btnPayment, setBtnPayment] = useState("現金");
  const [editingBtnId, setEditingBtnId] = useState<number | null>(null);

  // 定期ルール（固定費）設定用
  const [schLabel, setSchLabel] = useState("");
  const [schAmount, setSchAmount] = useState("");
  const [schCategory, setSchCategory] = useState("");
  const [schMemo, setSchMemo] = useState("");
  const [schPayment, setSchPayment] = useState("現金");
  const [schInterval, setSchInterval] = useState<"monthly" | "weekly">("monthly");
  const [schDay, setSchDay] = useState("1");
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  // 月変更時に targetDate も同期する
  const handleSetTargetDate = (newDate: Date) => {
    setTargetDate(newDate);
    setTargetYear(newDate.getFullYear());
    setTargetMonth(newDate.getMonth() + 1);
  };

  // 自動入力チェックロジック
  const checkAndTriggerAutoInput = async (currentSchedules: AutoSchedule[]) => {
    if (autoInputRunning.current) return;
    autoInputRunning.current = true;
    const today = new Date();
    const todayStr = getTodayString();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const currentDayOfWeek = today.getDay();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const monthEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;
    const autoInputLockKey = `kakeibo-auto-input-${currentMonthStr}`;
    if (localStorage.getItem(autoInputLockKey)) {
      autoInputRunning.current = false;
      return;
    }
    localStorage.setItem(autoInputLockKey, String(Date.now()));
    const { data: monthRecords, error: monthRecordsError } = await supabase
      .from("kakeibo")
      .select("amount, category, payment_method, memo")
      .gte("date", monthStart)
      .lte("date", monthEnd);
    if (monthRecordsError) {
      alert(`固定費の重複確認に失敗しました: ${monthRecordsError.message}`);
      localStorage.removeItem(autoInputLockKey);
      autoInputRunning.current = false;
      return;
    }

    const newInserts: Omit<RecordItem, "id">[] = [];
    const updatedScheduleIds: number[] = [];
    const existingContents = new Set(
      (monthRecords || []).map((record) =>
        JSON.stringify([record.amount, record.category, record.payment_method, record.memo || ""])
      )
    );

    for (const sch of currentSchedules) {
      let shouldExecute = false;
      let targetDateStr = "";

      if (sch.interval_type === "monthly") {
        const isMonthEndSchedule = sch.target_day === 31;
        const scheduledDate = isMonthEndSchedule
          ? new Date(today.getFullYear(), today.getMonth() + 1, 0)
          : new Date(
              today.getFullYear(),
              today.getMonth(),
              Math.min(Math.max(sch.target_day, 1), lastDayOfMonth)
            );
        const registrationDate = getNearestJapaneseBusinessDay(
          scheduledDate,
          isMonthEndSchedule ? "backward" : "forward"
        );

        const registrationDateStr = `${registrationDate.getFullYear()}-${String(registrationDate.getMonth() + 1).padStart(2, "0")}-${String(registrationDate.getDate()).padStart(2, "0")}`;
        shouldExecute = getJapaneseDateKey(today) >= registrationDateStr && !sch.last_executed_at?.startsWith(currentMonthStr);
        targetDateStr = registrationDateStr;
      } else if (sch.interval_type === "weekly") {
        shouldExecute = currentDayOfWeek === sch.target_day && sch.last_executed_at !== todayStr;
        targetDateStr = todayStr;
      }

      if (shouldExecute && targetDateStr) {
        const autoMemoText = `[自動] ${sch.memo || sch.label}`;
        const contentKey = JSON.stringify([sch.amount, sch.category, sch.payment_method || "現金", autoMemoText]);
        if (!existingContents.has(contentKey)) {
          newInserts.push({
            amount: sch.amount,
            category: sch.category,
            memo: autoMemoText,
            payment_method: sch.payment_method || "現金",
            date: targetDateStr
          });
          existingContents.add(contentKey);
          updatedScheduleIds.push(sch.id);
        } else {
          updatedScheduleIds.push(sch.id);
        }
      }
    }

    if (newInserts.length > 0) {
      const { error: insertError } = await supabase.from("kakeibo").insert(newInserts);
      if (insertError) {
        alert(`固定費の登録に失敗しました: ${insertError.message}`);
        localStorage.removeItem(autoInputLockKey);
        autoInputRunning.current = false;
        return;
      }
      await Promise.all(updatedScheduleIds.map(id => {
        const sch = currentSchedules.find(s => s.id === id);
        return supabase.from("auto_schedules").update({
          last_executed_at: todayStr
        }).eq("id", id);
      }));
    } else if (updatedScheduleIds.length > 0) {
      await Promise.all(updatedScheduleIds.map(id => {
        const sch = currentSchedules.find(s => s.id === id);
        return supabase.from("auto_schedules").update({
          last_executed_at: todayStr
        }).eq("id", id);
      }));
    }
    autoInputRunning.current = false;
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

    const { data: categoryData } = await supabase.from("categories").select("name").order("sort_order", { ascending: true });
    if (categoryData?.length) setQuickCategories(categoryData.map((item) => item.name));

    const { data: paymentData } = await supabase.from("payment_methods").select("name").order("sort_order", { ascending: true });
    if (paymentData?.length) setPaymentMethods(paymentData.map((item) => item.name));

    const { data: providerData } = await supabase.from("qr_payment_providers").select("name").order("sort_order", { ascending: true });
    if (providerData?.length) setQrPaymentProviders(providerData.map((item) => item.name));

    const { data: cardData } = await supabase.from("credit_card_providers").select("name").order("sort_order", { ascending: true });
    if (cardData?.length) setCreditCardProviders(cardData.map((item) => item.name));
  }, [targetYear, targetMonth]);

  useEffect(() => {
    setIsMounted(true);
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(data?.role === "admin");
      });
  }, [session]);

  useEffect(() => {
    if (isMounted && session) {
      const dateObj = new Date(targetYear, targetMonth - 1);
      fetchData(dateObj);
    }
  }, [targetYear, targetMonth, fetchData, isMounted, session]);

  // アクション系
  const handleSubmit = async (e: React.FormEvent) => {
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
        const { error: insertError } = await supabase.from("kakeibo").insert([{
          amount: parseInt(amount, 10), category: selectedCategory, memo, payment_method: paymentMethod, date: date
        }]);
        if (insertError) {
          alert(`登録に失敗しました: ${insertError.message}`);
          return;
        }
      }
      setAmount(""); setMemo(""); setSelectedCategory(""); setPaymentMethod("現金"); setQrPaymentProvider(""); setDate(getTodayString());
      await fetchData();
    } catch (error) {
      alert("エラーが発生しました");
    }
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

  const handleDelete = async (id: number) => {
    if (!confirm("このデータを履歴から削除しますか？")) return;
    await supabase.from("kakeibo").delete().eq("id", id);
    await fetchData();
  };

  const handleDeleteRecords = async (ids: number[]) => {
    if (ids.length === 0) return;
    const { error } = await supabase.from("kakeibo").delete().in("id", ids);
    if (error) {
      alert(`重複記録の削除に失敗しました: ${error.message}`);
      return;
    }
    await fetchData();
  };

  const handleDeleteButton = async (id: number) => {
    if (!confirm("このワンタップボタンを削除しますか？")) return;
    await supabase.from("auto_buttons").delete().eq("id", id);
    await fetchData();
  };

  const handleMoveButton = async (id: number, direction: "up" | "down") => {
    const currentIndex = autoButtons.findIndex((button) => button.id === id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= autoButtons.length) return;

    const reordered = [...autoButtons];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    const results = await Promise.all(
      reordered.map((button, index) =>
        supabase.from("auto_buttons").update({ sort_order: index }).eq("id", button.id)
      )
    );
    const error = results.find((result) => result.error)?.error;
    if (error) {
      alert(`並び順の変更に失敗しました: ${error.message}`);
      return;
    }
    setAutoButtons(reordered.map((button, index) => ({ ...button, sort_order: index })));
    await fetchData();
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("この自動入力スケジュールを削除しますか？")) return;
    await supabase.from("auto_schedules").delete().eq("id", id);
    await fetchData();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name || quickCategories.includes(name)) return;
    const { error } = await supabase.from("categories").insert({ name, sort_order: quickCategories.length });
    if (error) {
      alert("カテゴリの追加に失敗しました");
      return;
    }
    setQuickCategories((current) => [...current, name]);
    setNewCategory("");
  };

  const handleDeleteCategory = async (name: string) => {
    if (!confirm(`カテゴリ「${name}」を削除しますか？`)) return;
    const { error } = await supabase.from("categories").delete().eq("name", name);
    if (error) {
      alert("カテゴリの削除に失敗しました");
      return;
    }
    setQuickCategories((current) => current.filter((item) => item !== name));
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPaymentMethod.trim();
    if (!name || paymentMethods.includes(name)) return;
    const { error } = await supabase.from("payment_methods").insert({ name, sort_order: paymentMethods.length });
    if (error) {
      alert("支払い方法の追加に失敗しました");
      return;
    }
    setPaymentMethods((current) => [...current, name]);
    setNewPaymentMethod("");
  };

  const handleDeletePaymentMethod = async (name: string) => {
    if (!confirm(`支払い方法「${name}」を削除しますか？`)) return;
    const { error } = await supabase.from("payment_methods").delete().eq("name", name);
    if (error) {
      alert("支払い方法の削除に失敗しました");
      return;
    }
    setPaymentMethods((current) => current.filter((item) => item !== name));
  };

  const handleAddQrPaymentProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newQrPaymentProvider.trim();
    if (!name || qrPaymentProviders.includes(name)) return;
    const { error } = await supabase.from("qr_payment_providers").insert({ name, sort_order: qrPaymentProviders.length });
    if (error) {
      alert("決済会社の追加に失敗しました");
      return;
    }
    setQrPaymentProviders((current) => [...current, name]);
    setNewQrPaymentProvider("");
  };

  const handleDeleteQrPaymentProvider = async (name: string) => {
    if (!confirm(`決済会社「${name}」を削除しますか？`)) return;
    const { error } = await supabase.from("qr_payment_providers").delete().eq("name", name);
    if (error) {
      alert("決済会社の削除に失敗しました");
      return;
    }
    setQrPaymentProviders((current) => current.filter((item) => item !== name));
    if (qrPaymentProvider === name) {
      setQrPaymentProvider("");
      if (paymentMethod === "QR決済") setMemo("");
    }
  };

  const handleAddCreditCardProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCreditCardProvider.trim();
    if (!name || creditCardProviders.includes(name)) return;
    const { error } = await supabase.from("credit_card_providers").insert({ name, sort_order: creditCardProviders.length });
    if (error) {
      alert("カード会社の追加に失敗しました");
      return;
    }
    setCreditCardProviders((current) => [...current, name]);
    setNewCreditCardProvider("");
  };

  const handleDeleteCreditCardProvider = async (name: string) => {
    if (!confirm(`カード会社「${name}」を削除しますか？`)) return;
    const { error } = await supabase.from("credit_card_providers").delete().eq("name", name);
    if (error) {
      alert("カード会社の削除に失敗しました");
      return;
    }
    setCreditCardProviders((current) => current.filter((item) => item !== name));
    if (creditCardProvider === name) {
      setCreditCardProvider("");
      if (paymentMethod === "クレジットカード") setMemo("");
    }
  };

  const reorderNamedItems = async (
    items: string[],
    name: string,
    direction: "up" | "down",
    table: string,
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const currentIndex = items.indexOf(name);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = [...items];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    const results = await Promise.all(
      reordered.map((item, index) =>
        supabase.from(table).update({ sort_order: index }).eq("name", item)
      )
    );
    const error = results.find((result) => result.error)?.error;
    if (error) {
      alert(`並び順の変更に失敗しました: ${error.message}`);
      return;
    }
    setItems(reordered);
  };

  const handleMoveCategory = (name: string, direction: "up" | "down") =>
    reorderNamedItems(quickCategories, name, direction, "categories", setQuickCategories);
  const handleMovePaymentMethod = (name: string, direction: "up" | "down") =>
    reorderNamedItems(paymentMethods, name, direction, "payment_methods", setPaymentMethods);
  const handleMoveQrPaymentProvider = (name: string, direction: "up" | "down") =>
    reorderNamedItems(qrPaymentProviders, name, direction, "qr_payment_providers", setQrPaymentProviders);
  const handleMoveCreditCardProvider = (name: string, direction: "up" | "down") =>
    reorderNamedItems(creditCardProviders, name, direction, "credit_card_providers", setCreditCardProviders);

  const startEdit = (rec: RecordItem) => {
    setEditingId(String(rec.id)); setAmount(rec.amount.toString()); setSelectedCategory(rec.category); setMemo(rec.memo || ""); setPaymentMethod(rec.payment_method || "現金"); setDate(rec.date || getTodayString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAutoSelect = (btn: AutoButton) => {
    setAmount(btn.amount.toString());
    setSelectedCategory(btn.category);
    setMemo(`[ワンタップ] ${btn.memo || ""}`.trim());
    setPaymentMethod(btn.payment_method || "現金");
    setDate(getTodayString());
  };

  // 集計データ
  const filteredRecords = records.filter(r => {
    if (!r.date) return false;
    const [y, m] = r.date.split("-");
    return parseInt(y, 10) === targetYear && parseInt(m, 10) === targetMonth;
  });

  const dailyTotals = filteredRecords.reduce<Record<string, number>>((acc, rec) => {
    const dateStr = rec.date;
    acc[dateStr] = (acc[dateStr] || 0) + Number(rec.amount);
    return acc;
  }, {});

  const categoryTotals = filteredRecords.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount;
    return acc;
  }, {});

  const paymentTotals = filteredRecords.reduce<Record<string, number>>((acc, r) => {
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

  if (!isMounted) {
    return (
      <main className="min-h-screen w-full bg-gray-50 flex flex-col items-center p-4 overflow-x-hidden">
        <p>読込中...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg text-center">
          <h1 className="text-xl font-black text-emerald-700">🍀コツコツ家計簿🍀</h1>
          <p className="mt-3 text-xs text-gray-600">利用するにはログインしてください。</p>
          <div className="mt-4 flex justify-center">
            <AuthPanel email={null} onSignedIn={() => undefined} onSignedOut={() => undefined} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-gray-50 flex flex-col items-center p-4 overflow-x-hidden">
      <div className="w-full max-w-md flex flex-col gap-6 h-full flex-1">
        <header className="relative min-h-24 py-2">
          <div className="absolute left-0 top-2 flex flex-col items-start gap-2">
            {isAdmin && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">管理者</span>}
            <button onClick={() => setIsSettingMode(!isSettingMode)} className="text-xs font-bold px-3 py-2 rounded-full bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition active:scale-95">
              {isSettingMode ? "⬅ 戻る" : "⚙ 設定"}
            </button>
          </div>
          <div className="absolute right-0 top-2">
            <AuthPanel
              email={session?.user.email || null}
              onSignedIn={() => setIsSettingMode(false)}
              onSignedOut={() => setSession(null)}
            />
          </div>
          <h1 className="pt-16 text-center text-xl font-black text-emerald-700 whitespace-nowrap">🍀コツコツ家計簿🍀</h1>
        </header>

        {isSettingMode ? (
          <SettingManager
            autoButtons={autoButtons}
            schedules={schedules}
            quickCategories={quickCategories}
            paymentMethods={paymentMethods}
            qrPaymentProviders={qrPaymentProviders}
            creditCardProviders={creditCardProviders}
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
              setBtnMemo(btn.memo || "");
              setBtnPayment(btn.payment_method || "現金");
            }}
            cancelEditButton={() => {
              setEditingBtnId(null);
              setBtnLabel(""); setBtnAmount(""); setBtnCategory(""); setBtnMemo(""); setBtnPayment("現金");
            }}
            handleDeleteButton={handleDeleteButton}
            handleMoveButton={handleMoveButton}
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
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            handleAddCategory={handleAddCategory}
            handleDeleteCategory={handleDeleteCategory}
            handleMoveCategory={handleMoveCategory}
            newPaymentMethod={newPaymentMethod}
            setNewPaymentMethod={setNewPaymentMethod}
            handleAddPaymentMethod={handleAddPaymentMethod}
            handleDeletePaymentMethod={handleDeletePaymentMethod}
            handleMovePaymentMethod={handleMovePaymentMethod}
            newQrPaymentProvider={newQrPaymentProvider}
            setNewQrPaymentProvider={setNewQrPaymentProvider}
            handleAddQrPaymentProvider={handleAddQrPaymentProvider}
            handleDeleteQrPaymentProvider={handleDeleteQrPaymentProvider}
            handleMoveQrPaymentProvider={handleMoveQrPaymentProvider}
                    newCreditCardProvider={newCreditCardProvider}
                    setNewCreditCardProvider={setNewCreditCardProvider}
                    handleAddCreditCardProvider={handleAddCreditCardProvider}
                    handleDeleteCreditCardProvider={handleDeleteCreditCardProvider}
                    handleMoveCreditCardProvider={handleMoveCreditCardProvider}
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
              qrPaymentProvider={qrPaymentProvider} setQrPaymentProvider={setQrPaymentProvider}
              qrPaymentProviders={qrPaymentProviders}
              creditCardProviders={creditCardProviders}
              creditCardProvider={creditCardProvider}
              setCreditCardProvider={setCreditCardProvider}
              memo={memo} setMemo={setMemo}
              handleSubmit={handleSubmit}
              editingId={editingId}
              cancelEdit={() => {
                setEditingId(null);
                setAmount(""); setMemo(""); setSelectedCategory(""); setPaymentMethod("現金"); setQrPaymentProvider(""); setDate(getTodayString());
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
              deleteRecords={handleDeleteRecords}
            />
          </div>
        )}
      </div>
    </main>
  );
}