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
}

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

type globals = {
    name: string;
    teachIDs: string[];
    takeIDs: string[];
    classList: Map<string, Class>;
    currentClass: string;
};

var info: globals = {
    name: "",
    teachIDs: [],
    takeIDs: [],
    classList: new Map<string, Class>(),
    currentClass: "",
};

var username:string = "";

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
function onLoginJoinClick() {
    let joinDiv: HTMLElement = <HTMLElement>document.querySelector("#join");

    // check if something is already there
    if (joinDiv.innerHTML !== "") {
        joinDiv.innerHTML = "";
        return;
    }
    // obtain the template
    let template: HTMLElement = <HTMLElement>document.querySelector("#new_join_template");

    // compile the template
    let func = doT.template(template.innerHTML);
    // render the data into the template
    let rendered = func();
    // insert the rendered template into the DOM
    joinDiv.innerHTML = rendered;

    // create listener
    let joinBtn: HTMLButtonElement = <HTMLButtonElement>document.querySelector("#join_class_btn");
    joinBtn.onclick = onJoinClassBtnClick;
    console.log("add join btn listener");
}

function onLoginCreateClick() {
    let createDiv: HTMLElement = <HTMLElement>document.querySelector("#create");

    // check if something is already there
    if (createDiv.innerHTML !== "") {
        createDiv.innerHTML = "";
        return;
    }
    // obtain the template
    let template: HTMLElement = <HTMLElement>document.querySelector("#new_create_template");

    // compile the template
    let func = doT.template(template.innerHTML);
    // render the data into the template
    let rendered = func();
    // insert the rendered template into the DOM
    createDiv.innerHTML = rendered;

    // create listener
    let createBtn: HTMLButtonElement = <HTMLButtonElement>document.querySelector("#new_class_btn");
    createBtn.onclick = onCreateClassBtnClick;
    console.log("add create btn listener");
}

/**********************
 * login btn listeners
 *********************/
function onJoinClassBtnClick() {
    console.log("onJoinClassBtnClick");
    //get info if exists
    let classIDInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#join_class_id");
    if (classIDInput.value === "") {
        joinClassReqFail("Error: Requires class ID");
        return;
    }
    let classID = classIDInput.value;

    let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#student_name");
    if (nameInput.value === "" && info.name === "") {
        joinClassReqFail("Error: Requires your name");
        return;
    } else if (info.name === "") {
        info.name = nameInput.value;
    }

    console.log("name: ", info.name);

    // create request json object
    let reqJSON: joinRequest = {
        person: {
            name: info.name,
        },
    };

    //make request
    let req: XMLHttpRequest = new XMLHttpRequest();

    // response listener
    req.onload = function () {
        if (req.readyState === 4 && req.status === 200) {
            let res: createRequest = JSON.parse(req.responseText);
            console.log("join class req success", res);
            // add to list of classes
            info.classList.set(res.class.class_id, res.class);
            info.currentClass = res.class.class_id;

            switchStudentClassView();
            return;
        }
        joinClassReqFail("Failed to join class");
    };

    req.onerror = function () {
        joinClassReqFail("Error: Can't connect to server");
    };

    req.onabort = function () {
        joinClassReqFail("Error: Can't connect to server");
    };

    req.open("POST", `/api/v0/classes/${encodeURI(classID)}`);
    req.send(JSON.stringify(reqJSON));
    console.log(reqJSON);
}

function onCreateClassBtnClick() {
    console.log("onCreateClassBtnClick")

    let classNameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#new_class_name");
    if (classNameInput.value === "") {
        createClassReqFail("Error: Requires class name");
        return;
    }

    let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#instructor_name");
    if (nameInput.value === "" && info.name === "") {
        createClassReqFail("Error: Requires your name");
        return;
    } else if (info.name === "") {
        info.name = nameInput.value;
    }

    // create request json object
    let reqJSON: createRequest = {
        person: {
            name: info.name,
        },
        class: {
            class_name: classNameInput.value,
            class_id: "",
            questions: [],
        },
    };

    // make request
    let req: XMLHttpRequest = new XMLHttpRequest();

    // response listener
    req.onload = function () {
        if (req.readyState === 4 && req.status === 200) {
            let res: createRequest = JSON.parse(req.responseText);

            // add to list of classes
            info.classList.set(res.class.class_id, res.class);
            info.currentClass = res.class.class_id;

            switchInstructorClassView();
            return;
        }
        createClassReqFail("Error: Failed to create class");
    };

    req.onerror = function () {
        createClassReqFail("Error: Can't connect to server");
    };

    req.onabort = function () {
        createClassReqFail("Error: Can't connect to server");
    };

    req.open("POST", `/api/v0/classes`);
    req.send(JSON.stringify(reqJSON));
    console.log(reqJSON);
}

