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
  parse-issue-and-create-pr:
    if: github.event_name != 'push' && github.event_name != 'pull_request'
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
        uses: gkarthiks/nil-issue-reporter@0.1.0
        id: parseissue
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          labels: non-inclusive
```

Currently this action will scan for the issue title and body for the non-inclusive language and comments back on the issue addressing the author of the issue and optionally adds the label if specified in the workflow YML file.

## Roadmaps
* Auto validate for edit on the issue body
* Extend for issue comments
* Extend for Pull Requests