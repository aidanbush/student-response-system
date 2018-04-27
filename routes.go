package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

/* person routes */
func handleGetSelf(w http.ResponseWriter, r *http.Request) {
	person, err := getSelf(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(person)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
}

/* Class management */

func handleCreateClass(w http.ResponseWriter, r *http.Request) {
	class, err := createNewClass(w, r)
	if err != nil {
		fmt.Println("createNewClass: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	jsonOut, err := json.Marshal(class)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
	return
}

func handleJoinClass(w http.ResponseWriter, r *http.Request) {
	class, err := joinClass(w, r)
	if err != nil {
		fmt.Println("joinClass: ", err)
		return
	}

	jsonOut, err := json.Marshal(class)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
	return
}

/* Instructor class management */

func handleGetInstructorClasses(w http.ResponseWriter, r *http.Request) {
	classList, err := getInstructorClasses(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(classList)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
}

func handleInstrGetQuestions(w http.ResponseWriter, r *http.Request) {
	questions, err := instrGetQuestions(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(questions)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
	return
}

func handleCreateQuesion(w http.ResponseWriter, r *http.Request) {
	question, err := createNewQuestion(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(question)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
	return
}

func handleDeleteQuesion(w http.ResponseWriter, r *http.Request) {
	err := deleteQuestion(w, r)
	if err != nil {
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func handleAddAnswer(w http.ResponseWriter, r *http.Request) {
	answer, err := createNewAnswer(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(answer)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
	return
}

func handleMakeQuesionPublic(w http.ResponseWriter, r *http.Request) {
	question, err := makeQuestionPublic(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(question)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
	return
}

func handleGetQuesionAnswers(w http.ResponseWriter, r *http.Request) {
	answers, err := getSubmittedAnswers(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(answers)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
}

func handleDeleteAnswer(w http.ResponseWriter, r *http.Request) {
	err := deleteAnswer(w, r)
	if err != nil {
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

/* Student class interaction */

func handleStudentGetClasses(w http.ResponseWriter, r *http.Request) {
	classList, err := getStudentClasses(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(classList)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
}

func handleGetQuestions(w http.ResponseWriter, r *http.Request) {
	questions, err := getQuestions(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(questions)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
	return
}

func handleGetAnswers(w http.ResponseWriter, r *http.Request) {
	question, err := getAnswers(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(question)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
	return
}

func handleSubmitAnswer(w http.ResponseWriter, r *http.Request) {
	answer, err := submitAnswer(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(answer)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
	return
}

func handleChangeAnswer(w http.ResponseWriter, r *http.Request) {
	answer, err := changeAnswer(w, r)
	if err != nil {
		return
	}

	jsonOut, err := json.Marshal(answer)
	if err != nil {
		fmt.Println("json marshal: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "%s\n", string(jsonOut))
	return
}
