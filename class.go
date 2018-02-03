package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const classUIDLen = 5

type classReq struct {
	Class  class  `json:"class"`
	Person person `json:"person"`
}

type class struct {
	ClassName string `db:"name" json:"class_name"`
	ClassID   string `db:"cid" json:"class_id"`
}

func validClassReq(request classReq) bool {
	return strings.Compare(request.Class.ClassName, "") != 0
}

func validCookie(cookie *http.Cookie) bool {
	q := `Select * from person where pid = $1`
	res, err := db.Exec(q, cookie.Value)
	if err != nil {
		return false
	}
	count, err := res.RowsAffected()
	if err != nil {
		return false
	}
	return count != 0
}

func createNewClass(w http.ResponseWriter, r *http.Request) (classReq, error) {
	requestClass := classReq{}
	dataDec := json.NewDecoder(r.Body)

	err := dataDec.Decode(&requestClass)
	if err != nil {
		return requestClass, err
	}

	// validate request
	if !validClassReq(requestClass) {
		return requestClass, fmt.Errorf("class: invalid request")
	}

	// check if cookie exists for person else create one
	cookies, err := r.Cookie("UAT")
	if err != nil {
		if err != http.ErrNoCookie {
			return requestClass, err
		}
		// create new person
		err = createNewPerson(&requestClass.Person)
		if err != nil {
			return requestClass, err
		}
		//create cookie
		cookie := &http.Cookie{Name: "UAT", Value: requestClass.Person.Pid, Expires: time.Now().AddDate(0, 0, 1)}
		http.SetCookie(w, cookie)
	} else {
		// validate cookie
		if !validCookie(cookies) {
			return requestClass, fmt.Errorf("class: invalid cookie")
		}
	}

	// add class to db
	err = insertClassDB(&requestClass.Class)
	if err != nil {
		return requestClass, err
	}

	//make teacher of class
	err = linkTeacher(requestClass)
	if err != nil {
		return requestClass, nil
	}

	return requestClass, nil
}

func insertClassDB(class *class) error {
	// parse body into json object
	q := `insert into class (cid, name) values ($1, $2)`

	// generate random md5 hash
	hash := genMD5(classUIDLen)

	_, err := db.Exec(q, hash, class.ClassName)

	// if err try again
	for err != nil {
		fmt.Println("retry: ", hash, " already exists")
		//if not duplicate error
		if !pqslUniqueErr(err) {
			fmt.Println("db", err)
			return err
		}
		// generate new random md5 hash
		hash = genMD5(classUIDLen)
		_, err = db.Exec(q, hash, class.ClassName)
	}
	class.ClassID = hash

	return nil
}
