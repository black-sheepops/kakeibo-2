import React from 'react';



export default function AppButton({ 
  children, 
  onClick, 
  type = "button", 
  variant = "sub", 
  className = "" 
}: AppButtonProps) { // ここで一度だけ型を適用します

  // 色の定義をCSSプロパティとして保持
  const getBackgroundColor = (variant: string) => {
    switch (variant) {
      case 'main': return '#238566';
      case 'danger': return '#fef2f2';
      default: return '#f3f4f6';
    }
  };

  const getTextColor = (variant: string) => {
    switch (variant) {
      case 'main': return '#ffffff';
      case 'danger': return '#ef4444';
      default: return '#4b5563';
    }
  };

  return (
    <button 
      type={type} 
      onClick={onClick}
      style={{
        backgroundColor: getBackgroundColor(variant),
        color: getTextColor(variant),
      }}
      className={`border-2 border-gray-200 px-4 py-2 rounded-xl font-bold text-xs transition active:scale-95 w-full ${className}`}
    >
      {children}
    </button>
  );
}