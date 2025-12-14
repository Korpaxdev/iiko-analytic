package utils

import (
	"fmt"
	"sync"

	"github.com/go-playground/validator/v10"
)

var instance *Validator
var instanceOnce sync.Once

type Validator struct {
	validator *validator.Validate
}

func NewValidator() *Validator {
	return &Validator{
		validator: validator.New(),
	}
}

func GetValidator() *Validator {
	instanceOnce.Do(func() {
		instance = &Validator{
			validator: validator.New(),
		}
	})
	return instance
}

func (v *Validator) Validate(i any) (map[string]string, error) {
	if err := v.validator.Struct(i); err != nil {
		errors := make(map[string]string)
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			for _, validationError := range validationErrors {
				errors[validationError.Field()] = GetValidationErrorMessage(validationError)
			}
		}
		return errors, fmt.Errorf("validation failed")
	}
	return nil, nil
}
