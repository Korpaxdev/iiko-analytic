package utils

type ReportType string
type GroupField string
type AggregateField string

const (
	SalesReport        ReportType = "SALES"
	TransactionsReport ReportType = "TRANSACTIONS"
)

const (
	GroupByDepartment GroupField = "Department"
)

const (
	AggregateByDishDiscountSumInt        AggregateField = "DishDiscountSumInt"
	AggregateByDishDiscountSumIntAverage AggregateField = "DishDiscountSumInt.average"
)
