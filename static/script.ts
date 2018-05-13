/* types */
type person = {
    name: string;
};

type answer = {
    answer_id: string;
    answer_text: string;
    question_id: string;
};

type question = {
    question_title: string;
    question_id: string;
    public:boolean;
    class_id: string;
    answers: answer[];
    selected_answer: string;
};

type Class = {
    class_name: string;
    class_id: string;
    questions: question[];
};

enum pageEnum {
    login,
    instrView,
    instrList,
    StudentView,
    StudentList,
};

abstract class view {
    static show(){}
    static hide(){}
}

/* Main class */
class main {

    static username: string;
    static teaches: Class[];
    static takes: Class[];
    static classList: Map<string, Class>;
    static currentClass: string;
    static currentPage: pageEnum;

    static setup() {
        this.setupListeners();

        this.resetUser();
        this.currentPage = pageEnum.login;

        loginPage.show();

        this.getName();
    }

    static setupListeners() {
        header.setup();
        loginPage.setup();

        studentClassPage.setup();
        instructorClassPage.setup();

        instructorClassSelection.setup()
        studentClassSelection.setup()
    }

    static getQuestion(cid: string, qid: string): question | undefined {
        let Class: Class | undefined = main.classList.get(cid);
        if (Class === undefined) {
            return undefined;
        }
        return Class.questions.find(question => question.question_id === qid);
    }

    static getName() {
        if (document.cookie === "") {
            return;
        }

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let person: person = JSON.parse(req.responseText);
                main.username = person.name;
                loginPage.refresh();
                return;
            }
        };

        req.open("GET", `/api/v0/person`);
        req.send();
    }

    static resetUser() {
        this.username = '';
        this.teaches = [];
        this.takes = [];
        this.classList = new Map<string, Class>();
        this.currentClass = "";
    }

    static logout() {
        this.deleteCookie();
        this.resetUser();
    }

    static deleteCookie() {
        document.cookie = 'UAT=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    static hasCookie(): boolean {
        return document.cookie.indexOf('UAT=') !== -1;
    }

    static switchView(newPage: pageEnum) {
        switch (this.currentPage) {
            case pageEnum.login:
                loginPage.hide();
                break;
            case pageEnum.instrView:
                instructorClassPage.hide();
                break;
            case pageEnum.instrList:
                instructorClassSelection.hide();
                break;
            case pageEnum.StudentView:
                studentClassPage.hide();
                break;
            case pageEnum.StudentList:
                studentClassSelection.hide();
                break;
            default:
                console.log("hide default");
                return;
        }

        this.currentPage = newPage;

        switch (newPage) {
            case pageEnum.login:
                loginPage.show();
                break;
            case pageEnum.instrView:
                instructorClassPage.show();
                break;
            case pageEnum.instrList:
                instructorClassSelection.show();
                break;
            case pageEnum.StudentView:
                studentClassPage.show();
                break;
            case pageEnum.StudentList:
                studentClassSelection.show();
                break;
            default:
                console.log("show default");
                return;
        }
    }
}

class header implements view {
    static setup() {
        this.setupListeners();
    }

    static setupListeners() {
        (<HTMLElement>document.querySelector("#header_logout_btn")).onclick = this.logoutClick;
        (<HTMLElement>document.querySelector("#header_join_create_btn")).onclick = this.joinCreateClick;
        (<HTMLElement>document.querySelector("#header_student_class_list_btn")).onclick = this.studentListClick;
        (<HTMLElement>document.querySelector("#header_instr_class_list_btn")).onclick = this.instrListClick
    }

    static show() {
        if (main.currentPage !== pageEnum.login) {
            (<HTMLElement>document.querySelector("#header_join_create_btn")).classList.remove("hidden");
        }
        if (main.currentPage !== pageEnum.instrList && main.teaches.length !== 0) {
            (<HTMLElement>document.querySelector("#header_instr_class_list_btn")).classList.remove("hidden");
        }
        if (main.currentPage !== pageEnum.StudentList && main.takes.length !== 0) {
            (<HTMLElement>document.querySelector("#header_student_class_list_btn")).classList.remove("hidden");
        }
        if (main.hasCookie()) {
            (<HTMLElement>document.querySelector("#header_logout_btn")).classList.remove("hidden");
        }
    }

