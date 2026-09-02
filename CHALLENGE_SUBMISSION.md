# WebMCP Challenge Submission

## Project

**Transparent Glasshouse — WebMCP Edition**

**Live app:** https://transparent-glasshouse-webmcp.cstolting.chatgpt.site

## One-line description

A clear creative room where a person and an AI agent explore Bloom Cards and compose visible paths through wonder on the same live surface.

## What it does

Transparent Glasshouse turns a small public collection of portrait story-world cards into a collaborative browsing surface set inside a clear redwood conservatory. A person can open cards, search themes, change the glass and weather, and assemble an ordered Wonder Route. A WebMCP-capable agent can discover the same cards and perform the same meaningful actions. Its search highlights appear in the page; its chosen card opens in the page; its route is rendered beside the collection; and its actions join the human’s actions in one activity ledger.

The result is not an invisible agent operating behind a page. It is a shared room in which the person can see, understand, revise, and continue what the agent has done.

## Why WebMCP fits

The central problem is not access to text. It is access to the page’s interaction model. Without WebMCP, an agent has to infer card identities and manipulate generic controls. With WebMCP, the page declares six bounded capabilities with narrow schemas:

1. List the public Bloom Cards.
2. Search by idea, mood, place, or story detail.
3. Open a chosen card in the shared view.
4. Compose an ordered route of up to five cards.
5. Change the glass atmosphere.
6. Change the living weather.

These tools are useful individually and become expressive in sequence: discover, interpret, compose, and present.

## Human–agent collaboration

The human remains in control of the creative direction. They can browse freely, add or remove cards, reorder the route, clear it, and change the atmosphere. The agent accelerates discovery and makes a first composition from natural language. Both collaborators act on the same React state, and both are identified in the live activity stream. The human can immediately inspect or alter every result.

## Implementation

The app is built with React and vinext. Six imperative WebMCP tools register client-side through `document.modelContext.registerTool` after mount. Each tool has a compact JSON Schema, validates card identifiers against a fixed public collection, returns concise text, and updates the exact same state used by the visible controls. Tool registration is cleaned up with an `AbortController` when the page unmounts.

Discovery tools use `readOnlyHint`; route composition and atmosphere changes are marked state-changing. The challenge edition has no account, database, analytics, uploads, private links, or persistent user state.

## Potential impact

Most creative websites make visitors choose between browsing alone and handing control to an opaque automation. Transparent Glasshouse proposes a third pattern: a legible shared surface where an agent can help arrange meaning without removing the person from the act of making it. The same pattern could support museum collections, story studios, visual research boards, learning journeys, and creative storefronts.

## Privacy and scope

This is a separate public challenge edition. It contains five public demo cards only and does not expose the private BloomPlatform project, account links, unpublished workflows, credentials, paid materials, or personal files.

## License

MIT License. Copyright © 2026 Cherie Stolting.
