import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Card from './Card';

// 1. props の型を定義
interface CalendarCardProps {
  onDateChange: (date: Date | null) => void;
  // react-calendar の tileContent 型定義に基づきます
  tileContent?: ({ date, view }: { date: Date; view: string }) => React.ReactNode;
  viewDate: Date;
}

// 2. 引数に型を適用
export default function CalendarCard({ onDateChange, tileContent, viewDate }: CalendarCardProps) {
  return (
    <Card>
      <h2 className="text-sm font-bold mb-3">📅 登録履歴</h2>
      <Calendar
        onActiveStartDateChange={({ activeStartDate }) => onDateChange(activeStartDate)}
        activeStartDate={viewDate}
        tileContent={tileContent}
        className="w-full border-none rounded-2xl"
      />
    </Card>
  );
}