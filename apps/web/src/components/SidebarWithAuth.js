// ロールによってサイドバーの表示を変えるためのコンポーネント
'use client';

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from '@/contexts/AuthContext';

export default function SidebarWithAuth() {
    const { user } = useAuth();

  return <Sidebar user={user} />;
}
