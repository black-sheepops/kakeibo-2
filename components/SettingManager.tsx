"use client";

import React from "react";
import { AutoButton, AutoSchedule } from "@/types/kakeibo";
import type { ManagedUser, UserAuditLog } from "@/types/kakeibo";

type Props = {
  autoButtons: AutoButton[];
  schedules: AutoSchedule[];
  quickCategories: string[];
  paymentMethods: string[];
  qrPaymentProviders: string[];
  creditCardProviders: string[];
  weekDays: string[];
  // ボタン設定用
  btnLabel: string;
  setBtnLabel: (val: string) => void;
  btnAmount: string;
  setBtnAmount: (val: string) => void;
  btnCategory: string;
  setBtnCategory: (val: string) => void;
  btnMemo: string;
  setBtnMemo: (val: string) => void;
  btnPayment: string;
  setBtnPayment: (val: string) => void;
  editingBtnId: number | null;
  handleButtonSubmit: (e: React.FormEvent) => void;
  startEditButton: (btn: AutoButton) => void;
  cancelEditButton: () => void;
  handleDeleteButton: (id: number) => void;
  handleMoveButton: (id: number, direction: "up" | "down") => void;
  // 定期ルール設定用
  schLabel: string;
  setSchLabel: (val: string) => void;
  schAmount: string;
  setSchAmount: (val: string) => void;
  schCategory: string;
  setSchCategory: (val: string) => void;
  schMemo: string;
  setSchMemo: (val: string) => void;
  schPayment: string;
  setSchPayment: (val: string) => void;
  schInterval: "monthly" | "weekly";
  setSchInterval: (val: "monthly" | "weekly") => void;
  schDay: string;
  setSchDay: (val: string) => void;
  editingScheduleId: number | null;
  handleScheduleSubmit: (e: React.FormEvent) => void;
  startEditSchedule: (s: AutoSchedule) => void;
  cancelEditSchedule: () => void;
  handleDeleteSchedule: (id: number) => void;
  newCategory: string;
  setNewCategory: (value: string) => void;
  handleAddCategory: (event: React.FormEvent) => void;
  handleDeleteCategory: (name: string) => void;
  handleMoveCategory: (name: string, direction: "up" | "down") => void;
  newPaymentMethod: string;
  setNewPaymentMethod: (value: string) => void;
  handleAddPaymentMethod: (event: React.FormEvent) => void;
  handleDeletePaymentMethod: (name: string) => void;
  handleMovePaymentMethod: (name: string, direction: "up" | "down") => void;
  newQrPaymentProvider: string;
  setNewQrPaymentProvider: (value: string) => void;
  handleAddQrPaymentProvider: (event: React.FormEvent) => void;
  handleDeleteQrPaymentProvider: (name: string) => void;
  handleMoveQrPaymentProvider: (name: string, direction: "up" | "down") => void;
  newCreditCardProvider: string;
  setNewCreditCardProvider: (value: string) => void;
  handleAddCreditCardProvider: (event: React.FormEvent) => void;
  handleDeleteCreditCardProvider: (name: string) => void;
  handleMoveCreditCardProvider: (name: string, direction: "up" | "down") => void;
  accountEmail: string;
  isAdmin: boolean;
  handleEmailChange: (email: string) => Promise<void>;
  handlePasswordChange: (password: string) => Promise<void>;
  handleSignOut: () => Promise<void>;
  handleAccountDelete: () => Promise<void>;
  loadManagedUsers: () => Promise<ManagedUser[]>;
  updateManagedUser: (userId: string, role: "user" | "admin", disabled: boolean) => Promise<boolean>;
  loadAuditLogs: () => Promise<UserAuditLog[]>;
  deleteManagedUser: (userId: string) => Promise<boolean>;
};