/********************************
 * login failed request handlers
 *******************************/
function joinClassReqFail(error: string) {
    let joinDiv: HTMLElement = <HTMLElement>document.querySelector("#join_input_error");
    joinDiv.innerHTML = error;

    console.log("join class error: ", error);
}

function createClassReqFail(error: string) {
    let classDiv: HTMLElement = <HTMLElement>document.querySelector("#new_input_error");
    classDiv.innerHTML = error;

    console.log("create class error: ", error);
}

/******************************
 * login switch view functions
 *****************************/
function switchInstructorClassView() {
    // hide login page
    hideLoginPage();

    // call display view
    displayInstructorClassPage();
}

function switchStudentClassView() {
    // hide login page
    hideLoginPage();

    // call display view
    displayStudentClassPage();
}

/*******************
 * login hide views
 ******************/
function hideLoginPage() {
    // remove join and create divs
    let joinDiv: HTMLElement = <HTMLElement>document.querySelector("#join");
    joinDiv.innerHTML = "";

    let createDiv: HTMLElement = <HTMLElement>document.querySelector("#create");
    joinDiv.innerHTML = "";

    //hide login page
    let loginDiv: HTMLElement = <HTMLElement>document.querySelector("#new");
    loginDiv.classList.add("hidden");
    //loginDiv.
}

/******************
 * login listeners
 *****************/
function setupLoginListeners() {
    let joinHeading: HTMLElement = <HTMLElement>document.querySelector("#join_heading");
    joinHeading.addEventListener("click", onLoginJoinClick);

    let createHeading: HTMLElement = <HTMLElement>document.querySelector("#create_heading");
    createHeading.addEventListener("click", onLoginCreateClick);
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
    instructorNameDiv.innerHTML = `Hello ${info.name}`;

    let instructorDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_page");
    instructorDiv.classList.remove("hidden");
}

/************************
 * Instructor Class View
 ***********************/
function displayInstructorClassPage() {
    // request questions
    let req: XMLHttpRequest = new XMLHttpRequest();

    // response listener
    req.onload = function () {
        if (req.readyState === 4 && req.status === 200) {
            // get add questions to class object
            let res: question[] = JSON.parse(req.responseText);

            // set questions
            (<Class>info.classList.get(info.currentClass)).questions = res;
            instructorClassDisplayQuestions();
            return;
        }
        displayInstructorClassFail("Error: Failed to create class");
    };

    req.onerror = function () {
        displayInstructorClassFail("Error: Can't connect to server");
    };

    req.onabort = function () {
        displayInstructorClassFail("Error: Can't connect to server");
    };

    req.open("GET", `/api/v0/instructors/classes/${encodeURI(info.currentClass)}/questions`);
    req.send();

    // display instructor page
    displayInstructorPage();

    // display class page
    let classDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page");
    classDiv.classList.remove("hidden");
}

function instructorClassDisplayQuestions() {
    let classPageDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page");

    // obtain the template
    let template: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page_template");

    // compile the template
    let func = doT.template(template.innerHTML);
    // render the data into the template
    let rendered = func(info.classList.get(info.currentClass));
    // insert the rendered template into the DOM
    classPageDiv.innerHTML = rendered;

    // add listeners
    instructorClassListeners();
}

/*********************************
 * Instructor Class View updating
 ********************************/
// clean up
function instructorViewAddQuestion(question: question) {
    /* redraw view */
    instructorClassDisplayQuestions();
}

function instructorViewUpdateQuestion(question: question) {
    /* redraw view */
    instructorClassDisplayQuestions();
}

function instructorViewAddAnswer(answer: answer) {
    /* redraw view */
    instructorClassDisplayQuestions();
}

function instructorViewQuestionResults(response: response) {
    /* draw results */
}

function instructorViewDeleteQuestion(qid: string) {
    /* redraw view */
    instructorClassDisplayQuestions();
}

/*****************************
 * Instructor Class Listeners
 ****************************/
