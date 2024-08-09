var jpdbBaseURL = 'http://api.login2explore.com:5577';
var jpdbIRL = '/api/irl';
var jpdbIML = '/api/iml';
var schoolDBName = "SCHOOL-DB";
var studentRelationName = "STUDENT-TABLES";
var connToken = "90932127|-31949220193834007|90962136";

$(document).ready(function () {
    console.log("Document ready - initializing form");

    $("#rollNo").focus();

    // Initialize Flatpickr for date inputs
    flatpickr(".datepicker", {
        dateFormat: "Y-m-d",
        allowInput: true,
        disableMobile: "true"
    });

    $("#rollNo").change(function () {
        console.log("Roll No field changed");
        checkRollNo();
    });

    $("#saveBtn").click(function () {
        console.log("Save button clicked");
        saveData();
    });

    $("#updateBtn").click(function () {
        console.log("Update button clicked");
        updateData();
    });

    $("#resetBtn").click(function () {
        console.log("Reset button clicked");
        resetForm();
    });

    // Add animation to form fields
    $("input, textarea").focus(function() {
        $(this).parent().find("label").addClass("active");
    }).blur(function() {
        if ($(this).val() === '') {
            $(this).parent().find("label").removeClass("active");
        }
    });
});

function checkRollNo() {
    var rollNo = $("#rollNo").val();
    console.log("Checking Roll No:", rollNo);

    var jsonObj = {
        rollNo: rollNo
    };
    var reqString = createGETRequest(connToken, schoolDBName, studentRelationName, JSON.stringify(jsonObj));
    console.log("GET Request String:", reqString);

    jQuery.ajaxSetup({async: false});
    var resultObj = executeCommandAtGivenBaseUrl(reqString, jpdbBaseURL, jpdbIRL);
    jQuery.ajaxSetup({async: true});

    console.log("Result Object:", resultObj);

    if (resultObj.status === 400) {
        console.log("No existing record found. Preparing for new entry.");
        $("#saveBtn").prop("disabled", false);
        $("#updateBtn").prop("disabled", true);
        $("#resetBtn").prop("disabled", false);
        $("#rollNo").prop("disabled", false);
        enableFormFields(true);
        $("#fullName").focus();
    } else if (resultObj.status === 200) {
        console.log("Existing record found. Preparing for update.");
        $("#rollNo").prop("disabled", true);
        fillData(resultObj);
        $("#saveBtn").prop("disabled", true);
        $("#updateBtn").prop("disabled", false);
        $("#resetBtn").prop("disabled", false);
        enableFormFields(true);
        $("#fullName").focus();
    } else {
        console.error("Unexpected status:", resultObj.status);
    }

    logFormState();
}

function saveData() {
    var jsonStrObj = validateAndGetFormData();
    if (jsonStrObj === "") {
        return;
    }
    console.log("Data to save:", jsonStrObj);

    var putRequest = createPUTRequest(connToken, jsonStrObj, schoolDBName, studentRelationName);
    console.log("PUT Request:", putRequest);

    jQuery.ajaxSetup({async: false});
    var resultObj = executeCommandAtGivenBaseUrl(putRequest, jpdbBaseURL, jpdbIML);
    jQuery.ajaxSetup({async: true});

    console.log("Save result:", resultObj);

    resetForm();
    $("#rollNo").focus();
}

function updateData() {
    var jsonChg = validateAndGetFormData();
    if (jsonChg === "") {
        return;
    }
    console.log("Data to update:", jsonChg);

    var updateRequest = createUPDATERecordRequest(connToken, jsonChg, schoolDBName, studentRelationName, localStorage.getItem("recno"));
    console.log("UPDATE Request:", updateRequest);

    jQuery.ajaxSetup({async: false});
    var resultObj = executeCommandAtGivenBaseUrl(updateRequest, jpdbBaseURL, jpdbIML);
    jQuery.ajaxSetup({async: true});

    console.log("Update result:", resultObj);

    resetForm();
    $("#rollNo").focus();
}

