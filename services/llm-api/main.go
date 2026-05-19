package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

// Geminiからのレスポンスを格納する構造体
type GeminiQuestionResponse struct {
	Question    string   `json:"question"`
	Hint        string   `json:"hint"`
	Answer      string   `json:"answer"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

// クライアントからのリクエストボディの構造体
type GenerateRequest struct {
	PDFBase64 string `json:"pdf_base64"`
}

// エラーをJSONで返すヘルパー関数
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// メインのハンドラ関数
func generateQuestionsHandler(w http.ResponseWriter, r *http.Request) {
	// CORSヘッダー設定とメソッドチェック
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "許可されていないメソッドです")
		return
	}

	// リクエストボディをデコード
	var req GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "リクエストボディが不正です")
		return
	}

	pdfBytes, err := base64.StdEncoding.DecodeString(req.PDFBase64)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "PDFデータが不正です")
		return
	}

	// Gemini APIクライアントを初期化
	ctx := context.Background()
	geminiAPIKey := os.Getenv("GEMINI_API_KEY")
	if geminiAPIKey == "" {
		respondWithError(w, http.StatusInternalServerError, "GEMINI_API_KEYが設定されていません")
		return
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(geminiAPIKey))
	if err != nil {
		log.Printf("Geminiクライアント作成失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラーです")
		return
	}
	defer client.Close()

	// Geminiへのプロンプト
	prompt := `
# タスク
あなたのタスクは、添付されているPDFの内容を理解し、その内容を理解できる復習問題を作成することです。
復習問題は記述問題にしてください。

# PDFの内容を理解するために行うこと
以下の10の思考法を適用し、それぞれの視点から分析を行い、PDFの内容について理解してください。

- 論理的思考（ロジカルシンキング）
- 批判的思考（クリティカルシンキング）
- 水平思考（ラテラルシンキング）
- 帰納的思考（インダクティブ・シンキング）
- 演繹的思考（ディダクティブ・シンキング）
- アブダクション（仮説思考）
- デザイン思考
- システム思考
- フレームワーク思考
- マクロ・ミクロ思考

# 背景
あなたは、添付されているPDFの内容の講義を行っている教師です。その中で生徒に内容を復習できる問題を作成することになりました。

# 入力
添付されているPDFが入力です。

# 出力
出力はJSON形式で出力してください。
出力する文字列は「である体」を用いてください。
出力する文字列のMarkdown形式での装飾はしないでください。
問題数はそのスライドの内容をすべて網羅できる程度に作成してください。
作った問題の問題文はexplanationで出力してください。
作った問題のヒントをhintで出力してください。
作った問題の答えをanswerで出力してください。
作った問題の解説をdescriptionで出力してください。
作った問題の分野をtagsで出力してください。

## tagsについて
### tagの種類
教育課程: 小学、中学、高校、大学
難易度: 入門、基礎、応用
問われる知識: 国語、算数、数学、理科、社会、英語、外国語、情報、クイズ、雑学、思考力
問題タイプ: 選択肢問題、記述問題

### tagsの出力
tagsは以下から選び、配列として出力すること。タグ名のみとし、カテゴリ名は不要。

(例)
tags: [
    "大学",
    "情報",
    "記述問題",
    "思考力",
    "基礎"
]
`
	model := client.GenerativeModel("gemini-1.5-flash")
	filePart := genai.Part(genai.Blob{MIMEType: "application/pdf", Data: pdfBytes})

	// Geminiにリクエストを送信
	resp, err := model.GenerateContent(ctx, genai.Text(prompt), filePart)
	if err != nil {
		log.Printf("Gemini API呼び出し失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "問題の生成に失敗しました")
		return
	}

	// Geminiからの応答をパース
	geminiText := string(resp.Candidates[0].Content.Parts[0].(genai.Text))
	cleanJSON := strings.Trim(strings.TrimPrefix(geminiText, "```json"), " \n`")

	var questions []GeminiQuestionResponse
	if err := json.Unmarshal([]byte(cleanJSON), &questions); err != nil {
		log.Printf("Geminiレスポンスのパースに失敗: %v\nRaw: %s", err, cleanJSON)
		respondWithError(w, http.StatusInternalServerError, "Geminiレスポンスの形式が不正です")
		return
	}

	if len(questions) == 0 {
		respondWithError(w, http.StatusInternalServerError, "Geminiから問題が生成されませんでした")
		return
	}

	// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
	// ★  生成された問題リストからランダムに1問を抽出
	// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
	rand.Seed(time.Now().UnixNano())
	selectedQuestion := questions[rand.Intn(len(questions))]

	// 抽出した1問をクライアントに返す
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(selectedQuestion)
}

// APIキー認証ミドルウェア
func apiKeyAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}
		apiKey := r.Header.Get("X-API-Key")
		expectedAPIKey := getEnv("GO_API_KEY", "local-dev-api-key")
		if apiKey != expectedAPIKey {
			respondWithError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("注意: .envファイルが読み込めませんでした")
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/generate/questions", generateQuestionsHandler)

	port := getEnv("PORT", "8001")
	log.Printf("サーバーを http://localhost:%s で起動します", port)
	if err := http.ListenAndServe(":"+port, apiKeyAuthMiddleware(mux)); err != nil {
		log.Fatalf("サーバーの起動に失敗しました: %v", err)
	}
}
