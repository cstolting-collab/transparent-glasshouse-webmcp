"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Check,
  CirclePlus,
  CloudRain,
  Eye,
  GlassWater,
  RotateCcw,
  Route,
  Search,
  Sparkles,
  SunMedium,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BLOOM_CARDS = [
  {
    id: "redwood-roads",
    number: "I",
    chapter: "Recognition",
    title: "Redwood Roads",
    line: "Every branch remembers where a road once ran.",
    story: "A traveling city crosses the high canopy slowly enough for neighbors to recognize one another.",
    prompt: "Build a route about belonging, motion, and being welcomed home.",
    mood: "warm passage",
    tags: ["roads", "home", "canopy"],
    accent: "#cf694a",
    position: "center 52%",
  },
  {
    id: "saturn-house",
    number: "II",
    chapter: "Slow Time",
    title: "Saturn House",
    line: "Where time moves slow, the constellations write back.",
    story: "A glass room holds the distance long enough for wonder to become handwriting.",
    prompt: "Build a route that slows the room and leaves space for wonder.",
    mood: "luminous pause",
    tags: ["time", "stars", "stillness"],
    accent: "#b68a25",
    position: "center 16%",
  },
  {
    id: "glass-beach",
    number: "III",
    chapter: "Found Light",
    title: "Glass Beach",
    line: "The tide returns every broken color as a small lantern.",
    story: "A shoreline archive where weathered fragments become a map of light instead of evidence of damage.",
    prompt: "Build a route about transformation, tide, and recovered color.",
    mood: "bright recovery",
    tags: ["tide", "glass", "color"],
    accent: "#2d8c89",
    position: "42% 66%",
  },
  {
    id: "small-mercies",
    number: "IV",
    chapter: "Tender Evidence",
    title: "Museum of Small Mercies",
    line: "The smallest kindnesses are catalogued at full scale.",
    story: "An intimate collection of gestures that usually disappear before anyone thinks to name them.",
    prompt: "Build a route that notices care without making it perform.",
    mood: "quiet care",
    tags: ["care", "memory", "gesture"],
    accent: "#a85d79",
    position: "16% 78%",
  },
  {
    id: "squirrels-without-trees",
    number: "V",
    chapter: "Memory",
    title: "Squirrels Without Trees",
    line: "Memory is not absence—just distance from where something stood.",
    story: "A vanished pine leaves a missing road in the air, and a traveler pauses where the path should continue.",
    prompt: "Build a route about lost paths, memory, and making a new way.",
    mood: "gentle melancholy",
    tags: ["trees", "distance", "paths"],
    accent: "#6d8238",
    position: "80% 57%",
  },
] as const;

type CardId = (typeof BLOOM_CARDS)[number]["id"];
type GlassMode = "clear" | "soft" | "evening" | "luminous";
type Weather = "sunbreak" | "mist" | "rain" | "starlight";
type Activity = { id: number; actor: "You" | "Agent"; message: string };

