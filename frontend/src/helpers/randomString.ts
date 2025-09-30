// helpers/randomString.ts
export function randomString(length: number) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIKLMNOPRSTUVWZXY";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
