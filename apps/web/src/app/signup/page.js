// ユーザー登録ページ
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import FormError from '@/components/FormError';

// ダミー: ユーザーネームの重複チェックAPI
async function checkUsername(name) {
  // ★実際はサーバーに問い合わせる
  const res = await fetch(`/api/check-username?name=${encodeURIComponent(name)}`);
  const data = await res.json();
  return data.exists; // trueなら重複
}

export default function SignupPage() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showIconModal, setShowIconModal] = useState(false);

  const router = useRouter();

  // アイコン選択後
  const handleRegisterWithIcon = async (icon) => {
    setShowIconModal(false);
    // ★本登録APIに送信
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userName,
        password,
        icon,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || '登録に失敗しました');
      return;
    }

    // 登録完了→ログインAPIを叩く
    const loginRes = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userName, password }),
    });

    if (!loginRes.ok) {
      setError('登録後の自動ログインに失敗しました');
      return;
    }

    // HOMEへ遷移
    router.push('/');
  };

  // サインアップ処理
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!userName || !password) {
      setError('すべての項目を入力してください。');
      return;
    }
     // パスワードの長さチェック
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }
    // 重複チェック
    const exists = await checkUsername(userName);
    if (exists) {
      setError('そのユーザーネームは既に使われています。');
      return;
    }
    // アイコン選択モーダルへ
    setShowIconModal(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-2">
      <form
        onSubmit={handleSignup}
        className="bg-white p-4 sm:p-8 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">新規登録</h1>
        <InputField
          label="ユーザーネーム"
          name="userName"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="例: yamahira_ryusei"
        />
        <InputField
          label="パスワード（8文字以上）"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={8}
          required
        />
        <FormError message={error} />
        <Button
          type="submit"
          label="登録"
          className="w-full mt-4 bg-[#59d5d7] text-white"
        />

        <p className="mt-4 text-center text-sm text-gray-600">
          すでにアカウントがある場合は{' '}
          <a href="/login" className="text-[#59d5d7] hover:underline font-medium">
            ログイン
          </a>
        </p>
      </form>

      {/* モーダル表示 */}
      {showIconModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-2">
          <div className="bg-white p-4 rounded shadow relative w-full max-w-xs">
            <button
              type="button"
              aria-label="閉じる"
              className="absolute right-2 top-2 text-xl text-gray-400 hover:text-gray-700"
              onClick={() => setShowIconModal(false)}
            >
              ×
            </button>
            <h2 className="font-bold mb-2">アイコンを選んでください</h2>
            <div className="flex gap-2 justify-center flex-wrap">
              {[1,2,3,4,5,6,7,8].map(i => (
                <img
                  key={i}
                  src={`/usericons/user${i}.svg`}
                  alt={`icon${i}`}
                  className="w-12 h-12 cursor-pointer rounded hover:ring"
                  onClick={() => handleRegisterWithIcon(`user${i}.svg`)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