function onCreateQuestionClick() {
    // let nameInput: HTMLElement
    let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#instr_new_question_name");
    if (nameInput.value === "") {
        instrCreateQuestionFail("Error: question Requires name");
        return;
    }

    // setup request object
    let reqJSON: question = {
        question_title: nameInput.value,
        question_id: "",
        public: false,
        class_id: info.currentClass,
        answers: [],
        selected_answer: "",
    };


    // make request
    let req: XMLHttpRequest = new XMLHttpRequest();

    // response listener
    req.onload = function () {
        if (req.readyState === 4 && req.status === 200) {
            // get add questions to class object
            let res: question = JSON.parse(req.responseText);

            // insert question to array
            (<Class>info.classList.get(info.currentClass)).questions.push(res);

            instructorViewAddQuestion(res);
            return;
        }
        instrCreateQuestionFail("Error: Failed to create question");
    };

    req.onerror = function () {
        instrCreateQuestionFail("Error: Can't connect to server");
    };

    req.onabort = function () {
        instrCreateQuestionFail("Error: Can't connect to server");
    };

    req.open("POST", `/api/v0/instructors/classes/${encodeURI(info.currentClass)}/questions`);
    req.send(JSON.stringify(reqJSON));
}

/********************************
 * Instructor Question Listeners
 *******************************/
function onDeleteQuestionClick(event: Event) {
    let qid: string = (<HTMLElement>event.target).id.split("_")[1]
    // send delete request
    console.log("delete question: ", qid);

    let req: XMLHttpRequest = new XMLHttpRequest();

    req.onload = function () {
        if (req.readyState === 4 && req.status === 204) {
            // delete local copy
            let Class: Class = <Class>info.classList.get(info.currentClass);
            Class.questions = Class.questions.filter(question => question.question_id !== qid);
            // redraw
            instructorViewDeleteQuestion(qid);
            return;
        }
        instrDeleteQuestionFail(qid, "Error: Can't connect to server");
    };

    req.onerror = function () {
        instrDeleteQuestionFail(qid, "Error: Can't connect to server");
    };

    req.onabort = function () {
        instrDeleteQuestionFail(qid, "Error: Can't connect to server");
    };

    req.open("DELETE", `/api/v0/instructors/classes/${encodeURI(info.currentClass)}/questions/${encodeURI(qid)}`);
    req.send();
}

function onAddAnswerClick(event: Event) {
    let qid: string = (<HTMLElement>event.target).id.split("_")[1];

    // grab question text
    let answerText: string = (<HTMLInputElement>document.querySelector(`#instrQuestionAddText_${encodeURI(qid)}`)).value;
    if (answerText === "") {
        instrAddAnswerFail(qid, "Error: Enter a number");
        return;
    }

    // setup request object
    let reqJSON: answer = {
        answer_id: "",
        answer_text: answerText,
        question_id: "",
    };

    // make request
    let req: XMLHttpRequest = new XMLHttpRequest();

    // response listener
    req.onload = function () {
        if (req.readyState === 4 && req.status === 200) {
            let res: answer = JSON.parse(req.responseText);
            console.log("create question req success", res);

            // insert answer into error
            (<question>(<Class>info.classList.get(info.currentClass)).questions.find(question => question.question_id === qid)).answers.push(res);
            // assume not empty
            instructorViewAddAnswer(res);
            return;
        }
        instrAddAnswerFail(qid, "Error: Can't connect to server");
    };

    req.onerror = function () {
        instrAddAnswerFail(qid, "Error: Can't connect to server");
    };

    req.onabort = function () {
        instrAddAnswerFail(qid, "Error: Can't connect to server");
    };

    req.open("POST", `/api/v0/instructors/classes/${encodeURI(info.currentClass)}/questions/${encodeURI(qid)}`);
    req.send(JSON.stringify(reqJSON));
}

