"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Check,
  CirclePlus,
  Glasses,
  RotateCcw,
  Route,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const BLOOM_CARDS = [
  {
    id: "redwood-roads",
    number: "01",
    title: "Redwood Roads",
    eyebrow: "Copper line · Recognition",
    line: "Every branch remembers where a road once ran.",
    story:
      "A traveling city crosses the high canopy slowly enough for neighbors to recognize one another.",
    prompt: "Build a route about belonging, motion, and being welcomed home.",
    mood: "warm passage",
    tags: ["roads", "home", "canopy"],
    accent: "#ff9a66",
    glow: "255, 121, 84",
  },
  {
    id: "saturn-house",
    number: "02",
    title: "Saturn House",
    eyebrow: "Gold line · Slow time",
    line: "Where time moves slow, the constellations write back.",
    story:
      "A glass room holds the distance long enough for wonder to become handwriting.",
    prompt: "Build a route that slows the room and leaves space for wonder.",
    mood: "luminous pause",
    tags: ["time", "stars", "stillness"],
    accent: "#ffd56a",
    glow: "255, 207, 85",
  },
  {
    id: "glass-beach",
    number: "03",
    title: "Glass Beach",
    eyebrow: "Teal line · Found light",
    line: "The tide returns every broken color as a small lantern.",
    story:
      "A shoreline archive where weathered fragments become a map of light instead of evidence of damage.",
    prompt: "Build a route about transformation, tide, and recovered color.",
    mood: "bright recovery",
    tags: ["tide", "glass", "color"],
    accent: "#61f2dd",
    glow: "70, 236, 211",
  },
  {
    id: "small-mercies",
    number: "04",
    title: "Museum of Small Mercies",
    eyebrow: "Rose line · Tender evidence",
    line: "The smallest kindnesses are catalogued at full scale.",
    story:
      "An intimate collection of gestures that usually disappear before anyone thinks to name them.",
    prompt: "Build a route that notices care without making it perform.",
    mood: "quiet care",
    tags: ["care", "memory", "gesture"],
    accent: "#ff8fc7",
    glow: "255, 102, 183",
  },
  {
    id: "squirrels-without-trees",
    number: "05",
    title: "Squirrels Without Trees",
    eyebrow: "Lime line · Memory",
    line: "Memory is not absence—just distance from where something stood.",
    story:
      "A vanished pine leaves a missing road in the air, and a traveler pauses where the path should continue.",
    prompt: "Build a route about lost paths, memory, and making a new way.",
    mood: "gentle melancholy",
    tags: ["trees", "distance", "paths"],
    accent: "#b8ff7a",
    glow: "161, 255, 96",
  },
] as const;

type CardId = (typeof BLOOM_CARDS)[number]["id"];
type GlassMode = "clear" | "aurora" | "dim" | "neon";
type Activity = { id: number; actor: "You" | "Agent"; message: string };

const GLASS_MODES: GlassMode[] = ["clear", "aurora", "dim", "neon"];
const CARD_IDS = BLOOM_CARDS.map((card) => card.id);
const CARD_ID_SCHEMA = { type: "string", enum: CARD_IDS };

function cardById(id: string) {
  return BLOOM_CARDS.find((card) => card.id === id);
}

