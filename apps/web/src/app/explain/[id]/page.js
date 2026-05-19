// 詳しい解説用のページ
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext'; // AuthContextをインポート
import LoadingSpinner from '@/components/LoadingSpinner';

// 開発用のニセDBはもう不要なので削除
// import { QUESTIONS } from '@/app/api/_questiondb';
// import { USERS } from '@/app/api/_db';

export default function ExplainPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // URLから問題IDを取得

  const { user, fetchUser } = useAuth(); // AuthContextからログインユーザー情報を取得

  const [questionData, setQuestionData] = useState(null); // 問題データ全体を保持
  const [authorInfo, setAuthorInfo] = useState(null);   // 作成者情報を保持
  const [isLoading, setIsLoading] = useState(true);     // ページ全体のロード状態
  const [error, setError] = useState(null);             // エラーメッセージ
  const [noPermission, setNoPermission] = useState(false); // 権限がない場合

  // ユーザー情報取得 (AuthContextで管理されているので、AuthContextのuserを監視)
  // 問題情報取得・作成者情報取得
  useEffect(() => {
    // IDがない、またはuserがまだundefinedの場合は何もしない
    if (!id || user === undefined) {
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setNoPermission(false); // エラー/権限なし状態をリセット

      let fetchedQuestion = null;
      let fetchedAuthor = null;

      try {
        // 1. 問題データ取得
        const questionRes = await fetch(`/api/questions/${id}`);
        if (!questionRes.ok) {
          const errorData = await questionRes.json();
          if (questionRes.status === 404) {
            setError('指定された問題が見つかりません。');
            setQuestionData({ notfound: true }); // 問題が見つからないフラグを設定
            return; // ここで処理を中断し、notFoundの表示ロジックへ
          }
          throw new Error(errorData.error || `問題の取得に失敗しました: ${questionRes.status} ${questionRes.statusText}`);
        }
        fetchedQuestion = await questionRes.json();
        console.log("Fetched question for ExplainPage:", fetchedQuestion);

        // 2. 作成者情報取得 (author_idがあれば)
        if (fetchedQuestion.author_id) {
          const authorRes = await fetch(`/api/users/${fetchedQuestion.author_id}`);
          if (authorRes.ok) {
            fetchedAuthor = await authorRes.json();
            console.log("Fetched author for ExplainPage:", fetchedAuthor);
          } else {
            console.warn(`Failed to fetch author ID ${fetchedQuestion.author_id}:`, await authorRes.json());
            // 作者情報が取れなくても解説は表示できるよう、ここではエラーにせず進む
          }
        }
        
        // 取得したデータをステートにセット
        setQuestionData({
          explanation: fetchedQuestion.explanation?.String ?? '解説がありません。',
          author_id: fetchedQuestion.author_id,
          is_visible: fetchedQuestion.is_visible,
          // その他の問題詳細情報が必要であればここに追加
        });
        setAuthorInfo({
          user_name: fetchedAuthor?.user_name || '退会ユーザー',
          icon: fetchedAuthor?.icon ? `/usericons/${fetchedAuthor.icon}` : '/icons/person.svg',
        });

      } catch (err) {
        console.error("Error fetching data for ExplainPage:", err);
        setError('データのロード中にエラーが発生しました: ' + err.message);
        setQuestionData(null); // エラー時はデータをクリア
        setAuthorInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user, router]); // idとuserを依存配列に追加し、両方ロードされてからフェッチ

  // 問題が見つからない場合の自動リダイレクト (SolvePageと同様のロジック)
  useEffect(() => {
    if (questionData?.notfound) {
      const timer = setTimeout(() => {
        router.replace('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [questionData, router]);

  // パーミッションチェック
  useEffect(() => {
    // data, user, authorInfo がすべてロードされ、かつ問題が見つからない状態ではない場合にチェック
    if (!questionData || questionData.notfound || user === undefined || authorInfo === null) {
      return;
    }

    // userがnull（未ログイン確定）の場合も、権限がないとみなしてリダイレクト
    if (user === null) {
        setNoPermission(true);
        const timer = setTimeout(() => router.replace('/login'), 5000); // ログインページへリダイレクト
        return () => clearTimeout(timer);
    }

    // is_visible=false (非公開) かつ adminでも作成者でもなければ閲覧不可
    if (questionData.is_visible === false) {
      if (user.role !== 'admin' && user.id !== questionData.author_id) {
        setNoPermission(true); // 権限がないことを示すフラグを設定
        const timer = setTimeout(() => router.replace('/'), 5000); // ホームページへリダイレクト
        return () => clearTimeout(timer);
      }
    }
  }, [questionData, user, router, authorInfo]); // authorInfoも依存に追加

  // ローディング中の表示
  if (isLoading || user === undefined || authorInfo === null) {
    return (
      <div className="flex flex-col items-center py-24">
        <p>読み込み中...</p>
        <LoadingSpinner />
      </div>
    );
  }

  // エラー表示
  if (error) {
      return (
          <div className="flex flex-col items-center py-24 text-red-600">
              <p>{error}</p>
              <button onClick={() => router.replace('/')} className="mt-4 text-[#59d5d7] underline">
                  ← ホームへ戻る
              </button>
          </div>
      );
  }

  // 問題が見つからない場合の表示
  if (questionData.notfound) {
    return (
      <div className="flex flex-col items-center py-24 text-red-600">
        <p>該当する問題が見つかりません...</p>
        <Image
          src="/kklingo_character2.PNG"
          alt="泣いているキャラクター"
          width={150}
          height={150}
          priority
        />
        <button onClick={() => router.replace('/')} className="mt-4 text-[#59d5d7] underline">
          ← ホームへ戻る
        </button>
      </div>
    );
  }

  // 権限がない場合の表示
  if (noPermission) {
    return (
      <div className="flex flex-col items-center py-24 text-red-600">
        <p>この解説は非公開です。</p>
        <p>あなたには閲覧権限がありません。</p>
        <Image
          src="/icons/lock.svg" // 鍵アイコンパス
          alt="鍵アイコン"
          width={80}
          height={80}
        />
        <button onClick={() => router.replace('/')} className="mt-4 text-[#59d5d7] underline">
          ← ホームへ戻る
        </button>
      </div>
    );
  }

  // 全てのチェックをクリアした場合の表示
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-md mt-12">
      <button
        onClick={() => router.back()}
        className="mb-4 text-[#59d5d7] font-bold underline hover:text-[#23bac1] text-left"
      >← 戻る</button>

      <div className="flex items-center gap-4 mb-4">
        <img src={authorInfo.icon} alt="アイコン" className="w-14 h-14 rounded-full border border-[#59d5d7]" />
        <h1 className="text-2xl font-bold text-[#59d5d7]">
          詳しい解説
        </h1>
      </div>
      <div className="prose my-6">
        <ReactMarkdown>
          {questionData.explanation}
        </ReactMarkdown>
      </div>
      <div className="text-right text-gray-500 text-sm">
        作成者: {authorInfo.user_name}
      </div>
    </div>
  );
}