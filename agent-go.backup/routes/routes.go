package routes

import (
	"agent-go/server/controller"
	"agent-go/server/middleware"

	"github.com/gorilla/mux"
)

func RegisterRoutes(router *mux.Router) {
	router.HandleFunc("/", controller.GetAgentStatus).Methods("GET")
	router.Use(middleware.Authentication)
	router.HandleFunc("/getEndPointStatus/{id}", controller.GetAllEndPoints).Methods("GET")
	router.HandleFunc("/getAllEndPoints", controller.GetAllEndPoints).Methods("GET")
	router.HandleFunc("/addEndpoint/", controller.AddEndpoint).Methods("POST")
	router.HandleFunc("/updateStatus/{id}", controller.UpdateStatus).Methods("PATCH")
	router.HandleFunc("/deleteEndpoint/{id}", controller.DeleteEndpoint).Methods("DELETE")
	router.Use(middleware.LoggingMiddleware)
}
