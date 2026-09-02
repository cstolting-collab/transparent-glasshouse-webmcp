"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CirclePlus,
  CloudSun,
  Flower2,
  FolderOpen,
  Globe2,
  GripHorizontal,
  Home,
  Leaf,
  LockKeyhole,
  MessageCircle,
  MoreHorizontal,
  Move,
  Music2,
  PenLine,
  Plus,
  RotateCcw,
  Route,
  Search,
  Settings2,
  Star,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const BLOOM_CARDS = [
  {
    id: "redwood-roads",
    number: "I",
    title: "Redwood Roads",
    chapter: "Recognition",
    line: "Every branch remembers where a road once ran.",
    story: "A traveling city crosses the high canopy slowly enough for neighbors to recognize one another.",
    prompt: "Build a route about belonging, motion, and being welcomed home.",
    mood: "warm passage",
    tags: ["roads", "home", "canopy"],
    accent: "#ff8a5b",
  },
  {
    id: "saturn-house",
    number: "II",
    title: "Saturn House",
    chapter: "Slow Time",
    line: "Where time moves slow, the constellations write back.",
    story: "A glass room holds the distance long enough for wonder to become handwriting.",
    prompt: "Build a route that slows the room and leaves space for wonder.",
    mood: "luminous pause",
    tags: ["time", "stars", "stillness"],
    accent: "#ffd873",
  },
  {
    id: "glass-beach",
    number: "III",
    title: "Glass Beach",
    chapter: "Found Light",
    line: "The tide returns every broken color as a small lantern.",
    story: "A shoreline archive where weathered fragments become a map of light instead of evidence of damage.",
    prompt: "Build a route about transformation, tide, and recovered color.",
    mood: "bright recovery",
    tags: ["tide", "glass", "color"],
    accent: "#64e4dd",
  },
  {
    id: "small-mercies",
    number: "IV",
    title: "Museum of Small Mercies",
    chapter: "Tender Evidence",
    line: "The smallest kindnesses are catalogued at full scale.",
    story: "An intimate collection of gestures that usually disappear before anyone thinks to name them.",
    prompt: "Build a route that notices care without making it perform.",
    mood: "quiet care",
    tags: ["care", "memory", "gesture"],
    accent: "#ff9dc9",
  },
  {
    id: "squirrels-without-trees",
    number: "V",
    title: "Squirrels Without Trees",
    chapter: "Memory",
    line: "Memory is not absence—just distance from where something stood.",
    story: "A vanished pine leaves a missing road in the air, and a traveler pauses where the path should continue.",
    prompt: "Build a route about lost paths, memory, and making a new way.",
    mood: "gentle melancholy",
    tags: ["trees", "distance", "paths"],
    accent: "#b9f28d",
  },
] as const;

type CardId = (typeof BLOOM_CARDS)[number]["id"];
type GlassMode = "crystal" | "soft" | "evening" | "luminous";
type Weather = "sunbreak" | "mist" | "rain" | "starlight";
type Actor = "You" | "Agent";
type Activity = { id: number; actor: Actor; message: string };
type PanelId = "idea" | "notes" | "media" | "weather" | "cards" | "route" | "activity";
type Offset = { x: number; y: number };

const GLASS_MODES: GlassMode[] = ["crystal", "soft", "evening", "luminous"];
const WEATHER: Weather[] = ["sunbreak", "mist", "rain", "starlight"];
const CARD_IDS = BLOOM_CARDS.map((card) => card.id);
const CARD_ID_SCHEMA = { type: "string", enum: CARD_IDS };
const PANEL_IDS: PanelId[] = ["idea", "notes", "media", "weather", "cards", "route", "activity"];
const ZERO_OFFSETS = Object.fromEntries(PANEL_IDS.map((id) => [id, { x: 0, y: 0 }])) as Record<PanelId, Offset>;
const DEFAULT_VISIBLE: Record<PanelId, boolean> = {
  idea: true,
  notes: true,
  media: true,
  weather: true,
  cards: true,
  route: true,
  activity: false,
};

function cardById(id: string) {
  return BLOOM_CARDS.find((card) => card.id === id);
}

