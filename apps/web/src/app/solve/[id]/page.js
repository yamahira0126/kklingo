// 問題解答ページ
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import QuestionCard from '@/components/QuestionCard';
import RatingCard from '@/components/RatingCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '@/contexts/AuthContext'; // AuthContextをインポート

// 開発用のニセDBはもう不要なので削除
// import { QUESTIONS } from '@/app/api/_questiondb';
// import { USERS } from '@/app/api/_db'; // このページでUSERSは直接使わないため削除

export default function SolvePage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params; // URLから問題IDを取得
    const { user, fetchUser } = useAuth(); // AuthContextからユーザー情報と更新関数を取得

    const [question, setQuestion] = useState(null);
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(true); // 問題ロード状態
    const [error, setError] = useState(null); // エラーメッセージ用

    const hasReviewed = false; // ユーザーが既に評価済みかどうか(APIで管理するまではダミー)

    // ユーザー情報取得 (AuthContextで既にやっているので、ここではAuthContextのuserを監視)
    // AuthContextのuserがundefined, null, またはオブジェクトのいずれかになるのを待ちます

    // 問題データの取得
    useEffect(() => {
        // IDがない、またはユーザーがまだロードされていない場合は何もしない
        // userがnullになる可能性があるので、user !== undefined でチェック
        if (!id || user === undefined) {
            return;
        }

        const fetchQuestion = async () => {
            setIsLoadingQuestion(true);
            setError(null); // エラーをリセット
            try {
                // Next.js APIルート `/api/questions/[id]` を呼び出す
                const res = await fetch(`/api/questions/${id}`);

                if (!res.ok) {
                    // 404 Not Found など、エラーレスポンスの場合
                    const errorData = await res.json();
                    if (res.status === 404) {
                        setError('指定された問題が見つかりません。');
                        router.replace('/'); // 問題が見つからない場合はHOMEへ
                        return;
                    }
                    throw new Error(errorData.error || `問題の取得に失敗しました: ${res.status} ${res.statusText}`);
                }

                const data = await res.json();
                console.log("Fetched question:", data); // デバッグ用

                // Go APIのNullString/NullFloat64/NullInt32形式から値を抽出
                const formattedQuestion = {
                    id: data.id,
                    created_at: data.created_at, // time.Timeそのまま
                    author_id: data.author_id,
                    question: data.question,
                    hint: data.hint?.String ?? null, // hintがない場合はnullにする
                    answer: data.answer,
                    explanation: data.explanation?.String ?? null, // explanationがない場合はnullにする
                    tags: data.tags?.String ? data.tags.String.split(',').map(s => s.trim()).filter(Boolean) : [],
                    author_note: data.author_note?.String ?? null,
                    rating: data.rating?.Float64 ?? 0,
                    rated_count: data.rated_count?.Int32 ?? 0,
                    is_visible: data.is_visible,
                };
                setQuestion(formattedQuestion);

            } catch (err) {
                console.error("Error fetching question:", err);
                setError('問題のロード中にエラーが発生しました: ' + err.message);
                setQuestion(null); // エラー時は問題をクリア
                // router.replace('/'); // エラー時にHOMEへリダイレクトすることも検討
            } finally {
                setIsLoadingQuestion(false);
            }
        };

        fetchQuestion();
    }, [id, router, user]); // userも依存配列に追加し、ユーザー情報がロードされてから問題をフェッチ


    // アクセス制御
    useEffect(() => {
        // userとquestionが両方ロード済みであることを確認
        if (user === undefined || question === null || isLoadingQuestion) {
            return; // まだロード中か、問題が見つからなかった場合は待機
        }

        // userがnull（未ログイン確定）の場合
        if (user === null) {
            router.replace('/login'); // ログインページへリダイレクト
            return;
        }

        // 非表示設定の場合 (is_visible が false)
        if (!question.is_visible) {
            // adminロールではない、かつ、問題の作成者でもない場合
            if (user.role !== 'admin' && user.id !== question.author_id) {
                alert('この問題は非表示設定のため、アクセスできません。');
                router.replace('/'); // ホームページへリダイレクトしてアクセスを制限
            }
        }
    }, [user, question, router, isLoadingQuestion]); // isLoadingQuestionも依存配列に追加

    // ローディング中の表示
    if (isLoadingQuestion || user === undefined || user === null) {
        // 問題またはユーザー情報がロード中の場合、スピナーを表示
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="mt-2 text-gray-500">ロード中...</p>
                <LoadingSpinner />
            </div>
        );
    }
    
    // エラーがある場合はエラーメッセージを表示 (必要に応じてUIを調整)
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
                <p>{error}</p>
                <button onClick={() => router.replace('/')} className="mt-4 text-[#59d5d7] hover:underline">ホームに戻る</button>
            </div>
        );
    }

    // question が null (例: 404でリダイレクト済み) の場合もここでハンドリング
    if (!question) {
        return null; // リダイレクト済みなので、何も表示しない
    }

    // 編集ボタン押した時の処理
    const handleEdit = () => {
        // 問題データを直接渡すのではなく、IDだけを渡して編集ページで再取得させる
        // Next.jsのルーティングなので、パスとしてidを渡すのが一般的
        // 例: /edit/[id] ルートを使うか、クエリパラメータとして /edit?id=XXX とする
        // 今回は既存の /edit?data=... を /edit?id=... に変更
        router.push(`/edit?id=${question.id}`);
    };

    // 削除処理
    const handleDelete = async () => {
        if (!window.confirm("本当にこの問題を削除してもいいですか？\nこの操作は元に戻せません。")) {
            return; // キャンセルされたら何もしない
        }

        try {
            // Next.js APIルート `/api/questions/[id]` を呼び出す
            const res = await fetch(`/api/questions/${question.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json', // DELETEでもContent-Typeはつけておくのが無難
                },
            });

            if (!res.ok) {
                // エラーレスポンスの場合
                const errorData = await res.json();
                throw new Error(errorData.error || `問題の削除に失敗しました: ${res.status} ${res.statusText}`);
            }

            // 204 No Content が返されることを期待
            alert("問題を削除しました！");
            router.push('/mypage'); // 削除成功後、マイページへリダイレクト

        } catch (err) {
            console.error("Error deleting question:", err);
            alert('問題の削除中にエラーが発生しました: ' + err.message);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-10">
            <div className="flex items-center gap-3 mb-8 justify-center">
                <h1 className="text-4xl font-bold text-[#59d5d7]">問題を解く</h1>
                <img
                    src="/kklingo_character4.PNG"
                    alt="キャラクター"
                    className="w-20 h-20"
                />
            </div>
            <QuestionCard
                question={question.question}
                hint={question.hint}
                answer={question.answer}
                // is_visibleはQuestionCardで直接使われていないが、必要なら渡す
            />

            <div className="mt-8 flex justify-center">
                <button
                    onClick={() => router.push(`/explain/${id}`)}
                    className="bg-white border-2 border-[#59d5d7] hover:bg-[#e2f7fa] text-[#59d5d7] font-bold flex items-center gap-2 px-8 py-3 rounded-2xl shadow-md text-lg transition"
                >
                    詳しい解説を見る
                    <img
                        src="/icons/note.svg"
                        className="w-10 h-10 ml-2"
                    />
                </button>
            </div>

            {/* 評価カードの表示条件 */}
            {user && question && !hasReviewed && user.id !== question.author_id && (
                <div className="mt-8">
                    <RatingCard questionId={id} />
                </div>
            )}

            <AnimatePresence>
                {/* 編集・削除ボタンの表示条件 */}
                {user && question && (
                    <motion.div
                        className="mt-8 flex justify-center gap-4"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        key="buttons"
                    >
                        {/* ログインユーザーが問題の作成者である場合 */}
                        {user.id === question.author_id && (
                            <button
                                className="bg-[#59d5d7] hover:bg-[#46b7bb] text-white font-bold px-6 py-2 rounded-xl shadow transition-colors"
                                onClick={handleEdit}
                            >
                                問題を編集
                            </button>
                        )}
                        {/* ログインユーザーが管理者ロールである場合 */}
                        {user.role === "admin" && (
                            <button
                                className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 rounded-xl shadow transition-colors"
                                onClick={handleDelete}
                            >
                                問題を削除
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}