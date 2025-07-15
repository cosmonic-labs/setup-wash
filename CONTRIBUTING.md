# Contributing to setup-wash

Thank you for your interest in contributing to the `setup-wash` GitHub Action! We welcome contributions of all kinds, including bug reports, feature requests, code improvements, and documentation updates.

## Development Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/cosmonic-labs/setup-wash.git
   cd setup-wash
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the project:**

   ```bash
   npm run build
   ```

4. **Run tests:**

   ```bash
   npm test
   ```

## Linting

We use [GitHub Super-Linter](https://github.com/github/super-linter) to ensure code quality and consistency. You can run the linter locally using Docker:

```bash
# optionally add --platform linux/amd64 if on arm
docker run \
   -e "FILTER_REGEX_EXCLUDE=dist/**/*" \
   -e VALIDATE_JAVASCRIPT_ES=false \
   -e VALIDATE_JSCPD=false \
   -e VALIDATE_TYPESCRIPT_ES=false \
   -e FIX_MARKDOWN_PRETTIER=true \
   -e FIX_YAML_PRETTIER=true \
   -e DEFAULT_BRANCH=main \
   -e RUN_LOCAL=true \
   -v .:/tmp/lint \
   ghcr.io/super-linter/super-linter:slim-latest
```

This will lint your code and documentation files according to the project's standards. Please ensure your changes pass linting before submitting a pull request.

> [Node.js](https://nodejs.org) handy (20.x or later should work!). If you are
> using a version manager like [`nodenv`](https://github.com/nodenv/nodenv) or
> [`fnm`](https://github.com/Schniz/fnm), this template has a `.node-version`
> file at the root of the repository that can be used to automatically switch to
> the correct version when you `cd` into the repository. Additionally, this
> `.node-version` file is used by GitHub Actions in any `actions/setup-node`
> actions.

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

2. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

3. :white_check_mark: Run the tests

   ```bash
   $ npm test
     ✓ wait 500 ms (504ms)
   ...
   ```

## Testing and Coverage

This project uses Jest for testing. The tests are located in the `__tests__/` directory with a `.test.ts` extension. Mock fixtures for dependencies are located in the `__fixtures__/` directory.

### Test Structure

The test files are organized as follows:

- `__tests__/main.test.ts`: Tests for the main functionality of the GitHub Action
- `__tests__/wait.test.ts`: Tests for the wait utility function
- `__fixtures__/`: Contains mock implementations of dependencies:
  - `core.ts`: Mocks for @actions/core
  - `exec.ts`: Mocks for @actions/exec
  - `fs.ts`: Mocks for fs
  - `os.ts`: Mocks for os
  - `path.ts`: Mocks for path

The tests use Jest's mocking capabilities to isolate the code being tested from its dependencies. This allows for more reliable and focused testing.

### Running Tests

To run the tests:

```bash
npm test
```

### Test Coverage

Test coverage is automatically calculated when running tests. To generate a coverage report and badge:

```bash
npm run coverage
```

This will create a coverage badge in the `badges/` directory and detailed reports in the `coverage/` directory.

### Adding New Tests

When adding new tests to the project, follow these guidelines:

1. Place test files in the `__tests__/` directory with a `.test.ts` extension
2. Use the existing mock fixtures in `__fixtures__/` for dependencies
3. Import the module under test dynamically after setting up mocks:

   ```typescript
   // Set up mocks first
   jest.mock('@actions/core', () => ({
     // mock implementations
   }))

   // Then dynamically import the module under test
   beforeEach(async () => {
     // Reset mocks
     jest.resetAllMocks()

     // Set up mock implementations

     // Import the module
     ;({ run } = await import('../src/main.js'))
   })
   ```

4. Write tests that focus on the functionality rather than implementation details
5. Run tests with `npm test` to ensure they pass

### Continuous Integration

A GitHub Actions workflow is set up to run tests and update coverage information on every push to the main branch and on pull requests. The workflow is defined in `.github/workflows/ci.yml`.

## Submitting a Pull Request

1. Fork the repository and create your branch from `main`.
1. Make your changes and add tests as needed.
1. Format, test, and build the action

   ```bash
   npm run all
   ```

   > This step is important! It will run [`rollup`](https://rollupjs.org/) to
   > build the final JavaScript action code with all dependencies included. If
   > you do not run this step, your action will not work correctly when it is
   > used in a workflow.

1. (Optional) Test your action locally

   The [`@github/local-action`](https://github.com/github/local-action) utility
   can be used to test your action locally. It is a simple command-line tool
   that "stubs" (or simulates) the GitHub Actions Toolkit. This way, you can run
   your TypeScript action locally without having to commit and push your changes
   to a repository.

   The `local-action` utility can be run in the following ways:

   - Visual Studio Code Debugger

     Make sure to review and, if needed, update
     [`.vscode/launch.json`](./.vscode/launch.json)

   - Terminal/Command Prompt

     ```bash
     # npx @github/local action <action-yaml-path> <entrypoint> <dotenv-file>
     npx @github/local-action . src/main.ts .env
     ```

   You can provide a `.env` file to the `local-action` CLI to set environment
   variables used by the GitHub Actions Toolkit. For example, setting inputs and
   event payload data used by your action. For more information, see the example
   file, [`.env.example`](./.env.example), and the
   [GitHub Actions Documentation](https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables).

1.Submit a pull request with a clear description of your changes.

## Publishing a New Release

This project includes a helper script, [`script/release`](./script/release)
designed to streamline the process of tagging and pushing new releases for
GitHub Actions.

GitHub Actions allows users to select a specific version of the action to use,
based on release tags. This script simplifies this process by performing the
following steps:

1. **Retrieving the latest release tag:** The script starts by fetching the most
   recent SemVer release tag of the current branch, by looking at the local data
   available in your repository.
1. **Prompting for a new release tag:** The user is then prompted to enter a new
   release tag. To assist with this, the script displays the tag retrieved in
   the previous step, and validates the format of the inputted tag (vX.X.X). The
   user is also reminded to update the version field in package.json.
1. **Tagging the new release:** The script then tags a new release and syncs the
   separate major tag (e.g. v1, v2) with the new release tag (e.g. v1.0.0,
   v2.1.2). When the user is creating a new major release, the script
   auto-detects this and creates a `releases/v#` branch for the previous major
   version.
1. **Pushing changes to remote:** Finally, the script pushes the necessary
   commits, tags and branches to the remote repository. From here, you will need
   to create a new release in GitHub so users can easily reference the new tags
   in their workflows.

### Updating Licenses

Whenever you install or update dependencies, you can use the Licensed CLI to
update the licenses database. To install Licensed, see the project's
[Readme](https://github.com/licensee/licensed?tab=readme-ov-file#installation).

To update the cached licenses, run the following command:

```bash
licensed cache
```

To check the status of cached licenses, run the following command:

```bash
licensed status
```

---

Thank you for helping make `setup-wash` better!
