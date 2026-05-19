package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

// --- 構造体定義 ---
type User struct {
	ID       int64  `json:"id"`
	UserName string `json:"user_name"`
	Password string `json:"-"` // JSON出力時には含めない
	Role     string `json:"role"`
	Icon     string `json:"icon"`
}

// QuestionRequest はPOST /questions のリクエストボディに特化した構造体
type QuestionRequest struct {
	AuthorID    int64   `json:"author_id"`
	Question    string  `json:"question"`
	Hint        *string `json:"hint"` // ポインタにしてnullを許容
	Answer      string  `json:"answer"`
	Explanation *string `json:"explanation"` // ポインタにしてnullを許容
	Tags        *string `json:"tags"`        // カンマ区切りの単一文字列
	AuthorNote  *string `json:"author_note"` // ポインタにしてnullを許容
	IsVisible   *bool   `json:"is_visible"`  // ポインタにしてnullを許容し、デフォルト値はDBに任せる
}

// Question はDBから取得・JSONとして出力する際の完全なQuestion構造体
type Question struct {
	ID          int64           `json:"id"`
	CreatedAt   time.Time       `json:"created_at"`
	AuthorID    int64           `json:"author_id"`
	Question    string          `json:"question"`
	Hint        sql.NullString  `json:"hint"`
	Answer      string          `json:"answer"`
	Explanation sql.NullString  `json:"explanation"`
	Tags        sql.NullString  `json:"tags"` // DBのVARCHARに合わせてsql.NullStringを使用
	AuthorNote  sql.NullString  `json:"author_note"`
	Rating      sql.NullFloat64 `json:"rating"`
	RatedCount  sql.NullInt32   `json:"rated_count"`
	IsVisible   bool            `json:"is_visible"`
}

var db *sql.DB

// --- ヘルパー関数 ---
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func nullableString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *value, Valid: true}
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// parseIDFromURL はURLパスからIDを抽出し、int64に変換する
func parseIDFromURL(r *http.Request, prefix string) (int64, error) {
	idStr := strings.TrimPrefix(r.URL.Path, prefix)
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0, err
	}
	return id, nil
}

// --- ハンドラ ---

func loginHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "許可されていないメソッドです")
		return
	}

	var reqBody struct {
		UserName string `json:"user_name"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		respondWithError(w, http.StatusBadRequest, "リクエストボディが不正です")
		return
	}

	var u User
	var hashedPassword string
	err := db.QueryRow("SELECT id, user_name, password, role, icon FROM users WHERE user_name = $1", reqBody.UserName).Scan(&u.ID, &u.UserName, &hashedPassword, &u.Role, &u.Icon)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusUnauthorized, "ユーザー名またはパスワードが一致しません")
			return
		}
		log.Printf("DBクエリ失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(reqBody.Password))
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "ユーザー名またはパスワードが一致しません")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(u)
}

func usersCollectionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getUsers(w, r)
	case http.MethodPost:
		createUser(w, r)
	default:
		respondWithError(w, http.StatusMethodNotAllowed, "許可されていないメソッドです")
	}
}

func userInstanceHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, PATCH, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	id, err := parseIDFromURL(r, "/users/")
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "無効なIDです")
		return
	}

	switch r.Method {
	case http.MethodGet:
		getUserByID(w, r, id)
	case http.MethodPatch:
		updateUser(w, r, id)
	case http.MethodDelete:
		deleteUser(w, r, id)
	default:
		respondWithError(w, http.StatusMethodNotAllowed, "許可されていないメソッドです")
	}
}

func questionsCollectionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getQuestions(w, r) // ここでクエリパラメータを処理するように変更
	case http.MethodPost:
		createQuestion(w, r)
	default:
		respondWithError(w, http.StatusMethodNotAllowed, "許可されていないメソッドです")
	}
}

func questionInstanceHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, PATCH, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	id, err := parseIDFromURL(r, "/questions/")
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "無効なIDです")
		return
	}

	switch r.Method {
	case http.MethodGet:
		getQuestionByID(w, r, id)
	case http.MethodPatch:
		updateQuestion(w, r, id)
	case http.MethodDelete:
		deleteQuestion(w, r, id)
	default:
		respondWithError(w, http.StatusMethodNotAllowed, "許可されていないメソッドです")
	}
}

// --- usersのCRUD関数 ---
func getUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, user_name, role, icon FROM users ORDER BY id")
	if err != nil {
		log.Printf("DBクエリ失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.UserName, &u.Role, &u.Icon); err != nil {
			log.Printf("データスキャン失敗: %v", err)
			respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
			return
		}
		users = append(users, u)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func getUserByID(w http.ResponseWriter, r *http.Request, id int64) {
	var u User
	err := db.QueryRow("SELECT id, user_name, role, icon FROM users WHERE id = $1", id).Scan(&u.ID, &u.UserName, &u.Role, &u.Icon)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusNotFound, "ユーザーが見つかりません")
		} else {
			log.Printf("DBクエリ失敗: %v", err)
			respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(u)
}

func createUser(w http.ResponseWriter, r *http.Request) {
	var reqBody struct {
		UserName string `json:"user_name"`
		Password string `json:"password"`
		Role     string `json:"role"`
		Icon     string `json:"icon"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		respondWithError(w, http.StatusBadRequest, "リクエストボディが不正です")
		return
	}

	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE user_name = $1)", reqBody.UserName).Scan(&exists)
	if err != nil {
		log.Printf("DBクエリ失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}
	if exists {
		respondWithError(w, http.StatusConflict, "このユーザー名は既に使用されています")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(reqBody.Password), bcrypt.DefaultCost)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	var createdUser User
	err = db.QueryRow("INSERT INTO users (user_name, password, role, icon) VALUES ($1, $2, $3, $4) RETURNING id, user_name, role, icon", reqBody.UserName, string(hashedPassword), reqBody.Role, reqBody.Icon).Scan(&createdUser.ID, &createdUser.UserName, &createdUser.Role, &createdUser.Icon)
	if err != nil {
		log.Printf("DB INSERT失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(createdUser)
}

func updateUser(w http.ResponseWriter, r *http.Request, id int64) {
	// まずは現在のユーザー情報を取得
	var u User
	err := db.QueryRow("SELECT id, user_name, role, icon FROM users WHERE id = $1", id).Scan(&u.ID, &u.UserName, &u.Role, &u.Icon)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusNotFound, "ユーザーが見つかりません")
			return
		}
		log.Printf("DBクエリ失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	var reqBody map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		respondWithError(w, http.StatusBadRequest, "リクエストボディが不正です")
		return
	}

	// 更新対象のフィールドを動的に構築
	updates := make([]string, 0)
	args := make([]interface{}, 0)
	argCounter := 1

	if newUserName, ok := reqBody["user_name"].(string); ok {
		if newUserName != u.UserName { // ユーザー名が変更された場合のみ競合チェック
			var exists bool
			err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE user_name = $1 AND id != $2)", newUserName, id).Scan(&exists)
			if err != nil {
				log.Printf("DBクエリ失敗: %v", err)
				respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
				return
			}
			if exists {
				respondWithError(w, http.StatusConflict, "このユーザー名は既に使用されています")
				return
			}
		}
		updates = append(updates, "user_name = $"+strconv.Itoa(argCounter))
		args = append(args, newUserName)
		argCounter++
	}
	if val, ok := reqBody["icon"].(string); ok {
		updates = append(updates, "icon = $"+strconv.Itoa(argCounter))
		args = append(args, val)
		argCounter++
	}
	if val, ok := reqBody["role"].(string); ok {
		updates = append(updates, "role = $"+strconv.Itoa(argCounter))
		args = append(args, val)
		argCounter++
	}
	if newPassword, ok := reqBody["password"].(string); ok && newPassword != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
			return
		}
		updates = append(updates, "password = $"+strconv.Itoa(argCounter))
		args = append(args, string(hashedPassword))
		argCounter++
	}

	if len(updates) == 0 {
		// 更新するフィールドがない場合
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(u) // 元のユーザー情報を返す
		return
	}

	query := "UPDATE users SET " + strings.Join(updates, ", ") + " WHERE id = $" + strconv.Itoa(argCounter) + " RETURNING id, user_name, role, icon"
	args = append(args, id)

	err = db.QueryRow(query, args...).Scan(&u.ID, &u.UserName, &u.Role, &u.Icon)
	if err != nil {
		log.Printf("DB UPDATE失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(u)
}

func deleteUser(w http.ResponseWriter, r *http.Request, id int64) {
	result, err := db.Exec("DELETE FROM users WHERE id = $1", id)
	if err != nil {
		log.Printf("DB DELETE失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	if rowsAffected == 0 {
		respondWithError(w, http.StatusNotFound, "ユーザーが見つかりません")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// --- questionsのCRUD関数 ---
func getQuestions(w http.ResponseWriter, r *http.Request) {
	// WHERE 1=1 は常に真なので、AND句を追加する際に便利
	conditions := []string{} // WHERE句の条件を格納するスライス
	args := []interface{}{}  // SQLクエリにバインドする引数を格納するスライス
	argCounter := 1          // プレースホルダー ($1, $2, ...) の番号を管理

	keyword := r.URL.Query().Get("keyword")
	tag := r.URL.Query().Get("tag")
	showHiddenStr := r.URL.Query().Get("show_hidden")
	showHidden := (showHiddenStr == "true") // bool型に変換
	authorIDStr := r.URL.Query().Get("author_id")

	// author_id フィルタリング
	if authorIDStr != "" {
		authorID, err := strconv.ParseInt(authorIDStr, 10, 64)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "無効なauthor_idです")
			return
		}
		conditions = append(conditions, fmt.Sprintf("author_id = $%d", argCounter))
		args = append(args, authorID)
		argCounter++
	}

	// キーワード検索
	if keyword != "" {
		searchKeyword := "%" + strings.ToLower(keyword) + "%"
		// 複数のカラムをORで結合
		conditions = append(conditions, fmt.Sprintf(`(
            LOWER(question) LIKE $%d OR 
            LOWER(answer) LIKE $%d OR 
            LOWER(COALESCE(hint, '')) LIKE $%d OR 
            LOWER(COALESCE(explanation, '')) LIKE $%d OR 
            LOWER(COALESCE(tags, '')) LIKE $%d OR 
            LOWER(COALESCE(author_note, '')) LIKE $%d
        )`, argCounter, argCounter+1, argCounter+2, argCounter+3, argCounter+4, argCounter+5))
		args = append(args, searchKeyword, searchKeyword, searchKeyword, searchKeyword, searchKeyword, searchKeyword)
		argCounter += 6 // 6つのプレースホルダーを使用したため、カウンターを6増やす
	}

	// タグ検索
	if tag != "" {
		searchTag := "%" + strings.ToLower(tag) + "%"
		conditions = append(conditions, fmt.Sprintf(`LOWER(COALESCE(tags, '')) LIKE $%d`, argCounter))
		args = append(args, searchTag)
		argCounter++
	}

	// is_visible フィルタリング
	// author_id でフィルタリングされている場合 (マイページからのリクエスト) は is_visible を無視する
	// 管理者で show_hidden が true の場合も is_visible を無視する
	// それ以外 (一般ユーザーの検索、管理者だが show_hidden が false) の場合は is_visible = true のみ
	// 注: currentUser の role 情報は Go API には直接渡されないため、authorIDStr が存在するかどうかで「自分の問題」を判断する
	isAuthorSpecificQuery := (authorIDStr != "") // author_id が指定されているか

	if !showHidden && !isAuthorSpecificQuery {
		conditions = append(conditions, "is_visible = true")
	}
	// isAuthorSpecificQuery が true の場合、is_visible はフィルタリングしない (自分の非表示問題も表示)
	// showHidden が true の場合も is_visible はフィルタリングしない (管理者が全ての非表示問題を見る)

	// WHERE句を構築
	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	finalQuery := fmt.Sprintf(`SELECT id, created_at, author_id, question, hint, answer, explanation, tags, author_note, rating, rated_count, is_visible FROM questions%s ORDER BY id`, whereClause)

	log.Printf("Executing query: %s with args: %v", finalQuery, args)
	rows, err := db.Query(finalQuery, args...)
	if err != nil {
		log.Printf("DBクエリ失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}
	defer rows.Close()

	var questions []Question
	for rows.Next() {
		var q Question
		if err := rows.Scan(&q.ID, &q.CreatedAt, &q.AuthorID, &q.Question, &q.Hint, &q.Answer, &q.Explanation, &q.Tags, &q.AuthorNote, &q.Rating, &q.RatedCount, &q.IsVisible); err != nil {
			log.Printf("データスキャン失敗: %v", err)
			respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
			return
		}
		questions = append(questions, q)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(questions)
}

func createQuestion(w http.ResponseWriter, r *http.Request) {
	var req QuestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "リクエストボディが不正です")
		return
	}

	// 必須フィールドのチェック
	if req.AuthorID == 0 || req.Question == "" || req.Answer == "" {
		respondWithError(w, http.StatusBadRequest, "author_id, question, answerは必須です")
		return
	}

	var newQuestion Question

	// is_visible のデフォルト値 `true` を考慮し、nilの場合はDBのデフォルトに任せる
	var isVisible bool
	if req.IsVisible != nil {
		isVisible = *req.IsVisible
	} else {
		// req.IsVisible がnilの場合、DBのDEFAULT値 (true) が適用される
		// ここではGoの変数に明示的にtrueを設定（DBに依存するため必須ではないが、一貫性のため）
		isVisible = true
	}

	err := db.QueryRow(
		`INSERT INTO questions (author_id, question, hint, answer, explanation, tags, author_note, is_visible)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, author_id, question, hint, answer, explanation, tags, author_note, rating, rated_count, is_visible`,
		req.AuthorID,
		req.Question,
		nullableString(req.Hint),
		req.Answer,
		nullableString(req.Explanation),
		nullableString(req.Tags),
		nullableString(req.AuthorNote),
		isVisible, // is_visible の値を渡す
	).Scan(
		&newQuestion.ID,
		&newQuestion.CreatedAt,
		&newQuestion.AuthorID,
		&newQuestion.Question,
		&newQuestion.Hint,
		&newQuestion.Answer,
		&newQuestion.Explanation,
		&newQuestion.Tags,
		&newQuestion.AuthorNote,
		&newQuestion.Rating,
		&newQuestion.RatedCount,
		&newQuestion.IsVisible,
	)

	if err != nil {
		log.Printf("DB INSERT失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newQuestion)
}

func updateQuestion(w http.ResponseWriter, r *http.Request, id int64) {
	// まずは現在の問題情報を取得
	var q Question
	err := db.QueryRow("SELECT id, created_at, author_id, question, hint, answer, explanation, tags, author_note, rating, rated_count, is_visible FROM questions WHERE id = $1", id).Scan(
		&q.ID, &q.CreatedAt, &q.AuthorID, &q.Question, &q.Hint, &q.Answer, &q.Explanation, &q.Tags, &q.AuthorNote, &q.Rating, &q.RatedCount, &q.IsVisible,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusNotFound, "問題が見つかりません")
			return
		}
		log.Printf("DBクエリ失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	var reqBody map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		respondWithError(w, http.StatusBadRequest, "リクエストボディが不正です")
		return
	}

	// 更新対象のフィールドを動的に構築
	updates := make([]string, 0)
	args := make([]interface{}, 0)
	argCounter := 1

	if val, ok := reqBody["question"].(string); ok {
		updates = append(updates, "question = $"+strconv.Itoa(argCounter))
		args = append(args, val)
		argCounter++
	}
	if val, ok := reqBody["hint"]; ok {
		if s, isString := val.(string); isString {
			updates = append(updates, "hint = $"+strconv.Itoa(argCounter))
			args = append(args, sql.NullString{String: s, Valid: true})
			argCounter++
		} else if val == nil { // hintをnullに設定する場合
			updates = append(updates, "hint = NULL")
		}
	}
	if val, ok := reqBody["answer"].(string); ok {
		updates = append(updates, "answer = $"+strconv.Itoa(argCounter))
		args = append(args, val)
		argCounter++
	}
	if val, ok := reqBody["explanation"]; ok {
		if s, isString := val.(string); isString {
			updates = append(updates, "explanation = $"+strconv.Itoa(argCounter))
			args = append(args, sql.NullString{String: s, Valid: true})
			argCounter++
		} else if val == nil { // explanationをnullに設定する場合
			updates = append(updates, "explanation = NULL")
		}
	}
	if val, ok := reqBody["tags"]; ok {
		if s, isString := val.(string); isString {
			updates = append(updates, "tags = $"+strconv.Itoa(argCounter))
			args = append(args, sql.NullString{String: s, Valid: true})
			argCounter++
		} else if val == nil { // tagsをnullに設定する場合
			updates = append(updates, "tags = NULL")
		}
	}
	if val, ok := reqBody["author_note"]; ok {
		if s, isString := val.(string); isString {
			updates = append(updates, "author_note = $"+strconv.Itoa(argCounter))
			args = append(args, sql.NullString{String: s, Valid: true})
			argCounter++
		} else if val == nil { // author_noteをnullに設定する場合
			updates = append(updates, "author_note = NULL")
		}
	}
	if val, ok := reqBody["is_visible"].(bool); ok {
		updates = append(updates, "is_visible = $"+strconv.Itoa(argCounter))
		args = append(args, val)
		argCounter++
	}
	if val, ok := reqBody["rating"].(float64); ok {
		updates = append(updates, "rating = $"+strconv.Itoa(argCounter))
		args = append(args, sql.NullFloat64{Float64: val, Valid: true})
		argCounter++
	}
	if val, ok := reqBody["rated_count"].(float64); ok { // JSONの数値はfloat64でデコードされるため
		updates = append(updates, "rated_count = $"+strconv.Itoa(argCounter))
		args = append(args, sql.NullInt32{Int32: int32(val), Valid: true})
		argCounter++
	}

	if len(updates) == 0 {
		// 更新するフィールドがない場合
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(q) // 元のユーザー情報を返す
		return
	}

	query := "UPDATE questions SET " + strings.Join(updates, ", ") + " WHERE id = $" + strconv.Itoa(argCounter) + " RETURNING id, created_at, author_id, question, hint, answer, explanation, tags, author_note, rating, rated_count, is_visible"
	args = append(args, id)

	err = db.QueryRow(query, args...).Scan(
		&q.ID, &q.CreatedAt, &q.AuthorID, &q.Question, &q.Hint, &q.Answer, &q.Explanation, &q.Tags, &q.AuthorNote, &q.Rating, &q.RatedCount, &q.IsVisible,
	)
	if err != nil {
		log.Printf("DB UPDATE失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(q)
}

func deleteQuestion(w http.ResponseWriter, r *http.Request, id int64) {
	result, err := db.Exec("DELETE FROM questions WHERE id = $1", id)
	if err != nil {
		log.Printf("DB DELETE失敗: %v", err)
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		return
	}

	if rowsAffected == 0 {
		respondWithError(w, http.StatusNotFound, "ユーザーが見つかりません")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getQuestionByID(w http.ResponseWriter, r *http.Request, id int64) {
	var q Question
	err := db.QueryRow("SELECT id, created_at, author_id, question, hint, answer, explanation, tags, author_note, rating, rated_count, is_visible FROM questions WHERE id = $1", id).Scan(&q.ID, &q.CreatedAt, &q.AuthorID, &q.Question, &q.Hint, &q.Answer, &q.Explanation, &q.Tags, &q.AuthorNote, &q.Rating, &q.RatedCount, &q.IsVisible)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusNotFound, "問題が見つかりません")
		} else {
			log.Printf("DBクエリ失敗: %v", err)
			respondWithError(w, http.StatusInternalServerError, "サーバー内部エラー")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(q)
}

// --- ミドルウェアとmain関数 ---
func apiKeyAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 認証エンドポイントとOPTIONSメソッドは認証をスキップ
		if r.URL.Path == "/auth/login" || r.Method == http.MethodOptions {
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

	connStr := getEnv("DATABASE_URL", "host=localhost port=5432 dbname=kklingo sslmode=disable")
	var err error
	db, err = sql.Open("pgx", connStr)
	if err != nil {
		log.Fatalf("DB接続失敗: %v", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("DBへのPing失敗: %v", err)
	}
	log.Println("DBに正常に接続しました。")

	mux := http.NewServeMux()
	mux.HandleFunc("/auth/login", loginHandler)
	mux.HandleFunc("/users", usersCollectionHandler)
	mux.HandleFunc("/users/", userInstanceHandler)
	mux.HandleFunc("/questions", questionsCollectionHandler) // 修正済み
	mux.HandleFunc("/questions/", questionInstanceHandler)

	handlerWithAuth := apiKeyAuthMiddleware(mux)

	port := getEnv("PORT", "8080")
	log.Printf("サーバーを http://localhost:%s で起動します。", port)
	if err := http.ListenAndServe(":"+port, handlerWithAuth); err != nil {
		log.Fatalf("サーバーの起動に失敗しました: %v", err)
	}
}
