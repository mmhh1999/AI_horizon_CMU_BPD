// Mira: global, stage-aware planning copilot. Renders the floating button and panel,
// maps her avatar to a small state machine, and calls the local explain-proxy's
// POST /api/reason. main.js owns app state and assembles buildMiraContext(); this
// module only renders from what it's given and makes the network call, matching
// answers.js / explain.js's split elsewhere in the app.
//
// Guardrail (docs/ai-design.md): Mira explains what the dashboard already computed.
// She never invents a score, ranking, or recommendation; the proxy enforces this by
// checking that every number in her reply appears in the context JSON she was given.

const REASON_URL = "http://127.0.0.1:8799/api/reason";
const TIMEOUT_MS = 20000;

const asset = (name) => `assets/mira/Mira_${name}.png`;

// Not every one of the 12 shipped states is wired to a distinct trigger yet
// (Excited/Notifying/Success/Speaking are available for future refinement —
// see docs/branch-notes/ai-integration.md); these seven cover the actual flow.
export const MIRA_AVATAR = {
  idle: asset("Idle-small"),
  hover: asset("Hover"),
  open: asset("Default"),
  listening: asset("Listening"),
  thinking: asset("Thinking"),
  responding: asset("Responding"),
  error: asset("Error"),
};

export const MIRA_SUGGESTIONS = {
  community: ["Explain this area", "What does this data mean?"],
  perspective: ["How does this persona affect priorities?", "What changed when I selected this household?"],
  opportunity: ["Why is this opportunity highlighted?", "What should I notice here?"],
  futures: ["Summarize these futures", "What is different between these options?"],
  tradeoffs: [
    "Explain why this option is ranked higher",
    "Compare the top two options",
    "What changed because of this persona?",
    "What are the main trade-offs?",
    "What should a planner be cautious about?",
    "What would change if affordability mattered more?",
  ],
};

export const TRADEOFF_CTA_PROMPT =
  "Explain why the currently higher-ranked option performs better for the selected persona and priorities. " +
  "Use only the facts currently available in the dashboard, and clearly state the main trade-offs and limitations.";

const STAGE_GREETING = {
  community: "I can help explain what a neighborhood's numbers mean.",
  perspective: "Ask me how a lens or priority changes what matters here.",
  opportunity: "Ask me why a lot is highlighted, or what to notice about it.",
  futures: "I can summarize these housing types or point out what differs between them.",
  tradeoffs: "This is where I'm most useful — ask me why one option outranks another, or what the trade-offs are.",
};

export function greeting(stage) {
  const extra = STAGE_GREETING[stage] || "";
  return `Hi, I'm Mira. I can help explain what you're seeing, and when you reach trade-offs I can compare options and explain why the rankings change.${extra ? ` ${extra}` : ""}`;
}

// Network call. Any failure (proxy not running, no key, timeout, ungrounded reply)
// resolves to null — the panel shows a quiet "unavailable" message, never a crash.
export async function askMira(question, context, history) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(REASON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context, history }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ok ? data.text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function renderMiraFab(mira) {
  return `<button id="miraFab" class="mira-fab ${mira.open ? "on" : ""}" aria-label="Open Mira planning assistant" aria-expanded="${mira.open}">
    <img src="${MIRA_AVATAR[mira.open ? "open" : "idle"]}" alt=""/>
  </button>`;
}

function contextRow(label, value) {
  return value == null || value === "" ? "" : `<div><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
}

function contextSummary(context) {
  const rows = [
    contextRow("County", context.geography?.county),
    contextRow("Neighborhood", context.geography?.neighborhood),
    contextRow("Planning for", context.persona),
    contextRow("Priorities", context.topPriorities?.join(", ")),
    contextRow("Selected future", context.selectedFuture?.name),
    contextRow("Stage", context.stageLabel),
  ].filter(Boolean);
  if (!rows.length) return "";
  return `<div class="mira-context"><div class="mira-context-h">Current context</div>${rows.join("")}</div>`;
}

function messageHTML(m) {
  return `<div class="mira-msg ${m.role}">${m.role === "user" ? esc(m.text) : m.text}</div>`;
}

export function renderMiraPanel(mira, context, stage) {
  if (!mira.open) return "";
  const chips = MIRA_SUGGESTIONS[stage] || [];
  return `<section class="mira-panel" role="dialog" aria-label="Mira planning assistant">
    <header class="mira-head">
      <img src="${MIRA_AVATAR[mira.avatar] || MIRA_AVATAR.open}" alt="" class="mira-head-avatar"/>
      <div class="mira-head-text"><b>Mira</b><span>Planning Copilot</span><span class="mira-sub">Grounded in your current scenario</span></div>
      <button id="miraClose" aria-label="Close Mira panel"><i data-lucide="x" class="ic"></i></button>
    </header>
    ${contextSummary(context)}
    <div class="mira-log" id="miraLog">
      ${mira.messages.length ? mira.messages.map(messageHTML).join("") : `<div class="mira-msg assistant">${esc(greeting(stage))}</div>`}
      ${mira.avatar === "thinking" ? `<div class="mira-msg assistant mira-thinking"><i data-lucide="loader-2" class="ic spin"></i> Thinking…</div>` : ""}
      ${mira.avatar === "error" ? `<div class="mira-msg assistant muted small">Mira is unavailable right now (no response from the local proxy). The dashboard's own numbers above still stand.</div>` : ""}
    </div>
    ${chips.length ? `<div class="mira-chips">${chips.map((q) => `<button class="mira-chip" data-mira-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>` : ""}
    <form id="miraForm" class="mira-form"><input id="miraInput" placeholder="Ask Mira…" autocomplete="off" value="${esc(mira.input || "")}"/><button aria-label="Send">${`<i data-lucide="send" class="ic"></i>`}</button></form>
  </section>`;
}

export function tradeoffCtaHTML() {
  return `<button class="mira-cta" data-mira-cta><img src="${MIRA_AVATAR.idle}" alt=""/><span>Ask Mira to explain this trade-off</span><i data-lucide="arrow-right" class="ic"></i></button>`;
}
