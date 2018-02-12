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
		fmt.Println("pid hash retry: ", hash, " already exists")
		//if not duplicate error
		if !pqslUniqueErr(err) {
			fmt.Println("db", err)
			return err
		}
		fmt.Println("pid hash retry: ", hash, " already exists")
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

func linkStudent(class classReq) error {
	q := `insert into taking (pid, cid) values ($1, $2)`

	fmt.Println("linking pid: ", class.Person.Pid, " with cid: ", class.Class.ClassID)

	_, err := db.Exec(q, class.Person.Pid, class.Class.ClassID)
	if err != nil {
		return err
	}
	return nil
}

func validPid(pid string) (bool, error) {
	q := `select * from person as P where P.pid = $1`

	res, err := db.Exec(q, pid)
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

func getName(person *person) error {
	q := `select P.name from person as P where P.pid = $1`

	rows, err := db.Queryx(q, person.Pid)
	if err != nil {
		return err
	}
	if rows.Next() {
		err = rows.StructScan(person)
		if err != nil {
			return err
		}
	} else {
		return fmt.Errorf("getName: no rows")
	}

	return nil
}

func inClass(pid, cid string) (bool, error) {
	q := `select * from taking where pid = $1 and cid = $2`

	res, err := db.Exec(q, pid, cid)
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
