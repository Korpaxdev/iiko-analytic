package dto

type FilterType string

const (
	FilterTypeIncludeValues FilterType = "IncludeValues"
	FilterTypeExcludeValues FilterType = "ExcludeValues"
)

type Filter struct {
	FilterType FilterType `json:"filterType"`
	Values     []string   `json:"values"`
}
