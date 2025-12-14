package utils

import (
	"encoding/json"
	"fmt"

	"github.com/go-resty/resty/v2"
)

func HandleWithoutDto(response *resty.Response, err error) error {
	if err != nil {
		return err
	}
	if response.IsError() {
		return fmt.Errorf("status code: %d, body: %s", response.StatusCode(), response.Body())
	}
	return nil
}
func HandleResponse[T any](response *resty.Response, err error, dto *T) error {
	if err := HandleWithoutDto(response, err); err != nil {
		return err
	}

	if err := json.Unmarshal(response.Body(), dto); err != nil {
		return err
	}
	return nil
}
