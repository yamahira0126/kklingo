// 検索ページ
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react'; // useCallback を追加
import InputField from '@/components/InputField';
import SearchResultCard from '@/components/SearchResultCard';
import LoadingSpinner from '@/components/LoadingSpinner';

// 開発用のニセDBはもう不要なので削除

// 問題とユーザーはAPIから取得するため、初期値は空
// USER_MAP はAPIから取得したデータで動的に生成する
let USER_MAP = {}; // 初期化時に空のオブジェクトとして定義

// 検索用に加工する関数 (Go APIの出力に合わせて調整)
function toSearchItem(q) {
    const user = USER_MAP[q.author_id] || {}; // author_id は Go APIで int64 になっているので注意
    return {
        id: q.id,
        question: q.question,
        tags: q.tags?.String ? q.tags.String.split(',').map(s => s.trim()).filter(Boolean) : [], // Go APIのNullString対応
        userIcon: user.icon ? `/usericons/${user.icon}` : `/icons/person.svg`,
        userName: user.user_name || 'Unknown User',
        rating: typeof q.rating?.Float64 === 'number' ? q.rating.Float64 : 0, // Go APIのNullFloat64対応
        ratingCount: typeof q.rated_count?.Int32 === 'number' ? q.rated_count.Int32 : 0, // Go APIのNullInt32対応
        is_visible: q.is_visible,
    };
}

// 文字列をノーマライズする関数 (フロントエンドでの表示用。API側で処理されるため、検索ロジックには直接使われない)
function normalizeText(str) {
    return str
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
            String.fromCharCode(s.charCodeAt(0) - 0xfee0)
        ) // 全角英数字→半角
        .toLowerCase()
        .replace(/\s+/g, '');
}