    static hide() {
        (<HTMLElement>document.querySelector("#header_join_create_btn")).classList.add("hidden");
        (<HTMLElement>document.querySelector("#header_instr_class_list_btn")).classList.add("hidden");
        (<HTMLElement>document.querySelector("#header_student_class_list_btn")).classList.add("hidden");
        (<HTMLElement>document.querySelector("#header_logout_btn")).classList.add("hidden");
    }

    static logoutClick() {
        main.logout();
        main.switchView(pageEnum.login);
    }

    static joinCreateClick() {
        main.switchView(pageEnum.login);
    }

    static studentListClick() {
        main.switchView(pageEnum.StudentList);
    }

    static instrListClick() {
        main.switchView(pageEnum.instrList);
    }
}

/* login page */
type createRequest = {
    class: Class;
    person: person;
};

type joinRequest = {
    person: person;
};

class loginPage implements view {

    static setup() {
        this.setupListeners();
    }

    static setupListeners() {
        (<HTMLElement>document.querySelector("#join_heading")).onclick = this.joinClick;
        (<HTMLElement>document.querySelector("#create_heading")).onclick = this.createClick;
        (<HTMLButtonElement>document.querySelector("#join_class_btn")).onclick = this.joinClassBtnClick;
        (<HTMLButtonElement>document.querySelector("#new_class_btn")).onclick = this.createClassBtnClick;
        (<HTMLElement>document.querySelector("#class_list_heading")).onclick = this.listClick;
        (<HTMLButtonElement>document.querySelector("#instr_class_list_button")).onclick = this.instrListClick;
        (<HTMLButtonElement>document.querySelector("#student_class_list_button")).onclick = this.studentListClick;
    }

    static show() {
        (<HTMLElement>document.querySelector("#new")).classList.remove("hidden");
        if (main.hasCookie()) {
            (<HTMLElement>document.querySelector("#class_list_btns")).classList.remove("hidden");
        }
        // fix
        if (main.username === '') {
            (<HTMLElement>document.querySelector("#student_name")).classList.remove("hidden");
            (<HTMLElement>document.querySelector("#instructor_name")).classList.remove("hidden");
        }
        this.setHeader();

        header.show();
    }

    static hide() {
        this.hideIDs();

        this.clearInputs();

        header.hide();
    }

    static hideIDs() {
        (<HTMLElement>document.querySelector("#new")).classList.add("hidden");
        (<HTMLElement>document.querySelector("#join")).classList.add("hidden");
        (<HTMLElement>document.querySelector("#create")).classList.add("hidden");

        (<HTMLElement>document.querySelector("#class_list_btns")).classList.add("hidden");
        (<HTMLElement>document.querySelector("#list_classes")).classList.add("hidden");

        (<HTMLElement>document.querySelector("#student_name")).classList.add("hidden");
        (<HTMLElement>document.querySelector("#instructor_name")).classList.add("hidden");

        (<HTMLElement>document.querySelector("#join_input_error")).classList.add("hidden");
        (<HTMLElement>document.querySelector("#new_input_error")).classList.add("hidden");
    }

    static refresh() {
        this.hideIDs();
        this.show();
    }

    static clearInputs() {
        (<HTMLInputElement>document.querySelector("#join_class_id")).value = '';
        (<HTMLInputElement>document.querySelector("#student_name_input")).value = '';

        (<HTMLInputElement>document.querySelector("#new_class_name")).value = '';
        (<HTMLInputElement>document.querySelector("#instructor_name_input")).value = '';
    }

    static joinClick() {
        let joinDiv: HTMLElement = <HTMLElement>document.querySelector("#join");
        if (joinDiv.classList.contains("hidden")) {
            joinDiv.classList.remove("hidden");
        } else {
            joinDiv.classList.add("hidden");
        }
        return;
    }