function onPublicQuestionClick(event: Event) {
    let qid: string = (<HTMLElement>event.target).id.split("_")[1]
    // make public request
    console.log("make public question: ", qid);

    // setup request object
    let reqJSON: question = <question>(<Class>info.classList.get(info.currentClass)).questions.find(question => question.question_id === qid);
    reqJSON.public = true;

    // make request
    let req: XMLHttpRequest = new XMLHttpRequest();

    // response listener
    req.onload = function () {
        if (req.readyState === 4 && req.status === 200) {
            // update question
            let question: question = <question>(<Class>info.classList.get(info.currentClass)).questions.find(question => question.question_id === qid);
            question.public = true;

            instructorViewUpdateQuestion(question);
            return;
        }
        instrPublicQuestionFail(qid, "Error: Can't connect to server");
    };

    req.onerror = function () {
        instrPublicQuestionFail(qid, "Error: Can't connect to server");
    };

    req.onabort = function () {
        instrPublicQuestionFail(qid, "Error: Can't connect to server");
    };

    req.open("PUT", `/api/v0/instructors/classes/${encodeURI(info.currentClass)}/questions/${encodeURI(qid)}`);
    req.send(JSON.stringify(reqJSON));
}

function onQuestionResultsClick(event: Event) {
    let qid: string = (<HTMLElement>event.target).id.split("_")[1];
    console.log("results question: ", qid);

    // make request
    let req: XMLHttpRequest = new XMLHttpRequest();

    // response listener
    req.onload = function () {
        if (req.readyState === 4 && req.status === 200) {
            let res: response = JSON.parse(req.responseText);
            // TODO: draw results
            return;
        }
        instrAddAnswerFail(qid, "Error: Can't connect to server");
    };

    req.onerror = function () {
        instrAddAnswerFail(qid, "Error: Can't connect to server");
    };

    req.onabort = function () {
        instrAddAnswerFail(qid, "Error: Can't connect to server");
    };

    req.open("GET", `/api/v0/instructors/classes/${encodeURI(info.currentClass)}/questions/${encodeURI(qid)}`);
    req.send();
}

function onDeleteAnswerClick(event: Event) {
    // delete answer
    console.log("delete answer: ", (<HTMLElement>event.target).id.split("_")[1]);
}

/***********************************
 * Instructor Class Listeners setup
 **********************************/
function instructorClassListeners() {
    instructorQuestionListeners();

    instructorClassAnswerListeners();

    console.log("add create question listener");

    let createQuestion: HTMLElement = <HTMLElement>document.querySelector("#instr_new_question_btn");
    createQuestion.onclick = onCreateQuestionClick;
}

function instructorQuestionListeners() {
    let deleteQuestions = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionDel_']");
    for (var i = 0; i < deleteQuestions.length; ++i) {
        deleteQuestions[i].onclick = onDeleteQuestionClick;
    }

    let addAnswers = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionAdd_']");
    for (var i = 0; i < addAnswers.length; ++i) {
        addAnswers[i].onclick = onAddAnswerClick;
    }

    let questionsPublic = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionPub_']");
    for (var i = 0; i < questionsPublic.length; ++i) {
        questionsPublic[i].onclick = onPublicQuestionClick;
    }

    let questionsResults = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='instrQuestionRes_']");
    for (var i = 0; i < questionsResults.length; ++i) {
        questionsResults[i].onclick = onQuestionResultsClick;
    }
}

function instructorClassAnswerListeners() {
    let deleteAnswers = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='ansDel_']");
    for (var i = 0; i < deleteAnswers.length; ++i) {
        deleteAnswers[i].onclick = onDeleteAnswerClick;
    }
}

/*****************************
 * Instructor Class Selection
 ****************************/
function displayInstructorSelection() {
    displayInstructorPage();

    // show new div
    let selectionDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_selection_page");
    selectionDiv.classList.remove("hidden");
}

/*************************************
 * instructor failed request handlers
 ************************************/
function displayInstructorClassFail(error: string) {
    console.log("Class error: ", error);
}

function instrCreateQuestionFail(error: string) {
    console.log("create question error: ", error);
}

function instrAddAnswerFail(qid: string, error: string) {
    console.log("add answer error: ", error);
}

function instrDeleteQuestionFail(qid: string, error: string) {
    console.log("delete question error: ", error);
}

function instrPublicQuestionFail(qid: string, error: string) {
    console.log("public question error: ", error);
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
    instructorNameDiv.innerHTML = `Hello ${info.name}`;

    // show page
    let classDiv: HTMLElement = <HTMLElement>document.querySelector("#student_page");
    classDiv.classList.remove("hidden");
}

/*********************
 * Student Class View
 ********************/
function displayStudentClassPage() {
    studentClassUpdateQuestions();

    // display page
    displayStudentPage();

    // display class page
    let classDiv: HTMLElement = <HTMLElement>document.querySelector("#student_class_page");
    classDiv.classList.remove("hidden");
}

