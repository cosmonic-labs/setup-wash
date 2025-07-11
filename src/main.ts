import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

export async function run(): Promise<void> {
  try {
    const version = core.getInput('version') || 'latest'
    const platform = os.platform()
    let arch = os.arch()
    // Map Node arch to wash arch
    if (arch === 'x64') arch = 'amd64'
    if (arch === 'arm64') arch = 'aarch64'

    let ext = ''
    let tarball = ''
    if (platform === 'win32') {
      ext = '.zip'
      tarball = `wash-${platform}-${arch}${ext}`
    } else {
      ext = '.tar.gz'
      tarball = `wash-${platform}-${arch}${ext}`
    }

    let url = ''
    if (version === 'latest') {
      url = `https://github.com/wasmCloud/wash/releases/latest/download/${tarball}`
    } else {
      url = `https://github.com/wasmCloud/wash/releases/download/v${version}/${tarball}`
    }

    const installDir = path.join(
      process.env[platform === 'win32' ? 'USERPROFILE' : 'HOME'] ||
        os.homedir(),
      '.wash-bin'
    )
    fs.mkdirSync(installDir, { recursive: true })
    const archivePath = path.join(installDir, tarball)

    core.info(`Downloading wash from ${url}`)
    await exec.exec(`curl -sSL -o "${archivePath}" "${url}"`)

    if (platform === 'win32') {
      await exec.exec(
        `powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${installDir}' -Force"`
      )
    } else {
      await exec.exec(`tar -xzf "${archivePath}" -C "${installDir}"`)
    }

    // Find the wash binary
    let washPath = path.join(installDir, 'wash')
    if (platform === 'win32') washPath += '.exe'
    if (!fs.existsSync(washPath)) {
      // Sometimes the binary is inside a folder in the archive
      const files = fs.readdirSync(installDir)
      for (const file of files) {
        if (file.startsWith('wash')) {
          const candidate = path.join(
            installDir,
            file,
            platform === 'win32' ? 'wash.exe' : 'wash'
          )
          if (fs.existsSync(candidate)) {
            washPath = candidate
            break
          }
        }
      }
    }
    fs.chmodSync(washPath, 0o755)
    core.addPath(path.dirname(washPath))
    core.info(`wash installed to ${washPath}`)
    // Optionally print version
    await exec.exec(`"${washPath}" --version`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
    else core.setFailed('Unknown error occurred during wash installation')
  }
}
