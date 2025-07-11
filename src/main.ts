import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

export async function run(): Promise<void> {
  try {
    const version = core.getInput('version') || 'latest'
    const nodePlatform = os.platform()
    const nodeArch = os.arch()

    // Map Node arch and platform to wash release asset format
    let platform: string
    let ext: string
    let assetName: string
    let isWindows = false

    // Map to release asset platform string based on install.sh logic
    if (nodePlatform === 'win32') {
      platform = 'x86_64-pc-windows-msvc'
      ext = '.exe'
      assetName = `wash-${platform}${ext}`
      isWindows = true
    } else if (nodePlatform === 'darwin') {
      platform =
        nodeArch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin'
      ext = ''
      assetName = `wash-${platform}`
    } else if (nodePlatform === 'linux') {
      platform =
        nodeArch === 'arm64'
          ? 'aarch64-unknown-linux-musl'
          : 'x86_64-unknown-linux-musl'
      ext = ''
      assetName = `wash-${platform}`
    } else {
      throw new Error(`Unsupported platform: ${nodePlatform} ${nodeArch}`)
    }

    // Build the download URL using the cosmonic-labs repository
    let url = ''
    if (version === 'latest') {
      url = `https://github.com/cosmonic-labs/wash/releases/latest/download/${assetName}`
    } else {
      url = `https://github.com/cosmonic-labs/wash/releases/download/v${version}/${assetName}`
    }

    // Create installation directory
    const installDir = path.join(
      process.env[nodePlatform === 'win32' ? 'USERPROFILE' : 'HOME'] ||
        os.homedir(),
      '.wash-bin'
    )
    fs.mkdirSync(installDir, { recursive: true })
    const binPath = path.join(installDir, isWindows ? 'wash.exe' : 'wash')

    // Download the binary
    core.info(`Downloading wash from ${url}`)
    await exec.exec(`curl -sSL -o "${binPath}" "${url}"`)

    // Make the binary executable
    fs.chmodSync(binPath, 0o755)

    // Add to PATH
    core.addPath(installDir)
    core.info(`wash installed to ${binPath}`)

    // Print version
    await exec.exec(`"${binPath}" --version`)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('Unknown error occurred during wash installation')
    }
  }
}
