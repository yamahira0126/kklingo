// ユーザー情報カード

export default function UserInfoCard({ user, onEdit }) {
    return (
        <div className="max-w-2xl mx-auto w-full flex flex-col sm:flex-row items-center sm:items-start gap-3 border-b border-gray-100 my-10 pb-6 px-2">
            <img
                src={`/usericons/${user.icon}`}
                alt="ユーザーアイコン"
                className="w-20 h-20 rounded-full border-2 border-[#59d5d7] bg-white shadow mt-1"
            />
            <div className="flex-1 min-w-0 mt-2 sm:mt-1 w-full">
                <div>
                    <p className="text-xl sm:text-2xl font-bold mb-1 break-words text-center sm:text-left">
                        {user.user_name}
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm mb-1 break-all text-center sm:text-left">
                        ID: {user.id}
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm mb-3 text-center sm:text-left">
                        ロール: {user.role === 'admin' ? '管理者' : '一般ユーザー'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 flex-wrap justify-center sm:justify-start">
                    <button
                        onClick={() => onEdit('icon')}
                        className="text-xs text-[#59d5d7] border border-[#59d5d7] px-3 py-1 rounded-full hover:bg-[#e5fafb] transition"
                    >
                        アイコン変更
                    </button>
                    <button
                        onClick={() => onEdit('name')}
                        className="text-xs text-[#59d5d7] border border-[#59d5d7] px-3 py-1 rounded-full hover:bg-[#e5fafb] transition"
                    >
                        ユーザーネーム変更
                    </button>
                    <button
                        onClick={() => onEdit('password')}
                        className="text-xs text-[#59d5d7] border border-[#59d5d7] px-3 py-1 rounded-full hover:bg-[#e5fafb] transition"
                    >
                        パスワード変更
                    </button>
                </div>
            </div>
        </div>
    );
}