import React from 'react';
import dynamic from 'next/dynamic';
import 'react-calendar/dist/Calendar.css';
import Card from './Card';

// 1. props の型を定義
interface CalendarCardProps {
  onDateChange: (date: Date | null) => void;
  onActiveStartDateChange?: (params: { activeStartDate: Date | null }) => void; // 追加
  tileContent?: ({ date, view }: { date: Date; view: string }) => React.ReactNode;
  viewDate: Date;
}

// 2. 修正箇所: dynamic インポートの構文を正し、名前を統一する
const Calendar = dynamic(() => import('react-calendar'), {
  ssr: false, // サーバーサイドレンダリングを無効化
});
export default function CalendarCard({ onDateChange, onActiveStartDateChange, tileContent, viewDate }: CalendarCardProps) {
  return (
    <Card>
      <h2 className="text-sm font-bold mb-3">📅 登録履歴</h2>
      <Calendar
        // 3. 修正箇所: ここを CalendarComponent ではなく Calendar に統一
        onChange={(value) => onDateChange(value as Date)}
        onActiveStartDateChange={onActiveStartDateChange}
        activeStartDate={viewDate}
        tileContent={tileContent}
        className="w-full border-none rounded-2xl"
      />
    </Card>
  );
}