package dto

import (
	"iiko-analytic/internal/iiko/utils"
	"time"
)

type OlapParams struct {
	ReportType       utils.ReportType       `json:"reportType" validate:"required,oneof=SALES TRANSACTIONS"`
	GroupByRowFields []utils.GroupField     `json:"groupByRowFields"`
	AggregateFields  []utils.AggregateField `json:"aggregateFields"`
	Filters          map[string]Filter      `json:"filters" validate:"dive"`
	From             time.Time              `json:"from" validate:"required"`
	To               time.Time              `json:"to" validate:"required"`
}
