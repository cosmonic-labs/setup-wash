# setup-wash-action

**GitHub Action to install the wash CLI for wasmCloud development.**

## Overview

This action installs the [wash](https://github.com/cosmonic-labs/wash) CLI, a tool for developing and managing WebAssembly (Wasm) components with [wasmCloud](https://wasmcloud.com/).

## Usage

Add the following step to your workflow to install `wash`:

```yaml
- name: Setup wash CLI
 uses: cosmonic-labs/setup-wash-action@main
 with:
  wash-version: latest # Or specify a version, e.g. "0.51.1"
```

### Inputs

| Name         | Description                                                                | Default |
| ------------ | -------------------------------------------------------------------------- | ------- |
| wash-version | The version of wash to install (e.g., `0.51`, `0.51.1`, `^0.51`, `latest`) | latest  |

## Example Workflow

```yaml
name: wasmCloud Build

on: [push]

jobs:
 build:
  runs-on: ubuntu-latest
  steps:
   - uses: actions/checkout@v4
   - name: Setup wash CLI
    uses: cosmonic-labs/setup-wash-action@main
    with:
     wash-version: latest
   - name: Check wash version
    run: wash --version
```

## How it Works

This action uses [`taiki-e/cache-cargo-install-action`](https://github.com/taiki-e/cache-cargo-install-action), which leverages [`actions/cache`](https://github.com/actions/cache) to efficiently cache and install the wash CLI from the official repository. This speeds up workflow runs by avoiding repeated downloads and builds.