function PanelFrame({
  id,
  title,
  className,
  visible,
  offset,
  z,
  onFront,
  onStartDrag,
  onMoveKey,
  onClose,
  children,
}: {
  id: PanelId;
  title: string;
  className: string;
  visible: boolean;
  offset: Offset;
  z: number;
  onFront: (id: PanelId) => void;
  onStartDrag: (id: PanelId, event: React.PointerEvent<HTMLElement>) => void;
  onMoveKey: (id: PanelId, event: React.KeyboardEvent<HTMLElement>) => void;
  onClose: (id: PanelId) => void;
  children: React.ReactNode;
}) {
  if (!visible) return null;
  return (
    <section
      className={`spatial-panel ${className}`}
      style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`, zIndex: z }}
      onPointerDown={() => onFront(id)}
      aria-label={title}
    >
      <header
        className="panel-handle"
        onPointerDown={(event) => onStartDrag(id, event)}
        onKeyDown={(event) => onMoveKey(id, event)}
        tabIndex={0}
        role="toolbar"
        aria-label={`Move ${title}. Use arrow keys or drag.`}
      >
        <span><GripHorizontal />{title}</span>
        <Button variant="ghost" size="icon-xs" onPointerDown={(event) => event.stopPropagation()} onClick={() => onClose(id)} aria-label={`Close ${title}`}><X /></Button>
      </header>
      {children}
    </section>
  );
}

export default function Home() {
  const [route, setRoute] = useState<CardId[]>([]);
  const [selectedId, setSelectedId] = useState<CardId>("saturn-house");
  const [query, setQuery] = useState("");
  const [highlights, setHighlights] = useState<CardId[]>([]);
  const [glassMode, setGlassMode] = useState<GlassMode>("crystal");
  const [glassOpacity, setGlassOpacity] = useState(16);
  const [weather, setWeather] = useState<Weather>("sunbreak");
  const [toolState, setToolState] = useState<"checking" | "ready" | "preview" | "error">("checking");
  const [activity, setActivity] = useState<Activity[]>([{ id: 1, actor: "You", message: "Entered the Glasshouse." }]);
  const [notes, setNotes] = useState(["Bloom idea", "Layering, not dividing", "Glass is gentler", "Light carries meaning"]);
  const [noteDraft, setNoteDraft] = useState("");
  const [offsets, setOffsets] = useState<Record<PanelId, Offset>>(ZERO_OFFSETS);
  const [visible, setVisible] = useState<Record<PanelId, boolean>>(DEFAULT_VISIBLE);
  const [zOrder, setZOrder] = useState<Record<PanelId, number>>(() => Object.fromEntries(PANEL_IDS.map((id, index) => [id, 10 + index])) as Record<PanelId, number>);
  const [roomHydrated, setRoomHydrated] = useState(false);
  const activityId = useRef(1);
  const zCounter = useRef(30);
  const dragRef = useRef<{ id: PanelId; pointerX: number; pointerY: number; origin: Offset } | null>(null);

  const selectedCard = cardById(selectedId) ?? BLOOM_CARDS[0];
  const routeCards = useMemo(() => route.map((id) => cardById(id)).filter(Boolean), [route]);

  const addActivity = (actor: Actor, message: string) => {
    activityId.current += 1;
    setActivity((current) => [{ id: activityId.current, actor, message }, ...current].slice(0, 7));
  };

  const bringToFront = (id: PanelId) => {
    zCounter.current += 1;
    setZOrder((current) => ({ ...current, [id]: zCounter.current }));
  };

  const revealPanel = (id: PanelId) => {
    setVisible((current) => ({ ...current, [id]: true }));
    bringToFront(id);
  };

  const togglePanel = (id: PanelId) => {
    const next = !visible[id];
    setVisible((current) => ({ ...current, [id]: next }));
    if (next) bringToFront(id);
  };

  const resetRoom = () => {
    setOffsets(ZERO_OFFSETS);
    setVisible(DEFAULT_VISIBLE);
    setZOrder(Object.fromEntries(PANEL_IDS.map((id, index) => [id, 10 + index])) as Record<PanelId, number>);
    addActivity("You", "Returned every panel to its place.");
  };

  const startDrag = (id: PanelId, event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    bringToFront(id);
    dragRef.current = { id, pointerX: event.clientX, pointerY: event.clientY, origin: offsets[id] };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const movePanelWithKeys = (id: PanelId, event: React.KeyboardEvent<HTMLElement>) => {
    const delta = event.shiftKey ? 24 : 8;
    const movement: Record<string, Offset> = {
      ArrowLeft: { x: -delta, y: 0 },
      ArrowRight: { x: delta, y: 0 },
      ArrowUp: { x: 0, y: -delta },
      ArrowDown: { x: 0, y: delta },
    };
    const next = movement[event.key];
    if (!next) return;
    event.preventDefault();
    bringToFront(id);
    setOffsets((current) => ({ ...current, [id]: { x: current[id].x + next.x, y: current[id].y + next.y } }));
  };

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const x = Math.max(-720, Math.min(720, drag.origin.x + event.clientX - drag.pointerX));
      const y = Math.max(-520, Math.min(520, drag.origin.y + event.clientY - drag.pointerY));
      setOffsets((current) => ({ ...current, [drag.id]: { x, y } }));
    };
    const stop = () => { dragRef.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("transparent-glasshouse-room");
      if (saved) {
        const value = JSON.parse(saved) as {
          offsets?: Partial<Record<PanelId, { x?: unknown; y?: unknown }>>;
          visible?: Partial<Record<PanelId, unknown>>;
          glassOpacity?: unknown;
        };
        const safeOffsets = { ...ZERO_OFFSETS };
        const safeVisible = { ...DEFAULT_VISIBLE };
        for (const id of PANEL_IDS) {
          const offset = value.offsets?.[id];
          if (offset && typeof offset.x === "number" && Number.isFinite(offset.x) && typeof offset.y === "number" && Number.isFinite(offset.y)) {
            safeOffsets[id] = {
              x: Math.max(-720, Math.min(720, offset.x)),
              y: Math.max(-520, Math.min(520, offset.y)),
            };
          }
          if (typeof value.visible?.[id] === "boolean") safeVisible[id] = value.visible[id];
        }
        setOffsets(safeOffsets);
        setVisible(safeVisible);
        if (typeof value.glassOpacity === "number" && Number.isFinite(value.glassOpacity)) {
          setGlassOpacity(Math.max(8, Math.min(36, value.glassOpacity)));
        }
      }
    } catch {
      window.localStorage.removeItem("transparent-glasshouse-room");
    } finally {
      setRoomHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!roomHydrated) return;
    window.localStorage.setItem("transparent-glasshouse-room", JSON.stringify({ offsets, visible, glassOpacity }));
  }, [roomHydrated, offsets, visible, glassOpacity]);

  const openCard = (id: CardId, actor: Actor = "You") => {
    const card = cardById(id);
    if (!card) return;
    setSelectedId(id);
    revealPanel("idea");
    addActivity(actor, `Opened ${card.title}.`);
  };

  const addToRoute = (id: CardId, actor: Actor = "You") => {
    const card = cardById(id);
    if (!card || route.includes(id) || route.length >= 5) return;
    setRoute((current) => [...current, id]);
    revealPanel("route");
    addActivity(actor, `Placed ${card.title} on the Wonder Route.`);
  };

  const removeFromRoute = (id: CardId) => {
    const card = cardById(id);
    setRoute((current) => current.filter((item) => item !== id));
    if (card) addActivity("You", `Lifted ${card.title} from the Wonder Route.`);
  };

  const searchCards = (value: string, actor: Actor = "You") => {
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
    if (matches[0]) openCard(matches[0], actor);
    revealPanel("cards");
    if (!matches[0]) addActivity(actor, `Found no card for “${value.trim()}”.`);
    return matches;
  };

  const addNote = () => {
    const value = noteDraft.trim();
    if (!value) return;
    setNotes((current) => [...current, value].slice(-7));
    setNoteDraft("");
    addActivity("You", "Added a thought to Notes.");
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
            description: "List the public Bloom Cards in the spatial Glasshouse.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true },
            execute: async () => ({ cards: BLOOM_CARDS.map(({ id, title, mood }) => ({ id, title, mood })) }),
          }, { signal: controller.signal }),
          modelContext.registerTool({
            name: "find_bloom_cards",
            description: "Search the Bloom collection and reveal matching cards in the shared space.",
            inputSchema: { type: "object", properties: { query: { type: "string", minLength: 2, maxLength: 80 } }, required: ["query"], additionalProperties: false },
            annotations: { readOnlyHint: false },
            execute: async (input) => {
              const matches = searchCards((input as { query: string }).query, "Agent");
              return { highlighted: matches.map((id) => cardById(id)?.title) };
            },
          }, { signal: controller.signal }),
          modelContext.registerTool({
            name: "open_bloom_card",
            description: "Bring one Bloom Card into the main glass window.",
            inputSchema: { type: "object", properties: { card_id: CARD_ID_SCHEMA }, required: ["card_id"], additionalProperties: false },
            annotations: { readOnlyHint: false },
            execute: async (input) => {
              const id = (input as { card_id: CardId }).card_id;
              const card = cardById(id);
              if (!card) return { error: "That Bloom Card does not exist." };
              openCard(id, "Agent");
              return { opened: card.title, line: card.line };
            },
          }, { signal: controller.signal }),
          modelContext.registerTool({
            name: "compose_wonder_route",
            description: "Compose an ordered Wonder Route from up to five Bloom Cards.",
            inputSchema: {
              type: "object",
              properties: { card_ids: { type: "array", items: CARD_ID_SCHEMA, minItems: 1, maxItems: 5, uniqueItems: true }, reason: { type: "string", maxLength: 160 } },
              required: ["card_ids"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: async (input) => {
              const { card_ids, reason } = input as { card_ids: CardId[]; reason?: string };
              const valid = card_ids.filter((id, index) => cardById(id) && card_ids.indexOf(id) === index).slice(0, 5);
              if (!valid.length) return { error: "No valid Bloom Cards were provided." };
              setRoute(valid);
              setHighlights(valid);
              openCard(valid[0], "Agent");
              revealPanel("route");
              addActivity("Agent", `Composed a ${valid.length}-stop route${reason ? `: ${reason}` : "."}`);
              return { route: valid.map((id) => cardById(id)?.title), reason: reason ?? null };
            },
          }, { signal: controller.signal }),
          modelContext.registerTool({
            name: "set_glass_mode",
            description: "Set the shared glass treatment to crystal, soft, evening, or luminous.",
            inputSchema: { type: "object", properties: { mode: { type: "string", enum: GLASS_MODES } }, required: ["mode"], additionalProperties: false },
            annotations: { readOnlyHint: false },
            execute: async (input) => {
              const mode = (input as { mode: GlassMode }).mode;
              if (!GLASS_MODES.includes(mode)) return { error: "Unknown glass treatment." };
              setGlassMode(mode);
              revealPanel("weather");
              addActivity("Agent", `Changed the glass to ${mode}.`);
              return { mode };
            },
          }, { signal: controller.signal }),
          modelContext.registerTool({
            name: "set_glasshouse_weather",
            description: "Change the visible Glasshouse weather to sunbreak, mist, rain, or starlight.",
            inputSchema: { type: "object", properties: { weather: { type: "string", enum: WEATHER } }, required: ["weather"], additionalProperties: false },
            annotations: { readOnlyHint: false },
            execute: async (input) => {
              const next = (input as { weather: Weather }).weather;
              if (!WEATHER.includes(next)) return { error: "Unknown weather." };
              setWeather(next);
              revealPanel("weather");
              addActivity("Agent", `Brought in ${next}.`);
              return { weather: next };
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
    // Tool handlers intentionally share the same state as the visible room.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const panelProps = (id: PanelId, title: string, className: string) => ({
    id,
    title,
    className,
    visible: visible[id],
    offset: offsets[id],
    z: zOrder[id],
    onFront: bringToFront,
    onStartDrag: startDrag,
    onMoveKey: movePanelWithKeys,
    onClose: (panelId: PanelId) => setVisible((current) => ({ ...current, [panelId]: false })),
  });

  return (
    <main className={`spatial-glasshouse glass-${glassMode} weather-${weather}`} style={{ "--glass-alpha": glassOpacity / 100 } as React.CSSProperties}>
      <div className="living-world" aria-hidden="true" />
      <div className="weather-space" aria-hidden="true" />
      <p className="world-motto">Not pages on a screen. <span>Ideas in space.</span></p>

      <aside className="side-dock glass-dock" aria-label="Glasshouse rooms">
        <Button variant="ghost" size="icon" onClick={resetRoom} title="Home · reset room" aria-label="Reset room"><Home /></Button>
        <Button variant="ghost" size="icon" onClick={() => togglePanel("weather")} className={visible.weather ? "active" : ""} title="Weather" aria-label="Toggle weather"><Globe2 /></Button>
        <Button variant="ghost" size="icon" onClick={() => togglePanel("cards")} className={visible.cards ? "active" : ""} title="Bloom Cards" aria-label="Toggle Bloom Cards"><Flower2 /></Button>
        <Button variant="ghost" size="icon" onClick={() => togglePanel("media")} className={visible.media ? "active" : ""} title="Motion and sound" aria-label="Toggle motion and sound"><Music2 /></Button>
        <Button variant="ghost" size="icon" onClick={() => togglePanel("activity")} className={visible.activity ? "active" : ""} title="Human and agent activity" aria-label="Toggle activity"><MessageCircle /></Button>
        <span />
        <Button variant="ghost" size="icon" onClick={() => revealPanel("notes")} title="Add a thought" aria-label="Open notes"><Plus /></Button>
      </aside>

      <div className="spatial-canvas">
        <PanelFrame {...panelProps("idea", "Bloom window", "idea-panel") }>
          <div className="browser-bar">
            <div><ArrowLeft /><ArrowRight /></div>
            <span><LockKeyhole /> bloom://ideas/{selectedCard.id}</span>
            <div><Star /><MoreHorizontal /></div>
          </div>
          <div className="idea-content" style={{ "--card-accent": selectedCard.accent } as React.CSSProperties}>
            <p>{selectedCard.chapter} · Bloom {selectedCard.number}</p>
            <h1>{selectedCard.title}</h1>
            <blockquote>{selectedCard.line}</blockquote>
            <div className="idea-story"><span>{selectedCard.story}</span><em>{selectedCard.prompt}</em></div>
            <div className="idea-actions">
              <Button variant="ghost" onClick={() => route.includes(selectedCard.id) ? removeFromRoute(selectedCard.id) : addToRoute(selectedCard.id)}>
                {route.includes(selectedCard.id) ? <Check /> : <CirclePlus />}{route.includes(selectedCard.id) ? "On the route" : "Place on route"}
              </Button>
              <button onClick={() => revealPanel("cards")}>Explore the constellation <ArrowRight /></button>
            </div>
          </div>
          <form className="idea-search" onSubmit={(event) => { event.preventDefault(); searchCards(query); }}>
            <Search />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask the collection about memory, home, light…" aria-label="Search Bloom Cards" />
            <Button variant="ghost" size="sm" type="submit">Find</Button>
          </form>
        </PanelFrame>

        <PanelFrame {...panelProps("notes", "Notes", "notes-panel") }>
          <ul>{notes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}</ul>
          <div className="note-entry">
            <input value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addNote(); }} placeholder="Add thought…" aria-label="New note" />
            <Button variant="ghost" size="icon-sm" onClick={addNote} aria-label="Add note"><Plus /></Button>
          </div>
        </PanelFrame>

        <PanelFrame {...panelProps("media", "Motion study", "media-panel") }>
          <div className="media-heading"><span><Music2 /></span><div><strong>The Transparent Web</strong><small>Ideas in Space · 00:10</small></div></div>
          <video controls playsInline preload="metadata" src="/transparent-web-motion-study.mp4">Your browser does not support the motion study.</video>
        </PanelFrame>

        <PanelFrame {...panelProps("weather", "Room weather", "weather-panel") }>
          <div className="weather-reading"><CloudSun /><strong>{weather === "starlight" ? "54°" : weather === "rain" ? "63°" : weather === "mist" ? "66°" : "72°"}</strong><span>{weather}<small>Glasshouse atmosphere</small></span></div>
          <div className="weather-controls">
            <Select value={weather} onValueChange={(value) => { const next = value as Weather; setWeather(next); addActivity("You", `Brought in ${next}.`); }}>
              <SelectTrigger aria-label="Choose weather"><SelectValue /></SelectTrigger>
              <SelectContent>{WEATHER.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={glassMode} onValueChange={(value) => { const next = value as GlassMode; setGlassMode(next); addActivity("You", `Changed the glass to ${next}.`); }}>
              <SelectTrigger aria-label="Choose glass"><SelectValue /></SelectTrigger>
              <SelectContent>{GLASS_MODES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <label className="clarity-control"><span>Clarity</span><Slider min={8} max={36} step={1} value={[glassOpacity]} onValueChange={(value) => setGlassOpacity(value[0])} aria-label="Adjust panel transparency" /><output>{glassOpacity}%</output></label>
        </PanelFrame>

        <PanelFrame {...panelProps("cards", "Bloom constellation", "cards-panel") }>
          <div className="card-strip">
            {BLOOM_CARDS.map((card) => {
              const selected = card.id === selectedId;
              const highlighted = highlights.includes(card.id);
              return (
                <button key={card.id} className={`spatial-card${selected ? " selected" : ""}${highlighted ? " highlighted" : ""}`} style={{ "--card-accent": card.accent } as React.CSSProperties} onClick={() => openCard(card.id)}>
                  <span>{card.number}</span><strong>{card.title}</strong><small>{card.chapter}</small>
                </button>
              );
            })}
          </div>
        </PanelFrame>

        <PanelFrame {...panelProps("route", "Wonder Route", "route-panel") }>
          {routeCards.length === 0 ? (
            <div className="route-empty"><Route /><strong>Begin anywhere.</strong><span>Place a Bloom Card here.</span></div>
          ) : (
            <ol>{routeCards.map((card, index) => card && <li key={card.id} style={{ "--card-accent": card.accent } as React.CSSProperties}><span>{index + 1}</span><button onClick={() => openCard(card.id)}><strong>{card.title}</strong><small>{card.chapter}</small></button><Button variant="ghost" size="icon-xs" onClick={() => removeFromRoute(card.id)} aria-label={`Remove ${card.title}`}><X /></Button></li>)}</ol>
          )}
          <p>{route.length}/5 stops · held for this visit</p>
        </PanelFrame>

        <PanelFrame {...panelProps("activity", "Shared activity", "activity-panel") }>
          <div className={`agent-state state-${toolState}`}><span />{toolState === "ready" ? "Six agent tools awake" : toolState === "preview" ? "Human room open" : toolState === "checking" ? "Opening…" : "Refresh agent tools"}</div>
          <ul>{activity.map((item) => <li key={item.id}><span className={`activity-actor ${item.actor.toLowerCase()}`}>{item.actor === "Agent" ? <Bot /> : <UserRound />}</span><p><strong>{item.actor}</strong>{item.message}</p></li>)}</ul>
        </PanelFrame>
      </div>

      <nav className="bottom-dock glass-dock" aria-label="Workspace tools">
        <Button variant="ghost" size="icon" onClick={() => togglePanel("cards")} title="Bloom Cards" aria-label="Toggle Bloom Cards"><Leaf /></Button>
        <Button variant="ghost" size="icon" onClick={() => togglePanel("route")} title="Wonder Route" aria-label="Toggle Wonder Route"><FolderOpen /></Button>
        <Button variant="ghost" size="icon" onClick={() => togglePanel("notes")} title="Compose note" aria-label="Toggle notes"><PenLine /></Button>
        <Button variant="ghost" size="icon" onClick={() => togglePanel("activity")} title="Human and agent" aria-label="Toggle shared activity"><UsersRound /></Button>
        <Button variant="ghost" size="icon" onClick={() => revealPanel("weather")} title="Glass settings" aria-label="Open glass settings"><Settings2 /></Button>
      </nav>

      <div className="room-status"><Move /> Drag any panel · arrangement saves here <span>•</span> <button onClick={resetRoom}><RotateCcw /> Reset room</button></div>
    </main>
  );
}
