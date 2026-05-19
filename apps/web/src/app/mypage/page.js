// ユーザーごとのマイページ
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UserInfoCard from '@/components/UserInfoCard';
import UserQuestionsList from '@/components/UserQuestionsList';
import EditUserModal from '@/components/EditUserModal';
import LoadingSpinner from '@/components/LoadingSpinner';

// 開発用のニセDBはもう不要なので削除
// import { QUESTIONS } from '@/app/api/_questiondb';

export default function MyPage() {
  const router = useRouter();
  const { user, fetchUser } = useAuth(); // AuthContextからユーザー情報と更新関数を取得
  const [editModal, setEditModal] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true); // 問題ロード状態

  // ログアウトボタン
  function LogoutButton() {
    const handleLogout = async () => {
      await fetch('/api/logout', { method: 'POST' });
      await fetchUser(); // AuthContextのユーザー情報を更新
      router.push('/login');
    };
    return (
      <button
        onClick={handleLogout}
        className="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
      >
        ログアウト
      </button>
    );
  }

  useEffect(() => {


        // AuthContextのuserがロードされ、idプロパティが存在することを確認
    if (user && user.id !== undefined && user.id !== null) {
        console.log("MyPage (Frontend) User ID:", user.id, "Type:", typeof user.id);
    } else {
        console.log("MyPage (Frontend) User is not loaded or ID is missing:", user);
    }


    // userが存在し、かつユーザーIDが有効な場合にのみ問題をフェッチ
    if (user && user.id) {
      console.log(user.id);
      const fetchMyQuestions = async () => {
        setIsLoadingQuestions(true); // ロード開始
        try {
          // Next.js APIルート `/api/my-questions` を呼び出す
          // author_idをクエリパラメータとして渡す
          const res = await fetch(`/api/my-questions?author_id=${user.id}`);
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `問題の取得に失敗しました: ${res.status} ${res.statusText}`);
          }
          
          const data = await res.json();
          console.log("Fetched my questions:", data); // デバッグ用

          // APIから返されるデータ形式に合わせて整形
          const formattedQuestions = data.map(q => ({
            id: q.id,
            created_at: q.created_at.slice(0, 10).replace(/-/g, '/'), // 'YYYY-MM-DDTHH:MM:SSZ' -> 'YYYY/MM/DD'
            author_id: q.author_id,
            question: q.question,
            hint: q.hint?.String ?? "", // GoのNullString対応
            answer: q.answer,
            explanation: q.explanation?.String ?? "", // GoのNullString対応
            tags: q.tags?.String ? q.tags.String.split(',').map(s => s.trim()).filter(Boolean) : [], // GoのNullString対応
            author_note: q.author_note?.String ?? "", // GoのNullString対応
            is_visible: q.is_visible,
            rating: q.rating?.Float64 ?? 0, // GoのNullFloat64対応
            ratingCount: q.rated_count?.Int32 ?? 0, // GoのNullInt32対応
          }));
          setQuestions(formattedQuestions);
        } catch (error) {
          console.error("Failed to fetch user questions:", error);
          // エラーメッセージを表示するなど、ユーザーへのフィードバックを考慮
          setQuestions([]); // エラー時は空にする
        } finally {
          setIsLoadingQuestions(false); // ロード終了
        }
      };
      fetchMyQuestions();
    } else if (user === null) {
      // userがnullの場合（ロード済みで未ログイン）はログインページへリダイレクト
      // ただし、AuthContextが初期ロード中のuser=undefinedと区別する必要がある
      // ここではAuthContextのuserが確定してから処理する
      router.push('/login');
    }
  }, [user, router]); // user の変更を監視

  // user が undefined (AuthContextが初期化中) の場合はロード中表示
  if (user === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mt-2 text-gray-500">ユーザー情報ロード中...</p>
        <LoadingSpinner />
      </div>
    );
  }

  // user が null (未ログイン確定) の場合はログインページへリダイレクト済みなので、何も表示しない
  if (user === null) {
    return null;
  }

  // user が有効なオブジェクトの場合
  return (
    <div className="min-h-screen bg-gray-50 px-2">
      <header className="flex flex-col sm:flex-row justify-end items-center gap-4 px-2 sm:px-6 py-3 mt-6 mx-auto w-full max-w-4xl bg-white rounded-2xl shadow-md">
        <img
          src={`/usericons/${user.icon}`}
          alt="ユーザーアイコン"
          className="w-12 h-12 rounded-full border border-gray-300"
          onClick={() => router.push('/mypage')}
        />
        <p className="text-gray-700 font-medium text-sm sm:text-base">
          {user.user_name}さん こんにちは！
        </p>
        <LogoutButton />
      </header>


      <main className="text-center py-10 sm:py-20">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#59d5d7] mb-10">マイページ</h1>
        <UserInfoCard user={user} onEdit={setEditModal} />


        <div className="mt-10">
          <h2 className="text-base sm:text-xl font-semibold mb-3">自分が作成した問題</h2>
          {isLoadingQuestions ? (
            <div className="flex flex-col items-center justify-center">
              <p className="text-gray-500">問題ロード中...</p>
              <LoadingSpinner />
            </div>
          ) : questions.length === 0 ? (
            <div>
              <p className="text-gray-500">まだ問題を作成していません😿</p>
              <p className="text-gray-500">メニューの「問題の作成」から作ることができます！</p>
            </div>
          ) : (
            <UserQuestionsList questions={questions} />
          )}
        </div>


        {editModal && (
          <EditUserModal
            type={editModal}
            user={user}
            onClose={() => setEditModal(null)}
            onUpdated={fetchUser} // ユーザー情報更新後にAuthContextのユーザー情報を再取得
          />
        )}
      </main>
    </div>
  );
}