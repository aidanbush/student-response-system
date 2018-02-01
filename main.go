package main

import (
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()
	// class management routes
	r.HandleFunc("/api/v0/classes", handleCreateClass).Methods("POST")
	r.HandleFunc("/api/v0/classes/{classID}", handleJoinClass).Methods("GET")

	// instructor class management
	r.HandleFunc("/api/v0/classes/{classID}", handleCreateQuesion).Methods("POST")
	r.HandleFunc("/api/v0/classes/{classID}/questions/{questionID}", handleDeleteQuesion).Methods("DELETE")
	r.HandleFunc("/api/v0/classes/{classID}/questions/{questionID}", handleAddAnswer).Methods("POST")
	r.HandleFunc("/api/v0/classes/{classID}/questions/{questionID}", handleMakeQuesionPublic).Methods("PUT")

	// student class interaction
	r.HandleFunc("/api/v0/classes/{classID}/questions/", handleGetQuestions).Methods("GET")
	r.HandleFunc("/api/v0/classes/{classID}/questions/{questionID}", handleGetAnswers).Methods("GET")
	r.HandleFunc("/api/v0/classes/{classID}/questions/{questionID}", handleSubmitAnswer).Methods("POST")
	r.HandleFunc("/api/v0/classes/{classID}/questions/{questionID}", handleChangeAnswer).Methods("PUT")

	http.ListenAndServe(":8080", r)
}
