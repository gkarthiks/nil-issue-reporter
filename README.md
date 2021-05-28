# Non-Inclusive Language Reporter

This is a GitHub Action to report the non-inclusive language in the issues. 

## Usage

```yaml
name: Parse and Comment back on issue
on:
  issues:
    types: ['opened']
  issue_comment:
    types: ['created']

jobs:
  parse-issue:
    if: github.event_name != 'push' && github.event_name != 'pull_request' || contains(github.event.comment.body, '/validate')
    runs-on: ubuntu-latest
    name: Parse issue, scan and comment back for non-inclusive language
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '12'
          check-latest: true
      - name: NIL Reporter
        uses: gkarthiks/nil-issue-reporter@0.2.0
        id: parseissue
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          labels: non-inclusive
```

Currently this action will scan for the issue title and body for the non-inclusive language and comments back on the issue addressing the author of the issue and optionally adds the label if specified in the workflow YML file.


## Custom Command
If the above action YML is used, the command to re-trigger the validation is `/validate`; i.e, after correcting the issue title and/or issue description, if the validation needs to happen again then the user needs to comment `/validate` in the issue. This will re-trigger the check, validates for inclusive language, and removes the non-inclusive label if any attached to the issue in prior runs.

This can be customized by changing it in the workflow YML file. For example, if the command needs to be `validate nil` then on the `if` condition in under `jobs.parse-issue` the `/validate` needs to be replaced with `validate nil`.

## Roadmaps
* Auto validate for edit on the issue body
* Extend for issue comments
* Extend for Pull Requests