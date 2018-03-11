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
    classList: Class[];
    currentClass: string;
};

var info: globals = {
    name: null,
    teachIDs: [],
    takeIDs: [],
    classList: [],
    currentClass: null,
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
    let template = document.querySelector("#new_join_template");

    // compile the template
    let func = doT.template(template.innerHTML);
    // render the data into the template
    let rendered = func();
    // insert the rendered template into the DOM
    joinDiv.innerHTML = rendered;

    // create listener
    let joinBtn = document.querySelector("#join_class_btn");
    joinBtn.addEventListener("click", onJoinClassBtnClick);
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
    let template = document.querySelector("#new_create_template");

    // compile the template
    let func = doT.template(template.innerHTML);
    // render the data into the template
    let rendered = func();
    // insert the rendered template into the DOM
    createDiv.innerHTML = rendered;

    // create listener
    let createBtn = document.querySelector("#new_class_btn");
    createBtn.addEventListener("click", onCreateClassBtnClick);
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
    if (nameInput.value === "" && info.name === null) {
        joinClassReqFail("Error: Requires your name");
        return;
    } else if (info.name === null) {
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
    req.addEventListener("load", function () {
        if (req.readyState === 4 && req.status === 200) {
            let res: XMLHttpRequestResponseType = JSON.parse(req.responseText);
            console.log("join class req success", res);
            // TODO: implement switching pages
            // add class_id to list
            return;
        }
        joinClassReqFail("Failed to join class");
    });

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
    if (nameInput.value === "" && info.name === null) {
        createClassReqFail("Error: Requires your name");
        return;
    } else if (info.name === null) {
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
    req.addEventListener("load", function () {
        if (req.readyState === 4 && req.status === 200) {
            let res: createRequest = JSON.parse(req.responseText);
            console.log("create class req success", res);
            // TODO: implement switching pages
            info.classList.push(res.class);
            info.currentClass = res.class.class_id;
            switchInstructorClassView(res.class);
            return;
        }
        createClassReqFail("Error: Failed to create class");
    });

    req.addEventListener("error", function () {
        createClassReqFail("Error: Can't connect to server");
    });

    req.addEventListener("abort", function () {
        createClassReqFail("Error: Can't connect to server");
    });

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
function switchInstructorClassView(Class: Class) {
    // hide login page
    hideLoginPage();

    // call display view
    displayInstructorClassPage(Class);
}

function switchStudentClassView() {
    // hide login page

    // call display view
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
function displayInstructorClassPage(Class: Class) {
    // request questions
    let req: XMLHttpRequest = new XMLHttpRequest();

    // response listener
    req.addEventListener("load", function () {
        if (req.readyState === 4 && req.status === 200) {
            // get add questions to class object
            let res: question[] = JSON.parse(req.responseText);
            console.log("get questions req success", res);

            Class.questions = res;
            instructorClassDisplayQuestions(Class);
            return;
        }
        displayInstructorClassFail("Error: Failed to create class");
    });

    req.addEventListener("error", function () {
        displayInstructorClassFail("Error: Can't connect to server");
    });

    req.addEventListener("abort", function () {
        displayInstructorClassFail("Error: Can't connect to server");
    });

    req.open("GET", `/api/v0/instructors/classes/${Class.class_id}/questions`);
    req.send();

    // display instructor page
    displayInstructorPage();

    // display class page
    let classDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page");
    classDiv.classList.remove("hidden");
}

function instructorClassDisplayQuestions(Class: Class) {
    let classPageDiv: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page");

    // obtain the template
    let template: HTMLElement = <HTMLElement>document.querySelector("#instructor_class_page_template");

    // compile the template
    let func = doT.template(template.innerHTML);
    // render the data into the template
    let rendered = func(Class);
    // insert the rendered template into the DOM
    classPageDiv.innerHTML = rendered;

    // add listeners
    instructorClassListeners();
}

/*********************************
 * Instructor Class View updating
 ********************************/
// clean up
function instructorClassAddQuestion(question: question) {
    let questionList: HTMLElement = <HTMLElement>document.querySelector("#instr_question_list");

    // obtain the template
    let template: HTMLElement = <HTMLElement>document.querySelector("#instr_question_template");

    // compile the template
    let func = doT.template(template.innerHTML);
    // render the data into the template
    let rendered = func(question);
    // insert the rendered template into the DOM

    // insert into end of questions list
    console.log(rendered);
    questionList.innerHTML += rendered;
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
    req.addEventListener("load", function () {
        if (req.readyState === 4 && req.status === 200) {
            // get add questions to class object
            let res: question = JSON.parse(req.responseText);
            console.log("create question req success", res);

            // insert question to array
            info.classList.filter(x => x.class_id = info.currentClass)[0].questions.push(res);

            instructorClassAddQuestion(res);
            return;
        }
        instrCreateQuestionFail("Error: Failed to create question");
    });

    req.addEventListener("error", function () {
        instrCreateQuestionFail("Error: Can't connect to server");
    });

    req.addEventListener("abort", function () {
        instrCreateQuestionFail("Error: Can't connect to server");
    });

    req.open("POST", `/api/v0/instructors/classes/${info.currentClass}/questions`);
    req.send(JSON.stringify(reqJSON));
}

/***********************************
 * Instructor Class Listeners setup
 **********************************/
function instructorClassListeners() {
    let deleteQuestions = document.querySelectorAll("[id^='instrQuestionDel_']");
    for (var i = 0; i < deleteQuestions.length; ++i) {
        // deleteQuestions[i].split("_")[1]
    }

    let addAnswers = document.querySelectorAll("[id^='instrQuestionAdd_']");
    for (var i = 0; i < addAnswers.length; ++i) {
        // addAnswers[i].split("_")[1]
    }

    let questionsPublic = document.querySelectorAll("[id^='instrQuestionPub_']");
    for (var i = 0; i < questionsPublic.length; ++i) {
        // questionsPublic[i].split("_")[1]
    }

    let questionsResults = document.querySelectorAll("[id^='instrQuestionRes_']");
    for (var i = 0; i < questionsResults.length; ++i) {
        // questionsResults[i].split("_")[1]
    }

    instructorClassAnswerListeners();

    console.log("add create question listener");

    let createQuestion: HTMLElement = <HTMLElement>document.querySelector("#instr_new_question_btn");
    createQuestion.addEventListener("click", onCreateQuestionClick);
}

function instructorClassAnswerListeners() {
    let deleteAnswers = document.querySelectorAll("[id^='ansDel_']");
    // for each deleteAnswers
    for (var i = 0; i < deleteAnswers.length; ++i) {
        // deleteAnswers[i].split("_")[1]
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
    // body...
}

function instrCreateQuestionFail(error: string) {
    // body...
}

/*****************
 * main functions
 ****************/
function setupListeners() {
    setupLoginListeners();
}

setupListeners();