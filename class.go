package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

const classUIDLen = 5

type classReq struct {
	Class  class  `json:"class"`
	Person person `json:"person"`
}

type class struct {
	ClassName string `db:"name" json:"class_name"`
	ClassID   string `db:"cid" json:"class_id"`
}

func validClassReq(request classReq) bool {
	return strings.Compare(request.Class.ClassName, "") != 0
}

func createNewClass(w http.ResponseWriter, r *http.Request) (classReq, error) {
	requestClass := classReq{}
	dataDec := json.NewDecoder(r.Body)

	err := dataDec.Decode(&requestClass)
	if err != nil {
		fmt.Println("decode: ", err)
		return requestClass, err
	}

	// validate request
	if !validClassReq(requestClass) {
		fmt.Println("class: invalid request")
		return requestClass, fmt.Errorf("class: invalid request")
	}

	// log request class
	fmt.Println("request create class\nclass name: ", requestClass.Class.ClassName, "\nperson name: ", requestClass.Person.Name)

	// check if cookie exists for person else create one
	UAT, err := getUAT(w, r)
	if err != nil {
		if err == errNoUAT {
			// new person
			err = createUAT(&requestClass.Person, w)
			if err != nil {
				fmt.Println("createNewPerson: ", err)
				http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
				return requestClass, err
			}
		} else {
			w.WriteHeader(http.StatusBadRequest)
			return requestClass, err
		}
	} else {
		// already exists
		// validate cookie
		if !validUAT(UAT) {
			fmt.Println("createNewClass: invalid cookie")
			w.WriteHeader(http.StatusBadRequest)
			return requestClass, fmt.Errorf("createNewClass: invalid cookie")
		}
		requestClass.Person.Pid = UAT
	}

	// add class to db
	err = insertClassDB(&requestClass.Class)
	if err != nil {
		fmt.Println("insertClassDB: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return requestClass, err
	}

	//make teacher of class
	err = linkTeacher(requestClass)
	if err != nil {
		fmt.Println("cid: ", requestClass.Class.ClassID, "\npid: ", requestClass.Person.Pid)
		fmt.Println("linkTeacher: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return requestClass, err
	}

	return requestClass, nil
}

func insertClassDB(class *class) error {
	// parse body into json object
	q := `insert into class (cid, name) values ($1, $2)`

	// generate random md5 hash
	hash := genMD5(classUIDLen)

	_, err := db.Exec(q, hash, class.ClassName)

	// if err try again
	for err != nil {
		//if not duplicate error
		if !pqslUniqueErr(err) {
			fmt.Println("db", err)
			return err
		}
		fmt.Println("cid hash retry: ", hash, " already exists")
		// generate new random md5 hash
		hash = genMD5(classUIDLen)
		_, err = db.Exec(q, hash, class.ClassName)
	}
	class.ClassID = hash

	return nil
}

func validTeachClass(classID, UAT string) (bool, error) {
	q := `select C.cid from class as C, teaches as T, person as P
        where P.pid = $1 and P.pid = T.pid and T.cid = C.cid and C.cid = $2`
	//run query
	res, err := db.Exec(q, UAT, classID)
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

func joinClass(w http.ResponseWriter, r *http.Request) (classReq, error) {
	// get name
	requestClass := classReq{}

	// get class id
	vars := mux.Vars(r)

	// test if class exists
	classID, ok := vars["classID"]
	if !ok {
		fmt.Println("joinClass: can't find classID")
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return requestClass, fmt.Errorf("createNewQuestion: unable to grab classID")
	}

	// set classID
	requestClass.Class.ClassID = classID

	// test if class exists
	exist, err := classExists(classID)
	if err != nil {
		fmt.Println("joinClass: classExists: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return requestClass, err
	} else if !exist {
		fmt.Println("joinClass: classID does not exist")
		w.WriteHeader(http.StatusBadRequest)
		return requestClass, fmt.Errorf("err join class: invalid class ID")
	}

	// test if have UAT
	UAT, err := getUAT(w, r)
	if err != nil {
		fmt.Println("joinClass: new user")
		// if errNoUAT create one
		if err != errNoUAT {
			fmt.Println("joinClass: getUAT: ", err)
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return requestClass, err
		}
		// get name from request
		err = getNameFromClassReq(&requestClass, r)
		if err != nil {
			fmt.Println("joinClass: getNameFromClassReq", err)
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return requestClass, err
		}
		// create UAT
		err = createUAT(&requestClass.Person, w)
		if err != nil {
			fmt.Println("joinClass: createUAT: ", err)
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return requestClass, err
		}
	} else {
		fmt.Println("joinClass: existing user")
		// set persons pid
		requestClass.Person.Pid = UAT
		//test if pid exists
		ok, err := validPid(requestClass.Person.Pid)
		if err != nil {
			fmt.Println("joinClass: validPid: ", err)
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return requestClass, err
		} else if !ok {
			fmt.Println("joinClass: pid does not exist")
			w.WriteHeader(http.StatusBadRequest)
			return requestClass, fmt.Errorf("err join class: invalid UAT")
		}
		// load name from db
		err = getName(&requestClass.Person)
		if err != nil {
			fmt.Println("joinClass: getName: ", err)
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return requestClass, err
		}
	}

	// join class
	fmt.Printf("%#v\n", requestClass)
	err = linkStudent(requestClass)
	if err != nil {
		fmt.Println("joinClass: linkStudent: ", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return requestClass, err
	}

	// fill in class
	err = fillClass(&requestClass.Class)
	if err != nil {
		fmt.Println("joinClass: fillClass: ", err)
		return requestClass, err
	}

	// return class object
	return requestClass, nil
}

func getInstructorClasses(w http.ResponseWriter, r *http.Request) ([]class, error) {
	UAT, err := getUAT(w, r)
	if err != nil {
		fmt.Println("getInstructorClasses:", err)
		if err == errNoUAT || err == errInvalidUAT {
			w.WriteHeader(http.StatusBadRequest)
		} else {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
		return []class{}, err
	}

	classList, err := getInstructorClassListDB(UAT)
	if err != nil {
		fmt.Println("getInstructorClasses:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return classList, err
	}

	return classList, nil
}

func getStudentClasses(w http.ResponseWriter, r *http.Request) ([]class, error) {
	UAT, err := getUAT(w, r)
	if err != nil {
		fmt.Println("getStudentClasses:", err)
		if err == errNoUAT || err == errInvalidUAT {
			w.WriteHeader(http.StatusBadRequest)
		} else {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
		return []class{}, err
	}

	classList, err := getStudentClassListBD(UAT)
	if err != nil {
		fmt.Println("getStudentClasses:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return classList, err
	}

	return classList, nil
}

func classExists(classID string) (bool, error) {
	q := `select * from class as C where C.cid = $1`

	res, err := db.Exec(q, classID)
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

func fillClass(class *class) error {
	q := `select * from class where cid = $1`

	rows, err := db.Queryx(q, class.ClassID)
	if err != nil {
		return err
	}
	if rows.Next() {
		err = rows.StructScan(class)
		if err != nil {
			return err
		}
	} else {
		return fmt.Errorf("fillClass: no rows")
	}

	return nil
}

func getInstructorClassListDB(UAT string) ([]class, error) {
	q := `select C.cid, C.name from class as C, teaches as T
		where T.pid = $1 and T.cid = C.cid`
	classList := []class{}

	rows, err := db.Queryx(q, UAT)
	if err != nil {
		return classList, err
	}

	for rows.Next() {
		class := class{}

		err = rows.StructScan(&class)
		if err != nil {
			return classList, err
		}

		classList = append(classList, class)
	}

	return classList, nil
}

func getStudentClassListBD(UAT string) ([]class, error) {
	q := `select C.cid, C.name from class as C, taking as T
		where T.pid = $1 and T.cid = C.cid`
	classList := []class{}

	rows, err := db.Queryx(q, UAT)
	if err != nil {
		return classList, err
	}

	for rows.Next() {
		class := class{}

		err = rows.StructScan(&class)
		if err != nil {
			return classList, err
		}

		classList = append(classList, class)
	}

	return classList, nil
}
