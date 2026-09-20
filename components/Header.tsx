"use client";

import React from "react";

interface HeaderProps {
  isSettingMode: boolean;
  setIsSettingMode: (val: boolean) => void;
}

export default function Header({ isSettingMode, setIsSettingMode }: HeaderProps) {
  return (
    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
      <h1 className="text-xl font-black text-emerald-700">🍀 コツコツ家計簿</h1>
      <button
        onClick={() => setIsSettingMode(!isSettingMode)}
        className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
      >
        {isSettingMode ? "🏠 戻る" : "⚙️ 設定"}
      </button>
    </div>
  );
}