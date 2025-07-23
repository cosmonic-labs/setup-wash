import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'
// import { Octokit } from '@octokit/core'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import * as semver from 'semver'
import { Tool } from './constants.js'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit()

/**
 * Main installer function
 */
export async function installer(versionInput: string): Promise<string> {
  core.debug(`Starting installer with version: ${versionInput}`)

  // Get platform-specific information
  const { assetName, isWindows } = getPlatformInfo()
  core.debug(`Asset name: ${assetName}, isWindows: ${isWindows}`)

  // Resolve version if needed
  let version = versionInput
  if (
    version !== 'latest' &&
    (version.startsWith('^') || version.startsWith('~'))
  ) {
    core.info(`Resolving semver: ${version}`)
    const resolvedVersion = await resolveVersion(version)
    if (resolvedVersion) {
      version = resolvedVersion
      core.info(`Resolved to version: ${version}`)
    } else {
      core.warning(
        `Could not resolve semver ${version}, falling back to latest`
      )
      version = 'latest'
    }
  }

  // Check if the tool is already cached
  let toolPath = ''
  if (version !== 'latest') {
    toolPath = tc.find(Tool.Name, version)
    core.debug(`Checking cache for tool version ${version}`)
  }

  // If not found in cache or using latest, download it
  if (!toolPath) {
    core.info('Tool not found in cache, downloading...')

    // Download the binary
    const { downloadPath, binaryPath } = await downloadTool(
      version,
      assetName,
      isWindows
    )

    // Get the directory containing the binary
    const tempDir = path.dirname(binaryPath)

    // Cache the tool
    toolPath = await cacheWash(tempDir, binaryPath, version)
  } else {
    core.info(`Found cached version at: ${toolPath}`)
  }

  // Determine the binary name
  const binaryName = isWindows ? Tool.Name + '.exe' : Tool.Name
  const binPath = path.join(toolPath, binaryName)

  // Add to PATH
  core.addPath(toolPath)
  core.info(`wash installed to ${binPath}`)

  return binPath
}

/**
 * Get the actual version of wash from the binary
 */
export async function getWashVersion(
  binaryPath: string
): Promise<string | null> {
  try {
    core.debug(`Getting version from binary: ${binaryPath}`)
    let output = ''
    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString()
        }
      }
    }

    await exec.exec(`"${binaryPath}" --version`, [], options)

    // Parse the version from output (e.g., "wash 0.15.0")
    const versionMatch = output.match(/wash\s+v?(\d+\.\d+\.\d+)/)
    if (versionMatch && versionMatch[1]) {
      core.debug(`Detected version: ${versionMatch[1]}`)
      return versionMatch[1]
    }
    core.debug('Could not determine version from binary output')
    return null
  } catch (error) {
    core.warning(
      `Error getting wash version: ${error instanceof Error ? error.message : String(error)}`
    )
    return null
  }
}

/**
 * Download and install the wash binary
 */
export async function downloadTool(
  version: string,
  assetName: string,
  isWindows: boolean
): Promise<{
  downloadPath: string
  binaryPath: string
}> {
  const url = getDownloadUrl(version, assetName)
  core.info(`Downloading wash from ${url}`)

  const downloadPath = await tc.downloadTool(url)
  core.debug(`Downloaded to: ${downloadPath}`)

  // Create a temporary directory for extraction
  let tempDir = ''
  try {
    tempDir = await tc.extractZip(downloadPath)
    core.debug('Successfully extracted zip archive')
  } catch {
    // If not a zip file, just use the downloaded file directly
    core.debug('Not a zip file, using direct download')
    tempDir = path.dirname(downloadPath)

    // Determine the binary name
    const binaryName = isWindows ? 'wash.exe' : 'wash'

    // Move the binary to the expected location in the temp dir
    const tempBinaryPath = path.join(tempDir, binaryName)
    fs.copyFileSync(downloadPath, tempBinaryPath)

    // Make the binary executable (not needed on Windows)
    if (!isWindows) {
      fs.chmodSync(tempBinaryPath, 0o755)
    }
  }

  // Determine the binary name and path
  const binaryName = isWindows ? 'wash.exe' : 'wash'
  const binaryPath = path.join(tempDir, binaryName)

  return { downloadPath, binaryPath }
}

