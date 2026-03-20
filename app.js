const STORAGE_KEY = "smart-sprint-studio-v1";

const dimensions = [
  {
    id: "specific",
    name: "Specific",
    prompt: "Clarify exactly what the student will do or demonstrate.",
  },
  {
    id: "measurable",
    name: "Measurable",
    prompt: "Show how success will be observed, counted, or checked.",
  },
  {
    id: "achievable",
    name: "Achievable",
    prompt: "Keep the target realistic for the learner, support, and time available.",
  },
  {
    id: "relevant",
    name: "Relevant",
    prompt: "Connect the target to the course, exam, or growth priority.",
  },
  {
    id: "time-bound",
    name: "Time-bound",
    prompt: "Give the objective a clear deadline, lesson window, or review point.",
  },
];

const libraryCards = [
  {
    id: "specific-skill",
    dimension: "specific",
    title: "Name the exact skill",
    description: "Focus on one skill or outcome instead of a broad topic.",
  },
  {
    id: "specific-context",
    dimension: "specific",
    title: "Add the context",
    description: "Mention the subject, unit, task, or learning situation.",
  },
  {
    id: "measurable-score",
    dimension: "measurable",
    title: "Use a success threshold",
    description: "Include a score, percentage, rubric level, or completion count.",
  },
  {
    id: "measurable-evidence",
    dimension: "measurable",
    title: "Point to evidence",
    description: "State the quiz, paragraph, worksheet, or presentation that proves success.",
  },
  {
    id: "achievable-support",
    dimension: "achievable",
    title: "Acknowledge support",
    description: "Mention scaffolds like sentence stems, revision notes, or teacher check-ins.",
  },
  {
    id: "achievable-step",
    dimension: "achievable",
    title: "Break into steps",
    description: "Frame the goal so it fits the learner's current level and next step.",
  },
  {
    id: "relevant-priority",
    dimension: "relevant",
    title: "Link to a priority",
    description: "Tie the objective to coursework, exam preparation, or a target grade.",
  },
  {
    id: "relevant-purpose",
    dimension: "relevant",
    title: "Name the purpose",
    description: "Explain why the objective matters for the student right now.",
  },
  {
    id: "time-bound-lesson",
    dimension: "time-bound",
    title: "Anchor to a lesson",
    description: "Set a deadline such as today's lesson, this week, or the next tutorial.",
  },
  {
    id: "time-bound-review",
    dimension: "time-bound",
    title: "Schedule a review point",
    description: "Note when progress will be checked or reflected on.",
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
  saved: [],
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
  savedList: document.querySelector("#saved-objectives"),
  copyObjective: document.querySelector("#copy-objective"),
  saveObjective: document.querySelector("#save-objective"),
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
  els.saveObjective.addEventListener("click", saveObjective);
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
  renderSaved();
}

function renderPreview() {
  const objective = buildObjectiveText();
  els.preview.textContent = objective;

  const checks = [
    {
      label: "Specific target is clear",
      ok: Boolean(state.draft.focus && state.draft.action) || state.board.specific.length > 0,
    },
    {
      label: "Success can be measured",
      ok: Boolean(state.draft.metric) || state.board.measurable.length > 0,
    },
    {
      label: "Goal feels realistic",
      ok: state.board.achievable.length > 0,
    },
    {
      label: "Purpose is connected",
      ok: state.board.relevant.length > 0,
    },
    {
      label: "Time frame is visible",
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
        empty.textContent = "Drop a support card here.";
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

function renderSaved() {
  if (!state.saved.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Save a draft to build a reusable bank of SMART objectives.";
    els.savedList.replaceChildren(empty);
    return;
  }

  els.savedList.replaceChildren(
    ...state.saved.map((item) => {
      const card = document.createElement("article");
      card.className = "saved-card";

      const meta = summarizeDimensions(item.board);
      card.innerHTML = `
        <div class="saved-card-header">
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.objective)}</p>
          </div>
          <div class="saved-meta">${formatSavedAt(item.savedAt)}</div>
        </div>
        <div class="saved-actions">
          <button class="secondary-button" type="button" data-action="load" data-id="${item.id}">Load draft</button>
          <button class="ghost-button" type="button" data-action="copy" data-id="${item.id}">Copy</button>
          <button class="ghost-button" type="button" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
        <div class="saved-meta">${meta}</div>
      `;

      card.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", handleSavedAction);
      });

      return card;
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

function saveObjective() {
  const objective = buildObjectiveText();
  const title = state.draft.focus || "Untitled SMART objective";

  const entry = {
    id: crypto.randomUUID(),
    title,
    objective,
    draft: structuredClone(state.draft),
    board: structuredClone(state.board),
    savedAt: new Date().toISOString(),
  };

  state.saved.unshift(entry);
  persist();
  renderSaved();
}

function resetDraft() {
  state.draft = structuredClone(defaultState.draft);
  state.board = structuredClone(defaultState.board);
  hydrateInputs();
  persist();
  renderAll();
}

async function handleSavedAction(event) {
  const button = event.currentTarget;
  const id = button.dataset.id;
  const action = button.dataset.action;
  const saved = state.saved.find((item) => item.id === id);

  if (!saved) {
    return;
  }

  if (action === "load") {
    state.draft = structuredClone(saved.draft);
    state.board = structuredClone(saved.board);
    hydrateInputs();
    persist();
    renderAll();
    return;
  }

  if (action === "copy") {
    try {
      await navigator.clipboard.writeText(saved.objective);
    } catch {
      window.alert("Clipboard access failed while copying the saved objective.");
    }
    return;
  }

  if (action === "delete") {
    state.saved = state.saved.filter((item) => item.id !== id);
    persist();
    renderSaved();
  }
}

function buildObjectiveText() {
  const focus = state.draft.focus || "the student";
  const action = state.draft.action || "demonstrate a clearly defined learning goal";
  const metric = state.draft.metric || "show measurable evidence of success";
  const timeframe = state.draft.timeframe || "within an agreed time frame";

  const supports = dimensions
    .flatMap((dimension) => state.board[dimension.id].map(findCard))
    .filter(Boolean)
    .map((card) => card.title.toLowerCase());

  const supportText = supports.length ? ` Supported by ${joinAsSentence(supports)}.` : "";

  return `${capitalize(focus)} will ${action} and ${metric} ${timeframe}.${supportText}`;
}

function summarizeDimensions(board) {
  return dimensions
    .map((dimension) => `${dimension.name}: ${board[dimension.id].length}`)
    .join(" | ");
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
      saved: Array.isArray(parsed.saved) ? parsed.saved : [],
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

function formatSavedAt(value) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
