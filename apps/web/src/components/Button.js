// ボタン
'use client';

export default function Button({
  type = 'button',
  label, className = '',
  disabled = false,
  onClick,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`font-bold py-3 px-6 rounded-full shadow-md hover:opacity-50 ${className}`}
      disabled={disabled}
    >
      {label}
    </button>
  );
}