/**
 * Cache the wash binary
 */
export async function cacheWash(
  tempDir: string,
  binaryPath: string,
  version: string
): Promise<string> {
  core.debug(`Caching wash binary from ${tempDir}`)

  // For 'latest', get the actual version number
  if (version === 'latest') {
    const actualVersion = await getWashVersion(binaryPath)
    if (actualVersion) {
      core.info(`Caching with actual version: ${actualVersion}`)
      return await tc.cacheDir(tempDir, Tool.Name, actualVersion)
    } else {
      // If we can't determine the version, use a timestamp
      const timestamp = `latest-${Date.now()}`
      core.info(
        `Could not determine version, caching with timestamp: ${timestamp}`
      )
      return await tc.cacheDir(tempDir, Tool.Name, timestamp)
    }
  } else {
    core.info(`Caching with specified version: ${version}`)
    return await tc.cacheDir(tempDir, Tool.Name, version)
  }
}

/**
 * Get platform-specific information for the wash binary
 */
export function getPlatformInfo(): {
  platform: string
  ext: string
  assetName: string
  isWindows: boolean
} {
  const nodePlatform = os.platform()
  const nodeArch = os.arch()
  let platform: string
  let ext: string
  let assetName: string
  let isWindows = false

  // Map to release asset platform string based on install.sh logic
  if (nodePlatform === 'win32') {
    platform = 'x86_64-pc-windows-msvc'
    ext = '.exe'
    assetName = `${Tool.Name}-${platform}${ext}`
    isWindows = true
  } else if (nodePlatform === 'darwin') {
    platform =
      nodeArch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin'
    ext = ''
    assetName = `${Tool.Name}-${platform}`
  } else if (nodePlatform === 'linux') {
    platform =
      nodeArch === 'arm64'
        ? 'aarch64-unknown-linux-musl'
        : 'x86_64-unknown-linux-musl'
    ext = ''
    assetName = `${Tool.Name}-${platform}`
  } else {
    throw new Error(`Unsupported platform: ${nodePlatform} ${nodeArch}`)
  }

  return { platform, ext, assetName, isWindows }
}

/**
 * Resolve a semver range to a specific version
 */
// export async function resolveVersion(
//   targetVersion: string
// ): Promise<string | null> {
//   try {
//     core.debug(`Resolving semver range: ${targetVersion}`)

//     const version = { target: targetVersion }
//     const availableVersions: Map<string, string> = new Map()

//     for await (const response of octokit.paginate.iterator(
//       octokit.rest.repos.listReleases,
//       {
//         owner: Tool.Org,
//         repo: Tool.Repo,
//         per_page: 100
//       }
//     )) {
//       for (const release of response.data) {
//         const matchingAsset = release.assets.find(
//           (asset) =>
//             asset.name.includes('kustomize') &&
//             asset.name.includes(platform) &&
//             asset.name.includes(arch)
//         )

//         if (matchingAsset) {
//           const kustomizeVersion = (
//             version.exec(release.tag_name) || []
//           ).shift()

//           if (kustomizeVersion != null) {
//             availableVersions.set(
//               kustomizeVersion,
//               matchingAsset.browser_download_url
//             )
//           }
//         }
//       }
//     }

//     const resolved = semver.maxSatisfying(
//       [...availableVersions.keys()],
//       version.target
//     )

//     // Find the highest version that satisfies the range
//     const maxSatisfying = semver.maxSatisfying(availableVersions, versionRange)
//     core.debug(`Resolved to version: ${maxSatisfying || 'none'}`)
//     return maxSatisfying
//   } catch (error) {
//     core.warning(
//       `Error resolving version: ${error instanceof Error ? error.message : String(error)}`
//     )
//     return null
//   }
// }

/**
 * Get the download URL for the wash binary
 */
export function getDownloadUrl(version: string, assetName: string): string {
  if (version === 'latest') {
    return `https://github.com/cosmonic-labs/wash/releases/latest/download/${assetName}`
  } else {
    return `https://github.com/cosmonic-labs/wash/releases/download/v${version}/${assetName}`
  }
}
