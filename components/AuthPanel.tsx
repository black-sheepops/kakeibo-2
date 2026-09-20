"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/utils/supabase";

interface AuthPanelProps {
  email: string | null;
  onSignedIn: () => void;
  onSignedOut: () => void;
}

export default function AuthPanel({ email, onSignedIn, onSignedOut }: AuthPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [formEmail, setFormEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const result = mode === "signIn"
      ? await supabase.auth.signInWithPassword({ email: formEmail, password })
      : await supabase.auth.signUp({ email: formEmail, password });

    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === "signUp") {
      setMessage("登録しました。メール確認が必要な場合は、確認後にログインしてください。");
    } else {
      setIsOpen(false);
      setFormEmail("");
      setPassword("");
      onSignedIn();
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
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="text-xs font-bold px-3 py-2 rounded-full bg-white shadow-sm border border-gray-200 text-gray-600"
        >
          ログイン
        </button>
      )}

      {isOpen && !email && (
        <div className="absolute right-0 top-11 z-20 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex gap-2">
            <button type="button" onClick={() => setMode("signIn")} className={`flex-1 rounded-lg p-2 text-xs font-bold ${mode === "signIn" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>ログイン</button>
            <button type="button" onClick={() => setMode("signUp")} className={`flex-1 rounded-lg p-2 text-xs font-bold ${mode === "signUp" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>新規登録</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2">
            <input type="email" required value={formEmail} onChange={(event) => setFormEmail(event.target.value)} placeholder="メールアドレス" className="w-full rounded-lg border p-2 text-xs" />
            <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="パスワード（6文字以上）" className="w-full rounded-lg border p-2 text-xs" />
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-emerald-600 p-2 text-xs font-bold text-white disabled:opacity-50">
              {isSubmitting ? "処理中..." : mode === "signIn" ? "ログイン" : "アカウントを作成"}
            </button>
          </form>
          {message && <p className="mt-2 text-[10px] text-gray-600">{message}</p>}
        </div>
      )}
    </div>
  );
}
