package utils

import (
	"fmt"

	"github.com/go-playground/validator/v10"
)

func GetValidationErrorMessage(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return fmt.Sprintf("field '%s' is required", err.Field())
	case "min":
		if err.Kind().String() == "slice" || err.Kind().String() == "array" {
			return fmt.Sprintf("field '%s' must contain at least %s element(s)", err.Field(), err.Param())
		}
		return fmt.Sprintf("field '%s' must be at least %s", err.Field(), err.Param())
	case "max":
		if err.Kind().String() == "slice" || err.Kind().String() == "array" {
			return fmt.Sprintf("field '%s' must contain at most %s element(s)", err.Field(), err.Param())
		}
		return fmt.Sprintf("field '%s' must be at most %s", err.Field(), err.Param())
	case "oneof":
		return fmt.Sprintf("field '%s' must be one of: %s", err.Field(), err.Param())
	case "email":
		return fmt.Sprintf("field '%s' must be a valid email address", err.Field())
	case "url":
		return fmt.Sprintf("field '%s' must be a valid URL", err.Field())
	case "len":
		return fmt.Sprintf("field '%s' must be exactly %s characters long", err.Field(), err.Param())
	case "gte":
		return fmt.Sprintf("field '%s' must be greater than or equal to %s", err.Field(), err.Param())
	case "lte":
		return fmt.Sprintf("field '%s' must be less than or equal to %s", err.Field(), err.Param())
	case "gt":
		return fmt.Sprintf("field '%s' must be greater than %s", err.Field(), err.Param())
	case "lt":
		return fmt.Sprintf("field '%s' must be less than %s", err.Field(), err.Param())
	case "eq":
		return fmt.Sprintf("field '%s' must be equal to %s", err.Field(), err.Param())
	case "ne":
		return fmt.Sprintf("field '%s' must not be equal to %s", err.Field(), err.Param())
	default:
		return fmt.Sprintf("field '%s' failed validation: %s", err.Field(), err.Tag())
	}
}
