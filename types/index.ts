// 型定義のイメージ（types/index.tsなど）
export interface AutoButton {
  id: number;
  label: string;
  amount: number;
  category: string;
  memo: string;
  payment_method: string;
  sort_order: number;
}

export interface AutoSchedule {
  id: number;
  label: string;
  amount: number;
  category: string;
  payment_method: string;
  memo: string;
  interval_type: "monthly" | "weekly"; // ★ここが重要
  target_day: number;
  last_executed_at: string | null;
}