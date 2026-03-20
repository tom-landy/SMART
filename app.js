const STORAGE_KEY = "smart-sprint-studio-v1";

const dimensions = [
  {
    id: "specific",
    name: "Specific",
    prompt: "Name the exact Unit 2 topic, skill, or question type being revised.",
  },
  {
    id: "measurable",
    name: "Measurable",
    prompt: "Show what score, number of questions, or mark target proves progress.",
  },
  {
    id: "achievable",
    name: "Achievable",
    prompt: "Keep the revision target realistic for the time, energy, and resources available.",
  },
  {
    id: "relevant",
    name: "Relevant",
    prompt: "Link the revision to Unit 2 marks, weak areas, or the next mock exam.",
  },
  {
    id: "time-bound",
    name: "Time-bound",
    prompt: "Set a clear deadline before the lesson, mock, or Unit 2 exam date.",
  },
];

const libraryCards = [
  {
    id: "specific-skill",
    dimension: "specific",
    title: "Pick one Unit 2 skill",
    description: "Focus on one topic or exam skill instead of revising everything at once.",
  },
  {
    id: "specific-context",
    dimension: "specific",
    title: "Name the question type",
    description: "Mention the exact Unit 2 task, calculation, or extended response style.",
  },
  {
    id: "measurable-score",
    dimension: "measurable",
    title: "Set a mark target",
    description: "Include a target score, percentage, or number of marks to aim for.",
  },
  {
    id: "measurable-evidence",
    dimension: "measurable",
    title: "Choose the evidence",
    description: "Say which exam questions, flashcards, or timed task will prove improvement.",
  },
  {
    id: "achievable-support",
    dimension: "achievable",
    title: "Use revision support",
    description: "Mention notes, model answers, formula sheets, or teacher feedback you can use.",
  },
  {
    id: "achievable-step",
    dimension: "achievable",
    title: "Keep it realistic",
    description: "Aim for a next step that fits one revision session instead of an impossible leap.",
  },
  {
    id: "relevant-priority",
    dimension: "relevant",
    title: "Target a weak area",
    description: "Tie the objective to the Unit 2 topics where marks are being dropped.",
  },
  {
    id: "relevant-purpose",
    dimension: "relevant",
    title: "Explain why it matters",
    description: "Connect the revision to mock performance, confidence, or exam readiness.",
  },
  {
    id: "time-bound-lesson",
    dimension: "time-bound",
    title: "Set a revision deadline",
    description: "Use a clear deadline like tonight, this weekend, or before the next lesson.",
  },
  {
    id: "time-bound-review",
    dimension: "time-bound",
    title: "Plan the check-in",
    description: "Decide when to review scores, fix mistakes, and set the next revision target.",
  },
];

const defaultState = {
  draft: {
    focus: "",
    action: "",
    metric: "",
    timeframe: "",
  },
  board: {
    specific: [],
    measurable: [],
    achievable: [],
    relevant: [],
    "time-bound": [],
  },
};

const state = loadState();

const els = {
  form: document.querySelector("#objective-form"),
  focusInput: document.querySelector("#focus-input"),
  actionInput: document.querySelector("#action-input"),
  metricInput: document.querySelector("#metric-input"),
  timeframeInput: document.querySelector("#timeframe-input"),
  preview: document.querySelector("#objective-preview"),
  checklist: document.querySelector("#objective-checklist"),
  smartScore: document.querySelector("#smart-score"),
  smartProgress: document.querySelector("#smart-progress"),
  canvas: document.querySelector("#smart-canvas"),
  library: document.querySelector("#card-library"),
  copyObjective: document.querySelector("#copy-objective"),
  resetDraft: document.querySelector("#reset-draft"),
  libraryCardTemplate: document.querySelector("#library-card-template"),
  boardCardTemplate: document.querySelector("#board-card-template"),
};

let dragPayload = null;

hydrateInputs();
renderAll();
bindEvents();

function bindEvents() {
  els.form.addEventListener("input", handleDraftInput);
  els.copyObjective.addEventListener("click", copyObjective);
  els.resetDraft.addEventListener("click", resetDraft);
}

function handleDraftInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  state.draft[input.name] = input.value.trimStart();
  persist();
  renderAll();
}