    /* listeners */
    static createClick() {
        let createDiv: HTMLElement = <HTMLElement>document.querySelector("#create");
        if (createDiv.classList.contains("hidden")) {
            createDiv.classList.remove("hidden");
        } else {
            createDiv.classList.add("hidden");
        }
        return;
    }

    static listClick() {
        let listDiv: HTMLElement = <HTMLElement>document.querySelector("#list_classes");
        if (listDiv.classList.contains("hidden")) {
            listDiv.classList.remove("hidden");
        } else {
            listDiv.classList.add("hidden");
        }
    }

    static joinClassBtnClick() {
        let classIDInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#join_class_id");
        if (classIDInput.value === "") {
            loginPage.joinClassReqFail("Error: Requires class ID");
            return;
        }

        let classID = classIDInput.value;

        let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#student_name_input");
        if (nameInput.value === "" && main.username === "") {
            loginPage.joinClassReqFail("Error: Requires your name");
            return;
        } else if (main.username === "") {
            main.username = nameInput.value;
        }

        let reqJSON: joinRequest = {
            person: {
                name: main.username,
            },
        };

        loginPage.joinClassRequest(classID, reqJSON);
    }

    static createClassBtnClick() {
        let classNameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#new_class_name");
        if (classNameInput.value === "") {
            loginPage.createClassReqFail("Error: Requires class name");
            return;
        }

        let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#instructor_name_input");
        if (nameInput.value === "" && main.username === "") {
            loginPage.createClassReqFail("Error: Requires your name");
            return;
        } else if (main.username === "") {
            main.username = nameInput.value;
        }

        let reqJSON: createRequest = {
            person: {
                name: main.username,
            },
            class: {
                class_name: classNameInput.value,
                class_id: "",
                questions: [],
            },
        };

        loginPage.createClassRequest(reqJSON);
    }

    static studentListClick() {
        main.switchView(pageEnum.StudentList);
    }

    static instrListClick() {
        main.switchView(pageEnum.instrList);
    }

    /* login failed request handlers */
    static joinClassReqFail(error: string) {
        (<HTMLElement>document.querySelector("#join_input_error")).classList.remove("hidden");
        (<HTMLElement>document.querySelector("#join_input_error")).innerHTML = error;

        console.log("join class error: ", error);
    }

    static createClassReqFail(error: string) {
        (<HTMLElement>document.querySelector("#new_input_error")).classList.remove("hidden");
        (<HTMLElement>document.querySelector("#new_input_error")).innerHTML = error;

        console.log("create class error: ", error);
    }

    /* API Requests */
    static joinClassRequest(classID: string, reqJSON: joinRequest) {
        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let res: createRequest = JSON.parse(req.responseText);

                main.classList.set(res.class.class_id, res.class);
                main.currentClass = res.class.class_id;

                main.switchView(pageEnum.StudentView);
                return;
            }
            loginPage.joinClassReqFail("Failed to join class");
        };

        req.onerror = function () {
            loginPage.joinClassReqFail("Error: Can't connect to server");
        };

        req.onabort = function () {
            loginPage.joinClassReqFail("Error: Can't connect to server");
        };

        req.open("POST", `/api/v0/classes/${encodeURI(classID)}`);
        req.send(JSON.stringify(reqJSON));
    }

    static createClassRequest(reqJSON: createRequest) {
        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let res: createRequest = JSON.parse(req.responseText);

                main.classList.set(res.class.class_id, res.class);
                main.currentClass = res.class.class_id;

                main.switchView(pageEnum.instrView);
                return;
            }
            loginPage.createClassReqFail("Error: Failed to create class");
        };

        req.onerror = function () {
            loginPage.createClassReqFail("Error: Can't connect to server");
        };

        req.onabort = function () {
            loginPage.createClassReqFail("Error: Can't connect to server");
        };

        req.open("POST", `/api/v0/classes`);
        req.send(JSON.stringify(reqJSON));
    }

    /* view updating */
    static setHeader() {
        if (main.username === "") {
            this.setDefaultHeader();
        } else {
            this.setNameHeader();
        }
    }

    static setNameHeader() {
        if (main.username === "") {
            return
        }
        (<HTMLElement>document.querySelector("#login_header")).innerHTML = `Hello ${main.username}`;
    }

    static setDefaultHeader() {
        (<HTMLElement>document.querySelector("#login_header")).innerHTML = `Login`;
    }
}

