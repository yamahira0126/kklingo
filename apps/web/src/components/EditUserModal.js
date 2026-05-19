// ユーザー設定変更用モーダル
import { useState } from "react";
import FormError from './FormError';
import InputField from "./InputField";

export default function EditUserModal({ type, user, onClose, onUpdated }) {
    const [value, setValue] = useState('');
    const [error, setError] = useState('');
    const [newIcon, setNewIcon] = useState(user.icon);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        if (type === 'name' && !value.trim()) {
            setError('ユーザーネームを入力してください');
            return;
        }
        if (type === 'password' && value.length < 8) {
            setError('パスワードは8文字以上');
            return;
        }

        const body = {};
        if (type === 'icon') body.icon = newIcon;
        if (type === 'name') body.user_name = value;
        if (type === 'password') body.password = value;

        const res = await fetch('/api/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const d = await res.json();
            setError(d.error || '更新に失敗しました');
            return;
        }
        onUpdated && onUpdated();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-2">
            <div className="bg-white w-full max-w-xs sm:min-w-[340px] rounded shadow relative p-4 sm:p-6">
                <button
                    className="absolute right-2 top-2 text-xl text-gray-400 hover:text-gray-700"
                    onClick={onClose}
                    aria-label="閉じる"
                >
                    ×
                </button>
                <h2 className="font-bold mb-4 text-center text-base sm:text-lg">
                    {type === 'icon' && 'アイコン変更'}
                    {type === 'name' && 'ユーザーネーム変更'}
                    {type === 'password' && 'パスワード変更'}
                </h2>

                {/* アイコン変更 */}
                {type === 'icon' && (
                    <div className="grid grid-cols-4 gap-2 justify-center mb-4">
                        {[1,2,3,4,5,6,7,8].map(i => (
                            <img
                                key={i}
                                src={`/usericons/user${i}.svg`}
                                alt={`icon${i}`}
                                className={`w-12 h-12 rounded cursor-pointer ${
                                newIcon === `user${i}.svg`
                                    ? "ring-2 ring-[#59d5d7]"
                                    : "hover:ring"
                                }`}
                                onClick={() => setNewIcon(`user${i}.svg`)}
                            />
                        ))}
                    </div>
                )}

                {/* パスワード変更 */}
                {type === 'password' && (
                    <InputField
                        type="password"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder="新しいパスワード"
                    />
                )}

                {/* ユーザーネーム変更 */}
                {type === 'name' && (
                    <input
                        type="text"
                        className="w-full border px-3 py-2 rounded mb-4 text-sm"
                        placeholder="新しいユーザーネーム"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                    />
                )}

                <FormError message={error} />

                <button
                    onClick={handleSubmit}
                    className="mt-2 w-full bg-[#59d5d7] text-white py-2 rounded hover:bg-[#48c4c5] text-sm"
                >
                    更新する
                </button>
            </div>
        </div>
    );
}