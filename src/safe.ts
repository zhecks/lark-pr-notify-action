import * as crypto from 'crypto'

export function generateSignature(timestamp: string, secret: string): string {
    const stringToSign = `${timestamp}\n${secret}`
    const hmac = crypto.createHmac('sha256', stringToSign)
    return hmac.digest('base64')
}