/* Instructor Pages */
type response = {
    answer_id: string;
    count: number;
}

function displayInstructorPage() {
    (<HTMLElement>document.querySelector("#instructor_display_name")).innerHTML = `Instructor: ${main.username}`;
    (<HTMLElement>document.querySelector("#instructor_page")).classList.remove("hidden");
}

function hideInstructorPage() {
    (<HTMLElement>document.querySelector("#instructor_page")).classList.add("hidden");
}

class instructorClassPage implements view {

    static questionTemplateFunction: doT.RenderFunction;

    static setup() {
        let template: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page_template");

        this.questionTemplateFunction = doT.template(template.innerHTML);
    }

    static setupListeners() {
        this.questionListeners();

        this.answerListeners();

        let createQuestion: HTMLElement = <HTMLElement>document.querySelector("#instr_new_question_btn");
        createQuestion.onclick = this.createQuestionClick;
    }

    static questionListeners() {
        let deleteQuestions = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionDel_']");
        for (var i = 0; i < deleteQuestions.length; ++i) {
            deleteQuestions[i].onclick = this.deleteQuestionClick;
        }

        let addAnswers = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionAdd_']");
        for (var i = 0; i < addAnswers.length; ++i) {
            addAnswers[i].onclick = this.addAnswerClick;
        }

        let questionsPublic = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionPub_']");
        for (var i = 0; i < questionsPublic.length; ++i) {
            questionsPublic[i].onclick = this.publicQuestionClick;
        }

        let questionsResults = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionRes_']");
        for (var i = 0; i < questionsResults.length; ++i) {
            questionsResults[i].onclick = this.questionResultsClick;
        }
    }

