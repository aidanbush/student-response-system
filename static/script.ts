/* login page */
type createRequest = {
    class: Class;
    person: person;
};

type joinRequest = {
    person: person;
};

type person = {
    name: string;
};

type Class = {
    class_name: string;
    class_id: string;
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

    //get name
    let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#student_name");
    if (nameInput.value === "") {
        joinClassReqFail("Error: Requires your name");
        return;
    }

    // create request json object
    let reqJSON: joinRequest = {
        person: {
            name: nameInput.value,
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
            return
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

    // TODO: check if have name already
    let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#instructor_name");
    if (nameInput.value === "") {
        createClassReqFail("Error: Requires your name");
        return;
    }

    // create request json object
    let reqJSON: createRequest = {
        person: {
            name: nameInput.value,
        },
        class: {
            class_name: classNameInput.value,
            class_id: null,
        },
    };

    // make request
    let req: XMLHttpRequest = new XMLHttpRequest();

    // response listener
    req.addEventListener("load", function () {
        if (req.readyState === 4 && req.status === 200) {
            let res: XMLHttpRequestResponseType = JSON.parse(req.responseText);
            console.log("create class req success", res);
            // TODO: implement switching pages
            return;
        }
        createClassReqFail("Error: Failed to create class");
    });

    req.addEventListener("error", function () {
        createClassReqFail("Error: Can't connect to server");
    });

    req.addEventListener("abort", function () {
        createClassReqFail("Error: Can't connect to server")
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

/************
 * listeners
 ***********/
function setupLoginListeners() {
    let joinHeading = document.querySelector("#join_heading");
    joinHeading.addEventListener("click", onLoginJoinClick);

    let createHeading = document.querySelector("#create_heading");
    createHeading.addEventListener("click", onLoginCreateClick);
}

function setupListeners() {
    setupLoginListeners();
}

setupListeners();