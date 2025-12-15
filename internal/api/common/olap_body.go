package common

import (
	"iiko-analytic/internal/api/utils"
	"iiko-analytic/internal/iiko/dto"
	iikoUtils "iiko-analytic/internal/iiko/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/samber/lo"
)

type Filter struct {
	FilterType dto.FilterType `json:"filterType" validate:"required,oneof=IncludeValues ExcludeValues"`
	Values     []string       `json:"values" validate:"required"`
}

type OlapBody struct {
	BaseURL      string `json:"baseURL" validate:"required,url"`
	User         string `json:"user" validate:"required"`
	PasswordHash string `json:"passwordHash" validate:"required"`

	ReportType       iikoUtils.ReportType `json:"reportType" validate:"required,oneof=SALES TRANSACTIONS"`
	GroupByRowFields []string             `json:"groupByRowFields"`
	AggregateFields  []string             `json:"aggregateFields"`
	Filters          map[string]Filter    `json:"filters" validate:"dive"`
	From             utils.Date           `json:"from" validate:"required"`
	To               utils.Date           `json:"to" validate:"required"`
}

func (b *OlapBody) Validate(validator *utils.Validator) fiber.Map {
	errors, err := validator.Validate(b)
	if err != nil {
		return fiber.Map{
			"error":   err.Error(),
			"details": errors,
		}
	}
	if b.To.Time().Before(b.From.Time()) {
		return fiber.Map{
			"error":   "validation failed",
			"details": map[string]string{"to": "field 'to' must be greater than or equal to 'from'"},
		}
	}
	return nil
}

func (b *OlapBody) ToParams() dto.OlapParams {
	reportType := iikoUtils.ReportType(b.ReportType)
	aggregateFields := lo.Map(b.AggregateFields,
		func(field string, _ int) iikoUtils.AggregateField {
			return iikoUtils.AggregateField(field)
		})
	groupByRowFields := lo.Map(b.GroupByRowFields,
		func(field string, _ int) iikoUtils.GroupField {
			return iikoUtils.GroupField(field)
		})
	filters := lo.MapValues(b.Filters,
		func(filter Filter, _ string) dto.Filter {
			return dto.Filter{
				FilterType: filter.FilterType,
				Values:     filter.Values,
			}
		})
	return dto.OlapParams{
		ReportType:       reportType,
		AggregateFields:  aggregateFields,
		GroupByRowFields: groupByRowFields,
		Filters:          filters,
		From:             b.From.Time(),
		To:               b.To.Time(),
	}
}