function renderAll() {
  renderPreview();
  renderProgress();
  renderCanvas();
  renderLibrary();
}

function renderPreview() {
  const objective = buildObjectiveText();
  els.preview.textContent = objective;

  const checks = [
    {
      label: "Unit 2 target is clear",
      ok: Boolean(state.draft.focus && state.draft.action) || state.board.specific.length > 0,
    },
    {
      label: "Progress can be measured",
      ok: Boolean(state.draft.metric) || state.board.measurable.length > 0,
    },
    {
      label: "Goal feels realistic",
      ok: state.board.achievable.length > 0,
    },
    {
      label: "Revision purpose is clear",
      ok: state.board.relevant.length > 0,
    },
    {
      label: "Deadline is visible",
      ok: Boolean(state.draft.timeframe) || state.board["time-bound"].length > 0,
    },
  ];

  els.checklist.replaceChildren(...checks.map(renderStatusRow));
}

function renderProgress() {
  const totalChecks = 9;
  const completed = [
    Boolean(state.draft.focus),
    Boolean(state.draft.action),
    Boolean(state.draft.metric),
    Boolean(state.draft.timeframe),
    ...dimensions.map((dimension) => state.board[dimension.id].length > 0),
  ].filter(Boolean).length;

  const percent = Math.round((completed / totalChecks) * 100);
  els.smartScore.textContent = `${percent}%`;

  const rows = dimensions.map((dimension) => {
    const strong = state.board[dimension.id].length > 0;
    return {
      label: dimension.name,
      status: strong ? "Ready" : "Needs a card",
      strong,
    };
  });

  els.smartProgress.replaceChildren(
    ...rows.map((row) => {
      const element = document.createElement("div");
      element.className = "progress-item";
      element.innerHTML = `
        <strong>${row.label}</strong>
        <span class="status-pill ${row.strong ? "status-ready" : "status-waiting"}">${row.status}</span>
      `;
      return element;
    }),
  );
}

function renderCanvas() {
  els.canvas.replaceChildren(
    ...dimensions.map((dimension) => {
      const zone = document.createElement("section");
      zone.className = "drop-zone";
      zone.dataset.dimension = dimension.id;
      zone.addEventListener("dragover", handleZoneDragOver);
      zone.addEventListener("dragleave", handleZoneDragLeave);
      zone.addEventListener("drop", handleZoneDrop);

      const title = document.createElement("div");
      title.className = "zone-title";
      title.innerHTML = `<h3>${dimension.name}</h3><p>${dimension.prompt}</p>`;
      zone.append(title);

      const cardIds = state.board[dimension.id];
      if (!cardIds.length) {
        const empty = document.createElement("p");
        empty.className = "zone-empty";
        empty.textContent = "Drop a revision card here.";
        zone.append(empty);
      } else {
        cardIds
          .map(findCard)
          .filter(Boolean)
          .forEach((card) => zone.append(renderBoardCard(card, dimension.id)));
      }

      return zone;
    }),
  );
}

function renderLibrary() {
  const grouped = dimensions.map((dimension) => ({
    dimension,
    cards: libraryCards.filter((card) => card.dimension === dimension.id),
  }));

  els.library.replaceChildren(
    ...grouped.map(({ dimension, cards }) => {
      const group = document.createElement("section");
      group.className = "library-group";

      const heading = document.createElement("div");
      heading.className = "zone-title";
      heading.innerHTML = `<h3>${dimension.name}</h3><p>${dimension.prompt}</p>`;
      group.append(heading);

      cards.forEach((card) => group.append(renderLibraryCard(card)));
      return group;
    }),
  );
}

function renderLibraryCard(card) {
  const node = els.libraryCardTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.cardId = card.id;
  node.querySelector(".card-tag").textContent = shortDimension(card.dimension);
  node.querySelector("h3").textContent = card.title;
  node.querySelector("p").textContent = card.description;
  node.addEventListener("dragstart", () => {
    dragPayload = { source: "library", cardId: card.id };
  });
  node.addEventListener("dragend", () => {
    dragPayload = null;
  });
  return node;
}