function studentClassDisplayQuestions() {
    let classPageDiv: HTMLElement = <HTMLElement>document.querySelector("#student_class_page");

    // obtain the template
    let template: HTMLElement = <HTMLElement>document.querySelector("#student_class_page_template");

    // compile the template
    let func = doT.template(template.innerHTML);
    // render the data into the template
    let rendered = func(info.classList.get(info.currentClass));
    // insert the rendered template into the DOM
    classPageDiv.innerHTML = rendered;

    // show selected answers
    for (let q of (<Class>info.classList.get(info.currentClass)).questions) {
        if (q.selected_answer != "") {
            StudentClassViewSelectAnswer(q.question_id, q.selected_answer);
        }
    }

    // add listeners
    studentClassListeners();
}

/******************************
 * Student Class View Updating
 *****************************/
function studentClassUpdateQuestions() {
    let req: XMLHttpRequest = new XMLHttpRequest();

    req.onload = function () {
        if (req.readyState === 4 && req.status === 200) {
            // get add questions to class object
            let res: question[] = JSON.parse(req.responseText);

            // set questions
            (<Class>info.classList.get(info.currentClass)).questions = res;
            studentClassDisplayQuestions();
            return;
        }
        displayStudentClassFail("Error: Can't connect to server");
    };

    req.onerror = function () {
        displayStudentClassFail("Error: Can't connect to server");
    };

    req.onabort = function () {
        displayStudentClassFail("Error: Can't connect to server");
    };

    req.open("GET", `/api/v0/classes/${encodeURI(info.currentClass)}/questions`);
    req.send();
}

function StudentClassUpdateAnswer(qid: string, aid: string) {
    let question: question = (<question>getQuestion(info.currentClass, qid));

    let currentAnswer: string = question.selected_answer;
    if (currentAnswer !== "") {
        (<HTMLElement>document.querySelector(`#ansSel_${qid}_${currentAnswer}`)).classList.remove("selected-answer");
    }
    question.selected_answer = aid;

    StudentClassViewSelectAnswer(qid, aid);
}

function StudentClassViewSelectAnswer(qid: string, aid: string) {
    (<HTMLElement>document.querySelector(`#ansSel_${qid}_${aid}`)).classList.add("selected-answer");
}

/**************************
 * Student Class listeners
 *************************/
function onAnswerClick(event: Event) {
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
            StudentClassUpdateAnswer(qid, aid);
            return;
        }
        studentClassSubmitAnswerFail("Error: Can't connect to server");
    };

    req.onerror = function () {
        studentClassSubmitAnswerFail("Error: Can't connect to server");
    };

    req.onabort = function () {
        studentClassSubmitAnswerFail("Error: Can't connect to server");
    };

    // if question previously selected PUT else POST
    if ((<question>getQuestion(info.currentClass, qid)).selected_answer === "") {
        req.open("POST", `/api/v0/classes/${encodeURI(info.currentClass)}/questions/${encodeURI(qid)}`);
    } else {
        req.open("PUT", `/api/v0/classes/${encodeURI(info.currentClass)}/questions/${encodeURI(qid)}`);
    }

    req.send(JSON.stringify(reqJSON));
}

/********************************
 * Student Class Listeners setup
 *******************************/
function studentClassListeners() {
    // refresh listener
    let refreshDiv: HTMLElement = <HTMLElement>document.querySelector("#student_refresh_questions");
    refreshDiv.onclick = studentClassUpdateQuestions;

    // answer listeners
    let selectAnswers = <NodeListOf<HTMLElement>>document.querySelectorAll("[id^='ansSel_']");
    for (var i = 0; i < selectAnswers.length; ++i) {
        selectAnswers[i].onclick = onAnswerClick;
    }
}

/**********************************
 * student failed request handlers
 *********************************/
function displayStudentClassFail(error: string) {
    console.log("Class error: ", error);
}

function studentClassSubmitAnswerFail(error: string) {
    console.log("Submit answer error: ", error);
}

/*****************
 * main functions
 ****************/
function setupListeners() {
    setupLoginListeners();
}

/*******************
 * Helper functions
 ******************/
function getQuestion(cid: string, qid: string): question | undefined {
    let Class: Class | undefined = info.classList.get(cid);
    if (Class === undefined) {
        return undefined;
    }
    return Class.questions.find(question => question.question_id === qid);
}

setupListeners();