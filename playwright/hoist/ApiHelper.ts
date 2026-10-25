import {request, APIRequestContext} from '@playwright/test';

export interface ApiHelperConfig {
    baseURL: string;
    username: string;
    password: string;
}

/**
 * Helper for making authenticated API calls directly to the Grails backend,
 * bypassing the browser. Useful for verifying server-side state, seeding test
 * data, or testing endpoints independently of the UI.
 *
 * Authenticates via the Hoist `/xh/login` endpoint (form-based login) and
 * maintains the JSESSIONID cookie for subsequent requests.
 */
export class ApiHelper {
    private context: APIRequestContext | null = null;
    private readonly baseURL: string;
    private readonly username: string;
    private readonly password: string;

    constructor({baseURL, username, password}: ApiHelperConfig) {
        this.baseURL = baseURL;
        this.username = username;
        this.password = password;
    }

    /** Authenticate and establish a session. Called automatically on first request. */
    async loginAsync(): Promise<void> {
        this.context = await request.newContext({baseURL: this.baseURL});
        const resp = await this.context.post('/xh/login', {
            form: {username: this.username, password: this.password}
        });
        const body = await resp.json();
        if (!body.success) {
            throw new Error(`Login failed for ${this.username}`);
        }
    }

    /** GET a JSON endpoint. Authenticates on first call if needed. */
    async fetchJson(url: string, params?: Record<string, string>): Promise<any> {
        const ctx = await this.ensureContext();
        const resp = await ctx.get(url, {params});
        return resp.json();
    }

    /** POST to a JSON endpoint. Authenticates on first call if needed. */
    async postJson(url: string, data?: any): Promise<any> {
        const ctx = await this.ensureContext();
        const resp = await ctx.post(url, {data});
        return resp.json();
    }

    /** Clean up the API request context. */
    async dispose(): Promise<void> {
        await this.context?.dispose();
        this.context = null;
    }

    private async ensureContext(): Promise<APIRequestContext> {
        if (!this.context) await this.loginAsync();
        return this.context!;
    }
}
