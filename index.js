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

        // Parsing the issue
        var issueContext = github.context.payload.issue.body;
        var issueNumber = github.context.payload.issue.number;
        var issueTitle = github.context.payload.issue.title;
        var issueAuthor = github.context.payload.issue.user.login;

        core.info("Issue number: "+issueNumber)
        core.info("Issue title: "+issueTitle)

        // Create RegEx for parsing the data and comparing the nil
        var regEx = new RegExp(nilWordArray.join('|'), 'gi');

        validateAndComment(issueTitle, regEx, issueAuthor, "issue title", githubToken);
        validateAndComment(issueContext, regEx, issueAuthor, "issue description", githubToken);
    }

} catch (error) {
  core.setFailed(error.message);
}


// Validates the provided string for non-inclusive language
function validateAndComment(stringToValidate, regEx, issueAuthor, context, githubToken) {
    core.info("Validating the given string for non-inclusive language with regEx: "+regEx);
    var matchedNIL = stringToValidate.toLocaleLowerCase().match(regEx);
    if (matchedNIL != null && matchedNIL.length > 0) {
        core.info("Got the following non-inclusive language in the context: "+matchedNIL);
        var bodyString = "Hi @"+issueAuthor.trim()+", you have the following non-inclusive language in the "+context+", please rephrase the sentence with inclusive language. Refer https://inclusivenaming.org/language/word-list/";
        commentToIssue(bodyString, githubToken)
    } else {
        core.info("Hurray! The content is completely inclusive!!!");
    }

}


// Commenting back to issue with provided message
function commentToIssue(body, githubToken) {
    github.getOctokit(githubToken).rest.issues.createComment({
        issue_number: github.context.issue.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: body
    });
}