function validateAndGetFormData() {
    var rollNo = $("#rollNo").val();
    var fullName = $("#fullName").val();
    var className = $("#class").val();
    var birthDate = $("#birthDate").val();
    var address = $("#address").val();
    var enrollmentDate = $("#enrollmentDate").val();

    if (rollNo === "") {
        alert("Roll No is required");
        $("#rollNo").focus();
        return "";
    }
    if (fullName === "") {
        alert("Full Name is required");
        $("#fullName").focus();
        return "";
    }
    if (className === "") {
        alert("Class is required");
        $("#class").focus();
        return "";
    }
    if (birthDate === "") {
        alert("Birth Date is required");
        $("#birthDate").focus();
        return "";
    }
    if (address === "") {
        alert("Address is required");
        $("#address").focus();
        return "";
    }
    if (enrollmentDate === "") {
        alert("Enrollment Date is required");
        $("#enrollmentDate").focus();
        return "";
    }

    var jsonStrObj = {
        rollNo: rollNo,
        fullName: fullName,
        class: className,
        birthDate: birthDate,
        address: address,
        enrollmentDate: enrollmentDate
    };
    console.log("Form Data JSON:", jsonStrObj);
    return JSON.stringify(jsonStrObj);
}

function fillData(resultObj) {
    console.log("Raw result object:", resultObj);

    if (!resultObj || !resultObj.data) {
        console.error("Invalid result object or missing data");
        alert("Error: Unable to retrieve student data");
        return;
    }

    let data;
    try {
        // Parse the data string directly, without expecting a 'record' property
        data = JSON.parse(resultObj.data);
    } catch (error) {
        console.error("Error parsing result data:", error);
        alert("Error: Unable to parse student data");
        return;
    }

    console.log("Parsed data:", data);

    if (!data || typeof data !== 'object') {
        console.error("Invalid data structure in parsed data");
        alert("Error: Invalid student data structure");
        return;
    }

    $("#fullName").val(data.fullName || "");
    $("#class").val(data.class || "");
    $("#birthDate").val(data.birthDate || "");
    $("#address").val(data.address || "");
    $("#enrollmentDate").val(data.enrollmentDate || "");

    if (data.rollNo) {
        localStorage.setItem("recno", data.rollNo);
        console.log("Roll No stored in localStorage:", data.rollNo);
    } else {
        console.warn("No rollNo found in data");
    }
}

function resetForm() {
    console.log("Resetting form");

    $("#rollNo").val("");
    $("#fullName").val("");
    $("#class").val("");
    $("#birthDate").val("");
    $("#address").val("");
    $("#enrollmentDate").val("");

    $("#rollNo").prop("disabled", false);
    enableFormFields(false);
    $("#saveBtn").prop("disabled", true);
    $("#updateBtn").prop("disabled", true);
    $("#resetBtn").prop("disabled", true);
    $("#rollNo").focus();

    // Reset form field animations
    $("label").removeClass("active");
    logFormState();
}

function enableFormFields(enable) {
    console.log("Enabling form fields:", enable);

    $("#fullName").prop("disabled", !enable);
    $("#class").prop("disabled", !enable);
    $("#birthDate").prop("disabled", !enable);
    $("#address").prop("disabled", !enable);
    $("#enrollmentDate").prop("disabled", !enable);
}

function logFormState() {
    console.log("Form State:", {
        rollNo: $("#rollNo").val(),
        fullName: $("#fullName").val(),
        class: $("#class").val(),
        birthDate: $("#birthDate").val(),
        address: $("#address").val(),
        enrollmentDate: $("#enrollmentDate").val(),
        saveBtn: $("#saveBtn").prop("disabled"),
        updateBtn: $("#updateBtn").prop("disabled"),
        resetBtn: $("#resetBtn").prop("disabled")
    });
}
