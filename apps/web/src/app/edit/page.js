// 問題の編集
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';

function EditPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [problem, setProblem] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // formが用意できたらtagsをセット
  useEffect(() => {
    if (form && form.tags !== undefined) {
      if (Array.isArray(form.tags)) {
        setTags(form.tags);
      } else if (typeof form.tags === 'string') {
        setTags(form.tags.split(',').map(tag => tag.trim()).filter(tag => tag));
      } else {
        setTags([]);
      }
    }
  }, [form]);

  // ログインユーザーIDを取得
  useEffect(() => {
    // Note: /api/me はNext.jsのAPIルートを想定しています。
    // ユーザー認証情報がGo APIから直接来る場合、そのエンドポイントを叩く必要があります。
    // その際もAPIキーが必要であれば、Next.js APIルートを間に挟むのが安全です。
    fetch('/api/me') // Next.js APIルート `/api/me` を呼び出す
      .then(res => res.ok ? res.json() : null)
      .then(data => setUserId(data?.user?.id || null))
      .catch((err) => {
        console.error("Failed to fetch user ID:", err);
        setUserId(null);
      });
  }, []);

  // データ取得
  useEffect(() => {
    const dataStr = params.get('data');
    if (dataStr) {
      try {
        setProblem(JSON.parse(decodeURIComponent(dataStr)));
      } catch (e) {
        console.error("Failed to parse problem data:", e);
        setProblem(undefined); // パースエラーの場合もundefinedにする
      }
    } else {
      setProblem(undefined);
    }
    setIsLoading(false);
  }, [params]);

  // データの取得に失敗した場合はHOMEへ
  useEffect(() => {
    if (!isLoading && problem === undefined) {
      router.replace('/');
    }
  }, [problem, isLoading, router]);

  // ユーザーIDが一致しなければHOMEへ
  useEffect(() => {
    if (!isLoading && userId && problem && userId !== problem.author_id) {
      router.replace('/');
    }
  }, [userId, problem, isLoading, router]);

  // データが来たらformを初期化
  useEffect(() => {
    if (problem) {
      setForm({
        id: problem.id || '',
        question: problem.question || '',
        hint: problem.hint?.String || '',
        answer: problem.answer || '',
        explanation: problem.explanation?.String || '',
        tags: problem.tags?.String || '',
        author_note: problem.author_note?.String || '',
        is_visible: problem.is_visible ?? true,
      });
    }
  }, [problem]);

  if (isLoading || !problem || !form || userId === null) {
    return null;
  }
  if (problem === undefined) {
      return null;
  }


  // 値の変更
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // タグ追加
  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  // タグ削除
  const handleRemoveTag = (removeIdx) => {
    setTags(tags.filter((_, i) => i !== removeIdx));
  };

  // 保存処理
  const handleSave = async () => {
    setError('');
    if (!form.question.trim()) {
      setError('問題文は必ず入力してください');
      return;
    }
    if (!form.answer.trim()) {
      setError('答えは必ず入力してください');
      return;
    }
    setIsSaving(true);
    try {
      if (form.id !== problem.id || userId !== problem.author_id) {
        setError('問題IDまたは作成者IDが一致しません。編集できません。');
        setIsSaving(false);
        return;
      }

      // Next.js APIルートに送信するデータ
      const payloadToBFF = {
        question: form.question,
        hint: form.hint === '' ? null : form.hint,
        answer: form.answer,
        explanation: form.explanation === '' ? null : form.explanation,
        tags: tags.length > 0 ? tags.join(',') : null,
        author_note: form.author_note === '' ? null : form.author_note,
        is_visible: form.is_visible,
      };

      console.log("Next.js APIルートへ送信する内容", payloadToBFF);

      // Go APIに直接ではなく、Next.js APIルートを呼び出す
      const res = await fetch(`/api/questions/${form.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // X-API-Key はクライアントサイドから送信しない
        },
        body: JSON.stringify(payloadToBFF),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `API保存に失敗しました: ${res.status} ${res.statusText}`);
      }

      const savedQuestion = await res.json();
      console.log("保存された問題:", savedQuestion); // ここでコンソールに出力 (ブラウザの開発者コンソール)

      alert('保存しました！');
      router.push(`/solve/${form.id}`);
    } catch (e) {
      console.error("Error saving question:", e);
      setError('保存に失敗しました: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 削除ボタン
  const handleDelete = async () => {
    setDeleteModalOpen(false);
    
    try {
      if (form.id !== problem.id || userId !== problem.author_id) {
        setError('問題IDまたは作成者IDが一致しません。削除できません。');
        return;
      }

      // Go APIに直接ではなく、Next.js APIルートを呼び出す
      const res = await fetch(`/api/questions/${form.id}`, {
        method: 'DELETE',
        headers: {
          // X-API-Key はクライアントサイドから送信しない
        },
      });

      // 204 No Content の場合、res.json()を呼ばない
      if (res.status === 204) {
          alert(`問題ID: ${form.id} を削除しました`);
          router.push('/');
          return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `API削除に失敗しました: ${res.status} ${res.statusText}`);
      }
      
      // ここに到達することは通常ないが、念のため
      alert(`問題ID: ${form.id} を削除しました`);
      router.push('/');

    } catch (e) {
      console.error("Error deleting question:", e);
      setError('削除に失敗しました: ' + e.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-md mt-12">
      <h1 className="text-2xl font-bold mb-6 text-[#59d5d7]">問題を編集</h1>
      {error && <div className="text-red-500 mb-3">{error}</div>}

      <label className="block font-semibold mb-1">問題文</label>
      <textarea
        name="question"
        value={form.question}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded mb-4 min-h-[100px]"
      />

      <label className="block font-semibold mb-1">ヒント</label>
      <textarea
        name="hint"
        value={form.hint}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded mb-4"
      />

      <label className="block font-semibold mb-1">答え</label>
      <textarea
        name="answer"
        value={form.answer}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded mb-4"
      />

      <label className="block font-semibold mb-1">詳しい解説</label>
      <textarea
        name="explanation"
        value={form.explanation}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded mb-4 min-h-[100px]"
      />

      <label className="block font-semibold mb-1">タグ</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, idx) => (
          <span key={idx} className="inline-flex items-center bg-gray-200 px-2 py-1 rounded">
            {tag}
            <button type="button" onClick={() => handleRemoveTag(idx)} className="ml-1 text-gray-600 hover:text-red-500">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => (e.key === 'Enter' ? (e.preventDefault(), handleAddTag()) : null)}
          placeholder="タグを入力してEnter"
          className="flex-1 border px-3 py-2 rounded"
        />
        <button 
          type="button" 
          onClick={handleAddTag} 
          className="bg-[#59d5d7] text-white rounded px-3"
        >
          追加
        </button>
      </div>

      <label className="block font-semibold mb-1">作成者メモ(他のユーザーには公開されません)</label>
      <textarea
        name="author_note"
        value={form.author_note}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded mb-4 min-h-[80px]"
      />

      <div className="flex items-center mb-6">
        <input
          type="checkbox"
          name="is_visible"
          checked={form.is_visible}
          onChange={handleChange}
          id="visible"
          className="mr-2"
        />
        <label htmlFor="visible">検索に表示する</label>
      </div>

      <div className="flex gap-4">
        <Button
          label={isSaving ? '保存中...' : '保存'}
          onClick={handleSave}
          className="flex-1 bg-[#59d5d7] text-white"
          disabled={isSaving}
        />
        <Button
          label='削除'
          onClick={() => setDeleteModalOpen(true)}
          className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
        />
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-lg flex flex-col items-center">
            <div className="text-lg font-bold mb-4">削除の確認</div>
            <div className="mb-6">本当に削除してよろしいですか？</div>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense fallback={null}>
      <EditPageContent />
    </Suspense>
  );
}
