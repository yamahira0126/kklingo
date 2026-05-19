// 開発用のニセDB(問題)

export const QUESTIONS = [
  {
    id: 1,
    created_at: "2025-07-17",
    author_id: "user_001",
    question: "日本の首都はどこですか？",
    hint: "観光地としても有名な場所です",
    answer: "東京",
    explanation: "日本の首都は**東京**です。政治・経済の中心地です。",
    tags: "小学校,社会",
    author_note: "シンプルな地理問題",
    rating: 4.8,
    rated_count: 12,
    is_visible: true,
  },
  {
    id: 2,
    created_at: "2025-07-16",
    author_id: "user_002",
    question: "5 + 7 × 2 はいくつですか？",
    hint: "掛け算の順序を考えましょう",
    answer: "19",
    explanation: "7×2=14、5+14=19。計算順序に注意。",
    tags: "小学校,算数,思考力",
    author_note: "",
    rating: 4.1,
    rated_count: 8,
    is_visible: true,
  },
  {
    id: 3,
    created_at: "2025-07-15",
    author_id: "admin_001",
    question: "細胞の中で遺伝情報を持つ部分はどこですか？",
    hint: "アルファベット3文字です",
    answer: "DNA",
    explanation: "**DNA**は細胞内で遺伝情報を保持しています。",
    tags: "中学校,理科,雑学",
    author_note: "生物基礎問題",
    rating: 3.7,
    rated_count: 3,
    is_visible: false,
  },
  {
    id: 4,
    created_at: "2025-07-15",
    author_id: "user_001",
    question: `次の文章を読んで、問いに答えなさい。

  水は液体・固体・気体と変化します。
  地球上の水のうち海水の割合は約何パーセントですか？`,
    hint: `海に囲まれた地球の特徴を考えてみましょう。
  淡水との比較がポイントです。`,
    answer: "約97%",
    explanation: "地球上の水の**約97%**は海水、残り3%が淡水です。",
    tags: "小学校,理科,思考力",
    author_note: "",
    rating: 4.3,
    rated_count: 5,
    is_visible: true,
  },
  {
    id: 5,
    created_at: "2025-07-14",
    author_id: "user_002",
    question: "sin30°の値はいくつ？",
    hint: "三角比の基本です",
    answer: "0.5",
    explanation: "sin30°は**0.5**です。",
    tags: "高校,数学",
    author_note: "",
    is_visible: false,
    // rated_count, ratingなし
  },
  {
    id: 6,
    created_at: "2025-07-13",
    author_id: "user_001",
    question: `次の英文を和訳しなさい。
  He goes to school by bus.`,
    hint: "by bus は「バスで」",
    answer: "彼はバスで学校に行きます。",
    explanation: "go to school by bus＝「バスで学校に行く」",
    tags: "中学校,英語,外国語",
    author_note: "",
    rating: 4.5,
    rated_count: 7,
    is_visible: true,
  },
  {
    id: 7,
    created_at: "2025-07-12",
    author_id: "admin_001",
    question: "「吾輩は猫である」の作者は誰ですか？",
    hint: "夏目〇〇〇",
    answer: "夏目漱石",
    explanation: "**夏目漱石**が著者です。",
    tags: "",
    author_note: "",
    is_visible: true,
    // rated_count, ratingなし
  },
  {
    id: 8,
    created_at: "2025-07-10",
    author_id: "user_002",
    question: `日本国憲法の三大原則をすべて答えなさい。

  （1）＿＿＿＿＿＿＿＿
  （2）＿＿＿＿＿＿＿＿
  （3）＿＿＿＿＿＿＿＿
  `,
    hint: `ヒントとなるキーワード：
  国民主権・基本的人権の尊重・平和主義`,
    answer: `（1）国民主権
  （2）基本的人権の尊重
  （3）平和主義`,
    explanation: `三大原則：
  - 国民主権
  - 基本的人権の尊重
  - 平和主義`,
    tags: "中学校,社会,思考力",
    author_note: "教科書にも載っている重要事項",
    rating: 4.9,
    rated_count: 9,
    is_visible: true,
  },
  {
    id: 9,
    created_at: "2025-07-08",
    author_id: "user_001",
    question: `地球の直径は約何kmですか？`,
    hint: "1万kmより大きいです",
    answer: "約12,742km",
    explanation: "地球の直径は**約12,742km**です。",
    tags: "高校,理科,雑学",
    author_note: "",
    rating: 4.0,
    rated_count: 2,
    is_visible: false,
  },
  {
    id: 10,
    created_at: "2025-07-07",
    author_id: "admin_001",
    question: `下記の単語の意味を日本語で答えよ。

  evolution`,
    hint: "",
    answer: "進化",
    explanation: "**evolution**は「進化」という意味です。",
    tags: "高校,英語",
    author_note: "",
    is_visible: true,
    // rated_count, ratingなし
  },
  {
    id: 11,
    created_at: "2025-07-08",
    author_id: "UnknownUser",
    // ユーザーが削除されてるパターン(ユーザーDBに存在しないユーザーID)
    question: `江戸時代に行われた鎖国政策について説明せよ。`,
    hint: "外国との関係や貿易の制限について触れること",
    answer: "江戸幕府は外国との貿易や渡航を厳しく制限し、長崎や対馬など一部の港だけで限定的に貿易を認めた。",
    explanation: "鎖国政策により、日本は200年以上にわたって外国との交流が制限され、独自の社会・文化が発展した。",
    tags: "高校,社会,日本史",
    author_note: "社会の問題",
    rating: 4.0,
    rated_count: 2,
    is_visible: false,
  },
];

