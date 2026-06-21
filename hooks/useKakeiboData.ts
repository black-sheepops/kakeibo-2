// hooks/useKakeiboData.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AutoButton } from '../types/index';

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function useKakeiboData(targetYear: number, targetMonth: number) {
  const [records, setRecords] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [autoButtons, setAutoButtons] = useState<AutoButton[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔄 定期自動入力のチェックロジック
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
      fetchData();
      alert("🤖 定期自動入力を実行しました！");
    }
  };

  // 📡 データ取得ロジック
  const fetchData = useCallback(async (dateArg?: Date) => {
    setLoading(true);
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
    
    setLoading(false);
  }, [targetYear, targetMonth]);

  // 初期読み込みと、年月が変わった時の再取得
  useEffect(() => {
    const dateObj = new Date(targetYear, targetMonth - 1);
    fetchData(dateObj);
  }, [targetYear, targetMonth, fetchData]);

  return { records, schedules, autoButtons, loading, fetchData };
}