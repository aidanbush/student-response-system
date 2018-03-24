package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

const questionUIDLen = 5

var errNoQuestion = errors.New("no question exists")

type question struct {
	QuestionTitle  string   `db:"title" json:"question_title"`
	QuestionID     string   `db:"qid" json:"question_id"`
	Public         bool     `db:"public" json:"public"`
	ClassID        string   `db:"cid" json:"class_id"`
	Answers        []answer `json:"answers"`
	SelectedAnswer string   `json:"selected_answer"`
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
		fmt.Println("bad request by: ", cookie.Value)
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

func deleteQuestion(w http.ResponseWriter, r *http.Request) error {
	vars := mux.Vars(r)
	// get classID
	classID, ok := vars["classID"]
	if !ok {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return fmt.Errorf("deleteQuestion: unable to grab classID")
	}

	// get questionID
	questionID, ok := vars["questionID"]
	if !ok {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return fmt.Errorf("deleteQuestion: unable to grab questionID")
	}

	// get UAT
	UAT, err := getUAT(w, r)
	if err != nil {
		fmt.Println("deleteQuestion: ", err)
		if err != errNoUAT {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		return err
	}

	// if teach class
	ok, err = validTeachClass(classID, UAT)
	if err != nil {
		fmt.Println("deleteQuestion: inClass: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return err
	} else if !ok {
		fmt.Println("deleteQuestion: pid ", UAT, "not in class ", classID)
		w.WriteHeader(http.StatusBadRequest)
		return fmt.Errorf("deleteQuestion: inClass: not in class")
	}

	// if question in class
	ok, err = questionInClass(classID, questionID)
	if err != nil {
		fmt.Println("deleteQuestion: inClass: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return err
	} else if !ok {
		fmt.Println("deleteQuestion: qid: ", questionID, " not in class: ", classID)
		w.WriteHeader(http.StatusBadRequest)
		return fmt.Errorf("deleteQuestion: questionInClass: not in class")
	}

	// delete question
	err = deleteQuestionDB(questionID)
	if err != nil {
		fmt.Println("deleteQuestion: deleteQuesitonDB: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return err
	}

	return nil
}

func deleteQuestionDB(questionID string) error {
	q := `delete from answered where qid = $1`

	_, err := db.Exec(q, questionID)
	if err != nil {
		return err
	}

	q = `delete from answer where qid = $1`

	_, err = db.Exec(q, questionID)
	if err != nil {
		return err
	}

	q = `delete from question where qid = $1`

	_, err = db.Exec(q, questionID)
	if err != nil {
		return err
	}

	return nil
}

func validOwnQuestion(questionID, UAT string) (bool, error) {
	q := `select Q.qid from person as P, teaches as T, question as Q
		where P.pid = $1 and P.pid = T.pid and Q.cid = T.cid and Q.qid = $2`

	res, err := db.Exec(q, UAT, questionID)
	if err != nil {
		return false, err
	}

	//count number of responses
	count, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	return count != 0, nil
}

/* Make question for given route public */
func makeQuestionPublic(w http.ResponseWriter, r *http.Request) (question, error) {
	question := question{}
	vars := mux.Vars(r)

	questionID, ok := vars["questionID"]
	if !ok {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, fmt.Errorf("makeQuestionPublic: unable to grab questionID")
	}
	question.QuestionID = questionID

	// validate class and cookie
	// grab cookie
	cookie, err := r.Cookie("UAT")
	if err != nil {
		fmt.Println("error in getting cookie")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, err
	}

	// validate cookie
	if valid, err := validOwnQuestion(question.QuestionID, cookie.Value); err != nil {
		fmt.Println("error in validating question")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, err
	} else if !valid {
		fmt.Println("bad request")
		w.WriteHeader(http.StatusBadRequest)
		return question, fmt.Errorf("makeQuestionPublic: invalid UAT")
	}

	// parse json
	dataDec := json.NewDecoder(r.Body)

	err = dataDec.Decode(&question)
	if err != nil {
		fmt.Println("decode: ", err)
		return question, err
	}

	// update db
	err = updateQuestionDB(question)
	if err != nil {
		fmt.Println("updateQuestionDB: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, err
	}

	//fill up struct
	err = fillQuestion(&question)
	if err != nil {
		fmt.Println("fillQuestion: ", err)
		if err != errNoQuestion {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		return question, err
	}

	return question, nil
}

func instrGetQuestions(w http.ResponseWriter, r *http.Request) ([]question, error) {
	vars := mux.Vars(r)
	questions := []question{}

	// get classID from route
	classID, ok := vars["classID"]
	if !ok {
		fmt.Println("getQuestions: can't find classID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return questions, fmt.Errorf("getQuestions: unable to grab classID")
	}

	// validate class exists
	ok, err := classExists(classID)
	if err != nil {
		fmt.Println("getQuestions: classExists: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return questions, err
	} else if !ok {
		fmt.Println("getQuestions: classID does not exist")
		w.WriteHeader(http.StatusBadRequest)
		return questions, fmt.Errorf("getQuestions: classID does not exist")
	}

	// get UAT
	UAT, err := getUAT(w, r)
	if err != nil {
		fmt.Println("getQuestions: ", err)
		if err != errNoUAT {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		return questions, err
	}

	// validate teaches class
	ok, err = validTeachClass(classID, UAT)
	if err != nil {
		fmt.Println("getQuestions: inClass: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return questions, err
	} else if !ok {
		fmt.Println("getQuestions: pid ", UAT, "not in class ", classID)
		w.WriteHeader(http.StatusBadRequest)
		return questions, fmt.Errorf("getQuestions: inClass: not in class")
	}

	// get questions
	questions, err = retrieveQuestionsInstr(classID)
	if err != nil {
		fmt.Println("getQuestions: retrieveQuestionsUser: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return questions, err
	}

	// return questions
	return questions, nil
}

// add returning selected question
func getQuestions(w http.ResponseWriter, r *http.Request) ([]question, error) {
	// get class
	vars := mux.Vars(r)
	questions := []question{}

	// test if class exists
	classID, ok := vars["classID"]
	if !ok {
		fmt.Println("getQuestions: can't find classID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return questions, fmt.Errorf("getQuestions: unable to grab classID")
	}

	// validate class exists
	ok, err := classExists(classID)
	if err != nil {
		fmt.Println("getQuestions: classExists: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return questions, err
	} else if !ok {
		fmt.Println("getQuestions: classID does not exist")
		w.WriteHeader(http.StatusBadRequest)
		return questions, fmt.Errorf("getQuestions: classID does not exist")
	}

	// get UAT
	UAT, err := getUAT(w, r)
	if err != nil {
		fmt.Println("getQuestions: ", err)
		if err != errNoUAT {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		return questions, err
	}

	// validate in class
	ok, err = inClass(UAT, classID)
	if err != nil {
		fmt.Println("getQuestions: inClass: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return questions, err
	} else if !ok {
		fmt.Println("getQuestions: pid ", UAT, "not in class ", classID)
		w.WriteHeader(http.StatusBadRequest)
		return questions, fmt.Errorf("getQuestions: inClass: not in class")
	}

	// get questions
	questions, err = retrieveQuestionsUser(classID, UAT)
	if err != nil {
		fmt.Println("getQuestions: retrieveQuestionsUser: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return questions, err
	}

	// return questions
	return questions, nil
}

func getAnswers(w http.ResponseWriter, r *http.Request) (question, error) {
	question := question{}
	vars := mux.Vars(r)
	//get classID
	classID, ok := vars["classID"]
	if !ok {
		fmt.Println("getAnswers: can't find classID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, fmt.Errorf("getAnswers: unable to grab classID")
	}

	//get questionID
	question.QuestionID, ok = vars["questionID"]
	if !ok {
		fmt.Println("getAnswers: can't find questionID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, fmt.Errorf("getAnswers: unable to grab classID")
	}

	//get cookie
	UAT, err := getUAT(w, r)
	if err != nil {
		fmt.Println("getAnswers: ", err)
		if err != errNoUAT {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		return question, err
	}

	//check if in class
	ok, err = inClass(UAT, classID)
	if err != nil {
		fmt.Println("getAnswers: inClass: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, err
	} else if !ok {
		fmt.Println("getAnswers: pid ", UAT, " not in class: ", classID)
		w.WriteHeader(http.StatusBadRequest)
		return question, fmt.Errorf("getAnswers: inClass: not in class")
	}

	// if question in class
	ok, err = questionInClass(classID, question.QuestionID)
	if err != nil {
		fmt.Println("getAnswers: inClass: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, err
	} else if !ok {
		fmt.Println("getAnswers: qid: ", question.QuestionID, " not in class: ", classID)
		w.WriteHeader(http.StatusBadRequest)
		return question, fmt.Errorf("getAnswers: questionInClass: not in class")
	}

	//get question w/ answers
	err = fillQuestion(&question)
	if err != nil {
		if err != errNoQuestion {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		return question, err
	}

	//add answer
	question.SelectedAnswer, err = getUserAnswer(question.QuestionID, UAT)
	if err != nil {
		fmt.Println("getAnswers: retrieveQuestionsUser: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return question, err
	}

	//if not public return error
	if !question.Public {
		return question, fmt.Errorf("getAnswers: question not public")
	}

	return question, nil
}

func retrieveQuestionsInstr(classID string) ([]question, error) {
	questions := []question{}

	q := `select * from question where cid = $1`

	rows, err := db.Queryx(q, classID)
	if err != nil {
		return questions, err
	}

	question := question{}
	for rows.Next() {
		err = rows.StructScan(&question)
		if err != nil {
			return questions, err
		}
		// fill w/ answers
		err = fillAnswers(&question)
		if err != nil {
			return questions, err
		}
		// add to slice
		questions = append(questions, question)
	}

	return questions, nil
}

func retrieveQuestionsUser(classID, UAT string) ([]question, error) {
	questions := []question{}

	q := `select * from question where cid = $1 and public = true`

	rows, err := db.Queryx(q, classID)
	if err != nil {
		return questions, err
	}

	question := question{}
	for rows.Next() {
		err = rows.StructScan(&question)
		if err != nil {
			return questions, err
		}
		// fill w/ answers
		err = fillAnswers(&question)
		if err != nil {
			return questions, err
		}
		// get answer
		answer, err := getUserAnswer(question.QuestionID, UAT)
		if err != nil {
			// skip question
			continue
		}
		question.SelectedAnswer = answer
		// add to slice
		questions = append(questions, question)
	}

	return questions, nil
}

func getUserAnswer(questionID, UAT string) (string, error) {
	q := `select aid from answered where qid = $1 and pid = $2`
	aid := ""

	rows, err := db.Queryx(q, questionID, UAT)
	if err != nil {
		return aid, err
	}
	if rows.Next() {
		err := rows.Scan(&aid)
		if err != nil {
			return aid, err
		}
	}
	//if found or not return nil error as
	return aid, nil
}

func fillQuestion(question *question) error {
	q := `select * from question where qid = $1 and public = true`
	rows, err := db.Queryx(q, question.QuestionID)
	if err != nil {
		return err
	}
	if rows.Next() {
		err = rows.StructScan(question)
		if err != nil {
			return err
		}
	} else {
		return errNoQuestion
	}

	//fill up answers
	err = fillAnswers(question)
	if err != nil {
		return err
	}

	return nil
}

func updateQuestionDB(question question) error {
	q := `update question set public = true where qid = $1`

	res, err := db.Exec(q, question.QuestionID)
	if err != nil {
		return err
	}
	if count, err := res.RowsAffected(); err != nil {
		return err
	} else if count != 1 {
		return fmt.Errorf("updateQuestionDB: count != 1")
	}
	return nil
}

func questionInClass(classID, questionID string) (bool, error) {
	q := `select count(*) from question where qid = $1 and cid = $2`

	res, err := db.Exec(q, questionID, classID)
	if err != nil {
		return false, err
	}

	count, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	return count != 0, err
}
