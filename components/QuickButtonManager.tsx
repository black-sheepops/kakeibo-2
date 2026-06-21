import AppButton from "./AppButton";

export default function QuickButtonManager({
  buttons,
  onDelete,
  onSubmit,
  editingBtnId, setEditingBtnId,
  btnLabel, setBtnLabel,
  btnAmount, setBtnAmount,
  btnCategory, setBtnCategory,
  btnMemo, setBtnMemo,
  btnPayment, setBtnPayment,
  quickCategories,
  paymentMethods,
  autoButtons,
  handleAutoSelect
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 mb-2">ワンタップ登録</p>

        <div className="grid grid-cols-4 gap-2 w-full">
          {autoButtons?.map((btn) => (
            // ★ここを relative にすることで削除ボタンを右上に配置できます
            <div key={btn.id} className="relative w-full min-w-0">
              <AppButton
                onClick={() => handleAutoSelect?.(btn)}
                className="w-full h-16 flex flex-col justify-center items-center bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-500 transition"
              >
                <span className="font-bold text-[11px] truncate w-full px-1 text-gray-700">{btn.label}</span>
                <span className="text-[10px] font-semibold text-emerald-600">￥{btn.amount.toLocaleString()}</span>
              </AppButton>

              {/* 削除ボタン：AppButton の外側（div の中）に配置 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(btn.id);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-100 text-red-800 text-[10px] rounded-full hover:bg-red-200 shadow-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    
      <form onSubmit={onSubmit} className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
        {/* フォーム部分はそのまま */}
        <h3 className="text-sm font-bold text-indigo-800">ボタンの編集・作成</h3>
        <input type="text" placeholder="ボタン名" value={btnLabel} onChange={(e) => setBtnLabel(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
        <input type="number" placeholder="金額" value={btnAmount} onChange={(e) => setBtnAmount(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
        
        <select value={btnCategory} onChange={(e) => setBtnCategory(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white">
          <option value="">-- カテゴリ --</option>
          {quickCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <select value={btnPayment} onChange={(e) => setBtnPayment(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white">
          {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        
        <input type="text" placeholder="メモ" value={btnMemo} onChange={(e) => setBtnMemo(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white" />
        
        <AppButton variant="main" type="submit" className="w-full py-2">
          {editingBtnId ? "ボタンを更新" : "ボタンを追加"}
        </AppButton>
      </form>
    </div>
  );
}