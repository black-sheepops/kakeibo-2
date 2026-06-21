// lib/api.ts
import { supabase } from "./supabaseClient";

export const fetchRecords = async (year: number, month: number) => {
  const { data, error } = await supabase
    .from("records") // テーブル名は実際のものに合わせてください
    .select("*")
    .gte("date", `${year}-${String(month).padStart(2, "0")}-01`)
    .lte("date", `${year}-${String(month).padStart(2, "0")}-31`);
  
  if (error) throw error;
  return data;
};

export const deleteRecord = async (id: number) => {
  const { error } = await supabase.from("records").delete().eq("id", id);
  if (error) throw error;
};

// 他にも insert, update などをここに追加していきます