# Deployment & LLM Integration Memo

## Decision Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Primary LLM provider** | Anthropic (Claude) | Best structured output quality, strong JSON adherence, good at following schemas |
| **Fallback provider** | OpenAI (GPT-4o) | Widely available, proven JSON mode |
| **Phase A: JSON harness** | No LLM integration | Human relays specs via external LLM. Validates schema + prompt strategy with zero integration work |
| **Phase B: Client-side POC** | Direct Anthropic API calls from TypeScript | User-provided API key in localStorage. Good for local dev and internal demos |
| **Phase C: Deployed proxy** | Grails controller + service | Server-stored API key via Hoist Config (pwd type). Required for public Toolbox deployment |
| **Recommended path** | Build Phase B first, add Phase C for production | Client-side is faster to iterate; server proxy is a straightforward addition when needed |

## Architecture Options Evaluated

### Option 1: Client-Side Only (Phase B)

**How it works:** TypeScript code calls the Anthropic Messages API directly from the browser using the Anthropic JS SDK (`@anthropic-ai/sdk`). The API key is provided by the user and stored in localStorage.

**Pros:**
- No Grails changes — purely a client-side feature.
- Fast iteration cycle — change prompts, test immediately.
- Works for any developer with their own API key.

**Cons:**
- API key in the browser is unacceptable for production.
- CORS: Anthropic's API does not support browser-originated requests without a proxy. This is a **blocker** for truly client-side-only calls.
- No rate limiting, cost control, or audit logging.

**CORS Reality Check:** The Anthropic API does not set `Access-Control-Allow-Origin` headers for browser requests. Direct client-side calls will fail due to CORS. This means even Phase B needs *some* form of proxy. Options:
- A simple CORS proxy (e.g., a small Express server or Cloudflare Worker) — adds infra complexity.
- Use the Grails backend as the proxy from the start — the path of least resistance.

**Verdict:** Client-side-only is not viable for browser-originated calls due to CORS. However, the *prompt logic and response handling* should be client-side TypeScript. The server just relays.

### Option 2: Grails Proxy (Phase C)

**How it works:** A new `LlmController` + `LlmService` in the Grails backend. The client sends a structured request (prompt + current spec + widget schemas). The server calls the Anthropic API, validates the response, and returns the result.

**Pros:**
- API key stored securely in Hoist Config (pwd-encrypted, not in client bundle).
- Natural rate limiting via Hoist's request pipeline.
- Audit logging of prompts + responses for debugging.
- Works for deployed Toolbox — the production path.
- Reuses Hoist's `JSONClient` for outbound HTTP.

**Cons:**
- Requires Grails changes (controller + service + config).
- Adds a network hop and server-side latency.
- Server must be running for LLM features to work.

**Verdict:** This is the right production architecture. The Grails backend is already running for weather data — adding an LLM proxy is a natural extension.

### Option 3: Hybrid — Thin Proxy, Client-Side Logic

**How it works:** The Grails proxy is intentionally thin — it just relays requests to the LLM provider with the API key injected. All prompt construction, response parsing, validation, and retry logic lives in client-side TypeScript.

**Pros:**
- Keeps the "intelligence" client-side where iteration is fast.
- Server changes are minimal and stable (no prompt logic on server).
- API key is secure; everything else is in the client.

**Cons:**
- Slightly more client-side complexity.
- Full prompt text travels over the wire (not a real concern for internal/demo use).

**Verdict:** This is the recommended approach. It combines the security of server-side key management with the iteration speed of client-side prompt engineering.

## Recommended Architecture: Thin Grails Proxy

### Server Side

**LlmController.groovy:**
```groovy
@AccessAll
class LlmController extends BaseController {
    def llmService

    def generate() {
        def body = parseRequestJSON()
        renderJSON(llmService.generate(body.messages, body.config))
    }
}
```

**LlmService.groovy:**
```groovy
class LlmService extends BaseService {
    static clearCachesConfigs = ['llmApiKey', 'llmProvider']

    def configService
    private JSONClient _client

    Map generate(List messages, Map config = [:]) {
        def provider = configService.getString('llmProvider', 'anthropic')
        def apiKey = configService.getPwd('llmApiKey')
        def model = config.model ?: configService.getString('llmModel', 'claude-sonnet-4-20250514')
        def maxTokens = config.maxTokens ?: configService.getInt('llmMaxTokens', 4096)

        if (!apiKey || apiKey == 'UNCONFIGURED') {
            throw new DataNotAvailableException(
                'LLM API key not configured. Set "llmApiKey" in Admin console.'
            )
        }

        def payload = buildPayload(provider, messages, model, maxTokens)
        def url = getApiUrl(provider)

        def post = new HttpPost(url)
        post.setHeader('Authorization', "Bearer ${apiKey}")
        // Anthropic uses x-api-key header and anthropic-version header
        if (provider == 'anthropic') {
            post.setHeader('x-api-key', apiKey)
            post.setHeader('anthropic-version', '2023-06-01')
            post.removeHeaders('Authorization')
        }
        post.setEntity(new StringEntity(JSONSerializer.serialize(payload)))

        return client.executeAsMap(post)
    }

    void clearCaches() {
        _client = null
        super.clearCaches()
    }
}
```