export default function SearchPage() {
    const [keyword, setKeyword] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [searchedKeyword, setSearchedKeyword] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showHidden, setShowHidden] = useState(false);
    const [hiddenOnlyMatchCount, setHiddenOnlyMatchCount] = useState(0);
    // problems は直接使わないが、allTagsの生成のために必要になる可能性があるので残しておくか、allTagsをAPIから取得する方法を検討
    const [allProblemsFromAPI, setAllProblemsFromAPI] = useState([]);


    // ユーザー取得
    useEffect(() => {
        fetch('/api/me') // Next.js APIルート `/api/me` を呼び出す
            .then(res => res.ok ? res.json() : null)
            .then(data => setCurrentUser(data?.user || null))
            .catch((err) => {
                console.error("Failed to fetch current user ID:", err);
                setCurrentUser(null);
            });

        // 全ユーザーリストを取得し、USER_MAPを構築
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users-list'); // Next.js APIルート `/api/users-list`
                if (res.ok) {
                    const users = await res.json();
                    USER_MAP = Object.fromEntries(
                        users.map(u => [u.id, u]) // Go APIのIDはint64なので、mapのキーもint64になる
                    );
                } else {
                    console.error("Failed to fetch user list:", await res.json());
                }
            } catch (err) {
                console.error("Error fetching user list:", err);
            }
        };
        fetchUsers();
    }, []);

    // APIから全問題データを取得 (タグ一覧生成のため)
    useEffect(() => {
        const fetchAllQuestions = async () => {
            try {
                // show_hidden=true で全問題を取得 (adminでなくても、タグ一覧生成には全問題が必要)
                // ただし、is_visible=false の問題にadmin_noteが含まれる場合、それを取得すべきか検討
                // ここではシンプルに全件取得としています
                const res = await fetch(`/api/search-questions?show_hidden=true`);
                if (res.ok) {
                    const data = await res.json();
                    setAllProblemsFromAPI(data);
                } else {
                    console.error("Failed to fetch all questions for tags:", await res.json());
                }
            } catch (err) {
                console.error("Error fetching all questions:", err);
            }
        };
        fetchAllQuestions();
    }, []);


    // タグ一覧を全問題から集計
    const allTags = useMemo(() => {
        const tagsSet = new Set();
        allProblemsFromAPI.forEach(q => {
            if (q.tags && q.tags.String) { // Go APIのNullString対応
                q.tags.String.split(',').map(s => s.trim()).filter(Boolean).forEach(tag => tagsSet.add(tag));
            }
        });
        return Array.from(tagsSet);
    }, [allProblemsFromAPI]); // allProblemsFromAPI に依存

    // 検索ロジック (API呼び出しに置き換え)
    const executeSearch = useCallback(async (searchKeyword, searchTag) => {
        setIsLoading(true);
        setResults([]);
        setHiddenOnlyMatchCount(0);

        let queryParams = [];
        if (searchKeyword) {
            queryParams.push(`keyword=${encodeURIComponent(searchKeyword)}`);
        }
        if (searchTag) {
            queryParams.push(`tag=${encodeURIComponent(searchTag)}`);
        }
        // 管理者で「非表示も見る」がチェックされている場合のみ `show_hidden=true` を送信
        if (currentUser?.role === 'admin' && showHidden) {
            queryParams.push(`show_hidden=true`);
        }

        const queryString = queryParams.join('&');
        const fetchUrl = `/api/search-questions?${queryString}`; // Next.js APIルートを呼び出す

        try {
            const res = await fetch(fetchUrl);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `API検索に失敗しました: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();

            // is_visible を無視した全件検索のシミュレーション（API側で厳密に区別する必要がある）
            // 現状のGo APIではshow_hidden=trueで全件が返ってくるため、
            // is_visible:falseだが検索にヒットしている数をカウントするには追加のロジックが必要。
            // ここでは簡易的に、showHiddenがfalseの場合にis_visible:falseの問題を除外してカウント
            let filteredResults = data;
            let hiddenOnlyCount = 0;

            if (currentUser?.role === 'admin' && !showHidden) {
                 // adminだがshowHiddenがfalseの場合、is_visible=falseのものを一時的に隠す
                const visibleResults = data.filter(q => q.is_visible);
                hiddenOnlyCount = data.length - visibleResults.length;
                filteredResults = visibleResults;
            } else if (currentUser?.role !== 'admin') {
                // adminでない場合は、常にis_visible=trueのみ表示
                const visibleResults = data.filter(q => q.is_visible);
                hiddenOnlyCount = data.length - visibleResults.length;
                filteredResults = visibleResults;
            }


            setHiddenOnlyMatchCount(hiddenOnlyCount); // このカウントはAPIの挙動による
            setResults(filteredResults.map(toSearchItem)); // toSearchItemで整形

        } catch (e) {
            console.error("Error executing search:", e);
            setError('検索に失敗しました: ' + e.message);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, showHidden]); // 依存配列に currentUser と showHidden を追加

    // キーワード検索ハンドラ
    const handleSearch = () => {
        const trimmed = keyword.trim();
        setSearchedKeyword(trimmed);
        setSelectedTag('');

        if (!trimmed) {
            setResults([]);
            setHiddenOnlyMatchCount(0);
            setSearchedKeyword('');
            return;
        }

        if (trimmed.startsWith('#')) {
            const tag = trimmed.slice(1);
            setSelectedTag(tag);
            executeSearch(null, tag); // タグ検索はキーワードをnullにする
            return;
        }

        executeSearch(trimmed, null); // キーワード検索はタグをnullにする
    };

    // Enterキー
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // タグで絞り込み (クリックイベントから)
    const handleTagClick = (tag) => {
        setSelectedTag(tag);
        setKeyword('#' + tag); // 検索バーに #タグ をセット
        setSearchedKeyword('');
        executeSearch(null, tag); // タグ検索はキーワードをnullにする
    };

    // `showHidden` 変更時に自動で再検索をトリガー
    useEffect(() => {
        // currentUser がロード済みかつキーワードが入力されている場合にのみ再検索
        if (currentUser !== null && keyword.trim() !== '') {
            handleSearch(); // `showHidden` の変更に応じて、現在の `keyword` で再検索
        }
    }, [showHidden, currentUser]); // currentUser も含める


    // 検索前だけタグ一覧を表示（検索中や結果表示時は非表示）
    const showAllTagsSection = !isLoading && !searchedKeyword && !selectedTag && results.length === 0 && allTags.length > 0;


    // 表示見出し
    const heading = selectedTag
        ? `#${selectedTag} の検索結果`
        : searchedKeyword
            ? `「${searchedKeyword}」の検索結果`
            : '';


    return (
        <div className="p-4 sm:p-6 max-w-2xl w-full mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 text-[#59d5d7]">
                問題を検索
            </h1>
            <div className="flex flex-col sm:flex-row gap-y-1 sm:gap-y-0 sm:gap-x-2 mb-4">
                <InputField
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ここにキーワードを入力"
                    onSearchClick={handleSearch}
                    labelColor="text-[#59d5d7]"
                    className="w-full text-sm sm:max-w-xl"
                />
                {currentUser?.role === 'admin' && (
                    <label className="flex items-center text-sm cursor-pointer select-none sm:ml-2">
                        <input
                            type="checkbox"
                            checked={showHidden}
                            onChange={e => setShowHidden(e.target.checked)}
                            className="mr-1 accent-[#59d5d7]"
                        />
                        非表示の問題も見る
                    </label>
                )}
            </div>

            {showAllTagsSection && (
                <div className="mb-10">
                    <h2 className="text-base sm:text-lg font-semibold mb-3 text-gray-700">
                        タグ一覧
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                className="px-3 py-1 rounded-full text-gray-100 bg-[#59d5d7] hover:bg-gray-100 hover:text-gray-700 text-xs sm:text-sm shadow"
                                onClick={() => handleTagClick(tag)}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="p-6 text-center">
                    <p className="text-gray-600 animate-pulse text-lg sm:text-xl">検索中...</p>
                    <LoadingSpinner />
                </div>
            )}

            {!isLoading && searchedKeyword && results.length === 0 && hiddenOnlyMatchCount === 0 && (
                <div className="mt-8 text-center text-gray-500 text-base sm:text-lg">
                    <>「{selectedTag ? '#' + selectedTag : searchedKeyword}」の検索結果がありません</>
                </div>
            )}

            {!isLoading && results.length > 0 && (
                <div className="space-y-6 mt-4">
                    {heading && (
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                            {heading}
                        </h2>
                    )}
                    {results.map((item) => (
                        <SearchResultCard
                            key={item.id}
                            id={item.id}
                            question={item.question}
                            tags={item.tags}
                            userIcon={item.userIcon}
                            userName={item.userName}
                            rating={item.rating}
                            ratingCount={item.ratingCount}
                            is_visible={item.is_visible}
                            onTagClick={handleTagClick}
                        />
                    ))}
                </div>
            )}

            {!isLoading && searchedKeyword && hiddenOnlyMatchCount > 0 && (
                <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                    <p>{hiddenOnlyMatchCount}件の問題が非表示設定のため表示されていません。管理者は「非表示の問題も見る」をチェックしてください。</p>
                </div>
            )}
        </div>
    );
}