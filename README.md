# setup-wash-action

**setup-wash-action** is a GitHub Action for installing the
[wash](https://github.com/wasmCloud/wash) CLI, the official tool for wasmCloud
development. This action makes it easy to add wash to your CI workflows.

## Features

- Installs the specified version of wash (or the latest by default)
- Cross-platform: Linux, macOS, and Windows
- Adds wash to the PATH for subsequent workflow steps

## Usage

Add the following step to your workflow:

```yaml
- name: Setup wash
  uses: cosmonic-labs/setup-wash-action@v1
  with:
    version: 'latest' # or specify a version like '0.24.0'
```

You can now use the `wash` CLI in later steps:

```yaml
- name: Check wash version
  run: wash --version
```

### Inputs

| Name    | Description                | Default |
| ------- | -------------------------- | ------- |
| version | Version of wash to install | latest  |

## Example Workflow

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cosmonic-labs/setup-wash-action@v1
        with:
          version: 'latest'
      - run: wash --version
      # ... your other steps ...
```
