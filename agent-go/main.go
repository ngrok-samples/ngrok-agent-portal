package main

import (
	"log"
	"net/http"
	"os"

	"agent-go/server/app"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Error loading .env file, using default settings")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	router := app.SetupRouter()

	log.Printf("Server listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
