// ホーム
'use client';

import Button from "../components/Button";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';


export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => setUser(null));
  }, []);

  const clickCreate = () => {
    router.push('/create');
  };

  const clickSearch = () => {
    router.push('/search');
  };

  // ログアウトボタン
  function LogoutButton() {
    const router = useRouter();
    const { fetchUser } = useAuth();

    const handleLogout = async () => {
      await fetch('/api/logout', { method: 'POST' });
      await fetchUser();
      window.location.href = '/login';
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

  return (
    <div className="min-h-screen bg-gray-50 px-2">
      <header className="flex flex-col sm:flex-row justify-end items-center gap-4 px-2 sm:px-6 py-3 mt-6 mx-auto w-full max-w-4xl bg-white rounded-2xl shadow-md">
        {user ? (
          <>
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
          </>
        ) : (
          <>
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-[#59d5d7] font-semibold px-6 py-2 rounded-lg shadow-lg hover:bg-[#59d5d7]/10 transition w-full sm:w-auto"
            >
              ログイン
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="text-sm text-white bg-[#59d5d7] font-semibold px-6 py-2 rounded-lg shadow-lg hover:bg-[#48c4c5] transition w-full sm:w-auto"
            >
              新規登録
            </button>
          </>
        )}
      </header>

      <main className="text-center py-10 sm:py-20">
        <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-[#59d5d7] break-words w-full max-w-full">
          テスト前の
          <br className="block sm:hidden" />
          一夜漬け支援ツール
        </h2>
        <p className="text-gray-600 mb-8 text-base sm:text-lg">
          授業資料PDFから問題を作成します📝
        </p>
        <div className="flex flex-col items-center space-y-4 mt-8 w-full max-w-xs mx-auto sm:max-w-none sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
          <Button
            label="問題を作成✍"
            onClick={clickCreate}
            className="bg-[#59d5d7] text-white hover:bg-[#48c4c5] w-full sm:w-auto"
          />
          <Button
            label="問題の検索🔍"
            onClick={clickSearch}
            className="bg-[#00cc33] text-white hover:bg-[#48c4c5] w-full sm:w-auto"
          />
        </div>
      </main>
    </div>
  );
}
