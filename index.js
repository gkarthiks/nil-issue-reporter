const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const _str = require('underscore.string');

const ISSUE_TITLE_CTX = "issue title";
const ISSUE_DESC_CTX = "issue description";

var isLabelSet = false;
var isTitleInclusive = false;
var isDescInclusive = false;

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
        if (nilWordArray.length > 0) {
            var regEx = new RegExp(nilWordArray.join('|'), 'gi');

            core.info("Issue number: "+issueNumber)
            core.info("Issue title: "+issueTitle)
    
            validateAndComment(issueTitle, regEx, issueAuthor, ISSUE_TITLE_CTX, labelArray, githubToken, eventName);
            validateAndComment(issueContext, regEx, issueAuthor, ISSUE_DESC_CTX, labelArray, githubToken, eventName);
        } else {
            core.setFailed("Non Inclusive word list to restrict is not defined yet. Please define the words to be resricted.");
            commentToIssue("The non-inclusive word list is not defined. Please ask your admin to add the list of words to restrict and then comment `/validate`.", labelArray, githubToken);
        }
    }
    
} catch (error) {
  core.setFailed(error.message);
}


// Validates the provided string for non-inclusive language
function validateAndComment(stringToValidate, regEx, issueAuthor, context, labelArray, githubToken, eventName) {

    core.info("Validating the given string for non-inclusive language with regEx: "+regEx);
    var matchedNIL = stringToValidate.toLocaleLowerCase().match(regEx);
    
    if (matchedNIL != null && matchedNIL.length > 0) {
        var deDupeMatchedNIL = new Set(matchedNIL);
        core.info("Got the following non-inclusive language in the context: "+[...deDupeMatchedNIL]);
        var bodyString = `Hi @`+issueAuthor.trim()+`, you have the below mentioned non-inclusive language in the `+context+`, please rephrase the sentence with inclusive language. Refer https://inclusivenaming.org/language/word-list/. After reformatting the statement, please comment /validate to validate your statements.

        `+[...deDupeMatchedNIL];
        
        commentToIssue(bodyString, labelArray, githubToken)
    } else if (eventName.startsWith("issue_comment")) {
        setContextBool(context)
        if (isDescInclusive && isTitleInclusive) {
            removeLabel(labelArray)
        }
    } else {
        setContextBool(context)
        core.info("Hurray! The content is completely inclusive!!!");
    }

}

// Sets true for the title or description context if inclusive.
function setContextBool(context) {
    if (context == ISSUE_TITLE_CTX) {
        isTitleInclusive = true;
    }
    if (context == ISSUE_DESC_CTX) {
        isDescInclusive = true;
    }
}

// reads the data of the file from the specified path,
// if file doesn't exist, throws an error and sets the workflow to fail status
function readFileFrom(filePath) {
    try {
        return fs.readFileSync(nilFileLoc, 'utf8');
    } catch (err) {
        console.error('Error occured while reading the file', err);
        core.setFailed('Error occured while reading the file', err);
    }
}

// Commenting back to issue with provided message
function commentToIssue(body, labelArray, githubToken) {
    // Call to set the labels only if its not already set in the title validation
    if (isLabelSet == false) {
        addLabel(labelArray, githubToken);
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
    return _str.words(commaString, ",").map(item => item.trim());
}

// Removes the specified non inclusive labels from the issue
function removeLabel(labelArray) {
    if (labelArray.length > 0) {
        labelArray.forEach(function(label) {
            try {
                github.getOctokit(githubToken).rest.issues.removeLabel({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    issue_number: github.context.issue.number,
                    name: label
                });
            } catch (e) {
                console.error('Error occured while adding labels', e);
                core.setFailed('Error occured while adding labels', e);
            }
        })
    }
}

// Adds the specific label to the issue
function addLabel(labelArray, githubToken) {
    if (labelArray.length > 0) {
        try {
            github.getOctokit(githubToken).rest.issues.addLabels({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                issue_number: github.context.issue.number,
                labels: labelArray
            });
            isLabelSet = true;
        } catch (e) {
            console.error('Error occured while adding labels', e);
            core.setFailed('Error occured while adding labels', e);
        }
    }
}