import * as core from '@actions/core'
import { notify } from './github'

async function run(): Promise<void> {
  try {
    // const webhook: string = core.getInput("webhook")
    // const users: string = core.getInput("users")
    notify()

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