    static answerListeners() {
        let deleteAnswers = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='ansDel_']");
        for (var i = 0; i < deleteAnswers.length; ++i) {
            deleteAnswers[i].onclick = this.deleteAnswerClick;
        }
    }

    static show() {
        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let res: question[] = JSON.parse(req.responseText);

                (<Class>main.classList.get(main.currentClass)).questions = res;

                instructorClassPage.displayQuestions();
                return;
            }
            instructorClassPage.requestClassError("Error: Failed to create class");
        };

        req.onerror = function () {
            instructorClassPage.requestClassError("Error: Can't connect to server");
        };

        req.onabort = function () {
            instructorClassPage.requestClassError("Error: Can't connect to server");
        };

        req.open("GET", `/api/v0/instructors/classes/${encodeURI(main.currentClass)}/questions`);
        req.send();

        displayInstructorPage();

        let classDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page");
        classDiv.classList.remove("hidden");

        header.show();
    }

    static hide() {
        hideInstructorPage();

        (<HTMLElement>document.querySelector("#instructor_class_page")).innerHTML = "";
        (<HTMLElement>document.querySelector("#instructor_class_page")).classList.add("hidden");

        header.hide();
    }

    static displayQuestions() {
        let classPageDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page");
        classPageDiv.innerHTML = this.questionTemplateFunction(main.classList.get(main.currentClass));

        this.setupListeners();
    }

    /* view updating */
    static instructorViewAddQuestion(question: question) {
        this.displayQuestions();
    }

    static instructorViewUpdateQuestion(question: question) {
        this.displayQuestions();
    }

    static instructorViewAddAnswer(answer: answer) {
        this.displayQuestions();
    }

    static instructorViewQuestionResults(response: response) {
        /* draw results */
    }

    static instructorViewDeleteQuestion(qid: string) {
        this.displayQuestions();
    }

    /* listeners */
    static createQuestionClick() {
        let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#instr_new_question_name");

        if (nameInput.value === "") {
            instructorClassPage.questionError("Error: question Requires name");
            return;
        }

        let reqJSON: question = {
            question_title: nameInput.value,
            question_id: "",
            public: false,
            class_id: main.currentClass,
            answers: [],
            selected_answer: "",
        };

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let res: question = JSON.parse(req.responseText);
                (<Class>main.classList.get(main.currentClass)).questions.push(res);

                instructorClassPage.instructorViewAddQuestion(res);
                return;
            }
            instructorClassPage.questionError("Error: Failed to create question");
        };

        req.onerror = function () {
            instructorClassPage.questionError("Error: Can't connect to server");
        };

        req.onabort = function () {
            instructorClassPage.questionError("Error: Can't connect to server");
        };

        req.open("POST", `/api/v0/instructors/classes/${encodeURI(main.currentClass)}/questions`);
        req.send(JSON.stringify(reqJSON));
    }

    static deleteQuestionClick(event: Event) {
        let qid: string = (<HTMLElement>event.target).id.split("_")[1]

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 204) {
                let Class: Class = <Class>main.classList.get(main.currentClass);
                Class.questions = Class.questions.filter(question => question.question_id !== qid);

                instructorClassPage.instructorViewDeleteQuestion(qid);
                return;
            }
            instructorClassPage.deleteQuestionError(qid, "Error: Can't connect to server");
        };

        req.onerror = function () {
            instructorClassPage.deleteQuestionError(qid, "Error: Can't connect to server");
        };

        req.onabort = function () {
            instructorClassPage.deleteQuestionError(qid, "Error: Can't connect to server");
        };

        req.open("DELETE", `/api/v0/instructors/classes/${encodeURI(main.currentClass)}/questions/${encodeURI(qid)}`);
        req.send();
    }

    static addAnswerClick(event: Event) {
        let qid: string = (<HTMLElement>event.target).id.split("_")[1];

        let answerText: string = (<HTMLInputElement>document.querySelector(`#instrQuestionAddText_${encodeURI(qid)}`)).value;

        if (answerText === "") {
            instructorClassPage.addAnswerError(qid, "Error: Enter an answer");
            return;
        }

        let reqJSON: answer = {
            answer_id: "",
            answer_text: answerText,
            question_id: "",
        };

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let res: answer = JSON.parse(req.responseText);
                (<question>(<Class>main.classList.get(main.currentClass)).questions.find(question => question.question_id === qid)).answers.push(res);

                instructorClassPage.instructorViewAddAnswer(res);
                return;
            }
            instructorClassPage.addAnswerError(qid, "Error: Can't connect to server");
        };

        req.onerror = function () {
            instructorClassPage.addAnswerError(qid, "Error: Can't connect to server");
        };

        req.onabort = function () {
            instructorClassPage.addAnswerError(qid, "Error: Can't connect to server");
        };

        req.open("POST", `/api/v0/instructors/classes/${encodeURI(main.currentClass)}/questions/${encodeURI(qid)}`);
        req.send(JSON.stringify(reqJSON));
    }

    static publicQuestionClick(event: Event) {
        let qid: string = (<HTMLElement>event.target).id.split("_")[1]

        let reqJSON: question = Object.assign({}, main.getQuestion(main.currentClass, qid));
        reqJSON.public = true;

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let question: question = main.getQuestion(main.currentClass, qid);
                question.public = true;

                instructorClassPage.instructorViewUpdateQuestion(question);
                return;
            }
            instructorClassPage.publicQuestionError(qid, "Error: Can't connect to server");
        };

        req.onerror = function () {
            instructorClassPage.publicQuestionError(qid, "Error: Can't connect to server");
        };

        req.onabort = function () {
            instructorClassPage.publicQuestionError(qid, "Error: Can't connect to server");
        };

        req.open("PUT", `/api/v0/instructors/classes/${encodeURI(main.currentClass)}/questions/${encodeURI(qid)}`);
        req.send(JSON.stringify(reqJSON));
    }

    static questionResultsClick(event: Event) {
        let qid: string = (<HTMLElement>event.target).id.split("_")[1];
        console.log("results question: ", qid);

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let res: response = JSON.parse(req.responseText);
                instructorClassPage.instructorViewQuestionResults(res);
                return;
            }
            instructorClassPage.retrieveAnswersError(qid, "Error: Error in retrieving results");
        };

        req.onerror = function () {
            instructorClassPage.retrieveAnswersError(qid, "Error: Can't connect to server");
        };

        req.onabort = function () {
            instructorClassPage.retrieveAnswersError(qid, "Error: Can't connect to server");
        };

        req.open("GET", `/api/v0/instructors/classes/${encodeURI(main.currentClass)}/questions/${encodeURI(qid)}`);
        req.send();
    }

    static deleteAnswerClick(event: Event) {
        let [, qid, aid]: string[] = (<HTMLElement>event.target).id.split("_");

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 204) {
                let question: question = main.getQuestion(main.currentClass, qid);
                question.answers = question.answers.filter(a => a.answer_id !== aid);

                instructorClassPage.instructorViewUpdateQuestion(<question>main.getQuestion(main.currentClass, qid));
                return;
            }
            instructorClassPage.deleteAnswerError(qid, aid, "Error: Can't connect to server");
        };

        req.onerror = function () {
            instructorClassPage.deleteAnswerError(qid, aid, "Error: Can't connect to server");
        };

        req.onabort = function () {
            instructorClassPage.deleteAnswerError(qid, aid, "Error: Can't connect to server");
        };

        req.open("DELETE", `/api/v0/instructors/classes/${encodeURI(main.currentClass)}/questions/${encodeURI(qid)}/answers/${encodeURI(aid)}`);
        req.send();
    }

    /* failed request handlers */
    static requestClassError(error: string) {
        console.log("Class error: ", error);
    }

    static questionError(error: string) {
        console.log("create question error: ", error);
    }

    static addAnswerError(qid: string, error: string) {
        console.log("add answer error: ", error);
    }

    static deleteQuestionError(qid: string, error: string) {
        console.log("delete question error: ", error);
    }

    static publicQuestionError(qid: string, error: string) {
        console.log("public question error: ", error);
    }

    static deleteAnswerError(qid: string, aid: string, error: string) {
        console.log("delete answer error: ", error);
    }

    static retrieveAnswersError(qid: string, error: string) {
        console.log("retrieve answers error: ", error);
    }
}

