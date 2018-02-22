package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

/* Class management */

func handleCreateClass(w http.ResponseWriter, r *http.Request) {
	class, err := createNewClass(w, r)
	if err != nil {
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

func handleInstrGetQuestions(w http.ResponseWriter, r *http.Request) {
	questions, err := instrGetQuestions(w, r)
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
	http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	return
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

/* Student class interaction */

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
