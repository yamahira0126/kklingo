// 問題を評価する
'use client';

import { useState } from "react";
import { FaStar } from 'react-icons/fa';

export default function RatingCard({ questionId }) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const handleRate = (star) => setScore(star);

  const handleSubmit = (e) => {
    e.preventDefault();
    // ここでAPI送信処理
    setSent(true);
  };

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-700 font-bold">評価ありがとうございました！</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 flex flex-col gap-3 max-w-lg mx-auto">
      <div className="flex gap-2 justify-center mb-2">
        {[1,2,3,4,5].map(star => (
          <FaStar
            key={star}
            className={star <= score ? "text-yellow-400 text-2xl cursor-pointer" : "text-gray-300 text-2xl cursor-pointer"}
            onClick={() => handleRate(star)}
          />
        ))}
      </div>

      <button
        type="submit"
        className="bg-[#59d5d7] text-white font-bold rounded py-2 mt-2 hover:bg-[#3eb5b6] transition shadow"
        disabled={score === 0}
      >
        評価を送信
      </button>
    </form>
  );
}
