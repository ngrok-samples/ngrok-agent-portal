package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

var agentID string
var agentToken string

func init() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}
	agentID = os.Getenv("AGENT_ID")
	agentToken = os.Getenv("AGENT_TOKEN")
}

func Authentication(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("id")
		token := r.Header.Get("token")

		if id != agentID || token != agentToken {
			response := map[string]interface{}{
				"success": false,
				"error":   "Unauthorized",
			}
			jsonResponse, _ := json.Marshal(response)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write(jsonResponse)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // Allow all origins
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, AGENT_ID, AGENT_TOKEN")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

type CustomResponseWriter struct {
	http.ResponseWriter
	Body       *bytes.Buffer
	StatusCode int
}

func (w *CustomResponseWriter) WriteHeader(statusCode int) {
	w.StatusCode = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

func (w *CustomResponseWriter) Write(body []byte) (int, error) {
	w.Body.Write(body)
	return w.ResponseWriter.Write(body)
}

func logResponse(crw *CustomResponseWriter) {
	fmt.Printf("Response status: %d\n", crw.StatusCode)
	fmt.Printf("Response body: %s\n", crw.Body.String())
}

func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		crw := &CustomResponseWriter{ResponseWriter: w, Body: new(bytes.Buffer), StatusCode: http.StatusOK}
		next.ServeHTTP(crw, r)
		logResponse(crw)
	})
}

func LogRequest(method string, r *http.Request) {
	fmt.Printf("%s request to %s\n", method, r.URL.Path)

	if r.Body != nil {
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			fmt.Println("Error reading request body:", err)
			return
		}

		r.Body = io.NopCloser(io.Reader(bytes.NewBuffer(bodyBytes)))

		if len(bodyBytes) > 0 {
			fmt.Printf("Request body: %s\n", string(bodyBytes))
		}
	}
}
