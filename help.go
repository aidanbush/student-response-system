package main

import (
	"crypto/md5"
	"encoding/hex"
	"math/rand"

	"github.com/lib/pq"
)

const md5DataLen = 15

func pqslUniqueErr(err error) bool {
	if pErr, ok := err.(*pq.Error); ok {
		return pErr.Code == "23505"
	}
	return false
}

func genMD5(length int) string {
	data := make([]byte, md5DataLen)
	for i := 0; i < md5DataLen; i++ {
		data[i] = byte(rand.Int()) //add random number
	}

	hash := md5.New()
	sum := hash.Sum(data)
	return hex.EncodeToString(sum[:length]) //convert to hex!!!
}