class instructorClassSelection implements view {

    static classTemplateFunction: doT.RenderFunction;

    static setup() {
        let template: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_list_template");
        this.classTemplateFunction = doT.template(template.innerHTML);
    }

    static setupListeners() {
        (<HTMLButtonElement>document.querySelector("#instr_class_list_refresh_btn")).onclick = this.refreshClassesClick;

        let classList = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrSwitchClass_']");
        for (var i = 0; i < classList.length; ++i) {
            classList[i].onclick = this.switchClassClick;
        }
    }

    static show() {
        header.show();
        displayInstructorPage();

        let selectionDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_selection_page");
        selectionDiv.classList.remove("hidden");

        if (main.teaches.length == 0) {
            this.getClassList();
        } else {
            instructorClassSelection.showClasses();
        }
    }

    static hide() {
        header.hide();
        hideInstructorPage();

        (<HTMLElement>document.querySelector("#instr_class_list")).innerHTML = "";
        (<HTMLElement>document.querySelector("#instructor_class_selection_page")).classList.add("hidden");
    }

    static refreshClassesClick() {
        instructorClassSelection.getClassList();
    }

    static switchClassClick(event: Event) {
        let cid: string = (<HTMLElement>event.target).id.split("_")[1];

        main.currentClass = cid;
        main.switchView(pageEnum.instrView);
    }

    static showClasses() {
        let classListDiv: HTMLElement = <HTMLElement>document.querySelector("#instr_class_list");
        classListDiv.innerHTML = this.classTemplateFunction(main.teaches);

        this.setupListeners();
    }

