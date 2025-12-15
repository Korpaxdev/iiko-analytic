package iiko

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"iiko-analytic/internal/iiko/dto"
	"iiko-analytic/internal/iiko/routes"
	"iiko-analytic/internal/iiko/utils"
	"log"
	"maps"
	"os"
	"slices"
	"time"

	"github.com/go-resty/resty/v2"
	jsoniter "github.com/json-iterator/go"
	"github.com/samber/lo"
)

var logger = log.New(os.Stdout, "", log.LstdFlags|log.Lshortfile)

type Cache interface {
	Set(key string, value any, duration time.Duration) error
	Get(key string, value any) error
}

type ServerAPI struct {
	baseURL      string
	user         string
	passwordHash string
	client       *resty.Client
	token        string
	cache        Cache
}

func NewServerAPI(baseURL, user, passwordHash string, cache Cache) *ServerAPI {
	client := resty.New().
		SetJSONMarshaler(jsoniter.Marshal).
		SetJSONUnmarshaler(jsoniter.Unmarshal).
		SetBaseURL(baseURL)

	return &ServerAPI{
		baseURL:      baseURL,
		user:         user,
		passwordHash: passwordHash,
		client:       client,
		cache:        cache,
	}
}

func (s *ServerAPI) Login() error {
	params := map[string]string{
		"login": s.user,
		"pass":  s.passwordHash,
	}
	response, err := s.client.R().SetQueryParams(params).Get(routes.LoginRoute)

	if err = utils.HandleWithoutDto(response, err); err != nil {
		return err
	}
	s.token = response.String()
	return nil
}

func (s *ServerAPI) Logout() error {
	if s.token == "" {
		return nil
	}

	response, err := s.client.R().
		SetQueryParam("key", s.token).
		Post(routes.LogoOutRoute)

	if err = utils.HandleWithoutDto(response, err); err != nil {
		return err
	}

	s.token = ""
	return nil
}

func (s *ServerAPI) getPeriod(reportType utils.ReportType, from time.Time, to time.Time) map[string]any {
	switch reportType {
	case utils.SalesReport:
		return map[string]any{
			"OpenDate.Typed": map[string]any{
				"filterType":  "DateRange",
				"periodType":  "CUSTOM",
				"includeLow":  true,
				"includeHigh": true,
				"from":        from.Format("2006-01-02"),
				"to":          to.Format("2006-01-02"),
			},
		}
	default:
		return map[string]any{
			"DateTime.Typed": map[string]any{
				"filterType":  "DateRange",
				"periodType":  "CUSTOM",
				"includeLow":  true,
				"includeHigh": true,
				"from":        from.Format("2006-01-02"),
				"to":          to.Format("2006-01-02"),
			},
		}
	}
}

func (s *ServerAPI) filtersToMap(filters map[string]dto.Filter) map[string]any {
	filterKeys := lo.Keys(filters)
	slices.Sort(filterKeys)

	result := make(map[string]any, len(filters))
	for _, key := range filterKeys {
		filter := filters[key]
		result[key] = map[string]any{
			"filterType": string(filter.FilterType),
			"values":     filter.Values,
		}
	}
	return result
}

func (s *ServerAPI) getCacheKey(params dto.OlapParams) string {

	slices.Sort(params.AggregateFields)
	slices.Sort(params.GroupByRowFields)
	slices.Sort(params.GroupByColFields)

	keyData := map[string]any{
		"reportType":       string(params.ReportType),
		"aggregateFields":  params.AggregateFields,
		"groupByRowFields": params.GroupByRowFields,
		"groupByColFields": params.GroupByColFields,
		"filters":          s.filtersToMap(params.Filters),
		"from":             params.From.Format("2006-01-02"),
		"to":               params.To.Format("2006-01-02"),
	}
	data, _ := json.Marshal(keyData)
	hash := md5.Sum(data)
	return fmt.Sprintf("olap:%x", hash)
}

func (s *ServerAPI) OlapBody(params dto.OlapParams) map[string]any {
	bodyGroupByRowFields := lo.Map(params.GroupByRowFields,
		func(groupField utils.GroupField, _ int) string {
			return string(groupField)
		})

	bodyGroupByColFields := lo.Map(params.GroupByColFields,
		func(groupField utils.GroupField, _ int) string {
			return string(groupField)
		})

	bodyAggregateFields := lo.Map(params.AggregateFields,
		func(aggregateField utils.AggregateField, _ int) string {
			return string(aggregateField)
		})

	bodyFilters := map[string]any{}
	maps.Copy(bodyFilters, s.getPeriod(params.ReportType, params.From, params.To))
	maps.Copy(bodyFilters, s.filtersToMap(params.Filters))

	body := map[string]any{
		"reportType":       string(params.ReportType),
		"groupByRowFields": bodyGroupByRowFields,
		"groupByColFields": bodyGroupByColFields,
		"aggregateFields":  bodyAggregateFields,
		"filters":          bodyFilters,
	}
	return body
}

func (s *ServerAPI) Olap(params dto.OlapParams) (dto.OlapResponse, error) {

	var dto = dto.OlapResponse{}

	if s.cache != nil {
		cacheKey := s.getCacheKey(params)
		err := s.cache.Get(cacheKey, &dto)
		if err == nil {
			return dto, nil
		}
		logger.Printf("Error getting cache: %v\n", err)
	}

	if err := s.Login(); err != nil {
		return dto, err
	}

	body := s.OlapBody(params)
	response, err := s.client.R().
		SetBody(body).
		SetQueryParam("key", s.token).
		Post(routes.OlapRoute)

	if err = utils.HandleResponse(response, err, &dto); err != nil {
		return dto, err
	}

	if s.cache != nil {
		go func() {
			cacheKey := s.getCacheKey(params)
			if err := s.cache.Set(cacheKey, dto, 10*time.Minute); err != nil {
				logger.Printf("Error setting cache: %v\n", err)
			}
		}()
	}

	return dto, nil
}

func (s *ServerAPI) Fields(reportType utils.ReportType) (map[string]any, error) {
	var dto = map[string]any{}

	if err := s.Login(); err != nil {
		return dto, err
	}

	response, err := s.client.R().
		SetQueryParam("key", s.token).
		SetQueryParam("reportType", string(reportType)).
		Get(routes.OlapColumnsRoute)

	if err = utils.HandleResponse(response, err, &dto); err != nil {
		return dto, err
	}

	return dto, nil
}

func (s *ServerAPI) OlapPresets() ([]map[string]any, error) {
	var dto = []map[string]any{}

	if err := s.Login(); err != nil {
		return dto, err
	}

	response, err := s.client.R().
		SetQueryParam("key", s.token).
		Get(routes.OlapPresetsRoute)

	if err = utils.HandleResponse(response, err, &dto); err != nil {
		return dto, err
	}

	return dto, nil
}
