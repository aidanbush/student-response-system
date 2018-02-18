package main

import (
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

const connStr = "user=postgres dbname=nhlapp sslmode=disable"

var db *sqlx.DB

func init() {
	//seed random
	rand.Seed(time.Now().UTC().UnixNano())
}

func main() {
	connectStr := "dbname=student_assesment user=postgres host=localhost port=5432 sslmode=disable"

	var err error

	db, err = sqlx.Connect("postgres", connectStr)
	if err != nil {
		log.Fatal(err)
		return
	}
	defer db.Close()

	r := mux.NewRouter()
	// class management routes
	r.HandleFunc("/api/v0/classes", handleCreateClass).Methods("POST")
	r.HandleFunc("/api/v0/classes/{classID}", handleJoinClass).Methods("POST")

	// instructor class management
	r.HandleFunc("/api/v0/instructors/classes/{classID}/questions", handleCreateQuesion).Methods("POST")
	//instructor get questions
	r.HandleFunc("/api/v0/instructors/classes/{classID}/questions/{questionID}", handleDeleteQuesion).Methods("DELETE")
	r.HandleFunc("/api/v0/instructors/classes/{classID}/questions/{questionID}", handleAddAnswer).Methods("POST")
	r.HandleFunc("/api/v0/instructors/classes/{classID}/questions/{questionID}", handleMakeQuesionPublic).Methods("PUT")
	// add view submitted answers

	// student class interaction
	r.HandleFunc("/api/v0/classes/{classID}/questions", handleGetQuestions).Methods("GET")
	r.HandleFunc("/api/v0/classes/{classID}/questions/{questionID}", handleGetAnswers).Methods("GET") //change to return current answer
	r.HandleFunc("/api/v0/classes/{classID}/questions/{questionID}", handleSubmitAnswer).Methods("POST")
	r.HandleFunc("/api/v0/classes/{classID}/questions/{questionID}", handleChangeAnswer).Methods("PUT")

	http.ListenAndServe(":8080", r)
}
