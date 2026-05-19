// 作った問題一覧
import { useRouter } from "next/navigation";
import { FaStar, FaRegStar } from 'react-icons/fa';

export default function UserQuestionsList({ questions }) {
  const router = useRouter();

  if (!questions.length)
    return <p className="text-gray-400">作成した問題はありません</p>;

  return (
    <div className="grid gap-4 max-w-2xl mx-auto">
      {questions.map(q => (
        <div
          key={q.id}
          className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-3 border border-gray-200 max-w-xl w-full hover:bg-[#f6fafd] transition"
        >
          <div className="text-left">
            <p className="text-lg font-semibold text-gray-800">
              {!q.is_visible && (
                <img
                  src="/icons/lock.svg"
                  className="inline-block w-5 h-5 mr-1"
                  title="非公開"
                />
              )}
              {q.question.length > 20 ? q.question.slice(0, 20) + '…' : q.question}
            </p>
            <div className="flex flex-wrap gap-2 my-1">
              {(q.tags?.split ? q.tags.split(',') : q.tags || []).map(tag => (
                <span key={tag} className="bg-[#59d5d7] text-white px-2 py-0.5 rounded text-xs">{tag}</span>
              ))}
            </div>
            <div className="text-xs text-gray-500">作成日: {q.created_at}</div>
            <div className="mt-2 text-sm text-gray-700">
              {q.author_note.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-300 p-2 rounded shadow-sm flex flex-col gap-1 font-mono whitespace-pre-line">
                  <span className="text-xs font-bold text-yellow-600">＜MEMO＞</span>
                  <span>{q.author_note}</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
            {q.ratingCount > 0 ? (
              <>
                {[...Array(5)].map((_, i) =>
                  i < Math.round(q.rating) ? (
                    <FaStar key={i} className="text-yellow-400" />
                  ) : (
                    <FaRegStar key={i} className="text-yellow-300" />
                  )
                )}
                <span>（{q.ratingCount}件）</span>
              </>
            ) : (
              <span>評価無し</span>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => router.push(`/solve/${q.id}`)}
              className="bg-[#59d5d7] hover:bg-[#23bac1] text-white px-4 py-1 rounded font-bold text-sm transition"
              type="button"
            >
              この問題を解く
            </button>
            <button
                onClick={() =>
                    router.push(
                    `/edit?data=${encodeURIComponent(JSON.stringify(q))}`
                    )
                }
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded font-bold text-sm transition"
                type="button"
            >
                問題を編集
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

