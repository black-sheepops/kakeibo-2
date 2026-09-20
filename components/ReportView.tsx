"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { RecordItem } from "@/types/kakeibo";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ReportViewProps {
  targetYear: number;
  targetMonth: number;
  targetDate: Date;
  setTargetDate: (date: Date) => void;
  isMounted: boolean;
  dailyTotals: Record<string, number>;
  barData: any;
  categoryTotals: Record<string, number>;
  doughnutData: any;
  paymentTotals: Record<string, number>;
  filteredRecords: RecordItem[];
  allRecords: RecordItem[];
  startEdit: (r: RecordItem) => void;
  deleteRecord: (id: number) => void;
}

export default function ReportView({
  targetYear,
  targetMonth,
  targetDate,
  setTargetDate,
  isMounted: propsIsMounted,
  dailyTotals,
  barData,
  categoryTotals,
  doughnutData,
  paymentTotals,
  filteredRecords,
  allRecords,
  startEdit,
  deleteRecord,
}: ReportViewProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedDayRecords, setSelectedDayRecords] = useState<RecordItem[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrevMonth = () => {
    setTargetDate(new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setTargetDate(new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const clickedDateStr = `${yyyy}-${mm}-${dd}`; // 例: "2026-06-01"

    const recordsArray = Array.isArray(allRecords) ? allRecords : [];

    const matched = recordsArray.filter((r) => {
      if (!r.date) return false;
      // データのdateから "YYYY-MM-DD" 部分だけを安全に抽出して比較
      const recordDateStr = String(r.date).split("T")[0].split(" ")[0];
      return recordDateStr === clickedDateStr;
    });

    setSelectedDateStr(`${yyyy}年 ${Number(mm)}月 ${Number(dd)}日`);
    setSelectedDayRecords(matched);
  };

  const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const totalPayment = Object.values(paymentTotals).reduce((a, b) => a + b, 0);

  const barLabels = (barData?.labels as string[]) || [];
  const barValues = (barData?.datasets?.[0]?.data as number[]) || [0, 0, 0, 0, 0, 0];
  const maxBarVal = Math.max(...barValues, 1);

  const paymentColors = [
    "#34d399", // emerald-400
    "#60a5fa", // blue-400
    "#f472b6", // pink-400
    "#fbbf24", // amber-400
    "#a78bfa", // purple-400
    "#38bdf8", // sky-400
  ];

  const paymentLabelsArr = Object.keys(paymentTotals);
  const paymentValuesArr = Object.values(paymentTotals);
  const paymentDoughnutData = {
    labels: paymentLabelsArr,
    datasets: [
      {
        data: paymentValuesArr,
        backgroundColor: paymentColors.slice(0, paymentLabelsArr.length),
        borderWidth: 1,
      },
    ],
  };

  const renderMemoWithoutAuto = (memo?: string | null) => {
    if (!memo) return null;
    const cleanedMemo = memo.replace(/\[自動\]|自動/g, "").trim();
    if (!cleanedMemo) return null;

    return (
      <div className="text-gray-500 text-[10px] mt-0.5">
        {cleanedMemo}
      </div>
    );
  };

  // サーバーサイドおよびマウント前はプレースホルダーを返し、ハイドレーションエラーを完全に防ぐ
  if (!mounted) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6 w-full min-h-[400px] animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-1/3 mx-auto"></div>
        <div className="h-24 bg-gray-100 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-gray-100 rounded-2xl"></div>
          <div className="h-48 bg-gray-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6 w-full">
      <div className="flex justify-between items-center border-b pb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition"
        >
          ◀ 前月
        </button>
        <h2 className="font-black text-gray-800 text-base">
          📊 {targetYear}年 {targetMonth}月 レポート
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition"
        >
          次月 ▶
        </button>
      </div>

      <div className="space-y-4">
        {/* 月の総額 */}
        <div className="text-center bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
          <div className="text-xs font-bold text-emerald-800">{targetMonth}月 総合計支出</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">¥{totalExpense.toLocaleString()}</div>
        </div>

        {/* 2カラムレイアウト（カテゴリ別 / 支払い別 を左右に配置） */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          
          {/* カテゴリ別 円グラフ ＋ 下部リスト */}
          <div className="bg-gray-50 p-4 rounded-2xl border flex flex-col justify-start">
            <div className="text-xs font-bold text-gray-700 mb-3">🏷️ カテゴリ別内訳</div>
            {Object.keys(categoryTotals).length > 0 && doughnutData ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-[140px] h-[140px] flex items-center justify-center">
                  <Doughnut
                    data={doughnutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                    }}
                  />
                </div>
                <div className="w-full space-y-1.5">
                  {Object.entries(categoryTotals).map(([cat, val], idx) => {
                    const percentage = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
                    const color = doughnutData.datasets[0].backgroundColor?.[idx] || "#cbd5e1";
                    return (
                      <div key={cat} className="flex items-center justify-between text-xs py-0.5 border-b border-gray-200 last:border-none">
                        <div className="flex items-center gap-1.5 truncate pr-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: typeof color === 'string' ? color : '#cbd5e1' }}
                          ></span>
                          <span className="text-gray-600 truncate">{cat}</span>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span className="font-bold text-gray-800">¥{val.toLocaleString()}</span>
                          <span className="text-[10px] text-gray-400 font-normal ml-1">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 py-6 text-center">データなし</div>
            )}
          </div>

          {/* 支払い別 円グラフ ＋ 下部リスト */}
          <div className="bg-gray-50 p-4 rounded-2xl border flex flex-col justify-start">
            <div className="text-xs font-bold text-gray-700 mb-3">💳 支払い別内訳</div>
            {Object.keys(paymentTotals).length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-[140px] h-[140px] flex items-center justify-center">
                  <Doughnut
                    data={paymentDoughnutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                    }}
                  />
                </div>
                <div className="w-full space-y-1.5">
                  {Object.entries(paymentTotals).map(([pm, val], idx) => {
                    const percentage = totalPayment > 0 ? Math.round((val / totalPayment) * 100) : 0;
                    const color = paymentColors[idx % paymentColors.length];
                    return (
                      <div key={pm} className="flex items-center justify-between text-xs py-0.5 border-b border-gray-200 last:border-none">
                        <div className="flex items-center gap-1.5 truncate pr-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          ></span>
                          <span className="text-gray-600 truncate">{pm}</span>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span className="font-bold text-gray-800">¥{val.toLocaleString()}</span>
                          <span className="text-[10px] text-gray-400 font-normal ml-1">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 py-6 text-center">データなし</div>
            )}
          </div>

        </div>
      </div>

      <div className="space-y-6 pt-2">
        {/* 過去6ヶ月の推移 */}
        <div>
          <div className="text-xs font-bold text-gray-700 mb-2">📈 過去6ヶ月推移</div>
          <div className="bg-gray-50 p-4 rounded-2xl border h-48 flex items-end justify-between gap-2">
            {barLabels.map((label, idx) => {
              const val = barValues[idx] || 0;
              const heightPercent = Math.max(Math.round((val / maxBarVal) * 100), 4);
              
              const isCurrentMonth = idx === barLabels.length - 1;
              const barColor = isCurrentMonth ? "bg-emerald-500" : "bg-blue-300";

              return (
                <div key={label} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div className="text-[9px] text-gray-500 mb-1 truncate">
                    {val > 0 ? `¥${val.toLocaleString()}` : ""}
                  </div>
                  <div
                    className={`w-full rounded-t-lg transition-all ${barColor}`}
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                  <div className={`text-[10px] mt-2 ${isCurrentMonth ? "font-bold text-emerald-700" : "text-blue-500"}`}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="text-xs font-bold text-gray-700 mb-1">📅 カレンダー</div>
        <div className="border rounded-2xl p-2 bg-gray-50 flex justify-center">
          <Calendar
            value={targetDate}
            onChange={(val) => {
              if (val instanceof Date) setTargetDate(val);
            }}
            onClickDay={handleDayClick}
            tileContent={({ date }) => {
              const yyyy = date.getFullYear();
              const mm = String(date.getMonth() + 1).padStart(2, "0");
              const dd = String(date.getDate()).padStart(2, "0");
              const dateStr = `${yyyy}-${mm}-${dd}`;
              const sum = dailyTotals[dateStr];
              return sum ? (
                <div className="text-[9px] font-bold text-emerald-600 truncate">
                  ¥{sum.toLocaleString()}
                </div>
              ) : null;
            }}
            className="react-calendar-custom text-xs w-full border-none bg-transparent"
          />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="text-xs font-bold text-gray-700">📜 {targetMonth}月 履歴 ({filteredRecords.length}件)</div>
        {filteredRecords.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {filteredRecords.map((r) => (
              <div key={r.id} className="flex justify-between items-center p-3 bg-gray-50 border rounded-2xl text-xs">
                <div>
                  <div className="font-bold text-gray-800">
                    {r.date} - {r.category} <span className="text-gray-400 text-[10px]">({r.payment_method})</span>
                  </div>
                  {renderMemoWithoutAuto(r.memo)}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-emerald-700">¥{Number(r.amount).toLocaleString()}</span>
                  <button
                    onClick={() => startEdit(r)}
                    className="text-blue-500 font-bold text-[10px] hover:underline"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => {
                      deleteRecord(r.id);
                      setSelectedDayRecords(null);
                    }}
                    className="text-red-500 font-bold text-[10px]"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-4">この月の履歴はありません</p>
        )}
      </div>

      {selectedDayRecords !== null && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-gray-800 text-sm">📅 {selectedDateStr} の履歴</h3>
              <button
                onClick={() => setSelectedDayRecords(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ✕ 閉じる
              </button>
            </div>

            {selectedDayRecords.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedDayRecords.map((r) => (
                  <div key={r.id} className="p-3 bg-gray-50 border rounded-2xl text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-800">
                        {r.category} <span className="text-gray-400 text-[10px]">({r.payment_method})</span>
                      </div>
                      {renderMemoWithoutAuto(r.memo)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-emerald-700">¥{Number(r.amount).toLocaleString()}</span>
                      <button
                        onClick={() => {
                          const target = r;
                          setSelectedDayRecords(null);
                          startEdit(target);
                        }}
                        className="text-blue-500 font-bold text-[10px]"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => {
                          deleteRecord(r.id);
                          setSelectedDayRecords(null);
                        }}
                        className="text-red-500 font-bold text-[10px]"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">この日の履歴はありません</p>
            )}

            <button
              onClick={() => setSelectedDayRecords(null)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}