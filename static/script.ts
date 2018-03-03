function onLoginJoinClick() {
    let joinDiv: HTMLElement = <HTMLElement>document.querySelector("#join");
    if (joinDiv === null) {
        return
    }
    // check if something is already there
    if (joinDiv.innerHTML !== "") {
        joinDiv.innerHTML = "";
        return;
    }
    // obtain the template
    let template = document.querySelector("#new_join_template");
    if (template === null) {
        return;
    }
    // compile the template
    let func = doT.template(template.innerHTML);
    // render the data into the template
    let rendered = func();
    // insert the rendered template into the DOM
    joinDiv.innerHTML = rendered;

    // create listener
    let joinBtn = document.querySelector("#join_class_btn");
    if (joinBtn !== null) {
        joinBtn.addEventListener("click", onJoinClassBtnClick);
        console.log("add join btn listener");
    }
}

function onJoinClassBtnClick() {
    console.log("onJoinClassBtnClick");
    //get info if exists
    let classIDInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#join_class_id");
    if (classIDInput === null || classIDInput.value === "") {
        return
    }
    let classID = classIDInput.value;

    //get name
    let nameInput: HTMLInputElement = <HTMLInputElement>document.querySelector("#student_name");
    if (nameInput === null || nameInput.value === "") {
        return
    }
    let name = nameInput.value;

    //make request
    let req = new XMLHttpRequest();

    // response function
    req.addEventListener("load", function () {
        let res = JSON.parse(req.responseText);
        console.log(res)
    });

    req.open("POST", `/api/v0/classes/${encodeURI(classID)}`);
    req.send(name);
    console.log(classID, name);
}

function onLoginCreateClick() {
    let createDiv: HTMLElement = <HTMLElement>document.querySelector("#create");
    if (createDiv === null) {
        return;
    }

    // check if something is already there
    if (createDiv.innerHTML !== "") {
        createDiv.innerHTML = "";
        return;
    }
    // obtain the template
    let template = document.querySelector("#new_create_template");
    if (template === null) {
        return;
    }
    // compile the template
    let func = doT.template(template.innerHTML);
    // render the data into the template
    let rendered = func();
    // insert the rendered template into the DOM
    createDiv.innerHTML = rendered;
}

function setupLoginListeners() {
    let join_heading = document.querySelector("#join_heading");
    if (join_heading != null){
        join_heading.addEventListener("click", onLoginJoinClick);
    }
    let createHeading = document.querySelector("#create_heading");
    if (createHeading != null) {
        createHeading.addEventListener("click", onLoginCreateClick);
    }
}

function setupListeners() {
    setupLoginListeners();
}

setupListeners();