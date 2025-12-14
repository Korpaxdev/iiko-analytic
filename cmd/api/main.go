package main

import (
	"iiko-analytic/internal/api"
	"iiko-analytic/internal/api/routes/dashboard"
	"iiko-analytic/internal/api/routes/fields"
	"iiko-analytic/internal/api/routes/olap"
	"iiko-analytic/internal/api/utils"
	"log"
)

func main() {
	handlers := []utils.HandlerInterface{
		dashboard.NewDashboardHandler(),
		olap.NewOlapHandler(),
		fields.NewFieldsHandler(),
	}
	api := api.NewAPI()
	api.SetupHandlers(handlers)
	api.SetupMiddlewares()
	if err := api.Start(":8080"); err != nil {
		log.Fatalf("Error starting API: %v", err)
	}
	defer api.Shutdown()
}
