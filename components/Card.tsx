import React from 'react';

// 1. props の型を定義
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// 2. 定義した型を引数に適用
export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}