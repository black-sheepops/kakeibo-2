export type RecordItem = {
  id: number;
  date: string;
  amount: number;
  category: string;
  payment_method: string;
  memo: string | null;
};

export type AutoButton = {
  id: number;
  label: string;
  amount: number;
  category: string;
  payment_method: string;
  memo: string | null;
  sort_order: number;
};

export interface AutoSchedule {
  id: number;
  label: string;
  amount: number;
  category: string;
  payment_method?: string;
  target_day: number;
  memo?: string;
  interval_type: "monthly" | "weekly";
  last_executed_at: string | null;
}

export type ManagedUser = {
  user_id: string;
  email: string | null;
  role: "user" | "admin";
  disabled: boolean;
  created_at: string;
};

export type UserAuditLog = {
  id: number;
  actor_user_id: string | null;
  target_user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};