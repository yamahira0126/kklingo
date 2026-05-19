// ナビゲーションバー
"use client";

import Image from "next/image";
import SidebarItem from "./SidebarItem";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi"

export default function Sidebar({ user }) {
  const [open, setOpen] = useState(false);

  // 閉じる関数
  const handleItemClick = () => {
    if (window.innerWidth < 768) setOpen(false);
  };

  // サイドバー本体
  const sidebar = (
    <nav className="flex flex-col gap-3 pl-8 pt-5 md:pl-0 md:pt-0">
      <div className="mb-4">
        <Image
          src="/logo1.png"
          alt="KKlingo logo"
          width={120}
          height={40}
          priority
        />
      </div>

      {/* 全員に表示 */}
      <SidebarItem href="/" icon="/icons/home.svg" label="ホーム" />

       {/* ログインした人のみ表示 */}
      {user && (
        <SidebarItem href="/create" icon="/icons/PDF.svg" label="問題の作成" />
      )}
      {user && (
        <SidebarItem href="/search" icon="/icons/search.svg" label="問題の検索" />
      )}
      {user && (
        <SidebarItem href="/mypage" icon="/icons/study.svg" label="マイページ" />
      )}

       {/* ログインしていない人のみ表示 */}
      {!user && (
        <SidebarItem href="/login" icon="/icons/login.svg" label="ログイン" />
      )}
      {!user && (
        <SidebarItem href="/signup" icon="/icons/register.svg" label="新規登録" />
      )}

       {/* adminのみ表示 */}
      {user?.role === 'admin' && (
        <SidebarItem href="/admin" icon="/icons/id.svg" label="管理者ページ" />
      )}
    </nav>
  );


  return (
    <>
      {/* モバイル用: ハンバーガーメニュー */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setOpen(!open)}
          className="p-1 rounded bg-[#59d5d7] border border-[#23bac1] shadow"
        >
          {open ? <FiX size={20} color="#fff"  /> : <FiMenu size={20} color="#fff"  />}
        </button>
      </div>

      {/* サイドバー本体 */}
      <aside
        className={`
          fixed top-0 left-0 z-40
          bg-white border-r border-zinc-200
          w-64 h-full p-4
          transition-transform duration-200
          flex flex-col
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:w-48 md:h-screen md:block
        `}
        style={{ maxWidth: '16rem' }}
      >
        {sidebar}
      </aside>
      {/* 背景の黒マスク（モバイル時のみ） */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}