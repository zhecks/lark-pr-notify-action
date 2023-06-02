import {context} from '@actions/github'
import * as httpm from '@actions/http-client'
import {generateSignature} from './safe'
import * as core from '@actions/core'

interface message {
    msg_type: string
    card: string
    timestamp: string
    sign: string
}

interface card {
    type: string
    data: data
}

interface data {
    template_id: string
    template_variable: template_variable
}

interface template_variable {
    notification_title: string
    content_pr_url: string
    content_user_id: string
    content_workflows_status: string
    content_workflows_status_color: string
    content_pr_title: string
    button_pr_url: string
}

interface larkResponse {
    code: number
    data: object
    msg: string
}

export function generateMessage(
    notificationTitle: string,
    users: string,
    contentWorkflowsStatus: string,
    secret: string
): message {
    const contentPRUrl = context.payload.pull_request?.html_url || ''
    let contentUserID = ''
    const userArr = users.split(',')
    for (const user of userArr) {
        const strs = user.split('|')
        if (strs.length !== 2) {
            throw new Error('the secret users is error')
        }
        if (strs[0] === context.actor) {
            contentUserID = strs[1]
        }
    }
    if (contentUserID === '') {
        throw new Error('no this user in secret users, skip notify')
    }
    contentWorkflowsStatus = contentWorkflowsStatus.toUpperCase()
    const contentPRTitle = context.payload.pull_request?.title
    let contentWorkflowsStatusColor
    switch (contentWorkflowsStatus.toLowerCase()) {
        case 'success':
            contentWorkflowsStatusColor = 'green'
            break
        default:
            contentWorkflowsStatusColor = 'red'
    }
    const buttonPRUrL = contentPRUrl
    const msgCard: card = {
        type: 'template',
        data: {
            template_id: 'ctp_AAgXNqY1B7oP',
            template_variable: {
                notification_title: notificationTitle,
                content_pr_url: contentPRUrl,
                content_user_id: contentUserID,
                content_workflows_status: contentWorkflowsStatus,
                content_workflows_status_color: contentWorkflowsStatusColor,
                content_pr_title: contentPRTitle,
                button_pr_url: buttonPRUrL
            }
        }
    }
    const now = Math.floor(Date.now() / 1000).toString()
    core.info(`timestamp: ${now}`)
    const signature = generateSignature(now, secret)
    return {
        msg_type: 'interactive',
        card: JSON.stringify(msgCard),
        timestamp: now,
        sign: signature
    }
}

export async function notify(webhook: string, msg: message): Promise<void> {
    const jsonStr = JSON.stringify(msg)
    const http = new httpm.HttpClient()
    const response = await http.post(webhook, jsonStr, httpm.Headers)
    if (response.message.statusCode !== httpm.HttpCodes.OK) {
        throw new Error(
            `send request to webhook error, status code is ${response.message.statusCode}`
        )
    }
    const body = await response.readBody()
    const larkResp: larkResponse = JSON.parse(body)
    if (larkResp.code !== 0) {
        throw new Error(
            `send request to webhook error, err msg is ${larkResp.msg}`
        )
    }
}
