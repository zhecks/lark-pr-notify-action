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
    content_pr_title: string
    content_at: string
    content_workflows_status: string
    content_workflows_status_color: string
    button_pr_url: string
}

interface larkResponse {
    code: number
    data: object
    msg: string
}

function generateAt(contentWorkflowsStatus: string, openIDs: string[]): string {
    let contentAt = ''
    switch (contentWorkflowsStatus.toLowerCase()) {
        case 'success':
            contentAt = contentAt + '审核人：'.toString()
            break
        default:
            contentAt = contentAt + '创建人：'.toString()
    }
    for (const openID of openIDs) {
        contentAt = contentAt + `<at id='${openID}'></at> `.toString()
    }
    return contentAt
}

export function generateMessage(
    templateID: string,
    notificationTitle: string,
    users: string,
    reviewers: string,
    contentWorkflowsStatus: string,
    secret: string
): message {
    const contentPRUrl = context.payload.pull_request?.html_url || ''
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

    let openIDs: string[] = []
    const userArr = users.split(',')
    for (const user of userArr) {
        const infos = user.split('|')
        if (infos.length !== 2) {
            throw new Error('the secret users is error')
        }
        if (infos[0] === context.actor) {
            openIDs.push(infos[1])
            break
        }
    }
    // pr's actor is not in users, skip notify
    if (openIDs.length === 0) {
        throw new Error('no this user in secret users, skip notify')
    }
    // success, notify reviewers
    if (contentWorkflowsStatus.toLowerCase() === 'success') {
        openIDs = reviewers.split(',')
    }
    const contentAt = generateAt(contentWorkflowsStatus, openIDs)
    core.debug(contentAt)

    const msgCard: card = {
        type: 'template',
        data: {
            template_id: templateID,
            template_variable: {
                notification_title: notificationTitle,
                content_pr_url: contentPRUrl,
                content_at: contentAt,
                content_pr_title: contentPRTitle,
                content_workflows_status: contentWorkflowsStatus,
                content_workflows_status_color: contentWorkflowsStatusColor,
                button_pr_url: contentPRUrl
            }
        }
    }
    // generate sign
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
