package cache

import (
	"bytes"
	"compress/gzip"
	"errors"
	"io"
	"sync"
	"time"

	jsoniter "github.com/json-iterator/go"
	gcache "github.com/patrickmn/go-cache"
)

type CompressedCache struct {
	cache *gcache.Cache
}

var (
	instance     *CompressedCache
	instanceOnce sync.Once
)

func NewCompressedCache() *CompressedCache {
	return &CompressedCache{
		cache: gcache.New(5*time.Minute,
			10*time.Minute),
	}
}

func GetCompressedCache() *CompressedCache {
	instanceOnce.Do(func() {
		instance = NewCompressedCache()
	})
	return instance
}

func (c *CompressedCache) compress(data []byte) []byte {
	var buf bytes.Buffer
	w := gzip.NewWriter(&buf)
	w.Write(data)
	w.Close()
	return buf.Bytes()
}

func (c *CompressedCache) decompress(data []byte) ([]byte, error) {
	r, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer r.Close()
	return io.ReadAll(r)
}

func (c *CompressedCache) Set(key string, value any, duration time.Duration) error {
	data, err := jsoniter.Marshal(value)
	if err != nil {
		return err
	}
	compressedData := c.compress(data)
	c.cache.Set(key, compressedData, duration)
	return nil

}

func (c *CompressedCache) Get(key string, value any) error {
	compressedData, ok := c.cache.Get(key)
	if !ok {
		return errors.New("key not found")
	}
	data, err := c.decompress(compressedData.([]byte))
	if err != nil {
		return err
	}
	if err := jsoniter.Unmarshal(data, &value); err != nil {
		return err
	}
	return nil
}
