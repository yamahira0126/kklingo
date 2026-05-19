// エラーメッセージを出す

'use client';
export default function FormError({ message }) {
  if (!message) return null;
  return <p className="text-red-600 text-sm mt-1">{message}</p>;
}