    /* api requests */
    static getClassList() {
        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let classList: Class[] = JSON.parse(req.responseText);
                main.teaches = classList;

                for (var i = 0; i < classList.length; i++) {
                    if (main.classList.get(classList[i].class_id) === undefined) {
                        let newClass: Class = {
                            class_name: classList[i].class_name,
                            class_id: classList[i].class_id,
                            questions: []
                        };
                        main.classList.set(newClass.class_id, newClass);
                    }
                }

                instructorClassSelection.showClasses();
                return;
            }
            instructorClassSelection.requestClassListError("Error: Can't connect to server")
        };

        req.onerror = function () {
            instructorClassSelection.requestClassListError("Error: Can't connect to server")
        };

        req.onabort = function () {
            instructorClassSelection.requestClassListError("Error: Can't connect to server")
        };

        req.open("GET", `/api/v0/instructors/classes`);
        req.send();
    }

    static requestClassListError(error: string) {
        console.log("Class list error:", error);
    }
}

/* Student Pages */
type answerRequest = {
    answer_id:string;
};

function displayStudentPage() {
    (<HTMLElement>document.querySelector("#student_display_name")).innerHTML = `Student: ${main.username}`;
    (<HTMLElement>document.querySelector("#student_page")).classList.remove("hidden");
}

function hideStudentPage() {
    (<HTMLElement>document.querySelector("#student_page")).classList.add("hidden");
}

class studentClassPage implements view {

    static questionTemplateFunc: doT.RenderFunction;

    static setup() {
        let template: HTMLElement = <HTMLElement>document.querySelector("#student_class_page_template");
        this.questionTemplateFunc = doT.template(template.innerHTML);
    }

    static setupListeners() {
        (<HTMLElement>document.querySelector("#student_refresh_questions")).onclick = this.updateQuestions;

        // answer listeners
        let selectAnswers = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='ansSel_']");
        for (var i = 0; i < selectAnswers.length; ++i) {
            selectAnswers[i].onclick = this.answerClick;
        }
    }

    static show() {
        this.updateQuestions();

        displayStudentPage();

        (<HTMLElement>document.querySelector("#student_class_page")).classList.remove("hidden");

        header.show();
    }

    static hide() {
        hideStudentPage();

        let classDiv: HTMLElement = <HTMLElement>document.querySelector("#student_class_page");
        classDiv.classList.add("hidden");

        header.hide();
    }

    static studentClassDisplayQuestions() {
        let classPageDiv: HTMLElement = <HTMLElement>document.querySelector("#student_class_page");
        classPageDiv.innerHTML = this.questionTemplateFunc(main.classList.get(main.currentClass));

        for (let q of (<Class>main.classList.get(main.currentClass)).questions) {
            if (q.selected_answer != "") {
                this.SetSelectAnswer(q.question_id, q.selected_answer);
            }
        }

        this.setupListeners();
    }

    /* view updating */
    static updateQuestions() {
        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let res: question[] = JSON.parse(req.responseText);

                (<Class>main.classList.get(main.currentClass)).questions = res;
                studentClassPage.studentClassDisplayQuestions();
                return;
            }
            studentClassPage.requestClassError("Error: Can't connect to server");
        };

        req.onerror = function () {
            studentClassPage.requestClassError("Error: Can't connect to server");
        };

        req.onabort = function () {
            studentClassPage.requestClassError("Error: Can't connect to server");
        };

        req.open("GET", `/api/v0/classes/${encodeURI(main.currentClass)}/questions`);
        req.send();
    }

    static updateAnswer(qid: string, aid: string) {
        let question: question = (<question>main.getQuestion(main.currentClass, qid));

        let currentAnswer: string = question.selected_answer;
        if (currentAnswer !== "") {
            (<HTMLElement>document.querySelector(`#ansSel_${qid}_${currentAnswer}`)).classList.remove("selected-answer");
        }
        question.selected_answer = aid;

        this.SetSelectAnswer(qid, aid);
    }

    static SetSelectAnswer(qid: string, aid: string) {
        (<HTMLElement>document.querySelector(`#ansSel_${qid}_${aid}`)).classList.add("selected-answer");
    }

    /* listeners */
    static answerClick(event: Event) {
        let [,qid, aid]: string[] = (<HTMLElement>event.target).id.split("_");

        let reqJSON: answerRequest = {
            answer_id: aid,
        };

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                studentClassPage.updateAnswer(qid, aid);
                return;
            }
            studentClassPage.submitAnswerError("Error: Can't connect to server");
        };

        req.onerror = function () {
            studentClassPage.submitAnswerError("Error: Can't connect to server");
        };

        req.onabort = function () {
            studentClassPage.submitAnswerError("Error: Can't connect to server");
        };

        // if question previously selected PUT else POST
        if ((<question>main.getQuestion(main.currentClass, qid)).selected_answer === "") {
            req.open("POST", `/api/v0/classes/${encodeURI(main.currentClass)}/questions/${encodeURI(qid)}`);
        } else {
            req.open("PUT", `/api/v0/classes/${encodeURI(main.currentClass)}/questions/${encodeURI(qid)}`);
        }

        req.send(JSON.stringify(reqJSON));
    }

    /* failed request handlers */
    static requestClassError(error: string) {
        console.log("Class error: ", error);
    }

    static submitAnswerError(error: string) {
        console.log("Submit answer error: ", error);
    }
}

