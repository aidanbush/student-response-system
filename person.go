package main

import "fmt"

type person struct {
	Name string `db:"name" json:"name"`
	Pid  string `db:"pid" json:"-"`
}

const personUATLen = 10

func createNewPerson(person *person) error {
	q := `insert into person (pid, name) values ($1, $2)`

	hash := genMD5(personUATLen)

	_, err := db.Exec(q, hash, person.Name)

	// if err try again
	for err != nil {
		fmt.Println("retry: ", hash, " already exists")
		//if not duplicate error
		if !pqslUniqueErr(err) {
			fmt.Println("db", err)
			return err
		}
		// generate new random md5 hash
		hash = genMD5(personUATLen)
		_, err = db.Exec(q, hash, person.Name)
	}
	person.Pid = hash
	return nil
}

func linkTeacher(class classReq) error {
	q := `insert into teaches (pid, cid) values ($1, $2)`

	_, err := db.Exec(q, class.Person.Pid, class.Class.ClassID)
	if err != nil {
		return err
	}
	return nil
}
