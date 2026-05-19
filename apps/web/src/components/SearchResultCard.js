// 検索結果に表示するときのカード
'use client';

import { useRouter } from 'next/navigation';
import { FaStar, FaRegStar } from 'react-icons/fa';

export default function SearchResultCard({
  id,
  question,
  tags = [],
  userIcon,
  userName,
  rating,
  ratingCount,
  is_visible,
  onTagClick,
}) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/solve/${id}`);
  };

  const shortQuestion = question.length > 20 ? question.slice(0, 20) + '…' : question;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-3 border border-gray-200 max-w-xl w-full">
      <p className="text-lg font-semibold text-gray-800">
        {!is_visible && (
          <img
            src="/icons/lock.svg"
            className="inline-block w-5 h-5 mr-1"
            title="非公開"
          />
        )}
        {shortQuestion}
      </p>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <button
            key={index}
            onClick={() => onTagClick && onTagClick(tag)}
            className="bg-[#59d5d7] text-white px-2 py-1 rounded text-sm hover:opacity-80 transition"
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <img
          src={userIcon}
          alt="user icon"
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="text-gray-700">{userName}</span>
      </div>

      <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
        {ratingCount > 0 ? (
          <>
            {[...Array(5)].map((_, i) =>
              i < Math.round(rating) ? (
                <FaStar key={i} className="text-yellow-400" />
              ) : (
                <FaRegStar key={i} className="text-yellow-300" />
              )
            )}
            <span>（{ratingCount}件）</span>
          </>
        ) : (
          <span>評価無し</span>
        )}
      </div>

      <button
        onClick={handleClick}
        className="mt-3 bg-[#59d5d7] text-white py-1 px-4 rounded hover:bg-[#48c4c5] transition"
      >
        この問題を解く
      </button>
    </div>
  );
}