class studentClassSelection implements view {

    static classTemplateFunction: doT.RenderFunction;

    static setup() {
        let template: HTMLElement = <HTMLElement>document.querySelector("#student_class_list_template");
        this.classTemplateFunction = doT.template(template.innerHTML);
    }

    static setupListeners() {
        (<HTMLElement>document.querySelector("#student_class_list_refresh_btn")).onclick = this.refreshClassesClick;

        let classList = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='studentSwitchClass_']");
        for (var i = 0; i < classList.length; ++i) {
            classList[i].onclick = this.switchClassClick;
        }
    }

    static show() {
        header.show();
        displayStudentPage();

        let selectionDiv: HTMLElement = <HTMLElement>document.querySelector("#student_class_selection_page");
        selectionDiv.classList.remove("hidden");

        if (main.takes.length == 0) {
            this.getClassList();
        } else {
            studentClassSelection.showClasses();
        }
    }

    static hide() {
        header.hide();
        hideStudentPage();

        (<HTMLElement>document.querySelector("#student_class_list")).innerHTML = "";
        (<HTMLElement>document.querySelector("#student_class_selection_page")).classList.add("hidden");
    }

    static switchClassClick(event: Event) {
        let cid: string = (<HTMLElement>event.target).id.split("_")[1];

        main.currentClass = cid;
        main.switchView(pageEnum.StudentView);
    }

    static refreshClassesClick() {
        studentClassSelection.getClassList();
    }

    static showClasses() {
        let classListDiv: HTMLElement = <HTMLElement>document.querySelector("#student_class_list");
        classListDiv.innerHTML = this.classTemplateFunction(main.takes);

        this.setupListeners();
    }

    /* api requests */
    static getClassList() {
        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let classList: Class[] = JSON.parse(req.responseText);
                main.takes = classList;

                for (var i = 0; i < classList.length; i++) {
                    if (main.classList.get(classList[i].class_id) === undefined) {
                        let newClass: Class = {
                            class_name: classList[i].class_name,
                            class_id: classList[i].class_id,
                            questions: []
                        };
                        main.classList.set(newClass.class_id, newClass);
                    }
                }

                studentClassSelection.showClasses();
                return;
            }
            studentClassSelection.requestClassListError("Error: Can't connect to server")
        };

        req.onerror = function () {
            studentClassSelection.requestClassListError("Error: Can't connect to server")
        };

        req.onabort = function () {
            studentClassSelection.requestClassListError("Error: Can't connect to server")
        };

        req.open("GET", `/api/v0/classes`);
        req.send();
    }

    static requestClassListError(error: string) {
        console.log("Class list error:", error);
    }
}


main.setup();