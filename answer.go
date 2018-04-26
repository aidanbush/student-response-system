package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

const answerUIDLen = 5

var errUpdateNoRows = errors.New("updated no rows")

type answer struct {
	AnswerID   string `json:"answer_id" db:"aid"`
	AnswerText string `json:"answer_text" db:"answer"`
	QuestionID string `json:"question_id" db:"qid"`
}

type response struct {
	AnswerID string `json:"answer_id" db:"aid"`
	Count    int    `json:"count" db:"count"`
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

	//grab cookie
	cookie, err := r.Cookie("UAT")
	if err != nil {
		fmt.Println("error in getting cookie")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, err
	}

	// validate cookie
	if valid, err := validOwnQuestion(questionID, cookie.Value); err != nil {
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

	// set questionID
	answer.QuestionID = questionID

	//validate
	if !validAnswerReq(answer) {
		fmt.Println("answer: invalid request")
		w.WriteHeader(http.StatusBadRequest)
		return answer, fmt.Errorf("answer: invalid request")
	}

	// add answer
	err = insertAnswerDB(&answer)
	if err != nil {
		fmt.Println("insertAnswerDB: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answer, err
	}

	return answer, nil
}

func getSubmittedAnswers(w http.ResponseWriter, r *http.Request) ([]response, error) {
	vars := mux.Vars(r)
	answers := []response{}

	// get classID from route
	classID, ok := vars["classID"]
	if !ok {
		fmt.Println("getSubmittedAnswers: can't find classID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answers, fmt.Errorf("getSubmittedAnswers: unable to grab classID")
	}

	// validate class exists
	ok, err := classExists(classID)
	if err != nil {
		fmt.Println("getSubmittedAnswers: classExists: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answers, err
	} else if !ok {
		fmt.Println("getSubmittedAnswers: classID does not exist")
		w.WriteHeader(http.StatusBadRequest)
		return answers, fmt.Errorf("getSubmittedAnswers: classID does not exist")
	}

	// get UAT
	UAT, err := getUAT(w, r)
	if err != nil {
		fmt.Println("getSubmittedAnswers: ", err)
		if err != errNoUAT {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		return answers, err
	}

	// validate teaches class
	ok, err = validTeachClass(classID, UAT)
	if err != nil {
		fmt.Println("getSubmittedAnswers: inClass: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answers, err
	} else if !ok {
		fmt.Println("getSubmittedAnswers: pid ", UAT, "not in class ", classID)
		w.WriteHeader(http.StatusBadRequest)
		return answers, fmt.Errorf("getSubmittedAnswers: inClass: not in class")
	}

	// get questionID
	questionID, ok := vars["questionID"]
	if !ok {
		fmt.Println("getSubmittedAnswers: can't find questionID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answers, fmt.Errorf("getSubmittedAnswers: unable to grab classID")
	}

	// validate question in class
	ok, err = questionInClass(classID, questionID)
	if err != nil {
		fmt.Println("getSubmittedAnswers: inClass: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answers, err
	} else if !ok {
		fmt.Println("getSubmittedAnswers: qid: ", questionID, " not in class: ", classID)
		w.WriteHeader(http.StatusBadRequest)
		return answers, fmt.Errorf("getSubmittedAnswers: questionInClass: not in class")
	}

	// get answers
	answers, err = getResponses(questionID)
	if err != nil {
		fmt.Println("getSubmittedAnswers: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return answers, err
	}

	return answers, nil
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
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
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
	dataDec := json.NewDecoder(r.Body)

	err = dataDec.Decode(&answer)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		fmt.Println("decode: ", err)
		return answer, err
	}

	// validAnswer
	ok, err = validAnswer(answer.AnswerID, questionID)
	if err != nil {
		return answer, err
	} else if !ok {
		return answer, fmt.Errorf("submitAnswer: answer does not exits")
	}

	// update
	err = updateAnswerDB(answer.AnswerID, questionID, UAT)
	if err != nil {
		if err != errUpdateNoRows {
			fmt.Println("changeAnswer: updateAnswerDB: ", err)
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		} else {
			fmt.Println("changeAnswer: update on unanswered question")
			w.WriteHeader(http.StatusBadRequest)
		}
		return answer, err
	}

	// grab answer out of db
	err = fillAnswer(&answer)
	if err != nil {
		return answer, err
	}

	// return answer
	return answer, nil
}

// delete answer
func deleteAnswer(w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)

	// get classID
	classID, ok := vars["classID"]
	if !ok {
		fmt.Println("deleteAnswer: can't find classID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return fmt.Errorf("deleteAnswer: unable to grab classID")
	}

	// get questionID
	questionID, ok := vars["questionID"]
	if !ok {
		fmt.Println("deleteAnswer: can't find questionID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return fmt.Errorf("deleteAnswer: unable to grab questionID")
	}

	// get answerID
	answerID, ok := vars["answerID"]
	if !ok {
		fmt.Println("deleteAnswer: can't find answerID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return fmt.Errorf("deleteAnswer: unable to grab answerID")
	}

	// get UAT
	UAT, err := getUAT(w, r)
	if err != nil {
		if err != errNoUAT {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		fmt.Println("deleteAnswer: getUAT:", err)
		return err
	}

	// check if teach class and question and answer are in it
	ok, err = ownAnswer(UAT, classID, questionID, answerID)
	if err != nil {
		fmt.Println("deleteAnswer: ownAnswer:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return err
	} else if !ok {
		fmt.Println("deleteAnswer: UAT:", UAT, "does not own answer:", answerID, "from question:", questionID, "and class:", classID)
		w.WriteHeader(http.StatusBadRequest)
		return fmt.Errorf("deleteAnswer: doesn't own answer")
	}

	// delete answer
	err = deleteAnswerDB(answerID)
	if err != nil {
		fmt.Println("deleteAnswer: deleteAnswerDB:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return err
	}

	return nil
}

func getResponses(questionID string) ([]response, error) {
	q := `select aid, count(*) from answered where qid = $1 group by aid`

	responses := []response{}

	rows, err := db.Queryx(q, questionID)
	if err != nil {
		return responses, err
	}

	response := response{}
	for rows.Next() {
		err = rows.StructScan(&response)
		if err != nil {
			return responses, err
		}
		responses = append(responses, response)
	}
	return responses, nil
}

func submitAnswerDB(answerID, questionID, UAT string) error {
	q := `insert into answered (aid, qid, pid) values ($1, $2, $3)`

	_, err := db.Exec(q, answerID, questionID, UAT)
	if err != nil {
		return err
	}
	return nil
}

// return error on
func updateAnswerDB(answerID, questionID, UAT string) error {
	q := `update answered set aid = $1 where qid = $2 and pid = $3`

	res, err := db.Exec(q, answerID, questionID, UAT)
	if err != nil {
		return err
	}

	count, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if count == 0 {
		return errUpdateNoRows
	}
	return nil
}

func deleteAnswerDB(answerID string) error {
	q := `delete from answered where aid = $1`

	_, err := db.Exec(q, answerID)
	if err != nil {
		return err
	}

	q = `delete from answer where aid = $1`

	_, err = db.Exec(q, answerID)
	if err != nil {
		return err
	}

	return nil
}

func ownPublicQuestion(UAT, classID, questionID string) (bool, error) {
	q := `select * from taking as T, question as Q
        where T.pid = $1 and T.cid = $2 and Q.qid = $3 and T.cid = Q.cid and Q.public = true
        limit 1`

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

func ownAnswer(UAT, classID, questionID, answerID string) (bool, error) {
	q := `select * from teaches as T, question as Q, answer as A
		where T.pid = $1 and T.cid = $2 and Q.qid = $3 and A.aid = $4 and T.cid = Q.cid and Q.qid = A.qid
		limit 1`

	res, err := db.Exec(q, UAT, classID, questionID, answerID)
	if err != nil {
		return false, nil
	}

	count, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	return count != 0, nil
}

func validAnswer(answerID, questionID string) (bool, error) {
	q := `select * from answer where aid = $1 and qid = $2 limit 1`

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
