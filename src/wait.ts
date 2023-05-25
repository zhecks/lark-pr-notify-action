import { context } from '@actions/github'
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

export async function polling(options: Options): Promise<string> {
    const { timeoutSeconds, intervalSeconds } = options
    let now = new Date().getTime()
    const deadline = now + timeoutSeconds * 1000
    const headSha = context.payload.pull_request?.head.sha
    const http = new httpm.HttpClient('lark-pr-notify-action')
    const url = `${context.apiUrl}/repos/${context.repo.owner}/${context.repo.repo}/actions/runs?head_sha=${headSha}`
    let isCompleted
    let isSuccess
    while (now < deadline) {
        isCompleted = true
        isSuccess = true
        const response = await http.get(url)
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
            if (workflow.conclusion === 'failure') {
                isSuccess = false
            }
        }
        if (isCompleted) {
            break
        }
        core.info('waiting...')
        await wait(intervalSeconds * 1000)
        now = new Date().getTime()
    }
    if (now >= deadline || !isSuccess) {
        return 'failure'
    } else {
        return 'success'
    }
}
