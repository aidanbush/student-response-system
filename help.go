package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/lib/pq"
)

const md5DataLen = 15

var errNoUAT = errors.New("no UAT cookie found")

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
	return hex.EncodeToString(sum[:length])
}

func getUAT(w http.ResponseWriter, r *http.Request) (string, error) {
	// check if cookie exists for person else create one
	cookies, err := r.Cookie("UAT")
	if err != nil {
		if err != http.ErrNoCookie {
			fmt.Println("cookie: ", err)
			return "", err
		}
		// return no UAT
		return "", errNoUAT
	} else {
		// validate cookie
		if !validCookie(cookies) {
			fmt.Println("class: invalid cookie")
			return "", fmt.Errorf("class: invalid cookie")
		}
	}
	return cookies.Value, nil
}

func createUAT(person *person, w http.ResponseWriter) error {
	//create person in db
	err := createNewPerson(person)
	if err != nil {
		fmt.Println("createNewPerson: ", err)
		return err
	}

	cookie := &http.Cookie{
		Name:    "UAT",
		Value:   person.Pid,
		Path:    "/",
		Expires: time.Now().AddDate(0, 0, 1),
	}
	http.SetCookie(w, cookie)
	return nil
}

func validUAT(UAT string) bool {
	q := `Select * from person where pid = $1`
	res, err := db.Exec(q, UAT)
	if err != nil {
		return false
	}
	count, err := res.RowsAffected()
	if err != nil {
		return false
	}
	return count != 0
}

// refactor out
func validCookie(cookie *http.Cookie) bool {
	return validUAT(cookie.Value)
}

func getNameFromClassReq(requestClass *classReq, r *http.Request) error {
	dataDec := json.NewDecoder(r.Body)

	err := dataDec.Decode(&requestClass)
	if err != nil {
		fmt.Println("decode: ", err)
		return err
	}
	return nil
}
