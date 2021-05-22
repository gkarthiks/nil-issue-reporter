const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

try {
    var eventName = github.context.eventName
    if (eventName.startsWith("issue")) {
        var nilFileLoc = core.getInput("nil-file").trim();
        core.info("The NIL file picked up for comparative scan is from: "+nilFileLoc)
        var nilFileData = fs.readFileSync(nilFileLoc, 'utf8');

        var nilWordArray = nilFileData.toLocaleLowerCase().split(',');
        core.info(nilWordArray)



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
