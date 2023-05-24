import * as core from '@actions/core'
import {generateMessage, notify} from './lark'

async function run(): Promise<void> {
    try {
        const notificationTitle = core.getInput('notification_title')
        const users = core.getInput('users')
        const workflowsStatus = core.getInput('workflows_status')
        const msg = generateMessage(notificationTitle, users, workflowsStatus)

        const webhook = core.getInput('webhook')
        await notify(webhook, msg)
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run()
