import type { Metadata } from "next";
import { Inter } from "next/font/google";
// ★ここを修正！一番確実な「自分の真横にある globals.css」を指定する書き方にしました
import "./globals.css"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "スマート家計簿",
  description: "サクサク動く、あなた専用の家計簿アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}