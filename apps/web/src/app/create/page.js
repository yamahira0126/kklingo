'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner'; // ローディングスピナーコンポーネントを別途用意

export default function CreatePage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(undefined);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [requestText, setRequestText] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const inputRef = useRef(null);

    // ログイン状態を確認
    useEffect(() => {
        fetch('/api/me', { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject('Not logged in'))
            .then(data => {
                if (data?.user) {
                    setIsLoggedIn(true);
                    setCurrentUser(data.user);
                } else {
                    setIsLoggedIn(false);
                }
            })
            .catch(() => setIsLoggedIn(false));
    }, []);

    // 未ログイン時はリダイレクト
    useEffect(() => {
        if (isLoggedIn === false) {
            router.replace('/login');
        }
    }, [isLoggedIn, router]);

    // ファイルをBase64にエンコードするヘルパー関数
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });

    // ファイルアップロード処理
    const handleFile = (file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setError('PDFファイルのみ対応しています');
            setShowErrorModal(true);
            return;
        }
        setIsUploading(true);
        // 仮のアップロード時間
        setTimeout(() => {
            setIsUploading(false);
            setUploadedFile(file);
        }, 1500);
    };

    const handleChange = (e) => handleFile(e.target.files?.[0]);
    const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); };
    const preventDefaults = (e) => e.preventDefault();

    // 問題作成ボタンの処理
const handleCreate = async () => {
    if (!uploadedFile || !currentUser) {
        setError('ファイルまたはユーザー情報がありません。');
        setShowErrorModal(true); // エラーモーダルを表示
        return;
    }
    setIsCreating(true);
    setError('');

    try {
        // ステップ1: PDFをBase64にエンコード
        const pdfBase64 = await fileToBase64(uploadedFile);

        // ★ ステップ2: 問題生成APIを呼び出す (author_id, request_text を削除)
        const generateRes = await fetch('/api/generate-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                pdf_base64: pdfBase64,
                // author_id と request_text をここからは送らない
            }),
        });

        if (!generateRes.ok) {
            const errData = await generateRes.json();
            throw new Error(errData.error || '問題の生成に失敗しました。');
        }
        const generatedQuestion = await generateRes.json();

        // ★ ステップ3: 受け取った問題データに author_id を追加
        const dataToSave = {
            ...generatedQuestion,
            author_id: currentUser.id, // ここでIDを紐づける
            // tagsもDBの仕様に合わせて文字列に変換
            tags: Array.isArray(generatedQuestion.tags) ? generatedQuestion.tags.join(',') : '',
            explanation: generatedQuestion.description, // descriptionをexplanationにマッピング
        };

        // ★ ステップ4: IDを紐づけたデータをDB保存APIに送信
        const saveRes = await fetch('/api/save-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(dataToSave),
        });

        if (!saveRes.ok) {
            const errData = await saveRes.json();
            throw new Error(errData.error || '問題の保存に失敗しました。');
        }
        
        const savedQuestion = await saveRes.json();

        // ブラウザのコンソールに出力
        console.log("保存された問題:", savedQuestion);

        // 5. 成功したら編集ページに遷移
        router.push(`/edit?data=${encodeURIComponent(JSON.stringify(savedQuestion))}`);

    } catch (err) {
        setError(err.message);
        setShowErrorModal(true); // エラーモーダルを表示
    } finally {
        setIsCreating(false);
    }
};
    
    const handleErrorClose = () => {
        setShowErrorModal(false);
        setError('');
    };

    if (isLoggedIn === undefined) {
        return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
    }

    return (
        <div className="max-w-xl mx-auto p-8">
            <h1 className="text-2xl font-bold text-gray-700 mb-6">問題を作成</h1>

            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isUploading || uploadedFile ? "opacity-50 pointer-events-none" : "hover:border-cyan-400 border-gray-300"}`}
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={preventDefaults}
                onDragEnter={preventDefaults}
                onDragLeave={preventDefaults}
            >
                {isUploading ? (
                    <div>
                        <p className="text-lg text-cyan-500 animate-pulse">アップロード中…</p>
                        <LoadingSpinner />
                    </div>
                ) : uploadedFile ? (
                    <div>
                        <p className="text-lg font-semibold text-green-600">✓</p>
                        <p className="font-semibold">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">を受け付けました</p>
                    </div>
                ) : (
                    <div>
                        <p className="font-semibold">PDFファイルを選択</p>
                        <p className="text-sm text-gray-500">またはドラッグ＆ドロップ</p>
                        <input
                            type="file" accept="application/pdf"
                            ref={inputRef} onChange={handleChange}
                            className="hidden"
                        />
                    </div>
                )}
            </div>

            {uploadedFile && (
                <div className="mt-6">
                    <label className="block font-semibold mb-2" htmlFor="request">
                        作問への要望（任意）
                    </label>
                    <textarea
                        id="request"
                        className="w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="例：解説を詳しく、計算問題中心に など"
                        value={requestText}
                        onChange={e => setRequestText(e.target.value)}
                        rows={3}
                        disabled={isCreating}
                    />
                    <button
                        className="w-full bg-cyan-500 text-white py-2 rounded-lg font-bold hover:bg-cyan-600 transition-colors disabled:bg-gray-400"
                        onClick={handleCreate}
                        disabled={isCreating}
                    >
                        {isCreating ? '作成中…' : '作問開始'}
                    </button>
                </div>
            )}
            
            {isCreating && (
                <div className="mt-6 text-center">
                    <LoadingSpinner />
                    <p className="text-lg text-cyan-500 animate-pulse mt-2">AIが問題を生成しています...</p>
                </div>
            )}

            {showErrorModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                        <p className="text-lg font-semibold text-red-600 mb-4">エラー</p>
                        <p className="mb-6">{error}</p>
                        <button
                            className="w-full px-4 py-2 rounded bg-cyan-500 text-white font-semibold hover:bg-cyan-600"
                            onClick={handleErrorClose}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}