**Hoist Config entries:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `llmApiKey` | pwd | `UNCONFIGURED` | Anthropic API key |
| `llmProvider` | string | `anthropic` | Provider: `anthropic` or `openai` |
| `llmModel` | string | `claude-sonnet-4-20250514` | Model identifier |
| `llmMaxTokens` | int | `4096` | Max response tokens |

### Client Side

**LlmService.ts** (client-side TypeScript service or utility):
```typescript
class LlmChatService {
    /** Send a prompt to the LLM proxy and return the response. */
    async generateAsync(
        systemPrompt: string,
        messages: ChatMessage[],
        config?: {model?: string; maxTokens?: number}
    ): Promise<LlmResponse> {
        const response = await XH.postJson({
            url: 'llm/generate',
            body: {
                messages: [
                    {role: 'system', content: systemPrompt},
                    ...messages
                ],
                config
            }
        });
        return this.parseResponse(response);
    }

    /** Build the system prompt with widget schemas and current spec. */
    buildSystemPrompt(currentSpec?: DashSpec): string {
        const schemaText = widgetRegistry.generateLLMPrompt();
        const specText = currentSpec ? JSON.stringify(currentSpec, null, 2) : 'No dashboard yet.';
        return SYSTEM_PROMPT_TEMPLATE
            .replace('{{WIDGET_SCHEMAS}}', schemaText)
            .replace('{{CURRENT_SPEC}}', specText);
    }
}
```

## Prompt Strategy

### System Prompt Structure

```
You are a dashboard builder assistant. You create and modify weather dashboard specifications.

## Dashboard Spec Format
The dashboard is defined as a JSON object with a "state" array of widget instances.
Each widget has: viewSpecId, layout {x, y, w, h}, optional title, and state (config + bindings).

## Grid System
The dashboard uses a 12-column grid. Widgets are positioned by column (x) and row (y),
with width (w) in columns and height (h) in rows.

## Available Widget Types
{{WIDGET_SCHEMAS}}

## Wiring
Widgets communicate via bindings. Display widgets can bind their inputs to
the outputs of input widgets using: {"fromWidget": "<widgetId>", "output": "<outputName>"}
Or use constant values: {"const": "<value>"}

Widget instance IDs are assigned in order: first instance of type X gets ID "X",
second gets "X_2", etc.

## Current Dashboard
{{CURRENT_SPEC}}

## Instructions
- Respond with ONLY a valid JSON dashboard spec. No explanation, no markdown fences.
- When modifying an existing dashboard, preserve widgets the user didn't mention.
- Always include valid bindings for display widgets.
- Use sensible defaults for unspecified config properties.
- Keep layouts non-overlapping and well-organized.
```

### Edit Protocol

For iterative edits, the LLM receives the current spec and a user instruction. It returns a complete updated spec (not a patch). This is simpler and more reliable than JSON Patch:
- Full spec is easier for the LLM to produce correctly.
- Full spec can be validated as a unit.
- The client diffs old vs new for display purposes if needed.

**Why not JSON Patch:** JSON Patch (`{op, path, value}` arrays) is harder for LLMs to produce correctly — path references are error-prone, operations must be ordered, and partial patches can leave the spec in an invalid intermediate state. Full-spec replacement is more reliable.

## Rate Limiting & Cost Controls

Given the low-volume, trusted audience (internal users, select customers, candidates):

- **Per-user rate limit:** 20 requests per hour, enforced server-side via simple in-memory counter. Sufficient to prevent accidental runaway loops.
- **Max tokens per request:** Capped at 4096 (configurable via Hoist Config). Dashboard specs are typically < 2000 tokens.
- **Monthly cost estimate:** At ~20 users making ~10 requests/day at ~$0.01/request = ~$60/month. Well within acceptable demo budget.
- **No caching:** Each request is unique (user's specific dashboard + instruction). No caching value.

## Latency Budget

- **Acceptable:** 3-8 seconds for a full spec generation.
- **Target:** < 5 seconds for typical requests.
- **Anthropic Claude Sonnet:** Typical response time is 2-5 seconds for structured output of this size. Meets target.
- **UI:** Show a loading indicator with "Generating dashboard..." message. Stream response if possible (Anthropic supports streaming).

## Phasing Summary

| Phase | What | Blocked By | Effort |
|-------|------|------------|--------|
| **A: JSON Harness** | Manual copy-paste to external LLM | Nothing | Low — UI only |
| **B: Server Proxy** | Grails LlmController + LlmService + Config | Grails server running | Medium — new controller/service |
| **C: Chat Harness** | In-app chat UI + client-side prompt logic | Phase B | Medium — UI + prompt engineering |

Phase A enables immediate validation of the schema and prompt strategy. Phase B adds the server infrastructure. Phase C wires it into a polished in-app experience.
