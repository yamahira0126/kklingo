// 管理者用ページ
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState({ open: false, id: null });
    const router = useRouter();

    // アクセス権判定 兼 ユーザー一覧データ取得
    useEffect(() => {
        fetch('/api/me', { credentials: 'include' })
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Not logged in')))
            .then(data => {
                if (!data?.user || data.user.role !== 'admin') {
                    router.replace('/');
                } else {
                    setUser(data.user);
                    fetchUsers();
                }
            })
            .catch(() => router.replace('/'));
    }, [router]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const filteredUsers = users.filter(u => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return true;
        return u.user_name.toLowerCase().includes(keyword) || String(u.id).includes(keyword);
    });

    // ロール変更処理
    const handleRoleChange = async (id, role) => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ role: role }),
            });

            if (res.ok) {
                setUsers(currentUsers => currentUsers.map(u => u.id === id ? { ...u, role } : u));
                alert(`ID:${id}のロールを${role}に変更しました。`);
            } else {
                alert('ロールの変更に失敗しました。');
            }
        } catch (error) {
            console.error('Failed to change role:', error);
            alert('エラーが発生しました。');
        }
    };

    // 削除処理
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (res.ok) {
                setUsers(currentUsers => currentUsers.filter(u => u.id !== id));
                alert(`ID:${id} を削除しました。`);
            } else {
                alert('ユーザーの削除に失敗しました。');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('エラーが発生しました。');
        } finally {
            setModal({ open: false, id: null });
        }
    };

    if (!user) return <div className="flex justify-center items-center h-screen">読み込み中...</div>;

    return (
        <div className="max-w-4xl mx-auto mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-700">管理者ページ</h1>
        <div className="mb-4">
            <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border px-3 py-2 rounded w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="IDかユーザー名で検索"
            />
        </div>
    
        <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
                <thead>
                    <tr className="bg-gray-100 text-sm">
                    <th className="border p-2 font-semibold">アイコン</th>
                    <th className="border p-2 font-semibold">ID</th>
                    <th className="border p-2 font-semibold">ユーザー名</th>
                    <th className="border p-2 font-semibold">ロール</th>
                    <th className="border p-2 font-semibold">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-4 text-gray-500">
                                該当ユーザーがいません
                            </td>
                        </tr>
                    ) : (
                        filteredUsers.map(u => (
                            <tr key={u.id} className="text-sm hover:bg-gray-50">
                                <td className="border p-2 text-center">
                                <img src={`/usericons/${u.icon}`} alt="icon" className="w-10 h-10 rounded-full mx-auto object-cover" />
                                </td>
                                <td className="border px-3 py-2 text-gray-600 font-mono">{u.id}</td>
                                <td className="border px-3 py-2">{u.user_name}</td>
                                <td className="border p-2 text-center">
                                    <select
                                        value={u.role}
                                        onChange={e => handleRoleChange(u.id, e.target.value)}
                                        className="border rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                        disabled={u.id === user.id} // 自分自身のロールは変更不可
                                    >
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                                <td className="border p-2 text-center">
                                    {/* 自分自身と他の管理者は削除不可 */}
                                    {u.id !== user.id && u.role !== 'admin' && (
                                        <>
                                        <button
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                            onClick={() => setModal({ open: true, id: u.id })}
                                        >
                                            削除
                                        </button>
                                        {modal.open && modal.id === u.id && (
                                            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                                                <div className="bg-white p-6 rounded-lg shadow-xl max-w-xs w-full">
                                                    <p className="mb-4 text-center">
                                                        本当にこのユーザーを削除しますか？
                                                    </p>
                                                    <div className="mb-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
                                                        <p><strong>ID:</strong> {u.id}</p>
                                                        <p><strong>ユーザー名:</strong> {u.user_name}</p>
                                                    </div>
                                                    <div className="flex gap-4 justify-center">
                                                        <button
                                                            onClick={() => setModal({ open: false, id: null })}
                                                            className="px-4 py-2 rounded border bg-gray-100 hover:bg-gray-200"
                                                        >
                                                            キャンセル
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(u.id)}
                                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                                        >
                                                            削除する
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
    );
}