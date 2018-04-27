/*******************
 * Global Variables
 ******************/

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

/*************
 * Main class
 ************/
class main {

    static username: string;
    static teachIDs: string[];
    static takeIDs: string[];
    static classList: Map<string, Class>;
    static currentClass: string;
    static currentPage: pageEnum;

    static setup() {
        this.setupListeners();

        this.username = "";
        this.teachIDs = [];
        this.takeIDs = [];
        this.classList = new Map<string, Class>();
        this.currentClass = "";
        this.currentPage = pageEnum.login;
    }

    static setupListeners() {
        header.setup();
        loginPage.setupLoginListeners();

        studentClassPage.setup();
        instructorClassPage.setup();
    }
}

/*************
 * header
 ************/
class header {
    static setup() {
        this.setupListeners();
    }

    static setupListeners() {
        (<HTMLElement>document.querySelector("#header_logout_btn")).onclick = this.onLogoutClick;
        (<HTMLElement>document.querySelector("#header_join_create_btn")).onclick = this.onJoinCreateClick;
        (<HTMLElement>document.querySelector("#header_student_class_list_btn")).onclick = this.onStudentListClick;
        (<HTMLElement>document.querySelector("#header_instr_class_list_btn")).onclick = this.onInstrListClick
    }

    static onLogoutClick() {
        console.log("onLogoutClick")
        // goto login page and remove cookie
    }

    static onJoinCreateClick() {
        console.log("onJoinCreateClick")
        // goto login page
    }

    static onStudentListClick() {
        console.log("onStudentListClick")
        // goto student class list page
    }

    static onInstrListClick() {
        console.log("onInstrListClick")
        // goto instructor list page
    }

    static show() {
        (<HTMLElement>document.querySelector("#header_buttons")).classList.remove("hidden");
    }

    static hide() {
        (<HTMLElement>document.querySelector("#header_buttons")).classList.add("hidden");
    }
}

/*************
 * login page
 ************/
type createRequest = {
    class: Class;
    person: person;
};

type joinRequest = {
    person: person;
};

/**************************
 * login display listeners
 *************************/
class loginPage {
    static onLoginJoinClick() {
        let joinDiv: HTMLElement = <HTMLElement>document.querySelector("#join");
        if (joinDiv.classList.contains("hidden")) {
            joinDiv.classList.remove("hidden");
        } else {
            joinDiv.classList.add("hidden");
        }
        return;
    }

    static onLoginCreateClick() {
        let createDiv: HTMLElement = <HTMLElement>document.querySelector("#create");
        if (createDiv.classList.contains("hidden")) {
            createDiv.classList.remove("hidden");
        } else {
            createDiv.classList.add("hidden");
        }
        return;
    }

    static onLoginListClick() {
        let listDiv: HTMLElement = <HTMLElement>document.querySelector("#list_classes");
        if (listDiv.classList.contains("hidden")) {
            listDiv.classList.remove("hidden");
        } else {
            listDiv.classList.add("hidden");
        }
    }

    /**********************
     * login btn listeners
     *********************/
    static onJoinClassBtnClick() {
        console.log("onJoinClassBtnClick");

        let classIDInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#join_class_id");
        if (classIDInput.value === "") {
            loginPage.joinClassReqFail("Error: Requires class ID");
            return;
        }

        let classID = classIDInput.value;

        let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#student_name");
        if (nameInput.value === "" && main.username === "") {
            loginPage.joinClassReqFail("Error: Requires your name");
            return;
        } else if (main.username === "") {
            main.username = nameInput.value;
        }

        // create request json object
        let reqJSON: joinRequest = {
            person: {
                name: main.username,
            },
        };

        loginPage.joinClassRequest(classID, reqJSON);
    }

