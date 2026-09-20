"use client";

import React from "react";

interface AutoButton {
  id: number;
  label: string;
  amount: number;
  category: string;
  memo: string;
  payment_method: string;
  sort_order: number;
}

interface QuickButtonsProps {
  autoButtons: AutoButton[];
  onSelectButton: (btn: AutoButton) => void;
}

export default function QuickButtons({ autoButtons, onSelectButton }: QuickButtonsProps) {
  if (autoButtons.length === 0) return null;

  return (
    <div 
      className="flex gap-3 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide px-1" 
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {autoButtons.map((btn) => (
        <button
          type="button"
          key={btn.id}
          onClick={() => onSelectButton(btn)}
          className="flex-shrink-0 w-[100px] h-16 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-center items-center cursor-pointer transition-all active:scale-95 active:bg-gray-50"
        >
          <div className="font-bold text-[11px] text-gray-700 w-full overflow-hidden text-ellipsis whitespace-nowrap text-center px-2">
            {btn.label}
          </div>
          <div className="text-[10px] font-bold text-emerald-600 mt-1">
            ￥{btn.amount.toLocaleString()}
          </div>
        </button>
      ))}
    </div>
  );
}