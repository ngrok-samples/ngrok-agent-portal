package app

import (
	"agent-go/server/middleware"
	"agent-go/server/module"
	"agent-go/server/routes"

	"github.com/gorilla/mux"
)

func SetupRouter() *mux.Router {

	module.FetchAgentConfig()

	router := mux.NewRouter()

	router.Use(middleware.CORS)

	routes.RegisterRoutes(router)
	return router
}
