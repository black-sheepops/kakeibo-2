// types/index.ts
export interface AutoButton {
  id: string | number;
  label: string;
  amount: number;
  category?: string;
  payment?: string;
  memo?: string;
}