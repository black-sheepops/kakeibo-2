/** @type {import('next').NextConfig} */

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  // 開発環境ではPWAを無効にする
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  // Turbopackの設定を一切含めない（これが重要）
  webpack: (config) => {
    return config;
  },
});