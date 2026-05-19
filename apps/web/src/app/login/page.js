// ログインページ
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import FormError from '@/components/FormError';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { fetchUser } = useAuth();
  const [userid, setID] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userid || !password) {
      setError('ユーザーIDとパスワードを入力してください。');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: userid, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'ログインに失敗しました');
      }

      await fetchUser();

      // 成功→homeへ遷移
      router.push('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-2">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 sm:p-8 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          ログイン
        </h1>

        <InputField
          label="ユーザーネーム"
          type="text"
          name="userid"
          value={userid}
          onChange={(e) => setID(e.target.value)}
          placeholder="例: yamahira_ryusei"
        />
        <InputField
          label="パスワード"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <FormError message={error} />

        <Button
          type="submit"
          label={isLoading ? 'ログイン中...' : 'ログイン'}
          className="w-full mt-4 bg-[#59d5d7] text-white"
          disabled={isLoading}
        />

        <p className="mt-4 text-center text-sm text-gray-600">
          アカウントが無い場合は{' '}
          <a href="/signup" className="text-[#59d5d7] hover:underline font-medium">
            新規登録
          </a>
        </p>
      </form>
    </div>
  );
}
