const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

try {
    var eventName = github.context.eventName
    if (eventName.startsWith("issue")) {

        // Parsing the issue
        var issueContext = github.context.payload.issue.body;
        var issueNumber = github.context.payload.issue.number;
        var issueTitle = github.context.payload.issue.title;
        var issueAuthor = github.context.payload.issue.user.login;

        var githubToken = core.getInput('token');
        var nilFileLoc = core.getInput("nil-file").trim();
        var commaSeperatedLbl = core.getInput("labels").trim();
        var labelArray = commaSeperatedStrToArray(commaSeperatedLbl);
        
        core.info("The NIL file picked up for comparative scan is from: "+nilFileLoc)
        var nilFileData = readFileFrom(nilFileLoc);

        // Create RegEx for parsing the data and comparing the nil
        var nilWordArray = commaSeperatedStrToArray(nilFileData);
        var regEx = new RegExp(nilWordArray.join('|'), 'gi');

        core.info("Issue number: "+issueNumber)
        core.info("Issue title: "+issueTitle)

        validateAndComment(issueTitle, regEx, issueAuthor, "issue title", labelArray, githubToken);
        validateAndComment(issueContext, regEx, issueAuthor, "issue description", labelArray, githubToken);
    }

} catch (error) {
  core.setFailed(error.message);
}


// Validates the provided string for non-inclusive language
function validateAndComment(stringToValidate, regEx, issueAuthor, context, labelArray, githubToken) {
    core.info("Validating the given string for non-inclusive language with regEx: "+regEx);
    var matchedNIL = stringToValidate.toLocaleLowerCase().match(regEx);
    if (matchedNIL != null && matchedNIL.length > 0) {
        var deDupeMatchedNIL = new Set(matchedNIL);
        core.info("Got the following non-inclusive language in the context: "+[...deDupeMatchedNIL]);
        var bodyString = `Hi @`+issueAuthor.trim()+`, you have the following non-inclusive language in the `+context+`, please rephrase the sentence with inclusive language. Refer https://inclusivenaming.org/language/word-list/

        `+[...deDupeMatchedNIL];
        commentToIssue(bodyString, labelArray, githubToken)
    } else {
        core.info("Hurray! The content is completely inclusive!!!");
    }

}

// reads the data of the file from the specified path,
// if file doesn't exist, throws an error and sets the workflow to fail status
function readFileFrom(filePath) {
    try {
        return fs.readFileSync(nilFileLoc, 'utf8');
    } catch (err) {
        console.error('Error occured while reading the file', e);
        core.setFailed('Error occured while reading the file', e);
    }
}

// Commenting back to issue with provided message
function commentToIssue(body, labelArray, githubToken) {
    try {
        github.getOctokit(githubToken).rest.issues.addLabels({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: github.context.issue.number,
            labels: labelArray
        });
    } catch (e) {
        console.error('Error occured while adding labels', e);
        core.setFailed('Error occured while adding labels', e);
    }

    try {
        github.getOctokit(githubToken).rest.issues.createComment({
            issue_number: github.context.issue.number,
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            body: body
        });
    } catch(e) {
        console.error('Error occured while commenting back to issue', e);
        core.setFailed('Error occured while commenting back to issue', e);
    }
}

// Returns the comma seperated string into cleansed array of strings
function commaSeperatedStrToArray(commaString) {
    return commaString.split(",").map(item => item.trim());
}