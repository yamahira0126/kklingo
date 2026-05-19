// デザイン用　カード
"use client";

export default function Card({ title, description, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-6 ${className}`}>
      {title && <h2 className="text-xl font-bold mb-2">{title}</h2>}
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {children}
    </div>
  );
}
