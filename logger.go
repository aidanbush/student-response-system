package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"time"
)

type logResponseWriter struct {
	http.ResponseWriter
	status int
}

type connectLog struct {
	Route      string    `json:"route"`
	Method     string    `json:"method"`
	ReturnCode int       `json:"returnCode"`
	UAT        string    `json:"uat"`
	TimeStamp  time.Time `json:"time"`
	IP         string    `json:"ip"`
	Error      error     `json:"error"`
}

var fileWriter io.Writer

const logName = "log-file"

func init() {
	var err error
	fileWriter, err = os.OpenFile(logName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Fprintf(os.Stderr, "unable to use file %s, using stderr instead\n", logName)
		fileWriter = os.Stderr
	}
}

func (w *logResponseWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func loggingMiddleWare(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logW := logResponseWriter{w, 200}

		next.ServeHTTP(&logW, r)

		log := connectLog{
			Route:      r.URL.String(),
			Method:     r.Method,
			ReturnCode: logW.status,
			TimeStamp:  time.Now(),
		}

		if UAT, err := getUAT(&logW, r); err == nil {
			log.UAT = UAT
		}

		if ip, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
			log.IP = ip
		}

		jsonOut, err := json.Marshal(log)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Json marshal: ", err)
			return
		}

		fmt.Fprintf(fileWriter, "%s\n", string(jsonOut))
	})
}
