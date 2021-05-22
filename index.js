const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

try {
    var eventName = github.context.eventName
    if (eventName.startsWith("issue")) {
        var githubToken = core.getInput('token');
        var nilFileLoc = core.getInput("nil-file").trim();
        core.info("The NIL file picked up for comparative scan is from: "+nilFileLoc)
        var nilFileData = fs.readFileSync(nilFileLoc, 'utf8');
        var nilWordArray = nilFileData.toLocaleLowerCase().split(',');


        core.info(github.context.payload);


        // Parsing the issue
        var issueContext = github.context.payload.issue.body;
        var issueNumber = github.context.payload.issue.number;
        var issueTitle = github.context.payload.issue.title;

        core.info("Issue number: "+issueNumber)
        core.info("Issue title: "+issueTitle)

        // Create RegEx for parsing the data and comparing the nil
        var regEx = new RegExp(nilWordArray.join('|'), 'gi');

        validateAndComment(issueTitle, regEx, githubToken);
        validateAndComment(issueContext, regEx, githubToken);
    }



//   // `who-to-greet` input defined in action metadata file
//   const nameToGreet = core.getInput('who-to-greet');
//   console.log(`Hello ${nameToGreet}!`);
//   const time = (new Date()).toTimeString();
//   core.setOutput("time", time);
//   // Get the JSON webhook payload for the event that triggered the workflow
//   const payload = JSON.stringify(github.context.payload, undefined, 2)
//   console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}


// Validates the provided string for non-inclusive language
function validateAndComment(stringToValidate, regEx, githubToken) {
    core.info("Validating the given string for non-inclusive language with regEx: "+regEx);
    var matchedNIL = stringToValidate.toLocaleLowerCase().match(regEx);

    if (matchedNIL != null && matchedNIL.length > 0) {
        core.info("Got the following non-inclusive language in the context: "+matchedNIL);
        var bodyString = "Hi, you have the following non-inclusive language in the issue, please rephrase the sentence with inclusive language. Refer https://inclusivenaming.org/language/word-list/";
        commentToIssue(bodyString, githubToken)
    } else {
        core.info("Hurray! The content is completely inclusive!!!");
    }

}


// Commenting back to issue with provided message
function commentToIssue(body, githubToken) {
    core.info("=========================================");
    core.info(JSON.stringify(github.getOctokit(githubToken)));
    github.getOctokit(githubToken).issues.createComment({
        issue_number: github.context.issue.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: body
    });
}