function renderBoardCard(card, currentDimension) {
  const node = els.boardCardTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.cardId = card.id;
  node.querySelector(".card-tag").textContent = shortDimension(card.dimension);
  node.querySelector("h3").textContent = card.title;
  node.querySelector("p").textContent = card.description;

  node.addEventListener("dragstart", () => {
    dragPayload = { source: "board", cardId: card.id, fromDimension: currentDimension };
  });

  node.addEventListener("dragend", () => {
    dragPayload = null;
  });

  node.querySelector(".icon-button").addEventListener("click", () => {
    removeCardFromBoard(card.id);
  });

  return node;
}

function renderStatusRow(item) {
  const row = document.createElement("div");
  row.className = "check-item";
  row.innerHTML = `
    <strong>${item.label}</strong>
    <span class="status-pill ${item.ok ? "status-ready" : "status-waiting"}">${item.ok ? "Ready" : "Missing"}</span>
  `;
  return row;
}

function handleZoneDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("is-over");
}

function handleZoneDragLeave(event) {
  event.currentTarget.classList.remove("is-over");
}

function handleZoneDrop(event) {
  event.preventDefault();
  const zone = event.currentTarget;
  zone.classList.remove("is-over");

  if (!dragPayload) {
    return;
  }

  const targetDimension = zone.dataset.dimension;
  const card = findCard(dragPayload.cardId);
  if (!card) {
    return;
  }

  if (dragPayload.source === "board") {
    removeCardFromBoard(dragPayload.cardId, false);
  }

  addCardToBoard(dragPayload.cardId, targetDimension || card.dimension);
  dragPayload = null;
}

function addCardToBoard(cardId, dimension) {
  if (isCardPlaced(cardId)) {
    if (findCardPlacement(cardId) === dimension) {
      renderAll();
      return;
    }
  }

  removeCardFromBoard(cardId, false);
  state.board[dimension].push(cardId);
  persist();
  renderAll();
}

function removeCardFromBoard(cardId, rerender = true) {
  dimensions.forEach((dimension) => {
    state.board[dimension.id] = state.board[dimension.id].filter((item) => item !== cardId);
  });

  persist();
  if (rerender) {
    renderAll();
  }
}

async function copyObjective() {
  const text = buildObjectiveText();
  try {
    await navigator.clipboard.writeText(text);
    els.copyObjective.textContent = "Copied";
    window.setTimeout(() => {
      els.copyObjective.textContent = "Copy objective";
    }, 1200);
  } catch {
    window.alert("Clipboard access failed. You can still select and copy the objective manually.");
  }
}

function resetDraft() {
  state.draft = structuredClone(defaultState.draft);
  state.board = structuredClone(defaultState.board);
  hydrateInputs();
  persist();
  renderAll();
}

function buildObjectiveText() {
  const focus = state.draft.focus || "I";
  const action = state.draft.action || "revise one clear Unit 2 topic";
  const metric = state.draft.metric || "show clear evidence of improvement";
  const timeframe = state.draft.timeframe || "before my next Unit 2 revision check";

  const supports = dimensions
    .flatMap((dimension) => state.board[dimension.id].map(findCard))
    .filter(Boolean)
    .map((card) => card.title.toLowerCase());

  const supportText = supports.length ? ` Supported by ${joinAsSentence(supports)}.` : "";

  return `${capitalize(focus)} will ${action} and ${metric} ${timeframe}.${supportText}`;
}

function hydrateInputs() {
  els.focusInput.value = state.draft.focus;
  els.actionInput.value = state.draft.action;
  els.metricInput.value = state.draft.metric;
  els.timeframeInput.value = state.draft.timeframe;
}

function loadState() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return structuredClone(defaultState);
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      draft: { ...defaultState.draft, ...parsed.draft },
      board: { ...structuredClone(defaultState.board), ...parsed.board },
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function persist() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function findCard(cardId) {
  return libraryCards.find((card) => card.id === cardId) || null;
}

function isCardPlaced(cardId) {
  return dimensions.some((dimension) => state.board[dimension.id].includes(cardId));
}

function findCardPlacement(cardId) {
  const match = dimensions.find((dimension) => state.board[dimension.id].includes(cardId));
  return match?.id || null;
}

function shortDimension(dimensionId) {
  return dimensions.find((dimension) => dimension.id === dimensionId)?.name || dimensionId;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function joinAsSentence(items) {
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
