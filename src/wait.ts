import {context} from '@actions/github'
import * as httpm from '@actions/http-client'
import * as core from '@actions/core'

async function wait(milliseconds: number): Promise<string> {
    return new Promise(resolve => {
        if (isNaN(milliseconds)) {
            throw new Error('milliseconds not a number')
        }
        setTimeout(() => resolve('done!'), milliseconds)
    })
}

interface Options {
    token: string
    timeoutSeconds: number
    intervalSeconds: number
}

interface workflowRuns {
    workflow_runs: workflowRun[]
}

interface workflowRun {
    name: string
    status: string
    conclusion: string
}

interface checkRuns {
    check_runs: checkRun[]
}

interface checkRun {
    id: number
    name: string
    status: string
    conclusion: string
}

interface status {
    isCompleted: boolean
    isSuccess: boolean
}

interface workflowInfo {
    workflow_name: string
}

export async function polling(options: Options): Promise<string> {
    const {timeoutSeconds, intervalSeconds, token} = options
    let now = new Date().getTime()
    const deadline = now + timeoutSeconds * 1000

    let isSuccess
    let actionStatus: status = {
        isCompleted: false,
        isSuccess: false
    }
    let checkStatus: status = {
        isCompleted: false,
        isSuccess: false
    }
    while (now < deadline) {
        isSuccess = true

        actionStatus = await checkActions(actionStatus, token)
        checkStatus = await checkChecks(checkStatus, token)

        if (!actionStatus.isCompleted || !checkStatus.isCompleted) {
            core.info('waiting...')
            await wait(intervalSeconds * 1000)
            now = new Date().getTime()
        } else {
            isSuccess = actionStatus.isSuccess && checkStatus.isSuccess
            break
        }
    }
    if (now >= deadline || !isSuccess) {
        return 'failure'
    } else {
        return 'success'
    }
}

async function checkActions(
    actionStatus: status,
    token?: string
): Promise<status> {
    if (actionStatus.isCompleted) {
        return actionStatus
    }
    const headSha = context.payload.pull_request?.head.sha
    const http = new httpm.HttpClient('lark-pr-notify-action')
    const url = `${context.apiUrl}/repos/${context.repo.owner}/${context.repo.repo}/actions/runs?head_sha=${headSha}`
    let headers = {}
    if (token && token !== '') {
        headers = {
            Authorization: `Bearer ${token}`
        }
    }

    let isCompleted = true
    let isSuccess = true
    const response = await http.get(url, headers)
    const body = await response.readBody()
    const workflows: workflowRuns = JSON.parse(body)
    for (const workflow of workflows.workflow_runs) {
        if (context.workflow === workflow.name) {
            continue
        }
        core.info(
            `action ${workflow.name}'s status is ${workflow.status} and conclusion is ${workflow.conclusion}`
        )
        if (workflow.status !== 'completed') {
            isCompleted = false
        }
        if (workflow.conclusion !== 'success') {
            isSuccess = false
        }
    }

    return {
        isCompleted,
        isSuccess
    }
}

async function checkChecks(
    checkStatus: status,
    token?: string
): Promise<status> {
    if (checkStatus.isCompleted) {
        return checkStatus
    }

    const headSha = context.payload.pull_request?.head.sha
    const http = new httpm.HttpClient('lark-pr-notify-action')
    const url = `${context.apiUrl}/repos/${context.repo.owner}/${context.repo.repo}/commits/${headSha}/check-runs`
    let headers = {}
    if (token && token !== '') {
        headers = {
            Authorization: `Bearer ${token}`
        }
    }

    let isCompleted = true
    let isSuccess = true
    const response = await http.get(url, headers)
    const body = await response.readBody()
    const checks: checkRuns = JSON.parse(body)
    for (const check of checks.check_runs) {
        const workflowName = await getWorkflowName(check.id, token)
        if (context.workflow === workflowName) {
            continue
        }
        core.info(
            `check ${check.name}'s status is ${check.status} and conclusion is ${check.conclusion}`
        )
        if (check.status !== 'completed') {
            isCompleted = false
        }
        if (check.conclusion !== 'success') {
            isSuccess = false
        }
    }

    return {
        isCompleted,
        isSuccess
    }
}

async function getWorkflowName(jobID: number, token?: string): Promise<string> {
    const http = new httpm.HttpClient('lark-pr-notify-action')
    const url = `${context.apiUrl}/repos/${context.repo.owner}/${context.repo.repo}/actions/jobs/${jobID}`
    let headers = {}
    if (token && token !== '') {
        headers = {
            Authorization: `Bearer ${token}`
        }
    }

    const response = await http.get(url, headers)
    const body = await response.readBody()
    const info: workflowInfo = JSON.parse(body)
    return info.workflow_name
}
