"use client"; // これを忘れるとエラーになります！
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (type: "login" | "signup") => {
    if (type === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert("確認メールを送信しました。");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-gray-800 text-center">ログイン</h1>
        <input type="email" placeholder="メールアドレス" className="w-full p-3 border rounded-xl" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="パスワード" className="w-full p-3 border rounded-xl" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={() => handleAuth("login")} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">ログイン</button>
        <button onClick={() => handleAuth("signup")} className="w-full text-indigo-600 font-bold">新規登録</button>
      </div>
    </div>
  );
}