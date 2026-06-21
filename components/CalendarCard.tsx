// components/CalendarCard.tsx
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Card from './Card';

export default function CalendarCard({ onDateChange, tileContent, viewDate }) {
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