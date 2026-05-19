// 入力用のコンポーネント
'use client';

import Image from "next/image";
import { useState } from 'react';

export default function InputField({
  label,
  labelColor = 'text-gray-700',
  type = 'text',
  value,
  onChange,
  onKeyDown,
  name,
  placeholder,
  onSearchClick,
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="mb-4">
      {label && <label className="block mb-1 font-semibold">{label}</label>}
      <div className="relative flex-1">
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        
        {onSearchClick && (
          <button
            type="button"
            onClick={onSearchClick}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <img src="/icons/search.svg" alt="検索" className="w-5 h-5" />
          </button>
        )}

        {isPassword && (
          <button
              type="button"
              onClick={() => setShow((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              tabIndex={-1}
            >
              {show ? '非表示' : '表示'}
          </button>
        )}
        </div>
    </div>
  );
}
