import { jest } from '@jest/globals'

// Import our mock modules
import * as core from '../__fixtures__/core.js'
import * as exec from '../__fixtures__/exec.js'
import * as fs from '../__fixtures__/fs.js'
import * as os from '../__fixtures__/os.js'
import * as path from '../__fixtures__/path.js'
import * as tc from '../__fixtures__/tool-cache.js'

// Mock the modules
jest.mock('@actions/core', () => ({
  getInput: core.getInput,
  setFailed: core.setFailed,
  info: core.info,
  addPath: core.addPath,
  setOutput: core.setOutput,
  warning: core.warning
}))

jest.mock('@actions/exec', () => ({
  exec: exec.exec
}))

jest.mock('@actions/tool-cache', () => ({
  find: tc.find,
  downloadTool: tc.downloadTool,
  extractZip: tc.extractZip,
  cacheDir: tc.cacheDir
}))

jest.mock('semver', () => ({
  maxSatisfying: jest.fn().mockImplementation(() => '0.15.0')
}))

jest.mock('fs', () => ({
  mkdirSync: fs.mkdirSync,
  existsSync: fs.existsSync,
  readdirSync: fs.readdirSync,
  chmodSync: fs.chmodSync,
  copyFileSync: jest.fn()
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

// Define a type for the exec options to avoid TypeScript errors
interface ExecOptions {
  listeners?: {
    stdout?: (data: Buffer) => void
  }
}

describe('setup-wash-action', () => {
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
    core.setOutput.mockImplementation((name, value) => {
      console.log(`core.setOutput called with: ${name}=${value}`)
    })

    // Mock exec.exec to simulate successful command execution
    exec.exec.mockImplementation(async (cmd) => {
      console.log(`Executing command: ${cmd}`)
      return 0
    })

    os.platform.mockReturnValue('linux')
    os.arch.mockReturnValue('x64')
    os.homedir.mockReturnValue('/tmp')
    fs.mkdirSync.mockImplementation(() => undefined)
    fs.existsSync.mockReturnValue(true)
    fs.chmodSync.mockImplementation(() => undefined)
    fs.readdirSync.mockReturnValue([])
    path.join.mockImplementation((...args) => args.join('/'))
    path.dirname.mockImplementation(() => '/tmp/.wash-bin')

    // Set up tool-cache mocks
    tc.find.mockReturnValue('')
    tc.downloadTool.mockResolvedValue('/tmp/downloaded-wash')
    tc.extractZip.mockRejectedValue(new Error('Not a zip file'))
    tc.cacheDir.mockReturnValue('/tool-cache/wash/0.15.0')

    // Set up a mock for exec.exec that captures stdout listeners
    exec.exec.mockImplementation((cmd, args, options: ExecOptions) => {
      console.log(`Executing command: ${cmd}`)
      if (options?.listeners?.stdout) {
        options.listeners.stdout(Buffer.from('wash 0.15.0'))
      }
      return Promise.resolve(0)
    })
    ;({ run } = await import('../src/main.js'))
  })

  // We're using regular tests instead of skipped tests to avoid ESLint warnings
  it('uses cached version when available', async () => {
    // Set up mocks specific to this test
    core.getInput.mockReturnValue('1.0.0')
    tc.find.mockReturnValue('/tool-cache/wash/1.0.0')

    await run()

    expect(tc.find).toHaveBeenCalledWith('wash', '1.0.0')
    expect(tc.downloadTool).not.toHaveBeenCalled()
    expect(core.addPath).toHaveBeenCalledWith('/tool-cache/wash/1.0.0')
  })

  it('resolves semver ranges', async () => {
    // Set up mocks specific to this test
    core.getInput.mockReturnValue('^0.14.0')

    await run()

    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('Resolving semver')
    )
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