export default function Home() {
  const [route, setRoute] = useState<CardId[]>([]);
  const [selectedId, setSelectedId] = useState<CardId>("saturn-house");
  const [query, setQuery] = useState("");
  const [highlights, setHighlights] = useState<CardId[]>([]);
  const [glassMode, setGlassMode] = useState<GlassMode>("aurora");
  const [toolState, setToolState] = useState<"checking" | "ready" | "preview" | "error">("checking");
  const [activity, setActivity] = useState<Activity[]>([
    { id: 1, actor: "You", message: "Entered the Glasshouse." },
  ]);
  const activityId = useRef(1);

  const selectedCard = cardById(selectedId) ?? BLOOM_CARDS[0];

  const addActivity = (actor: Activity["actor"], message: string) => {
    activityId.current += 1;
    setActivity((current) => [
      { id: activityId.current, actor, message },
      ...current,
    ].slice(0, 6));
  };

  const openCard = (id: CardId, actor: Activity["actor"] = "You") => {
    const card = cardById(id);
    if (!card) return;
    setSelectedId(id);
    addActivity(actor, `Opened ${card.title}.`);
    requestAnimationFrame(() => {
      document.getElementById(`card-${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  };

  const addToRoute = (id: CardId) => {
    const card = cardById(id);
    if (!card || route.includes(id) || route.length >= 5) return;
    setRoute((current) => [...current, id]);
    addActivity("You", `Added ${card.title} to the route.`);
  };

  const removeFromRoute = (id: CardId) => {
    const card = cardById(id);
    setRoute((current) => current.filter((item) => item !== id));
    if (card) addActivity("You", `Removed ${card.title} from the route.`);
  };

  const moveRouteCard = (index: number, direction: -1 | 1) => {
    setRoute((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    addActivity("You", "Reordered the Wonder Route.");
  };

  const searchCards = (value: string, actor: Activity["actor"] = "You") => {
    const normalized = value.trim().toLowerCase();
    setQuery(value);
    if (!normalized) {
      setHighlights([]);
      return [];
    }
    const matches = BLOOM_CARDS.filter((card) =>
      [card.title, card.eyebrow, card.line, card.story, card.mood, ...card.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    ).map((card) => card.id);
    setHighlights(matches);
    if (matches[0]) setSelectedId(matches[0]);
    addActivity(actor, `Searched the constellation for “${value.trim()}”.`);
    return matches;
  };

  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) {
      queueMicrotask(() => setToolState("preview"));
      return;
    }

    const controller = new AbortController();
    const register = async () => {
      try {
        await Promise.all([
          modelContext.registerTool(
            {
              name: "list_bloom_cards",
              description: "List the public Bloom Cards in the Transparent Glasshouse with their themes and moods.",
              inputSchema: { type: "object", properties: {}, additionalProperties: false },
              annotations: { readOnlyHint: true },
              execute: async () => ({
                cards: BLOOM_CARDS.map((card) => ({ id: card.id, title: card.title, mood: card.mood })),
              }),
            },
            { signal: controller.signal },
          ),
          modelContext.registerTool(
            {
              name: "find_bloom_cards",
              description: "Search the Bloom constellation by idea, mood, place, or story detail and highlight matches in the shared view.",
              inputSchema: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Theme or phrase to find.", minLength: 2, maxLength: 80 },
                },
                required: ["query"],
                additionalProperties: false,
              },
              annotations: { readOnlyHint: true },
              execute: async (input) => {
                const { query } = input as { query: string };
                const matches = searchCards(query, "Agent");
                if (!matches.length) return { message: `No Bloom Cards matched “${query}”.`, highlighted: [] };
                return { highlighted: matches.map((id) => cardById(id)?.title) };
              },
            },
            { signal: controller.signal },
          ),
          modelContext.registerTool(
            {
              name: "open_bloom_card",
              description: "Open one Bloom Card in the shared Glasshouse so the person and agent can examine the same story prompt.",
              inputSchema: {
                type: "object",
                properties: { card_id: { ...CARD_ID_SCHEMA, description: "Bloom Card to open." } },
                required: ["card_id"],
                additionalProperties: false,
              },
              annotations: { readOnlyHint: true },
              execute: async (input) => {
                const { card_id } = input as { card_id: CardId };
                const card = cardById(card_id);
                if (!card) return { error: "That Bloom Card does not exist." };
                openCard(card_id, "Agent");
                return { opened: card.title, line: card.line };
              },
            },
            { signal: controller.signal },
          ),
          modelContext.registerTool(
            {
              name: "compose_wonder_route",
              description: "Compose an ordered Wonder Route from up to five Bloom Cards and show it immediately in the shared Glasshouse.",
              inputSchema: {
                type: "object",
                properties: {
                  card_ids: {
                    type: "array",
                    description: "Bloom Card IDs in route order.",
                    items: CARD_ID_SCHEMA,
                    minItems: 1,
                    maxItems: 5,
                    uniqueItems: true,
                  },
                  reason: { type: "string", description: "Short reason for this route.", maxLength: 160 },
                },
                required: ["card_ids"],
                additionalProperties: false,
              },
              annotations: { readOnlyHint: false },
              execute: async (input) => {
                const { card_ids, reason } = input as { card_ids: CardId[]; reason?: string };
                const validIds = card_ids.filter((id, index) => cardById(id) && card_ids.indexOf(id) === index).slice(0, 5);
                if (!validIds.length) return { error: "No valid Bloom Cards were provided." };
                setRoute(validIds);
                setHighlights(validIds);
                setSelectedId(validIds[0]);
                addActivity("Agent", `Composed a ${validIds.length}-stop Wonder Route${reason ? `: ${reason}` : "."}`);
                return { route: validIds.map((id) => cardById(id)?.title), reason: reason ?? null };
              },
            },
            { signal: controller.signal },
          ),
          modelContext.registerTool(
            {
              name: "set_glass_mode",
              description: "Change the shared Glasshouse atmosphere to clear, aurora, dim, or neon without changing its content.",
              inputSchema: {
                type: "object",
                properties: {
                  mode: { type: "string", enum: GLASS_MODES, description: "Glass atmosphere." },
                },
                required: ["mode"],
                additionalProperties: false,
              },
              annotations: { readOnlyHint: false },
              execute: async (input) => {
                const { mode } = input as { mode: GlassMode };
                if (!GLASS_MODES.includes(mode)) return { error: "Unknown glass mode." };
                setGlassMode(mode);
                addActivity("Agent", `Changed the glass to ${mode} mode.`);
                return { mode };
              },
            },
            { signal: controller.signal },
          ),
        ]);
        setToolState("ready");
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("WebMCP registration failed", error);
          setToolState("error");
        }
      }
    };

    void register();
    return () => controller.abort();
    // Tool handlers intentionally register once and update the shared React surface through stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const routeCards = useMemo(
    () => route.map((id) => cardById(id)).filter(Boolean),
    [route],
  );

  return (
    <main className={`glasshouse mode-${glassMode}`}>
      <div className="ambient" aria-hidden="true">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
        <span className="orbit orbit-one" />
        <span className="orbit orbit-two" />
      </div>

      <div className="page-shell">
        <header className="masthead glass-panel">
          <a className="brand" href="#top" aria-label="Transparent Glasshouse home">
            <span className="brand-mark" aria-hidden="true"><Sparkles /></span>
            <span>
              <strong>Transparent Glasshouse</strong>
              <small>WebMCP Edition · Public Constellation</small>
            </span>
          </a>
          <div className={`tool-status status-${toolState}`} aria-live="polite">
            <span className="status-light" />
            {toolState === "ready" && "5 WebMCP tools ready"}
            {toolState === "preview" && "Browser preview · WebMCP available in supported browsers"}
            {toolState === "checking" && "Checking WebMCP…"}
            {toolState === "error" && "WebMCP tools need a refresh"}
          </div>
        </header>

        <section className="intro glass-panel" id="top">
          <div>
            <p className="kicker">A shared surface for human imagination + agent action</p>
            <h1>Enter the clear room.<br />Find a path through wonder.</h1>
          </div>
          <div className="intro-copy">
            <p>
              Explore the cards yourself, or ask an AI agent to search the
              constellation and compose a route. Every action appears in the same live world.
            </p>
            <code>Try: “Build me a route about memory, home, and recovered light.”</code>
          </div>
        </section>

        <nav className="mode-dock glass-panel" aria-label="Glass atmosphere">
          <span><Glasses /> Glass atmosphere</span>
          <div>
            {GLASS_MODES.map((mode) => (
              <Button
                key={mode}
                variant="ghost"
                size="sm"
                className={glassMode === mode ? "mode-button active" : "mode-button"}
                onClick={() => {
                  setGlassMode(mode);
                  addActivity("You", `Changed the glass to ${mode} mode.`);
                }}
              >
                {glassMode === mode && <Check />}{mode}
              </Button>
            ))}
          </div>
        </nav>

        <div className="workbench">
          <section className="constellation glass-panel" aria-labelledby="constellation-title">
            <div className="section-heading">
              <div>
                <p className="kicker">The public collection</p>
                <h2 id="constellation-title">Bloom Constellation</h2>
              </div>
              <label className="search-field">
                <Search aria-hidden="true" />
                <span className="sr-only">Search Bloom Cards</span>
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    const normalized = event.target.value.trim().toLowerCase();
                    setHighlights(
                      normalized
                        ? BLOOM_CARDS.filter((card) =>
                            [card.title, card.story, card.mood, ...card.tags].join(" ").toLowerCase().includes(normalized),
                          ).map((card) => card.id)
                        : [],
                    );
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchCards(query);
                  }}
                  placeholder="Find a feeling or place"
                />
              </label>
            </div>

            <div className="card-field">
              {BLOOM_CARDS.map((card, index) => {
                const isSelected = selectedId === card.id;
                const isHighlighted = highlights.includes(card.id);
                const isOnRoute = route.includes(card.id);
                return (
                  <article
                    id={`card-${card.id}`}
                    key={card.id}
                    className={`bloom-card card-${index + 1}${isSelected ? " selected" : ""}${isHighlighted ? " highlighted" : ""}`}
                    style={{ "--card-accent": card.accent, "--card-glow": card.glow } as React.CSSProperties}
                  >
                    <span className="card-number">{card.number}</span>
                    <p>{card.eyebrow}</p>
                    <button className="card-open" onClick={() => openCard(card.id)}>
                      <strong>{card.title}</strong>
                      <span>{card.line}</span>
                    </button>
                    <div className="card-footer">
                      <span>{card.mood}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => isOnRoute ? removeFromRoute(card.id) : addToRoute(card.id)}
                        aria-label={`${isOnRoute ? "Remove" : "Add"} ${card.title} ${isOnRoute ? "from" : "to"} route`}
                      >
                        {isOnRoute ? <Check /> : <CirclePlus />}
                        {isOnRoute ? "Added" : "Add"}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>

            <article className="focus-card" style={{ "--card-accent": selectedCard.accent } as React.CSSProperties}>
              <div>
                <p className="kicker">Open card · {selectedCard.number}</p>
                <h3>{selectedCard.title}</h3>
              </div>
              <div>
                <p>{selectedCard.story}</p>
                <blockquote>{selectedCard.prompt}</blockquote>
              </div>
            </article>
          </section>

          <aside className="route-column">
            <section className="route-panel glass-panel" aria-labelledby="route-title">
              <div className="section-heading compact">
                <div>
                  <p className="kicker">Shared composition</p>
                  <h2 id="route-title"><Route /> Wonder Route</h2>
                </div>
                {route.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setRoute([]);
                      addActivity("You", "Cleared the Wonder Route.");
                    }}
                    aria-label="Clear route"
                  >
                    <RotateCcw />
                  </Button>
                )}
              </div>

              {routeCards.length === 0 ? (
                <div className="empty-route">
                  <Route />
                  <strong>No route yet.</strong>
                  <p>Add a card yourself or invite an agent to compose one.</p>
                </div>
              ) : (
                <ol className="route-list">
                  {routeCards.map((card, index) => card && (
                    <li key={card.id} style={{ "--card-accent": card.accent } as React.CSSProperties}>
                      <span className="route-stop">{index + 1}</span>
                      <button onClick={() => openCard(card.id)}>
                        <strong>{card.title}</strong>
                        <small>{card.mood}</small>
                      </button>
                      <div className="route-actions">
                        <Button variant="ghost" size="icon-xs" disabled={index === 0} onClick={() => moveRouteCard(index, -1)} aria-label={`Move ${card.title} up`}><ArrowUp /></Button>
                        <Button variant="ghost" size="icon-xs" disabled={index === route.length - 1} onClick={() => moveRouteCard(index, 1)} aria-label={`Move ${card.title} down`}><ArrowDown /></Button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <div className="route-summary">
                <span>{route.length}/5 stops</span>
                <span>{route.length ? "Route lives in this session" : "Waiting for a first spark"}</span>
              </div>
            </section>

            <section className="activity-panel glass-panel" aria-labelledby="activity-title">
              <div className="section-heading compact">
                <div>
                  <p className="kicker">One surface, two collaborators</p>
                  <h2 id="activity-title">Live activity</h2>
                </div>
              </div>
              <ul aria-live="polite">
                {activity.map((item) => (
                  <li key={item.id}>
                    <span className={`actor actor-${item.actor.toLowerCase()}`} aria-hidden="true">
                      {item.actor === "Agent" ? <Bot /> : <UserRound />}
                    </span>
                    <p><strong>{item.actor}</strong>{item.message}</p>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <footer className="footer glass-panel">
          <p><Sparkles /> Transparent Glasshouse is a public WebMCP experiment in collaborative browsing.</p>
          <p>Five tools · No account · No upload · Session-only state</p>
        </footer>
      </div>
    </main>
  );
}
