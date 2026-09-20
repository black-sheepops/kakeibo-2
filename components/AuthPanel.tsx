"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/utils/supabase";

interface AuthPanelProps {
  email: string | null;
  onSignedIn: () => void | Promise<void>;
  onSignedOut: () => void | Promise<void>;
  resetMode?: boolean;
  onPasswordReset?: () => void | Promise<void>;
}

export default function AuthPanel({ email, onSignedIn, onSignedOut, resetMode = false, onPasswordReset }: AuthPanelProps) {
  const [mode, setMode] = useState<"signIn" | "signUp" | "resetRequest" | "reset">(resetMode ? "reset" : "signIn");
  const [formEmail, setFormEmail] = useState("");
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    if (mode === "resetRequest") {
      const { error } = await supabase.auth.resetPasswordForEmail(formEmail.trim(), { redirectTo: window.location.origin });
      setMessage(error ? `再設定メールの送信に失敗しました: ${error.message}` : "パスワード再設定メールを送信しました。メールをご確認ください。");
      setIsSubmitting(false);
      return;
    }

    const result = mode === "reset"
      ? await supabase.auth.updateUser({ password })
      : mode === "signIn"
        ? await supabase.auth.signInWithPassword({ email: formEmail, password })
        : await supabase.auth.signUp({ email: formEmail, password });

    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === "reset") {
      setPassword("");
      setMessage("パスワードを変更しました。新しいパスワードでログインしてください。");
      await supabase.auth.signOut();
      await onPasswordReset?.();
    } else if (mode === "signUp") {
      setMessage("登録しました。メール確認が必要な場合は、確認後にログインしてください。");
    } else {
      setFormEmail("");
      setPassword("");
      await onSignedIn();
    }
    setIsSubmitting(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(`ログアウトに失敗しました: ${error.message}`);
      return;
    }
    onSignedOut();
  };

  return (
    <div className="relative">
      {email ? (
        <div className="flex max-w-40 flex-col items-start gap-1">
          <span className="max-w-full truncate text-[10px] font-bold text-gray-600" title={email}>{email}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-gray-600 shadow-sm border border-gray-200"
            title="ログアウト"
          >
            ログアウト
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex gap-2">
            {mode !== "reset" && mode !== "resetRequest" && <button type="button" onClick={() => setMode("signIn")} className={`flex-1 rounded-lg p-2 text-xs font-bold ${mode === "signIn" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>ログイン</button>}
            {mode !== "reset" && mode !== "resetRequest" && <button type="button" onClick={() => setMode("signUp")} className={`flex-1 rounded-lg p-2 text-xs font-bold ${mode === "signUp" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>新規登録</button>}
          </div>
          {mode === "resetRequest" && (
            <div className="mb-3">
              <h2 className="text-sm font-bold text-gray-700">パスワードを再設定</h2>
              <p className="mt-1 text-[10px] text-gray-500">登録済みのメールアドレスを入力してください。</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-2">
            {mode !== "reset" && <input type="email" required value={formEmail} onChange={(event) => { setFormEmail(event.target.value); setIsEmailConfirmed(false); }} placeholder="メールアドレス" className="w-full rounded-lg border p-2 text-xs" />}
            {mode === "resetRequest" && (
              <label className="flex items-start gap-2 text-[10px] text-gray-600">
                <input type="checkbox" checked={isEmailConfirmed} onChange={(event) => setIsEmailConfirmed(event.target.checked)} className="mt-0.5" />
                <span>入力したメールアドレスに間違いがないことを確認しました。</span>
              </label>
            )}
            {mode !== "resetRequest" && <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="パスワード（6文字以上）" className="w-full rounded-lg border p-2 text-xs" />}
            <button type="submit" disabled={isSubmitting || (mode === "resetRequest" && !isEmailConfirmed)} className="w-full rounded-lg bg-emerald-600 p-2 text-xs font-bold text-white disabled:opacity-50">
              {isSubmitting ? "処理中..." : mode === "reset" ? "パスワードを変更" : mode === "resetRequest" ? "再設定メールを送信" : mode === "signIn" ? "ログイン" : "アカウントを作成"}
            </button>
          </form>
          {mode === "resetRequest" && (
            <button type="button" onClick={() => { setMode("signIn"); setMessage(""); setIsEmailConfirmed(false); }} className="mt-2 w-full text-xs text-gray-500 underline">
              ログイン画面に戻る
            </button>
          )}
          {mode === "signIn" && <button type="button" onClick={() => { setMode("resetRequest"); setMessage(""); setIsEmailConfirmed(false); }} className="mt-2 w-full text-xs text-emerald-700 underline">パスワードを忘れた場合</button>}
          {message && <p className="mt-2 text-[10px] text-gray-600">{message}</p>}
        </div>
      )}
    </div>
  );
}
