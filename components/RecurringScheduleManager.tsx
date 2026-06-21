import AppButton from "./AppButton";

export default function RecurringScheduleManager({
  schedules,
  onDelete,
  onSubmit,
  // 親から渡されるべき state や props を追加
  schLabel, setSchLabel,
  schAmount, setSchAmount,
  schCategory, setSchCategory,
  schPayment, setSchPayment,
  schInterval, setSchInterval,
  schDay, setSchDay,
  schMemo, setSchMemo,
  quickCategories,
  paymentMethods,
  weekDays,
  editingSchId,        // 追加
  setEditingSchId      // 追加
}) {

  console.log("受け取ったスケジュール:", schedules);
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "monthly" | "weekly";
    setSchInterval(value);
    setSchDay(value === "monthly" ? "1" : "0");
  };

  return (
    <div className="bg-emerald-50 p-4 rounded-xl border">
      <h3 className="text-sm font-bold text-emerald-800 mb-3">🔄 定期ルール管理</h3>

      {/* 一覧リスト部分 */}
      <div className="space-y-2 mb-4">
        {schedules.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2 bg-gray-50 rounded-xl border">
            登録されているスケジュールはありません
          </p>
        ) : (
          schedules.map((sch) => (
            <div key={sch.id} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl border text-xs">
              {/* 左側：コンテンツ */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-gray-700 truncate">{sch.label} <span className="text-emerald-600">(￥{sch.amount.toLocaleString()})</span></div>
                <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                  🔄 {sch.interval_type === "monthly" ? `毎月 ${sch.target_day} 日` : `毎週 ${weekDays[sch.target_day]}曜日`} / 💳 {sch.payment_method}
                </div>
              </div>

              {/* 右側：ボタンエリア（flex-shrink-0 で縮まないようにする） */}
              <div className="flex gap-1 flex-shrink-0">
                <AppButton variant="sub" onClick={() => {
                  setSchLabel(sch.label);
                  setSchAmount(sch.amount.toString());
                  setSchCategory(sch.category);
                  setSchPayment(sch.payment_method);
                  setSchInterval(sch.interval_type);
                  setSchDay(sch.target_day.toString());
                  setSchMemo(sch.memo);
                  setEditingSchId(sch.id);
                }}
                  className="text-emerald-600 font-bold px-2 hover:underline"
                >
                  編集
                </AppButton>
                <AppButton variant="danger" onClick={() => onDelete(sch.id)} className="px-2">
                  削除
                </AppButton>
              </div>
            </div>
          ))
        )}
      </div>

      {/* フォーム部分 */}
      <form onSubmit={onSubmit} className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-3">
        <p className="text-xs font-bold text-emerald-800">＋ 新しい定期ルールを追加</p>
        <input type="text" placeholder="名前" value={schLabel} onChange={(e) => setSchLabel(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
        <input type="number" placeholder="金額" value={schAmount} onChange={(e) => setSchAmount(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />

        <div className="grid grid-cols-2 gap-2">
          <select value={schCategory} onChange={(e) => setSchCategory(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white">
            <option value="">-- カテゴリ --</option>
            {quickCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={schPayment} onChange={(e) => setSchPayment(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white">
            {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="bg-white p-2 rounded-lg border grid grid-cols-2 gap-2 items-center text-xs">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-0.5">繰り返しの周期</label>
            <select
              value={schInterval}
              onChange={handleIntervalChange}
              className="w-full p-1 border rounded bg-gray-50 font-medium"
            >
              <option value="monthly">毎月固定</option>
              <option value="weekly">毎週固定</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-0.5">{schInterval === "monthly" ? "指定する日付" : "指定する曜日"}</label>
            <select value={schDay} onChange={(e) => setSchDay(e.target.value)} className="w-full p-1 border rounded bg-gray-50 font-medium">
              {schInterval === "monthly"
                ? Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}日</option>)
                : weekDays.map((w, idx) => <option key={idx} value={idx}>{w}曜日</option>)
              }
            </select>
          </div>
        </div>

        <input type="text" placeholder="自動入力用のメモ (空欄でもOK)" value={schMemo} onChange={(e) => setSchMemo(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
        <AppButton
          variant="main"
          type="submit"
          className={`w-full py-2 text-white text-xs font-bold rounded-lg transition ${editingSchId ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
        >
          {editingSchId ? "定期ルールを更新する" : "スケジュールに登録"}
        </AppButton>

        {/* キャンセルボタン（編集中のみ表示） */}
        {editingSchId && (
          <AppButton variant="sub" type="button" onClick={() => {
            setEditingSchId(null);
            // フォームをクリアする処理
          }} className="w-full py-1">
            編集をキャンセル
          </AppButton>
        )}
      </form>
    </div>
  );
}