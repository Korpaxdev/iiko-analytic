package olap

import (
	"iiko-analytic/internal/api/utils"
	"iiko-analytic/internal/cache"
	"iiko-analytic/internal/iiko"
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

const (
	Route  = "/olap"
	Method = fiber.MethodPost
)

func NewOlapHandler() utils.HandlerInterface {
	return utils.NewHandler(Method, Route, olapHandler)
}
func olapHandler(c *fiber.Ctx) error {
	var body OlapBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	validate := utils.GetValidator()
	errors, err := validate.Validate(body)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   err.Error(),
			"details": errors,
		})
	}

	if body.To.Time().Before(body.From.Time()) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "validation failed",
			"details": map[string]string{"to": "field 'to' must be greater than or equal to 'from'"},
		})
	}

	reportType := iikoUtils.ReportType(body.ReportType)
	aggregateFields := lo.Map(body.AggregateFields,
		func(field string, _ int) iikoUtils.AggregateField {
			return iikoUtils.AggregateField(field)
		})
	groupByRowFields := lo.Map(body.GroupByRowFields,
		func(field string, _ int) iikoUtils.GroupField {
			return iikoUtils.GroupField(field)
		})
	filters := lo.MapValues(body.Filters,
		func(filter Filter, _ string) dto.Filter {
			return dto.Filter{
				FilterType: filter.FilterType,
				Values:     filter.Values,
			}
		})

	serverAPI := iiko.NewServerAPI(
		body.BaseURL,
		body.User,
		body.PasswordHash,
		cache.GetCompressedCache())

	defer func() {
		go serverAPI.Logout()
	}()

	report, err := serverAPI.Olap(
		dto.OlapParams{
			ReportType:       reportType,
			AggregateFields:  aggregateFields,
			GroupByRowFields: groupByRowFields,
			Filters:          filters,
			From:             body.From.Time(),
			To:               body.To.Time(),
		})

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(report.Data)
}
