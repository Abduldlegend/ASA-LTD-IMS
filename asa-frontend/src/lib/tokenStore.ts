/**
 * The access token lives only in memory. It is never written to localStorage, so a script
 * injected into the page cannot read it. After a reload the session is restored with the
 * HTTP-only refresh cookie, which JavaScript cannot read either.
 */
let accessToken: string | null = null

export const tokenStore = {
    get: () => accessToken,
    set: (token: string) => {
        accessToken = token
    },
    clear: () => {
        accessToken = null
    },
}