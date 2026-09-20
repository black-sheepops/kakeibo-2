// components/SettingForm.tsx
import { AutoButton, AutoSchedule } from '../types/index';

interface SettingFormProps {
  autoButtons: AutoButton[];
  setEditingBtnId: (id: number | null) => void;
  setBtnLabel: (val: string) => void;
  setBtnAmount: (val: string) => void;
  setBtnCategory: (val: string) => void;
  setBtnMemo: (val: string) => void;
  handleButtonSubmit: (e: React.FormEvent) => void;
  btnLabel: string;
  btnAmount: string;
  btnCategory: string;
  btnPayment: string;
  setBtnPayment: (val: string) => void;
  btnMemo: string;
  quickCategories: string[];
  paymentMethods: string[];
  editingBtnId: number | null;
  schedules: AutoSchedule[];
  handleDeleteSchedule: (id: number) => void;
  handleScheduleSubmit: (e: React.FormEvent) => void;
  setScheduleLabel: (val: string) => void;
  setScheduleAmount: (val: string) => void;
  scheduleLabel: string;
  scheduleAmount: string;
  setEditingScheduleId: (id: number | null) => void;
  editingScheduleId: number | null;
}

export default function SettingForm({
  autoButtons, setEditingBtnId, setBtnLabel, setBtnAmount,
  setBtnCategory, setBtnMemo, handleButtonSubmit, btnLabel, btnAmount, 
  btnCategory, btnPayment, setBtnPayment, btnMemo, 
  quickCategories, paymentMethods, editingBtnId,
  schedules, handleDeleteSchedule, handleScheduleSubmit, setScheduleLabel, setScheduleAmount, 
  scheduleLabel, scheduleAmount, setEditingScheduleId, editingScheduleId
}: SettingFormProps) {
return (
    // ★ここを <> で囲み、一番下で </> で閉じます
    <>
      <form onSubmit={handleButtonSubmit} className="space-y-3">
        {/* ボタン一覧エリア */}
        <div className="grid grid-cols-4 gap-1">
          {autoButtons.map(btn => (
            <button 
              type="button" 
              key={btn.id} 
              onClick={() => { 
                setBtnLabel(btn.label); setBtnAmount(btn.amount.toString()); 
                setBtnCategory(btn.category); setBtnMemo(btn.memo); 
                setBtnPayment(btn.payment_method || "現金"); setEditingBtnId(btn.id); 
              }} 
              className="p-1 bg-gray-100 rounded text-[10px] font-bold"
            >
              {btn.label}
            </button>
          ))}
        </div>

        <input type="text" placeholder="ボタン名" value={btnLabel} onChange={(e) => setBtnLabel(e.target.value)} className="w-full p-2 border rounded" />
        <input type="number" placeholder="金額" value={btnAmount} onChange={(e) => setBtnAmount(e.target.value)} className="w-full p-2 border rounded" />
        
        <div className="grid grid-cols-2 gap-2">
          <select value={btnCategory} onChange={(e) => setBtnCategory(e.target.value)} className="p-2 border rounded">
            {quickCategories?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={btnPayment} onChange={(e) => setBtnPayment(e.target.value)} className="p-2 border rounded">
            {paymentMethods?.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        
        <input placeholder="メモ" value={btnMemo} onChange={(e) => setBtnMemo(e.target.value)} className="w-full p-2 border rounded" />
        
        <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">
          {editingBtnId ? "更新" : "登録"}
        </button>
      </form>

    <div className="border-t mt-6 pt-4">
      <h2 className="font-bold text-sm mb-3">定期登録（固定費）の管理</h2>

      {/* 1. 登録・編集用フォームエリア */}
      <div className="mb-6 bg-gray-50 p-4 rounded-xl">
        <h3 className="text-xs font-bold mb-2">新規登録・編集</h3>
        <form onSubmit={handleScheduleSubmit} className="space-y-2">
          <input 
            placeholder="固定費名" 
            value={scheduleLabel} 
            onChange={(e) => setScheduleLabel(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
          <input 
            type="number"
            placeholder="金額" 
            value={scheduleAmount} 
            onChange={(e) => setScheduleAmount(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
          <button type="submit" className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg text-sm">
            {editingScheduleId ? "スケジュールを更新" : "登録"}
          </button>
        </form>
      </div>

            {/* 2. 一覧リスト表示エリア */}
            <div className="mt-6">
            <h3 className="text-sm font-bold mb-2">登録済みスケジュール一覧</h3>
            
            {/* ここでデータの有無をチェックして表示します */}
            {Array.isArray(schedules) && schedules.length > 0 ? (
              schedules.map((sch) => (
                <div key={sch.id} className="bg-white p-3 border rounded-lg mb-2">
                  <p className="font-bold">{sch.label}</p>
                  <p className="text-xs text-gray-500">￥{sch.amount.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">データが登録されていません。</p>
            )}
          </div>

          
    </div>
    </>
  );
}