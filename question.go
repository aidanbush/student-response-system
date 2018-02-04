package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

const questionUIDLen = 5

type question struct {
	QuestionTitle string   `db:"title" json:"question_title"`
	QuestionID    string   `db:"qid" json:"question_id"`
	Public        bool     `db:"public" json:"public"`
	class         string   `db:"cid" json:"class_id"`
	Answers       []string `json:"answers"`
}

func validQuestionReq(request question) bool {
	return strings.Compare(request.QuestionTitle, "") != 0
}

func createNewQuestion(w http.ResponseWriter, r *http.Request) (question, error) {
	question := question{}
	vars := mux.Vars(r)

	classID, ok := vars["classID"]
	if !ok {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, fmt.Errorf("createNewQuestion: unable to grab classID")
	}
	//validate class and cookie
	//grab cookie
	cookie, err := r.Cookie("UAT")
	if err != nil {
		fmt.Println("error in getting cookie")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, err
	}

	if valid, err := validTeachClass(classID, cookie.Value); err != nil {
		fmt.Println("error in validating class")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, err
	} else if !valid {
		fmt.Println("bad request")
		w.WriteHeader(http.StatusBadRequest)
		return question, fmt.Errorf("createNewQuestion: invalid UAT")
	}

	//parse json
	dataDec := json.NewDecoder(r.Body)

	err = dataDec.Decode(&question)
	if err != nil {
		fmt.Println("decode: ", err)
		return question, err
	}

	if !validQuestionReq(question) {
		fmt.Println("question: invalid request")
		w.WriteHeader(http.StatusBadRequest)
		return question, fmt.Errorf("question: invalid request")
	}

	//add question
	err = insertQuestionDB(&question, classID)
	if err != nil {
		fmt.Println("insertQuestionDB", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, err
	}

	return question, nil
}

func insertQuestionDB(question *question, class string) error {
	q := `insert into question (qid, title, public, cid) values ($1, $2, $3, $4)`

	// generate random md5 hash
	hash := genMD5(questionUIDLen)

	_, err := db.Exec(q, hash, question.QuestionTitle, false, class)

	// if err try again
	for err != nil {
		// if not duplicate error
		if !pqslUniqueErr(err) {
			fmt.Println("db", err)
			return err
		}
		fmt.Println("qid hash retry: ", hash, " already exists")
		// generate new random md5 hash
		hash = genMD5(questionUIDLen)
		_, err = db.Exec(q, hash, question.QuestionTitle, false, class)
	}
	question.QuestionID = hash

	return nil
}

func validOwnQuestion(questionID, UAT string) (bool, error) {
	q := `select Q.qid from person as P, teaches as T, question as Q
		where P.pid = $1 and P.pid = T.pid and Q.cid = T.cid and Q.qid = $2`

	res, err := db.Exec(q, UAT, questionID)
	if err != nil {
		return false, err
	}

	//parse json
	dataDec := json.NewDecoder(r.Body)

	err = dataDec.Decode(&question)
	if err != nil {
		fmt.Println("decode: ", err)
		return question, err
	}
	//count number of responses
	count, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	return count != 0, nil
}