export default function SettingManager({
  autoButtons,
  schedules,
  quickCategories,
  paymentMethods,
  qrPaymentProviders,
  creditCardProviders,
  weekDays,
  btnLabel, setBtnLabel, btnAmount, setBtnAmount, btnCategory, setBtnCategory, btnMemo, setBtnMemo, btnPayment, setBtnPayment, editingBtnId, handleButtonSubmit, startEditButton, cancelEditButton, handleDeleteButton,
  schLabel, setSchLabel, schAmount, setSchAmount, schCategory, setSchCategory, schMemo, setSchMemo, schPayment, setSchPayment, schInterval, setSchInterval, schDay, setSchDay, editingScheduleId, handleScheduleSubmit, startEditSchedule, cancelEditSchedule, handleDeleteSchedule, newCategory, setNewCategory, handleAddCategory, handleDeleteCategory, handleMoveCategory, newPaymentMethod, setNewPaymentMethod, handleAddPaymentMethod, handleDeletePaymentMethod, handleMovePaymentMethod, newQrPaymentProvider, setNewQrPaymentProvider, handleAddQrPaymentProvider, handleDeleteQrPaymentProvider, handleMoveQrPaymentProvider, newCreditCardProvider, setNewCreditCardProvider, handleAddCreditCardProvider, handleDeleteCreditCardProvider, handleMoveCreditCardProvider, handleMoveButton, accountEmail, isAdmin, handleEmailChange, handlePasswordChange, handleSignOut, handleAccountDelete, loadManagedUsers, updateManagedUser, loadAuditLogs, deleteManagedUser
}: Props) {
  const [activeTab, setActiveTab] = React.useState<"basic" | "quick" | "schedule" | "account">("basic");
  const [basicTab, setBasicTab] = React.useState<"category" | "payment" | "credit" | "qr">("category");
  const [newEmail, setNewEmail] = React.useState(accountEmail);
  const [newPassword, setNewPassword] = React.useState("");
  const [isAccountDeletionConfirmed, setIsAccountDeletionConfirmed] = React.useState(false);
  const [managedUsers, setManagedUsers] = React.useState<ManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [auditLogs, setAuditLogs] = React.useState<UserAuditLog[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = React.useState(false);
  const [accountMessage, setAccountMessage] = React.useState("");

  React.useEffect(() => {
    setNewEmail(accountEmail);
  }, [accountEmail]);

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newEmail.trim() || newEmail.trim() === accountEmail) return;
    await handleEmailChange(newEmail.trim());
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 6) return;
    await handlePasswordChange(newPassword);
    setNewPassword("");
  };

  React.useEffect(() => {
    if (!isAdmin || activeTab !== "account") return;
    setIsLoadingUsers(true);
    loadManagedUsers()
      .then(setManagedUsers)
      .finally(() => setIsLoadingUsers(false));
    setIsLoadingAuditLogs(true);
    loadAuditLogs()
      .then(setAuditLogs)
      .finally(() => setIsLoadingAuditLogs(false));
  }, [activeTab, isAdmin, loadManagedUsers, loadAuditLogs]);

  const handleManagedUserUpdate = async (user: ManagedUser, role: "user" | "admin", disabled: boolean) => {
    if (!confirm(`${user.email || "このユーザー"}の設定を変更しますか？`)) return;
    if (await updateManagedUser(user.user_id, role, disabled)) {
      setManagedUsers((current) => current.map((item) => item.user_id === user.user_id ? { ...item, role, disabled } : item));
      setAccountMessage("ユーザー設定を更新しました。");
      setAuditLogs(await loadAuditLogs());
    }
  };

  const handleManagedUserDelete = async (user: ManagedUser) => {
    if (!confirm(`${user.email || "このユーザー"}を削除しますか？入力データもすべて削除され、元に戻せません。`)) return;
    if (await deleteManagedUser(user.user_id)) {
      setManagedUsers((current) => current.filter((item) => item.user_id !== user.user_id));
      setAuditLogs(await loadAuditLogs());
      setAccountMessage("ユーザーと関連データを削除しました。");
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="grid grid-cols-4 gap-2 bg-gray-100 p-1.5 rounded-2xl">
        {[
          { id: "basic" as const, label: "🏷️ 基本設定" },
          { id: "quick" as const, label: "🎯 ワンタップ" },
          { id: "schedule" as const, label: "🔄 定期ルール" },
          { id: "account" as const, label: "👤 ログイン情報" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-2.5 rounded-xl text-[11px] font-bold transition ${
              activeTab === tab.id
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "basic" && <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-700">🏷️ 基本設定</h2>
          <p className="text-[10px] text-gray-400 mt-1">入力画面で使うカテゴリと支払い先を管理します</p>
        </div>
        <div className="grid grid-cols-4 gap-1.5 bg-gray-100 p-1.5 rounded-2xl">
          {[
            { id: "category" as const, label: "カテゴリ" },
            { id: "payment" as const, label: "支払い方法" },
            { id: "credit" as const, label: "クレカ" },
            { id: "qr" as const, label: "QR決済" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setBasicTab(tab.id)}
              className={`py-2 rounded-xl text-[10px] font-bold transition ${
                basicTab === tab.id
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {basicTab === "category" && <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
            <p className="text-xs font-bold text-gray-600 mb-2">🏷️ カテゴリ</p>
            <div className="space-y-2">
              {quickCategories.map((category, index) => (
                <div key={category} className="flex items-center justify-between gap-2 h-9 text-xs bg-gray-50 rounded-xl px-3">
                  <span className="min-w-0 truncate">{category}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => handleMoveCategory(category, "up")} disabled={index === 0} className="px-1.5 text-gray-500 disabled:opacity-30" aria-label={`${category}を上へ`}>↑</button>
                    <button type="button" onClick={() => handleMoveCategory(category, "down")} disabled={index === quickCategories.length - 1} className="px-1.5 text-gray-500 disabled:opacity-30" aria-label={`${category}を下へ`}>↓</button>
                    <button type="button" onClick={() => handleDeleteCategory(category)} className="text-red-400 font-bold ml-1">削除</button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddCategory} className="flex gap-2 mt-2">
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="カテゴリ名" className="min-w-0 flex-1 p-2 text-xs border rounded-xl" />
              <button type="submit" className="px-3 text-xs bg-emerald-600 text-white rounded-xl">追加</button>
            </form>
          </div>}

          {basicTab === "payment" && <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
            <p className="text-xs font-bold text-gray-600 mb-2">💰 支払い方法</p>
            <div className="space-y-2">
              {paymentMethods.map((method, index) => (
                <div key={method} className="flex items-center justify-between gap-2 h-9 text-xs bg-gray-50 rounded-xl px-3">
                  <span className="min-w-0 truncate">{method}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => handleMovePaymentMethod(method, "up")} disabled={index === 0} className="px-1.5 text-gray-500 disabled:opacity-30" aria-label={`${method}を上へ`}>↑</button>
                    <button type="button" onClick={() => handleMovePaymentMethod(method, "down")} disabled={index === paymentMethods.length - 1} className="px-1.5 text-gray-500 disabled:opacity-30" aria-label={`${method}を下へ`}>↓</button>
                    <button type="button" onClick={() => handleDeletePaymentMethod(method)} className="text-red-400 font-bold ml-1">削除</button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddPaymentMethod} className="flex gap-2 mt-2">
              <input value={newPaymentMethod} onChange={(e) => setNewPaymentMethod(e.target.value)} placeholder="支払い方法" className="min-w-0 flex-1 p-2 text-xs border rounded-xl" />
              <button type="submit" className="px-3 text-xs bg-emerald-600 text-white rounded-xl">追加</button>
            </form>
          </div>}
          {basicTab === "credit" && <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
            <p className="text-xs font-bold text-gray-600 mb-1">💳 クレジットカード会社</p>
            <p className="text-[10px] text-gray-400 mb-2">カード選択時に表示する会社</p>
            <div className="space-y-2">
              {creditCardProviders.map((provider, index) => (
                <div key={provider} className="flex items-center justify-between gap-2 h-9 text-xs bg-gray-50 rounded-xl px-3">
                  <span className="min-w-0 truncate">{provider}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => handleMoveCreditCardProvider(provider, "up")} disabled={index === 0} className="px-1.5 text-gray-500 disabled:opacity-30" aria-label={`${provider}を上へ`}>↑</button>
                    <button type="button" onClick={() => handleMoveCreditCardProvider(provider, "down")} disabled={index === creditCardProviders.length - 1} className="px-1.5 text-gray-500 disabled:opacity-30" aria-label={`${provider}を下へ`}>↓</button>
                    <button type="button" onClick={() => handleDeleteCreditCardProvider(provider)} className="text-red-400 font-bold ml-1">削除</button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddCreditCardProvider} className="flex gap-2 mt-2">
              <input value={newCreditCardProvider} onChange={(e) => setNewCreditCardProvider(e.target.value)} placeholder="カード会社名" className="min-w-0 flex-1 p-2 text-xs border rounded-xl" />
              <button type="submit" className="px-3 text-xs bg-emerald-600 text-white rounded-xl">追加</button>
            </form>
          </div>}
          {basicTab === "qr" && <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
            <p className="text-xs font-bold text-gray-600 mb-1">📱 QR決済会社</p>
            <p className="text-[10px] text-gray-400 mb-2">QR決済選択時に表示する会社</p>
            <div className="space-y-2">
              {qrPaymentProviders.map((provider, index) => (
                <div key={provider} className="flex items-center justify-between gap-2 h-9 text-xs bg-gray-50 rounded-xl px-3">
                  <span className="min-w-0 truncate">{provider}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => handleMoveQrPaymentProvider(provider, "up")} disabled={index === 0} className="px-1.5 text-gray-500 disabled:opacity-30" aria-label={`${provider}を上へ`}>↑</button>
                    <button type="button" onClick={() => handleMoveQrPaymentProvider(provider, "down")} disabled={index === qrPaymentProviders.length - 1} className="px-1.5 text-gray-500 disabled:opacity-30" aria-label={`${provider}を下へ`}>↓</button>
                    <button type="button" onClick={() => handleDeleteQrPaymentProvider(provider)} className="text-red-400 font-bold ml-1">削除</button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddQrPaymentProvider} className="flex gap-2 mt-2">
              <input value={newQrPaymentProvider} onChange={(e) => setNewQrPaymentProvider(e.target.value)} placeholder="決済会社名" className="min-w-0 flex-1 p-2 text-xs border rounded-xl" />
              <button type="submit" className="px-3 text-xs bg-emerald-600 text-white rounded-xl">追加</button>
            </form>
          </div>}
      </div>}
      {activeTab === "account" && <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-700">👤 ログイン情報</h2>
          <p className="text-[10px] text-gray-400 mt-1">アカウント情報と認証設定を変更できます</p>
        </div>
        {accountMessage && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{accountMessage}</p>}
        <button type="button" onClick={handleSignOut} className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold text-red-600">ログアウト</button>
        <div className="rounded-2xl bg-gray-50 p-3 text-xs">
          <span className="text-gray-500">権限の種類</span>
          <p className="mt-1 font-bold text-emerald-700">{isAdmin ? "管理者" : "一般ユーザー"}</p>
        </div>
        <form onSubmit={submitEmail} className="rounded-2xl border border-gray-100 p-3">
          <label className="text-xs font-bold text-gray-600">ログイン名（メールアドレス）</label>
          <input type="email" required value={newEmail} onChange={(event) => setNewEmail(event.target.value)} className="mt-2 w-full rounded-xl border p-2.5 text-xs" />
          <button type="submit" disabled={!newEmail.trim() || newEmail.trim() === accountEmail} className="mt-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">ログイン名を変更</button>
          <p className="mt-2 text-[10px] text-gray-400">変更後に確認メールが届く場合があります。</p>
        </form>
        <form onSubmit={submitPassword} className="rounded-2xl border border-gray-100 p-3">
          <label className="text-xs font-bold text-gray-600">パスワード変更</label>
          <input type="password" required minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="新しいパスワード（6文字以上）" className="mt-2 w-full rounded-xl border p-2.5 text-xs" />
          <button type="submit" disabled={newPassword.length < 6} className="mt-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">パスワードを変更</button>
        </form>
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-3">
          <p className="text-[10px] text-red-700">アカウントを削除すると、入力した履歴・設定もすべて削除され、元に戻せません。</p>
          <label className="mt-3 flex items-start gap-2 text-[10px] text-red-700">
            <input
              type="checkbox"
              checked={isAccountDeletionConfirmed}
              onChange={(event) => setIsAccountDeletionConfirmed(event.target.checked)}
              className="mt-0.5 accent-red-600"
            />
            <span>削除すると元に戻せないことを確認しました</span>
          </label>
          <button
            type="button"
            onClick={handleAccountDelete}
            disabled={!isAccountDeletionConfirmed}
            className="mt-2 rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            アカウントを削除
          </button>
        </div>
        {isAdmin && <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
          <h3 className="text-xs font-bold text-amber-800">管理者用ユーザー管理</h3>
          {isLoadingUsers ? <p className="mt-2 text-[10px] text-gray-500">読み込み中...</p> : (
            <div className="mt-2 space-y-2">
              {managedUsers.map((user) => (
                <div key={user.user_id} className="rounded-xl bg-white p-2 text-[10px]">
                  <p className="truncate font-bold text-gray-700">{user.email || "メールアドレスなし"}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <select value={user.role} onChange={(event) => handleManagedUserUpdate(user, event.target.value as "user" | "admin", user.disabled)} className="rounded-lg border p-1">
                      <option value="user">一般ユーザー</option>
                      <option value="admin">管理者</option>
                    </select>
                    <button type="button" onClick={() => handleManagedUserUpdate(user, user.role, !user.disabled)} className="rounded-lg border border-gray-200 p-1">
                      {user.disabled ? "利用停止中（解除）" : "利用停止"}
                    </button>
                  </div>
                  <button type="button" onClick={() => handleManagedUserDelete(user)} className="mt-1 w-full rounded-lg border border-red-200 p-1 text-red-600">
                    ユーザーとデータを削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>}
        {isAdmin && <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
          <h3 className="text-xs font-bold text-gray-700">操作履歴</h3>
          {isLoadingAuditLogs ? <p className="mt-2 text-[10px] text-gray-500">読み込み中...</p> : auditLogs.length === 0 ? (
            <p className="mt-2 text-[10px] text-gray-400">記録された操作はありません</p>
          ) : (
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg bg-white px-2 py-1.5 text-[10px]">
                  <span className="font-bold text-gray-700">{log.action}</span>
                  <span className="ml-2 text-gray-400">{new Date(log.created_at).toLocaleString("ja-JP")}</span>
                </div>
              ))}
            </div>
          )}
        </div>}
      </div>}
      {/* ワンタップボタン設定カード */}
      {activeTab === "quick" && <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-700">🎯 ワンタップ入力</h2>
          <p className="text-[10px] text-gray-400 mt-1">よく使う支出をすぐ入力できるボタンです</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {autoButtons.map(btn => (
            <div key={btn.id} className="flex min-h-32 flex-col justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <button type="button" onClick={() => startEditButton(btn)} className="text-left mb-2 group active:scale-95 transition-all">
                <div className="font-bold text-indigo-600 text-xs">{btn.label}</div>
                <div className="text-[10px] text-gray-500 mt-1">{btn.category} / 💳 {btn.payment_method}</div>
                <div className="font-bold text-gray-700 text-xs mt-1">￥{btn.amount.toLocaleString()}</div>
              </button>
              <div className="flex items-center justify-between gap-1 mt-2">
                <div className="flex gap-1">
                  <button type="button" onClick={() => handleMoveButton(btn.id, "up")} className="px-2 py-1 text-[10px] text-gray-500 bg-white rounded-lg border border-gray-200 active:scale-95" aria-label={`${btn.label}を上へ`}>↑</button>
                  <button type="button" onClick={() => handleMoveButton(btn.id, "down")} className="px-2 py-1 text-[10px] text-gray-500 bg-white rounded-lg border border-gray-200 active:scale-95" aria-label={`${btn.label}を下へ`}>↓</button>
                </div>
                <button type="button" onClick={() => handleDeleteButton(btn.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold active:scale-95">🗑 削除</button>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleButtonSubmit} className="flex flex-col gap-3 mt-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50">
          <input type="text" placeholder="ボタン名" value={btnLabel} onChange={(e) => setBtnLabel(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <input type="number" placeholder="金額" value={btnAmount} onChange={(e) => setBtnAmount(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <div className="grid grid-cols-2 gap-2">
            <select value={btnCategory} onChange={(e) => setBtnCategory(e.target.value)} className="p-2.5 text-xs border border-gray-200 rounded-xl bg-white">
              <option value="">-- カテゴリ --</option>
              {quickCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={btnPayment} onChange={(e) => setBtnPayment(e.target.value)} className="p-2.5 text-xs border border-gray-200 rounded-xl bg-white">
              {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <input type="text" placeholder="メモ" value={btnMemo} onChange={(e) => setBtnMemo(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-3 text-sm bg-emerald-600 text-white font-bold rounded-xl">{editingBtnId ? "🔄 更新" : "➕ 追加"}</button>
            {editingBtnId && <button type="button" onClick={cancelEditButton} className="flex-1 py-3 text-sm bg-gray-100 text-gray-600 font-bold rounded-xl">キャンセル</button>}
          </div>
        </form>
      </div>}

      {/* 定期ルール（固定費）設定カード */}
      {activeTab === "schedule" && <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-700">🔄 定期ルール</h2>
          <p className="text-[10px] text-gray-400 mt-1">固定費などを自動登録するルールです</p>
        </div>
        <div className="flex flex-col gap-2">
          {schedules.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">登録データがありません</p> : schedules.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <button 
                type="button" 
                onClick={() => startEditSchedule(s)} 
                className="text-left flex-1 active:scale-95 transition-all"
              >
                <div className="font-bold text-emerald-700 text-xs">{s.label} <span className="text-gray-600">({s.amount.toLocaleString()}円)</span></div>
                <div className="text-[10px] text-gray-500 mt-1">🔄 {s.interval_type === "monthly" ? `毎月${s.target_day}日` : `毎週${weekDays[s.target_day]}曜`} / 💳 {s.payment_method}</div>
              </button>
              <button type="button" onClick={() => handleDeleteSchedule(s.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold px-2 active:scale-95">🗑 削除</button>
            </div>
          ))}
        </div>
        <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-3 mt-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-50">
          <input type="text" placeholder="名前" value={schLabel} onChange={(e) => setSchLabel(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <input type="number" placeholder="金額" value={schAmount} onChange={(e) => setSchAmount(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <div className="grid grid-cols-2 gap-2">
            <select value={schCategory} onChange={(e) => setSchCategory(e.target.value)} className="p-2.5 text-xs border border-gray-200 rounded-xl bg-white">
              <option value="">-- カテゴリ --</option>
              {quickCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={schPayment} onChange={(e) => setSchPayment(e.target.value)} className="p-2.5 text-xs border border-gray-200 rounded-xl bg-white">
              {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
              <select
                value={schInterval}
                onChange={(e) => {
                  setSchInterval(e.target.value as "monthly" | "weekly");
                  setSchDay("1");
                }}
                className="p-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50 flex-1"
              >
                <option value="monthly">毎月固定</option>
                <option value="weekly">毎週固定</option>
              </select>
              <select 
                value={schDay} 
                onChange={(e) => setSchDay(e.target.value)} 
                className="p-2.5 text-xs border border-gray-200 rounded-xl bg-gray-50 flex-1"
              >
                {schInterval === "monthly" ? (
                  Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>{d}日</option>
                  ))
                ) : (
                  <>
                    <option value="1">月曜日</option>
                    <option value="2">火曜日</option>
                    <option value="3">水曜日</option>
                    <option value="4">木曜日</option>
                    <option value="5">金曜日</option>
                    <option value="6">土曜日</option>
                    <option value="0">日曜日</option>
                  </>
                )}
              </select>
            </div>
          <input type="text" placeholder="メモ" value={schMemo} onChange={(e) => setSchMemo(e.target.value)} className="w-full p-2.5 text-xs border border-gray-200 rounded-xl bg-white" />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-3 text-sm bg-emerald-600 text-white font-bold rounded-xl">{editingScheduleId !== null ? "🔄 更新" : "➕ 追加"}</button>
            {editingScheduleId !== null && (
              <button type="button" onClick={cancelEditSchedule} className="flex-1 py-3 text-sm bg-gray-100 text-gray-600 font-bold rounded-xl">キャンセル</button>
            )}
          </div>
        </form>
      </div>}
    </div>
  );
}