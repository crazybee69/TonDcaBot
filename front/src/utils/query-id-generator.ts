export function generateQueryId(): number {
    return Math.floor(Math.random() * Math.pow(2, 31))
}