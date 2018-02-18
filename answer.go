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
	QuestionID string `json:"question_id" db:"qid"`
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

// return question w/ correct selected answer
func submitAnswer(w http.ResponseWriter, r *http.Request) (answer, error) {
	vars := mux.Vars(r)
	answer := answer{}

	// get classID
	classID, ok := vars["classID"]
	if !ok {
		fmt.Println("getAnswers: can't find classID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, fmt.Errorf("getAnswers: unable to grab classID")
	}

	// get questionID
	questionID, ok := vars["questionID"]
	if !ok {
		fmt.Println("getAnswers: can't find questionID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, fmt.Errorf("getAnswers: unable to grab classID")
	}

	// get UAT
	cookie, err := r.Cookie("UAT")
	if err != nil {
		fmt.Println("error in getting cookie")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, err
	}
	UAT := cookie.Value

	// validate in class and question in class and public
	ok, err = ownPublicQuestion(UAT, classID, questionID)
	if err != nil {
		return answer, err
	} else if !ok {
		return answer, fmt.Errorf("submitAnswer: don't own question")
	}

	// get answerID
	dataDec := json.NewDecoder(r.Body)

	err = dataDec.Decode(&answer)
	if err != nil {
		fmt.Println("decode: ", err)
		return answer, err
	}

	// valid answer
	ok, err = validAnswer(answer.AnswerID, questionID)
	if err != nil {
		return answer, err
	} else if !ok {
		return answer, fmt.Errorf("submitAnswer: answer does not exits")
	}

	// insert
	err = submitAnswerDB(answer.AnswerID, questionID, UAT)
	if err != nil {
		return answer, err
	}

	// grab answer out of db
	err = fillAnswer(&answer)
	if err != nil {
		return answer, err
	}

	return answer, nil
}

// change answer
func changeAnswer(w http.ResponseWriter, r *http.Request) (answer, error) {
	vars := mux.Vars(r)
	answer := answer{}

	// get classID
	classID, ok := vars["classID"]
	if !ok {
		fmt.Println("changeAnswer: can't find classID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, fmt.Errorf("changeAnswer: unable to grab classID")
	}

	// get questionID
	questionID, ok := vars["questionID"]
	if !ok {
		fmt.Println("changeAnswer: can't find questionID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, fmt.Errorf("changeAnswer: unable to grab classID")
	}

	// get UAT
	cookie, err := r.Cookie("UAT")
	if err != nil {
		fmt.Println("error in getting cookie")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, err
	}
	UAT := cookie.Value

	// validate in class and public
	ok, err = ownPublicQuestion(UAT, classID, questionID)
	if err != nil {
		return answer, err
	} else if !ok {
		return answer, fmt.Errorf("changeAnswer: don't own question")
	}

	// get answerID

	// validAnswer

	// insert

	// grab answer out of db

	// return answer
}

func submitAnswerDB(answerID, questionID, UAT string) error {
	q := `insert into answered (aid, qid, pid) values ($1, $2, $3)`

	_, err := db.Exec(q, answerID, questionID, UAT)
	if err != nil {
		return err
	}
	return nil
}

func ownPublicQuestion(UAT, classID, questionID string) (bool, error) {
	q := `select count(*) from taking as T, question as Q
        where T.pid = $1 and T.cid = $2 and Q.qid = $3 and T.cid = Q.cid and Q.public = true`

	res, err := db.Exec(q, UAT, classID, questionID)
	if err != nil {
		return false, err
	}

	count, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	return count != 0, err
}

func validAnswer(answerID, questionID string) (bool, error) {
	q := `select count(*) from answer where aid = $1 and qid = $2`

	res, err := db.Exec(q, answerID, questionID)
	if err != nil {
		return false, err
	}

	count, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	return count != 0, err
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

func fillAnswer(answer *answer) error {
	q := `select * from answer where aid = $1`
	rows, err := db.Queryx(q, answer.AnswerID)
	if err != nil {
		return err
	}
	if rows.Next() {
		err = rows.StructScan(answer)
		if err != nil {
			return err
		}
	} else {
		return fmt.Errorf("fill answer: unable to find answer")
	}

	return nil
}

func fillAnswers(question *question) error {
	q := `select * from answer where qid = $1`

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
