import * as core from '@actions/core'
import { installer } from './installer.js'
import { exec } from '@actions/exec'
import { Tool } from './constants.js'

export async function run(): Promise<void> {
  try {
    // Get the version input
    const version = core.getInput(Tool.Name + '-version') || 'latest'
    core.debug(`Requested install of ${Tool.Name} version: ${version}`)

    // Install tool
    const binPath = await installer(version)

    // Set output
    core.setOutput(`${Tool.Name}-path`, binPath)

    // Print version
    let output = ''
    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString()
        }
      }
    }
    await exec(`"${binPath}" --version`, [], options)
    core.info(`Installed ${Tool.Name} version: ${output.trim()}`)

    core.info('Installation completed successfully')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed(
        'Unknown error occurred during ' + Tool.Name + ' installation: ' + error
      )
    }
  }
}
