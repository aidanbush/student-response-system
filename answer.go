package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

const answerUIDLen = 5

type answer struct {
	AnswerID   string `json:"answer_id" db:"aid"`
	AnswerText string `json:"answer_text" db:"answer"`
	QuestionID string `json:"question_id"`
}

func validAnswerReq(request answer) bool {
	return strings.Compare(request.AnswerText, "") != 0
}

func createNewAnswer(w http.ResponseWriter, r *http.Request) (answer, error) {
	answer := answer{}
	vars := mux.Vars(r)

	questionID, ok := vars["questionID"]
	if !ok {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, fmt.Errorf("createNewAnswer: unable to grab questionID")
	}

	answer.QuestionID = questionID

	//grab cookie
	cookie, err := r.Cookie("UAT")
	if err != nil {
		fmt.Println("error in getting cookie")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, err
	}

	// validate cookie
	if valid, err := validOwnQuestion(answer.QuestionID, cookie.Value); err != nil {
		fmt.Println("error in validating question")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, err
	} else if !valid {
		fmt.Println("bad request")
		w.WriteHeader(http.StatusBadRequest)
		return answer, fmt.Errorf("createNewAnswer: invalid UAT")
	}

	// parse json
	dataDec := json.NewDecoder(r.Body)

	err = dataDec.Decode(&answer)
	if err != nil {
		fmt.Println("decode: ", err)
		return answer, err
	}

	//validate
	if !validAnswerReq(answer) {
		fmt.Println("answer: invalid request")
		w.WriteHeader(http.StatusBadRequest)
		return answer, fmt.Errorf("answer: invalid request")
	}

	// add answer
	err = insertAnswerDB(&answer)
	if err != nil {
		fmt.Println("insertAnswerDB", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, err
	}

	return answer, nil
}

func insertAnswerDB(answer *answer) error {
	q := `insert into answer (aid, answer, qid) values ($1, $2, $3)`

	// generate random md5 hash
	hash := genMD5(answerUIDLen)

	_, err := db.Exec(q, hash, answer.AnswerText, answer.QuestionID)

	// if err try again
	for err != nil {
		// if not duplicate error
		if !pqslUniqueErr(err) {
			fmt.Println("db", err)
			return err
		}
		fmt.Println("qid hash retry: ", hash, " already exists")
		// generate new random md5 hash
		hash = genMD5(answerUIDLen)
		_, err = db.Exec(q, hash, answer.AnswerText, answer.QuestionID)
	}
	answer.AnswerID = hash

	return nil
}

func fillAnswers(question question) error {
	q := `select * from answers where qid = $1`

	rows, err := db.Queryx(q, question.QuestionID)
	if err != nil {
		return err
	}

	answer := answer{}

	for rows.Next() {
		err = rows.StructScan(&answer)
		if err != nil {
			return err
		}
		question.Answers = append(question.Answers, answer)
	}

	return nil
}