const GLASS_MODES: GlassMode[] = ["clear", "soft", "evening", "luminous"];
const WEATHER: Weather[] = ["sunbreak", "mist", "rain", "starlight"];
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
  const [glassMode, setGlassMode] = useState<GlassMode>("clear");
  const [weather, setWeather] = useState<Weather>("sunbreak");
  const [toolState, setToolState] = useState<"checking" | "ready" | "preview" | "error">("checking");
  const [activity, setActivity] = useState<Activity[]>([
    { id: 1, actor: "You", message: "Entered the clear room." },
  ]);
  const activityId = useRef(1);

  const selectedCard = cardById(selectedId) ?? BLOOM_CARDS[0];
  const routeCards = useMemo(() => route.map((id) => cardById(id)).filter(Boolean), [route]);

  const addActivity = (actor: Activity["actor"], message: string) => {
    activityId.current += 1;
    setActivity((current) => [{ id: activityId.current, actor, message }, ...current].slice(0, 5));
  };

  const openCard = (id: CardId, actor: Activity["actor"] = "You") => {
    const card = cardById(id);
    if (!card) return;
    setSelectedId(id);
    addActivity(actor, `Opened ${card.title}.`);
    requestAnimationFrame(() => document.getElementById("reading-room")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const addToRoute = (id: CardId, actor: Activity["actor"] = "You") => {
    const card = cardById(id);
    if (!card || route.includes(id) || route.length >= 5) return;
    setRoute((current) => [...current, id]);
    addActivity(actor, `Placed ${card.title} on the journey.`);
  };

  const removeFromRoute = (id: CardId) => {
    const card = cardById(id);
    setRoute((current) => current.filter((item) => item !== id));
    if (card) addActivity("You", `Lifted ${card.title} from the journey.`);
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
      return [] as CardId[];
    }
    const matches = BLOOM_CARDS.filter((card) =>
      [card.title, card.chapter, card.line, card.story, card.mood, ...card.tags].join(" ").toLowerCase().includes(normalized),
    ).map((card) => card.id);
    setHighlights(matches);
    if (matches[0]) setSelectedId(matches[0]);
    addActivity(actor, `Looked through the collection for “${value.trim()}”.`);
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
          modelContext.registerTool({
            name: "list_bloom_cards",
            description: "List the public Bloom Cards in the Transparent Glasshouse with their themes and moods.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true },
            execute: async () => ({ cards: BLOOM_CARDS.map((card) => ({ id: card.id, title: card.title, mood: card.mood })) }),
          }, { signal: controller.signal }),
          modelContext.registerTool({
            name: "find_bloom_cards",
            description: "Search the Bloom collection by idea, mood, place, or story detail and highlight matches in the shared room.",
            inputSchema: {
              type: "object",
              properties: { query: { type: "string", description: "Theme or phrase to find.", minLength: 2, maxLength: 80 } },
              required: ["query"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: async (input) => {
              const { query } = input as { query: string };
              const matches = searchCards(query, "Agent");
              return matches.length
                ? { highlighted: matches.map((id) => cardById(id)?.title) }
                : { message: `No Bloom Cards matched “${query}”.`, highlighted: [] };
            },
          }, { signal: controller.signal }),
          modelContext.registerTool({
            name: "open_bloom_card",
            description: "Open one Bloom Card in the shared reading room.",
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
          }, { signal: controller.signal }),
          modelContext.registerTool({
            name: "compose_wonder_route",
            description: "Compose an ordered Wonder Route from up to five Bloom Cards and show it immediately in the shared room.",
            inputSchema: {
              type: "object",
              properties: {
                card_ids: { type: "array", items: CARD_ID_SCHEMA, minItems: 1, maxItems: 5, uniqueItems: true },
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
          }, { signal: controller.signal }),
          modelContext.registerTool({
            name: "set_glass_mode",
            description: "Set the shared glass treatment to clear, soft, evening, or luminous.",
            inputSchema: {
              type: "object",
              properties: { mode: { type: "string", enum: GLASS_MODES, description: "Glass treatment." } },
              required: ["mode"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: async (input) => {
              const { mode } = input as { mode: GlassMode };
              if (!GLASS_MODES.includes(mode)) return { error: "Unknown glass treatment." };
              setGlassMode(mode);
              addActivity("Agent", `Changed the glass to ${mode}.`);
              return { mode };
            },
          }, { signal: controller.signal }),
          modelContext.registerTool({
            name: "set_glasshouse_weather",
            description: "Change the visible Glasshouse weather to sunbreak, mist, rain, or starlight.",
            inputSchema: {
              type: "object",
              properties: { weather: { type: "string", enum: WEATHER, description: "Weather in the shared room." } },
              required: ["weather"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: async (input) => {
              const nextWeather = (input as { weather: Weather }).weather;
              if (!WEATHER.includes(nextWeather)) return { error: "Unknown weather." };
              setWeather(nextWeather);
              addActivity("Agent", `Brought in ${nextWeather}.`);
              return { weather: nextWeather };
            },
          }, { signal: controller.signal }),
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
    // WebMCP handlers intentionally register once and update the same React surface as human controls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={`glasshouse glass-${glassMode} weather-${weather}`}>
      <div className="world" aria-hidden="true" />
      <div className="weather-layer" aria-hidden="true" />
      <div className="glasshouse-shell">
        <header className="masthead clear-panel" id="top">
          <a className="brand" href="#top" aria-label="Transparent Glasshouse home">
            <span className="brand-seal"><GlassWater /></span>
            <span>
              <small>The public constellation</small>
              <strong>Transparent Glasshouse</strong>
            </span>
          </a>
          <nav aria-label="Glasshouse sections">
            <a href="#collection">Bloom Cards</a>
            <a href="#reading-room">Reading Room</a>
            <a href="#journey">Wonder Route</a>
          </nav>
          <div className={`tool-status status-${toolState}`} aria-live="polite">
            <span />
            {toolState === "ready" && "Six agent tools awake"}
            {toolState === "preview" && "Human room open · agent tools available in WebMCP"}
            {toolState === "checking" && "Opening the room…"}
            {toolState === "error" && "Refresh to wake agent tools"}
          </div>
        </header>

        <section className="welcome clear-panel" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <p className="folio">The Glasshouse Constellation · A living card room</p>
            <h1 id="welcome-title">A clear room<br />for finding wonder.</h1>
            <p className="welcome-note">Browse a card with your own hands—or let an agent help find a path. You remain together in the same visible room.</p>
          </div>
          <div className="room-controls" aria-label="Room controls">
            <label>
              <span><CloudRain /> Weather</span>
              <Select value={weather} onValueChange={(value) => {
                const next = value as Weather;
                setWeather(next);
                addActivity("You", `Brought in ${next}.`);
              }}>
                <SelectTrigger className="weather-select" aria-label="Choose Glasshouse weather"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEATHER.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            <label>
              <span><Eye /> Glass</span>
              <Select value={glassMode} onValueChange={(value) => {
                const next = value as GlassMode;
                setGlassMode(next);
                addActivity("You", `Changed the glass to ${next}.`);
              }}>
                <SelectTrigger className="weather-select" aria-label="Choose glass treatment"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GLASS_MODES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            <p><SunMedium /> Today in the canopy<br /><strong>{weather === "sunbreak" ? "Rain clearing · warm light returning" : weather === "mist" ? "Low cloud · roads appearing slowly" : weather === "rain" ? "Soft rain · lanterns lit" : "Clear night · Saturn visible"}</strong></p>
          </div>
        </section>

        <div className="room-grid">
          <section className="collection clear-panel" id="collection" aria-labelledby="collection-title">
            <div className="section-title">
              <div>
                <p className="folio">Collection No. 01</p>
                <h2 id="collection-title">Bloom Cards</h2>
              </div>
              <label className="search-field">
                <Search aria-hidden="true" />
                <span className="sr-only">Search Bloom Cards</span>
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    const normalized = event.target.value.trim().toLowerCase();
                    setHighlights(normalized ? BLOOM_CARDS.filter((card) => [card.title, card.story, card.mood, ...card.tags].join(" ").toLowerCase().includes(normalized)).map((card) => card.id) : []);
                  }}
                  onKeyDown={(event) => { if (event.key === "Enter") searchCards(query); }}
                  placeholder="Find memory, home, light…"
                />
              </label>
            </div>

            <div className="constellation-rail" aria-hidden="true"><span /><span /><span /><span /><span /></div>
            <div className="card-gallery">
              {BLOOM_CARDS.map((card, index) => {
                const isSelected = selectedId === card.id;
                const isHighlighted = highlights.includes(card.id);
                const isOnRoute = route.includes(card.id);
                return (
                  <article
                    id={`card-${card.id}`}
                    key={card.id}
                    className={`bloom-card card-${index + 1}${isSelected ? " selected" : ""}${isHighlighted ? " highlighted" : ""}`}
                    style={{ "--card-accent": card.accent } as React.CSSProperties}
                  >
                    <div className="card-edge" />
                    <header><span>Bloom Card</span><span>{card.number}</span></header>
                    <button className="card-portrait" onClick={() => openCard(card.id)} aria-label={`Open ${card.title}`} style={{ backgroundPosition: card.position }}>
                      <span>{card.chapter}</span>
                    </button>
                    <button className="card-reading" onClick={() => openCard(card.id)}>
                      <small>The Glasshouse Constellation</small>
                      <strong>{card.title}</strong>
                      <em>{card.line}</em>
                    </button>
                    <footer>
                      <span>{card.mood}</span>
                      <Button variant="ghost" size="sm" onClick={() => isOnRoute ? removeFromRoute(card.id) : addToRoute(card.id)} aria-label={`${isOnRoute ? "Remove" : "Add"} ${card.title} ${isOnRoute ? "from" : "to"} route`}>
                        {isOnRoute ? <Check /> : <CirclePlus />}{isOnRoute ? "Placed" : "Place"}
                      </Button>
                    </footer>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="journey clear-panel" id="journey" aria-labelledby="journey-title">
            <div className="section-title compact">
              <div><p className="folio">Your path</p><h2 id="journey-title">Wonder Route</h2></div>
              {route.length > 0 && <Button variant="ghost" size="icon-sm" onClick={() => { setRoute([]); addActivity("You", "Cleared the Wonder Route."); }} aria-label="Clear route"><RotateCcw /></Button>}
            </div>
            {routeCards.length === 0 ? (
              <div className="empty-journey"><Route /><strong>Begin anywhere.</strong><p>Place a card here, or ask an agent for a route about what is on your mind.</p></div>
            ) : (
              <ol className="journey-list">
                {routeCards.map((card, index) => card && (
                  <li key={card.id} style={{ "--card-accent": card.accent } as React.CSSProperties}>
                    <span className="route-number">{String(index + 1).padStart(2, "0")}</span>
                    <button onClick={() => openCard(card.id)}><strong>{card.title}</strong><small>{card.chapter}</small></button>
                    <div>
                      <Button variant="ghost" size="icon-xs" disabled={index === 0} onClick={() => moveRouteCard(index, -1)} aria-label={`Move ${card.title} up`}><ArrowUp /></Button>
                      <Button variant="ghost" size="icon-xs" disabled={index === route.length - 1} onClick={() => moveRouteCard(index, 1)} aria-label={`Move ${card.title} down`}><ArrowDown /></Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <p className="route-count">{route.length} of 5 cards · held only for this visit</p>
          </aside>
        </div>

        <section className="reading-room clear-panel" id="reading-room" aria-labelledby="reading-title" style={{ "--card-accent": selectedCard.accent } as React.CSSProperties}>
          <div className="reading-image" style={{ backgroundPosition: selectedCard.position }}><span>{selectedCard.number}</span></div>
          <div className="reading-copy">
            <p className="folio">Open card · {selectedCard.chapter}</p>
            <h2 id="reading-title">{selectedCard.title}</h2>
            <blockquote>{selectedCard.line}</blockquote>
            <p>{selectedCard.story}</p>
            <div className="prompt"><Sparkles /><span><small>A possible path</small>{selectedCard.prompt}</span></div>
          </div>
          <Button className="reading-place" variant="ghost" onClick={() => route.includes(selectedCard.id) ? removeFromRoute(selectedCard.id) : addToRoute(selectedCard.id)}>
            {route.includes(selectedCard.id) ? <Check /> : <CirclePlus />}{route.includes(selectedCard.id) ? "On the route" : "Place on route"}
          </Button>
        </section>

        <section className="shared-ledger clear-panel" aria-labelledby="ledger-title">
          <div><p className="folio">One room · two kinds of attention</p><h2 id="ledger-title">Shared ledger</h2></div>
          <ul aria-live="polite">
            {activity.map((item) => (
              <li key={item.id}><span className={`actor actor-${item.actor.toLowerCase()}`}>{item.actor === "Agent" ? <Bot /> : <UserRound />}</span><p><strong>{item.actor}</strong>{item.message}</p></li>
            ))}
          </ul>
        </section>

        <footer className="site-footer clear-panel">
          <p><Sparkles /> An independent WebMCP experiment by Cherie Stolting.</p>
          <p>Six tools · no account · no upload · session-only state</p>
        </footer>
      </div>
    </main>
  );
}
