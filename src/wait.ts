// import {context} from '@actions/github'
// import * as httpm from '@actions/http-client'

// async function wait(milliseconds: number): Promise<string> {
//     return new Promise(resolve => {
//         if (isNaN(milliseconds)) {
//             throw new Error('milliseconds not a number')
//         }
//         setTimeout(() => resolve('done!'), milliseconds)
//     })
// }

// interface Options {
//     timeoutSeconds: number
//     intervalSeconds: number
// }

// interface workflowRuns {
//     workflow_runs: workflowRun[]
// }

// interface workflowRun {
//     status: string
//     conclusion: string
// }

// export async function polling(options: Options): Promise<string> {
//     const {timeoutSeconds, intervalSeconds} = options
//     let now = new Date().getTime()
//     const deadline = now + timeoutSeconds * 1000
//     const headSha = "1e0b2c7b4f32963838e8fd4a1186810f22b84931"
//     let isCompleted = true
//     let isSuccess = true
//     const http = new httpm.HttpClient('lark-pr-notify-action')
//     const url = `"${context.apiUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/?head_sha=${headSha}"`
//     while (now < deadline) {
//         const response = await http.get(url)
//         const body = await response.readBody()
//         const workflows: workflowRuns = JSON.parse(body)
//         for (const workflow of workflows.workflow_runs) {
//             if (workflow.status !== 'completed') {
//                 isCompleted = false
//             }
//             if (workflow.conclusion === 'failure') {
//                 isSuccess = false
//             }
//         }
//         if (isCompleted) {
//             break
//         }
//         await wait(intervalSeconds * 1000)
//         now = new Date().getTime()
//     }
//     if (now >= deadline || !isSuccess) {
//         return 'failure'
//     } else {
//         return 'success'
//     }
// }