    static onCreateClassBtnClick() {
        console.log("onCreateClassBtnClick")

        let classNameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#new_class_name");
        if (classNameInput.value === "") {
            loginPage.createClassReqFail("Error: Requires class name");
            return;
        }

        let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#instructor_name");
        if (nameInput.value === "" && main.username === "") {
            loginPage.createClassReqFail("Error: Requires your name");
            return;
        } else if (main.username === "") {
            main.username = nameInput.value;
        }

        // create request json object
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

    static onStudentListClick() {
        console.log("onStudentListClick");
    }

    static onInstrListClick() {
        console.log("onInstrListClick");
    }

    /********************************
     * login failed request handlers
     *******************************/
    static joinClassReqFail(error: string) {
        (<HTMLElement>document.querySelector("#join_input_error")).innerHTML = error;

        console.log("join class error: ", error);
    }

    static createClassReqFail(error: string) {
        (<HTMLElement>document.querySelector("#new_input_error")).innerHTML = error;

        console.log("create class error: ", error);
    }

    /******************************
     * login switch view functions
     *****************************/
    static switchInstructorClassView() {
        this.hideLoginPage();

        main.currentPage = pageEnum.instrView;
        instructorClassPage.show();
    }

    static switchStudentClassView() {
        this.hideLoginPage();

        main.currentPage = pageEnum.StudentView;
        studentClassPage.show();
    }

    /*******************
     * login hide views
     ******************/
    static hideLoginPage() {
        (<HTMLElement>document.querySelector("#join")).classList.add("hidden");

        (<HTMLElement>document.querySelector("#create")).classList.add("hidden");

        (<HTMLElement>document.querySelector("#new")).classList.add("hidden");
    }

    /******************
     * login listeners
     *****************/
    static setupLoginListeners() {
        console.log("setupLoginListeners");
        (<HTMLElement>document.querySelector("#join_heading")).onclick = this.onLoginJoinClick;

        (<HTMLElement>document.querySelector("#create_heading")).onclick = this.onLoginCreateClick;

        (<HTMLButtonElement>document.querySelector("#join_class_btn")).onclick = this.onJoinClassBtnClick;

        (<HTMLButtonElement>document.querySelector("#new_class_btn")).onclick = this.onCreateClassBtnClick;

        (<HTMLElement>document.querySelector("#class_list_heading")).onclick = this.onLoginListClick;

        (<HTMLButtonElement>document.querySelector("#instr_class_list_button")).onclick = this.onInstrListClick;

        (<HTMLButtonElement>document.querySelector("#student_class_list_button")).onclick = this.onStudentListClick;
    }

    /***************
     * API Requests
     **************/
    static joinClassRequest(classID: string, reqJSON: joinRequest) {
        let req: XMLHttpRequest = new XMLHttpRequest();

        // response listener
        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let res: createRequest = JSON.parse(req.responseText);
                console.log("join class req success", res);

                main.classList.set(res.class.class_id, res.class);
                main.currentClass = res.class.class_id;

                loginPage.switchStudentClassView();
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
        console.log(reqJSON);
    }

    static createClassRequest(reqJSON: createRequest) {
        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                let res: createRequest = JSON.parse(req.responseText);

                // add to list of classes
                main.classList.set(res.class.class_id, res.class);
                main.currentClass = res.class.class_id;

                loginPage.switchInstructorClassView();
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
        console.log(reqJSON);
    }
}
/******************
 * Instructor Page
 *****************/

type response = {
    answer_id: string;
    count: number;
}

/*******************
 * Instructor Views
 ******************/
function displayInstructorPage() {
    // TODO set name
    let instructorNameDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_display_name");
    instructorNameDiv.innerHTML = `Hello ${main.username}`;

    let instructorDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_page");
    instructorDiv.classList.remove("hidden");
}

/************************
 * Instructor Class View
 ***********************/
class instructorClassPage {

    static questionTemplateFunction: doT.RenderFunction;

    static setup() {
        let template: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page_template");

        this.questionTemplateFunction = doT.template(template.innerHTML);
    }

    static show() {
        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                // add questions to class list and update
                let res: question[] = JSON.parse(req.responseText);
                (<Class>main.classList.get(main.currentClass)).questions = res;

                instructorClassPage.instructorClassDisplayQuestions();
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
        // clear questions
        let classPageDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page");
        classPageDiv.innerHTML = "";

        // hide page
        let classDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page");
        classDiv.classList.add("hidden");

        header.hide();
    }

    static instructorClassDisplayQuestions() {
        let classPageDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page");
        classPageDiv.innerHTML = this.questionTemplateFunction(main.classList.get(main.currentClass));

        this.setupListeners();
    }

    /*********************************
     * Instructor Class View updating
     ********************************/
    static instructorViewAddQuestion(question: question) {
        this.instructorClassDisplayQuestions();
    }

    static instructorViewUpdateQuestion(question: question) {
        this.instructorClassDisplayQuestions();
    }

    static instructorViewAddAnswer(answer: answer) {
        this.instructorClassDisplayQuestions();
    }

    static instructorViewQuestionResults(response: response) {
        /* draw results */
    }

    static instructorViewDeleteQuestion(qid: string) {
        this.instructorClassDisplayQuestions();
    }

