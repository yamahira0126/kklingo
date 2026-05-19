// React Contextでuser情報を管理する
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // 認証状態取得
  const fetchUser = async () => {
    const res = await fetch('/api/me');
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    } else {
      setUser(null);
    }
  };



  
  useEffect(() => {
    fetchUser();
  }, []);

  // サインイン/サインアウト後にも呼ぶ
  return (
    <AuthContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// カスタムフック
export const useAuth = () => useContext(AuthContext);
