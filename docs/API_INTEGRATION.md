# Brain Plug — Client & Developer API Integration Guide

This guide provides developers and clients with complete technical specifications, code examples, authentication requirements, and SDK integrations for interacting with the Brain Plug API.

---

## 1. Authentication & Security

Brain Plug supports two authentication mechanisms:

### A. API Key Authentication (Recommended for Backend & Embeds)
Used for automated backend integrations, custom web applications, and standalone chat widgets.

Pass the API key in the `Authorization` HTTP header:
```http
Authorization: Bearer bp_live_your_api_key_here
```

> [!NOTE]
> Generate API keys under your workspace portal at `/client/agents/[id]/api-keys`. Keys are prefixed with `bp_live_` and are hashed using SHA-256 in the database.

### B. Session Token Authentication
Used for logged-in web applications via encrypted HTTP-only session cookies (`auth_token`).

---

## 2. Real-Time Chat API (SSE Streaming)

The primary interaction endpoint for conversational agents with Retrieval-Augmented Generation (RAG).

### Endpoint
`POST /api/v1/chat`

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer bp_live_your_api_key_here
```

### Request Body (JSON)
| Field | Type | Required | Description |
|---|---|---|---|
| `agentId` | `string (UUID)` | **Yes** | Unique identifier of the target AI agent. |
| `message` | `string` | **Yes** | User prompt or inquiry (max 8,000 characters). |
| `conversationId` | `string (UUID)` | No | Optional conversation ID to continue existing session. |
| `stream` | `boolean` | No | Defaults to `true` for SSE streaming responses. |

```json
{
  "agentId": "00000000-0000-0000-0000-000000000001",
  "message": "What is the return policy for Acme Corp products?",
  "conversationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

---

### Response Format (Server-Sent Events)
The endpoint returns `Content-Type: text/event-stream` with chunked events:

1. **`start` Event**: Emitted when processing begins.
```json
data: {"type":"start","conversationId":"3fa85f64-5717-4562-b3fc-2c963f66afa6","sources":[{"fileName":"policy_2026.pdf","similarity":0.89}]}
```

2. **`token` Event**: Emitted for each generated text token.
```json
data: {"type":"token","content":"Our"}
data: {"type":"token","content":" standard"}
data: {"type":"token","content":" return"}
data: {"type":"token","content":" policy..."}
```

3. **`done` Event**: Emitted upon completion with full message and latency metrics.
```json
data: {"type":"done","conversationId":"3fa85f64-5717-4562-b3fc-2c963f66afa6","fullContent":"Our standard return policy allows...","sources":[{"fileName":"policy_2026.pdf","similarity":0.89}],"latencyMs":342}
```

4. **`error` Event**: Emitted if generation fails.
```json
data: {"type":"error","message":"Quota exceeded"}
```

---

## 3. Code Integration Examples

### A. cURL Example
```bash
curl -X POST https://api.brainplug.ai/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer bp_live_acmedemosecretkey1234567890abcdef" \
  -d '{
    "agentId": "00000000-0000-0000-0000-000000000001",
    "message": "Hello, how can I configure custom branding?"
  }'
```

---

### B. JavaScript / TypeScript (Fetch API with SSE Stream Parsing)
```typescript
async function askAgent(agentId: string, apiKey: string, userMessage: string) {
  const response = await fetch("https://api.brainplug.ai/api/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      agentId,
      message: userMessage,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`API Request failed: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullAnswer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "token") {
            fullAnswer += event.content;
            process.stdout.write(event.content); // Stream to console
          } else if (event.type === "done") {
            console.log("\n\nCitations:", event.sources);
          }
        } catch (e) {
          // ignore partial frames
        }
      }
    }
  }

  return fullAnswer;
}
```

---

### C. Python Example
```python
import requests
import json

def chat_with_agent(agent_id: str, api_key: str, message: str):
    url = "https://api.brainplug.ai/api/v1/chat"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "agentId": agent_id,
        "message": message
    }

    with requests.post(url, json=payload, headers=headers, stream=True) as response:
        response.raise_for_status()
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                event_data = json.loads(line[6:])
                if event_data.get("type") == "token":
                    print(event_data["content"], end="", flush=True)
                elif event_data.get("type") == "done":
                    print(f"\n[Completed in {event_data.get('latencyMs')}ms]")

if __name__ == "__main__":
    chat_with_agent(
        agent_id="00000000-0000-0000-0000-000000000001",
        api_key="bp_live_acmedemosecretkey1234567890abcdef",
        message="What are your business hours?"
    )
```

---

## 4. Web Chat Widget Embed Integration

To embed the floating chat widget on any website or web application, copy and paste this single script snippet into your HTML before the closing `</body>` tag:

```html
<!-- Brain Plug Live Chat Widget Embed -->
<script
  src="https://api.brainplug.ai/widget.js"
  data-agent-id="00000000-0000-0000-0000-000000000001"
  data-api-key="bp_live_acmedemosecretkey1234567890abcdef"
  async
></script>
```

### Widget Configuration Endpoint
`GET /api/v1/widget/config/{agentId}`

Returns live branding, styling, position, and allowed origins for the agent:
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "Acme Customer Support Bot",
      "welcomeMessage": "Hi there! Welcome to Acme Corp. How can I help you today?"
    },
    "widget": {
      "position": "BOTTOM_RIGHT",
      "launcherType": "BUTTON",
      "buttonLabel": "Chat with Support",
      "primaryColor": "#7c3aed",
      "secondaryColor": "#ede9fe",
      "backgroundColor": "#ffffff",
      "textColor": "#1e1b4b",
      "width": 400,
      "height": 600,
      "borderRadius": 16,
      "animation": "slide-up"
    }
  }
}
```

---

## 5. Customer Relations (CR) Support Tickets API

### Create Support Ticket
`POST /api/v1/tickets`
```json
{
  "title": "Need custom domain SSL assistance",
  "description": "We are trying to connect support.acme.com but receiving a certificate warning.",
  "category": "TECHNICAL_ISSUE",
  "priority": "HIGH",
  "agentId": "00000000-0000-0000-0000-000000000001"
}
```

### Add Message to Ticket
`POST /api/v1/tickets/{id}/messages`
```json
{
  "content": "We have uploaded the new DNS CNAME record. Please check again."
}
```

---

## 6. HTTP Error Codes Reference

| Code | Reason | Resolution |
|---|---|---|
| `400 Bad Request` | Missing required parameters or malformed JSON body. | Validate request payload against schema. |
| `401 Unauthorized` | Invalid or expired API key / session token. | Ensure header has valid `Bearer bp_live_...` key. |
| `403 Forbidden` | API key not assigned to target agent or domain not whitelisted. | Add domain to Allowed Domains in `/client/agents/[id]/widget`. |
| `404 Not Found` | Agent, tenant, or ticket ID does not exist. | Verify UUID. |
| `429 Too Many Requests` | Rate limit exceeded (Default: 60 requests/minute). | Back off requests or request quota increase. |
| `500 Internal Error` | Upstream Gemini API error or database failure. | Inspect `requestId` in response and contact support. |