    /*****************************
     * Instructor Class Listeners
     ****************************/
    static onCreateQuestionClick() {
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


        // make request
        let req: XMLHttpRequest = new XMLHttpRequest();

        // response listener
        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                // retrieve and add question
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

    /********************************
     * Instructor Question Listeners
     *******************************/
    static onDeleteQuestionClick(event: Event) {
        let qid: string = (<HTMLElement>event.target).id.split("_")[1]
        console.log("delete question: ", qid);

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 204) {
                // delete local copy
                let Class: Class = <Class>main.classList.get(main.currentClass);
                Class.questions = Class.questions.filter(question => question.question_id !== qid);
                // redraw
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

    static onAddAnswerClick(event: Event) {
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
                console.log("create question req success", res);

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

    static onPublicQuestionClick(event: Event) {
        let qid: string = (<HTMLElement>event.target).id.split("_")[1]
        // make public request
        console.log("make public question: ", qid);

        // setup request object
        let reqJSON: question = <question>(<Class>main.classList.get(main.currentClass)).questions.find(question => question.question_id === qid);
        reqJSON.public = true;

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                // update question
                let question: question = <question>(<Class>main.classList.get(main.currentClass)).questions.find(question => question.question_id === qid);
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

    static onQuestionResultsClick(event: Event) {
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

    static onDeleteAnswerClick(event: Event) {
        let [, qid, aid]: string[] = (<HTMLElement>event.target).id.split("_");
        console.log("delete question, answer: ", qid, ", ", aid);

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 204) {
                let question: question = getQuestion(main.currentClass, qid);
                question.answers = question.answers.filter(a => a.answer_id !== aid);

                instructorClassPage.instructorViewUpdateQuestion(<question>getQuestion(main.currentClass, qid));
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

    /***********************************
     * Instructor Class Listeners setup
     **********************************/
    static setupListeners() {
        this.questionListeners();

        this.answerListeners();

        console.log("add create question listener");

        let createQuestion: HTMLElement = <HTMLElement>document.querySelector("#instr_new_question_btn");
        createQuestion.onclick = this.onCreateQuestionClick;
    }

    static questionListeners() {
        let deleteQuestions = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionDel_']");
        for (var i = 0; i < deleteQuestions.length; ++i) {
            deleteQuestions[i].onclick = this.onDeleteQuestionClick;
        }

        let addAnswers = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionAdd_']");
        for (var i = 0; i < addAnswers.length; ++i) {
            addAnswers[i].onclick = this.onAddAnswerClick;
        }

        let questionsPublic = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionPub_']");
        for (var i = 0; i < questionsPublic.length; ++i) {
            questionsPublic[i].onclick = this.onPublicQuestionClick;
        }

        let questionsResults = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionRes_']");
        for (var i = 0; i < questionsResults.length; ++i) {
            questionsResults[i].onclick = this.onQuestionResultsClick;
        }
    }

    static answerListeners() {
        let deleteAnswers = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='ansDel_']");
        for (var i = 0; i < deleteAnswers.length; ++i) {
            deleteAnswers[i].onclick = this.onDeleteAnswerClick;
        }
    }

    /*************************************
     * instructor failed request handlers
     ************************************/
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

/**********************************
 * Instructor Class Selection View
 *********************************/
class instructorClassSelection {

    static classTemplateFunction: doT.RenderFunction;

    static setup() {
        // setup template
        let template: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_list_template");
        this.classTemplateFunction = doT.template(template.innerHTML);
    }

    static show() {
        displayInstructorPage();

        // show div
        let selectionDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_selection_page");
        selectionDiv.classList.remove("hidden");
    }

    static hide() {
        // empty list
        let classListDiv: HTMLElement = <HTMLElement>document.querySelector("#instr_class_list");
        classListDiv.innerHTML = "";

        let selectionDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_selection_page");
        selectionDiv.classList.add("hidden");
    }

    static fillPage() {
        let classListDiv: HTMLElement = <HTMLElement>document.querySelector("#instr_class_list");

        classListDiv.innerHTML = this.classTemplateFunction(main.classList.get(main.currentClass));

        this.setupListeners();
    }

    static setupListeners() {
        let classList = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrSwitchClass_']");
        for (var i = 0; i < classList.length; ++i) {
            classList[i].onclick = this.onSwitchClassClick;
        }
    }

    static onSwitchClassClick(event: Event) {
        let cid: string = (<HTMLElement>event.target).id.split("_")[1];

        this.hide();

        main.currentClass = cid;
        main.currentPage = pageEnum.instrView;

        instructorClassPage.show();
    }
}

/***************
 * Student Page
 **************/
type answerRequest = {
    answer_id:string;
};

/****************
 * Student Views
 ***************/
function displayStudentPage() {
    // TODO set name
    let instructorNameDiv: HTMLElement = <HTMLElement>document.querySelector("#student_display_name");
    instructorNameDiv.innerHTML = `Hello ${main.username}`;

    // show page
    let classDiv: HTMLElement = <HTMLElement>document.querySelector("#student_page");
    classDiv.classList.remove("hidden");
}

/*********************
 * Student Class View
 ********************/
class studentClassPage {

    static questionTemplateFunc: doT.RenderFunction;

    static setup() {
        console.log("studentClassPage setup");

        let template: HTMLElement = <HTMLElement>document.querySelector("#student_class_page_template");
        this.questionTemplateFunc = doT.template(template.innerHTML);
    }

    static show() {
        this.studentClassUpdateQuestions();

        // display page
        displayStudentPage();

        // display class page
        let classDiv: HTMLElement = <HTMLElement>document.querySelector("#student_class_page");
        classDiv.classList.remove("hidden");

        header.show();
    }

    static hide() {
        let classDiv: HTMLElement = <HTMLElement>document.querySelector("#student_class_page");
        classDiv.classList.add("hidden");

        header.hide();
    }

    static studentClassDisplayQuestions() {
        let classPageDiv: HTMLElement = <HTMLElement>document.querySelector("#student_class_page");

        classPageDiv.innerHTML = this.questionTemplateFunc(main.classList.get(main.currentClass));

        // show selected answers
        for (let q of (<Class>main.classList.get(main.currentClass)).questions) {
            if (q.selected_answer != "") {
                this.StudentClassViewSelectAnswer(q.question_id, q.selected_answer);
            }
        }

        this.setupListeners();
    }

    /******************************
     * Student Class View Updating
     *****************************/
    static studentClassUpdateQuestions() {
        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                // get add questions to class object
                let res: question[] = JSON.parse(req.responseText);

                // set questions
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

    static studentClassUpdateAnswer(qid: string, aid: string) {
        let question: question = (<question>getQuestion(main.currentClass, qid));

        let currentAnswer: string = question.selected_answer;
        if (currentAnswer !== "") {
            (<HTMLElement>document.querySelector(`#ansSel_${qid}_${currentAnswer}`)).classList.remove("selected-answer");
        }
        question.selected_answer = aid;

        this.StudentClassViewSelectAnswer(qid, aid);
    }

    static StudentClassViewSelectAnswer(qid: string, aid: string) {
        (<HTMLElement>document.querySelector(`#ansSel_${qid}_${aid}`)).classList.add("selected-answer");
    }

    /**************************
     * Student Class listeners
     *************************/
    static onAnswerClick(event: Event) {
        let [,qid, aid]: string[] = (<HTMLElement>event.target).id.split("_");

        // send answer
        //reqJSON
        let reqJSON: answerRequest = {
            answer_id: aid,
        };

        let req: XMLHttpRequest = new XMLHttpRequest();

        req.onload = function () {
            if (req.readyState === 4 && req.status === 200) {
                // update answer
                studentClassPage.studentClassUpdateAnswer(qid, aid);
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
        if ((<question>getQuestion(main.currentClass, qid)).selected_answer === "") {
            req.open("POST", `/api/v0/classes/${encodeURI(main.currentClass)}/questions/${encodeURI(qid)}`);
        } else {
            req.open("PUT", `/api/v0/classes/${encodeURI(main.currentClass)}/questions/${encodeURI(qid)}`);
        }

        req.send(JSON.stringify(reqJSON));
    }

    /********************************
     * Student Class Listeners setup
     *******************************/
    static setupListeners() {
        // refresh listener
        let refreshDiv: HTMLElement = <HTMLElement>document.querySelector("#student_refresh_questions");
        refreshDiv.onclick = this.studentClassUpdateQuestions;

        // answer listeners
        let selectAnswers = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='ansSel_']");
        for (var i = 0; i < selectAnswers.length; ++i) {
            selectAnswers[i].onclick = this.onAnswerClick;
        }
    }

    /**********************************
     * student failed request handlers
     *********************************/
    static requestClassError(error: string) {
        console.log("Class error: ", error);
    }

    static submitAnswerError(error: string) {
        console.log("Submit answer error: ", error);
    }
}

/*****************
 * main functions
 ****************/
function setupListeners() {
    header.setup();
    loginPage.setupLoginListeners();

    studentClassPage.setup();
    instructorClassPage.setup();
}

/*******************
 * Helper functions
 ******************/
function getQuestion(cid: string, qid: string): question | undefined {
    let Class: Class | undefined = main.classList.get(cid);
    if (Class === undefined) {
        return undefined;
    }
    return Class.questions.find(question => question.question_id === qid);
}

main.setup();