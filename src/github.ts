import { context } from "@actions/github";

export function notify() {
    // const pull_request = context.payload.pull_request;
    // const content_pr_url = pull_request?.html_url
    // const userMap = new Map();
    // users.split(',').forEach((user: string) => {
    //     const strs = user.split('|')
    //     if (strs.length != 2) {
    //         throw new Error('the secret users is error');
    //     }
    //     userMap.set(strs[0], strs[1])
    // })
    // if (userMap.get(context.actor) == null) {
    //     throw new Error(`'the user ${context.actor}' isn't in secret users`);
    // }
    // const content_user_id = userMap.get(context.actor)
    console.log(context);

}