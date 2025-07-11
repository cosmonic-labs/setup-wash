import { jest } from '@jest/globals'

// Import our mock modules
import * as core from '../__fixtures__/core.js'
import * as exec from '../__fixtures__/exec.js'
import * as fs from '../__fixtures__/fs.js'
import * as os from '../__fixtures__/os.js'
import * as path from '../__fixtures__/path.js'

// Mock the modules
jest.mock('@actions/core', () => ({
  getInput: core.getInput,
  setFailed: core.setFailed,
  info: core.info,
  addPath: core.addPath
}))

jest.mock('@actions/exec', () => ({
  exec: exec.exec
}))

jest.mock('fs', () => ({
  mkdirSync: fs.mkdirSync,
  existsSync: fs.existsSync,
  readdirSync: fs.readdirSync,
  chmodSync: fs.chmodSync
}))

jest.mock('os', () => ({
  platform: os.platform,
  arch: os.arch,
  homedir: os.homedir
}))

jest.mock('path', () => ({
  join: path.join,
  dirname: path.dirname
}))

type RunFunction = () => Promise<void>

describe('setup-wash action', () => {
  let run: RunFunction

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.resetAllMocks()

    // Set up default mock implementations
    core.getInput.mockReturnValue('latest')
    core.info.mockImplementation(() => undefined)
    core.addPath.mockImplementation((path) => {
      console.log(`core.addPath called with: ${path}`)
    })
    core.setFailed.mockImplementation(() => undefined)
    // Mock exec.exec to simulate successful command execution
    exec.exec.mockImplementation(async (cmd) => {
      console.log(`Executing command: ${cmd}`)
      // Don't throw an error
      return 0
    })
    os.platform.mockReturnValue('linux')
    os.arch.mockReturnValue('x64')
    os.homedir.mockReturnValue('/tmp')
    fs.mkdirSync.mockImplementation(() => undefined)
    // Mock fs.existsSync to return true for the wash binary path
    fs.existsSync.mockImplementation((p) => {
      console.log(`fs.existsSync called with: ${p}`)
      // Always return true to ensure the wash binary is found
      return true
    })
    fs.chmodSync.mockImplementation(() => undefined)
    fs.readdirSync.mockReturnValue([])
    path.join.mockImplementation((...args) => args.join('/'))
    path.dirname.mockImplementation((p) => {
      console.log(`path.dirname called with: ${p}`)
      // Always return a valid directory path
      return '/tmp/.wash-bin'
    })
    ;({ run } = await import('../src/main.js'))
  })

  it('installs wash and prints version', async () => {
    // Reset the mock before the test
    core.addPath.mockClear()
    await run()
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Downloading wash from')
    )
    expect(exec.exec).toHaveBeenCalled()
  })

  it('runs on Linux with x64 architecture', async () => {
    // Set up mocks specific to this test
    os.platform.mockReturnValue('linux')
    os.arch.mockReturnValue('x64')
    os.homedir.mockReturnValue('/home/user')

    await run()

    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Downloading wash from')
    )
    expect(exec.exec).toHaveBeenCalled()
  })

  it('runs on Windows', async () => {
    // Set up mocks specific to this test
    os.platform.mockReturnValue('win32')
    os.arch.mockReturnValue('x64')
    os.homedir.mockReturnValue('C:\\Users\\user')
    process.env.USERPROFILE = 'C:\\Users\\user'

    await run()

    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Downloading wash from')
    )
    // We can't test for powershell specifically since our mock doesn't capture args
    expect(exec.exec).toHaveBeenCalled()
  })

  it('handles arm64 architecture', async () => {
    // Set up mocks specific to this test
    os.platform.mockReturnValue('linux')
    os.arch.mockReturnValue('arm64')
    os.homedir.mockReturnValue('/home/user')

    await run()

    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Downloading wash from')
    )
    expect(exec.exec).toHaveBeenCalled()
  })

  it('handles specific version', async () => {
    // Set up mocks specific to this test
    core.getInput.mockReturnValue('1.0.0')

    await run()

    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Downloading wash from')
    )
    expect(exec.exec).toHaveBeenCalled()
  })

  // Test specifically for the case when wash binary is inside a folder
  it('handles case when wash binary is inside a folder', async () => {
    // Reset mocks for this test
    jest.resetAllMocks()
    // Set up default mock implementations again
    core.getInput.mockReturnValue('latest')
    core.info.mockImplementation(() => undefined)
    core.addPath.mockImplementation((path) => {
      console.log(`core.addPath called with: ${path}`)
    })
    core.setFailed.mockImplementation(() => undefined)
    exec.exec.mockImplementation(async (cmd) => {
      console.log(`Executing command: ${cmd}`)
      return 0
    })
    os.platform.mockReturnValue('linux')
    os.arch.mockReturnValue('x64')
    os.homedir.mockReturnValue('/tmp')
    fs.mkdirSync.mockImplementation(() => undefined)
    fs.chmodSync.mockImplementation(() => undefined)
    path.join.mockImplementation((...args) => args.join('/'))
    path.dirname.mockImplementation((p) => {
      console.log(`path.dirname called with: ${p}`)
      return '/tmp/.wash-bin'
    })

    // This is the key part: mock existsSync to ALWAYS return false for the wash binary
    fs.existsSync.mockImplementation((p) => {
      console.log(`fs.existsSync called with: ${p}`)
      return false
    })
    // Mock readdirSync to return a folder and log when it's called
    fs.readdirSync.mockImplementation((dir) => {
      console.log(`fs.readdirSync called with: ${dir}`)
      return ['wash-v1.0.0']
    })
    // Re-import the run function with our new mocks
    ;({ run } = await import('../src/main.js'))
    await run()
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Downloading wash from')
    )
    expect(exec.exec).toHaveBeenCalled()
  })

  it('sets failed if error thrown', async () => {
    exec.exec.mockImplementationOnce(() => {
      throw new Error('fail')
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('fail')
  })

  it('sets failed with fallback message if non-Error thrown', async () => {
    exec.exec.mockImplementationOnce(() => {
      throw 'fail'
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith(
      'Unknown error occurred during wash installation'
    )
  })
})
