import * as core from '@actions/core'
import {generateMessage, notify} from './lark'
import {polling} from './wait'

async function run(): Promise<void> {
    try {
        core.info('waiting other actions...')
        const timeout = core.getInput('timeout')
        const interval = core.getInput('interval')
        const status: string = await polling({
            timeoutSeconds: parseInt(timeout, 10),
            intervalSeconds: parseInt(interval, 10)
        })
        core.info(`the workflows status is ${status}`)
        const notificationTitle = core.getInput('notification_title')
        const users = core.getInput('users')
        const msg = generateMessage(notificationTitle, users, status)

        const webhook = core.getInput('webhook')
        await notify(webhook, msg)
        core.info('finalize')
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run()
