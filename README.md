# Transparent Glasshouse — WebMCP Edition

Transparent Glasshouse is a shared creative surface for people and AI agents. A person can browse a public constellation of portrait Bloom Cards, open story prompts, choose the glass and living weather, and compose an ordered Wonder Route. An agent can perform the same meaningful actions through WebMCP, with every change reflected immediately in the same elegant conservatory.

**Live site:** [transparent-glasshouse-webmcp.cstolting.chatgpt.site](https://transparent-glasshouse-webmcp.cstolting.chatgpt.site)

This repository is the public, challenge-safe edition. It contains no private account links, unpublished workflows, paid materials, credentials, or content from the private BloomPlatform project.

## Why WebMCP

The Glasshouse is intentionally more than a page an agent can read. Its tools expose the interaction model itself:

- `list_bloom_cards` — discover the available public cards and moods.
- `find_bloom_cards` — search ideas and visibly highlight matching cards.
- `open_bloom_card` — focus the shared interface on a chosen story.
- `compose_wonder_route` — create an ordered route of up to five cards.
- `set_glass_mode` — change the shared atmosphere without changing content.
- `set_glasshouse_weather` — bring sunbreak, mist, rain, or starlight into the shared room.

The person and agent work on one live surface. Human actions and agent actions appear together in the activity stream, making collaboration visible and inspectable.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm run install:ci
npm run dev
```

Open the local URL printed by Vite. In an ordinary browser the full human interface works in preview mode. Open the same page in a WebMCP-capable browser to register and use the six imperative JavaScript tools.

## Build and verify

```bash
npm run build
npm run lint
```

## WebMCP implementation

The tools register client-side after mount through `document.modelContext.registerTool`. Each tool uses a narrow JSON Schema, validates identifiers against the public card collection, returns concise text, and updates the same React state used by human controls. An `AbortController` unregisters tools when the page unmounts.

Read-only discovery tools are marked with `readOnlyHint`. Composition and atmosphere tools are explicitly marked as state-changing. No tool uploads data, accesses accounts, crosses origins, or persists session content.

## Challenge demo path

1. Open the clear redwood conservatory and show the five public portrait Bloom Cards.
2. Manually add one card to demonstrate the human control surface.
3. Ask the agent to find cards about memory or home.
4. Ask it to compose a three-stop Wonder Route.
5. Ask it to bring in soft rain, then return the glass to clear.
6. Show the shared activity stream containing both collaborators.

## Privacy

- No sign-in.
- No analytics.
- No upload.
- No database.
- Session-only state.

## License

MIT © 2026 Cherie Stolting. See [LICENSE](LICENSE).
