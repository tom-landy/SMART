const STORAGE_KEY = "unit2-smart-creator-v2";

const sentenceSlots = [
  {
    id: "starter",
    label: "Starter",
    hint: "Drag in who the objective is about.",
    options: [
      { id: "starter-i", text: "I will" },
      { id: "starter-we", text: "We will" },
      { id: "starter-students", text: "Students will" },
    ],
  },
  {
    id: "topic",
    label: "Unit 2 focus",
    hint: "Choose the exact Unit 2 topic or skill.",
    options: [
      { id: "topic-cashflow", text: "revise cash flow forecasting questions" },
      { id: "topic-break-even", text: "practise break-even calculations" },
      { id: "topic-budgeting", text: "improve budgeting and variance analysis answers" },
      { id: "topic-justify", text: "write stronger justified business decisions" },
    ],
  },
  {
    id: "measure",
    label: "Success measure",
    hint: "Pick a clear score, number, or outcome.",
    options: [
      { id: "measure-questions", text: "by completing 3 exam questions correctly" },
      { id: "measure-score", text: "by scoring at least 8 out of 10" },
      { id: "measure-marks", text: "by gaining 10 or more marks on a timed task" },
      { id: "measure-errors", text: "with no more than 2 mistakes in calculations" },
    ],
  },
  {
    id: "relevant",
    label: "Why it matters",
    hint: "Connect it to Unit 2 performance.",
    options: [
      { id: "relevant-weakness", text: "so I improve a Unit 2 weakness" },
      { id: "relevant-mock", text: "so I am more confident for the next mock" },
      { id: "relevant-marks", text: "so I stop dropping easy Unit 2 marks" },
    ],
  },
  {
    id: "deadline",
    label: "Deadline",
    hint: "Set a proper deadline.",
    options: [
      { id: "deadline-tonight", text: "by tonight" },
      { id: "deadline-weekend", text: "by Sunday evening" },
      { id: "deadline-lesson", text: "before the next Unit 2 lesson" },
      { id: "deadline-mock", text: "before the Unit 2 mock exam" },
    ],
  },
];

const sorterStatements = [
  {
    id: "smart-1",
    text: "I will improve break-even calculations by completing 4 Unit 2 questions and scoring at least 8/10 by Sunday evening.",
    correctZone: "smart",
  },
  {
    id: "smart-2",
    text: "I will practise cash flow forecasting for 30 minutes tonight and check my answers using the mark scheme.",
    correctZone: "smart",
  },
  {
    id: "smart-3",
    text: "I will write one timed 10-mark Unit 2 response before Friday so I can improve my exam technique.",
    correctZone: "smart",
  },
  {
    id: "not-1",
    text: "I will do better in business.",
    correctZone: "not-smart",
  },
  {
    id: "not-2",
    text: "I will revise Unit 2 loads sometime soon.",
    correctZone: "not-smart",
  },
  {
    id: "not-3",
    text: "I will get full marks on every question from now on.",
    correctZone: "not-smart",
  },
];

const defaultState = {
  builder: {
    starter: null,
    topic: null,
    measure: null,
    relevant: null,
    deadline: null,
  },
  sorter: {
    pool: sorterStatements.map((statement) => statement.id),
    smart: [],
    "not-smart": [],
  },
};

const state = loadState();

const els = {
  sentenceBoard: document.querySelector("#sentence-board"),
  phraseBank: document.querySelector("#phrase-bank"),
  preview: document.querySelector("#objective-preview"),
  checklist: document.querySelector("#objective-checklist"),
  copyObjective: document.querySelector("#copy-objective"),
  resetBuilder: document.querySelector("#reset-builder"),
  resetSorter: document.querySelector("#reset-sorter"),
  statementPool: document.querySelector("#statement-pool"),
  smartZone: document.querySelector("#smart-zone"),
  notSmartZone: document.querySelector("#not-smart-zone"),
  checkSorter: document.querySelector("#check-sorter"),
  sortFeedback: document.querySelector("#sort-feedback"),
  slotTemplate: document.querySelector("#builder-slot-template"),
  phraseTemplate: document.querySelector("#phrase-template"),
  statementTemplate: document.querySelector("#statement-template"),
};

let dragPayload = null;

renderAll();
bindEvents();

function bindEvents() {
  els.copyObjective.addEventListener("click", copyObjective);
  els.resetBuilder.addEventListener("click", resetBuilder);
  els.resetSorter.addEventListener("click", resetSorter);
  els.checkSorter.addEventListener("click", checkSorter);
  [els.statementPool, els.smartZone, els.notSmartZone].forEach((zone) => {
    zone.addEventListener("dragover", handleSorterDragOver);
    zone.addEventListener("dragleave", handleDragLeave);
    zone.addEventListener("drop", handleSorterDrop);
  });
}

function renderAll() {
  renderBuilder();
  renderPhraseBank();
  renderPreview();
  renderSorter();
}

function renderBuilder() {
  els.sentenceBoard.replaceChildren(
    ...sentenceSlots.map((slot) => {
      const node = els.slotTemplate.content.firstElementChild.cloneNode(true);
      const drop = node.querySelector(".slot-drop");

      node.dataset.slot = slot.id;
      node.querySelector(".slot-label").textContent = slot.label;
      drop.dataset.slot = slot.id;
      drop.addEventListener("dragover", handleBuilderDragOver);
      drop.addEventListener("dragleave", handleDragLeave);
      drop.addEventListener("drop", handleBuilderDrop);

      const selectedId = state.builder[slot.id];
      if (selectedId) {
        const phrase = findPhrase(selectedId);
        if (phrase) {
          drop.append(renderPhraseCard(phrase, "builder", slot.id));
        }
      } else {
        const hint = document.createElement("p");
        hint.className = "slot-hint";
        hint.textContent = slot.hint;
        drop.append(hint);
      }

      return node;
    }),
  );
}

function renderPhraseBank() {
  const groups = sentenceSlots.map((slot) => {
    const group = document.createElement("section");
    group.className = "phrase-group";

    const heading = document.createElement("div");
    heading.className = "sort-heading";
    heading.innerHTML = `<h3>${slot.label}</h3><p>${slot.hint}</p>`;
    group.append(heading);

    const stack = document.createElement("div");
    stack.className = "phrase-stack";
    stack.dataset.slotGroup = slot.id;

    slot.options
      .filter((option) => state.builder[slot.id] !== option.id)
      .forEach((option) => stack.append(renderPhraseCard(option, "bank", slot.id)));

    group.append(stack);
    return group;
  });

  els.phraseBank.replaceChildren(...groups);
}

function renderPhraseCard(option, source, slotId) {
  const card = els.phraseTemplate.content.firstElementChild.cloneNode(true);
  card.textContent = option.text;
  card.dataset.optionId = option.id;
  card.dataset.source = source;
  card.dataset.slot = slotId;

  card.addEventListener("dragstart", () => {
    dragPayload = {
      type: "phrase",
      optionId: option.id,
      source,
      slotId,
    };
  });

  card.addEventListener("dragend", () => {
    dragPayload = null;
  });

  if (source === "builder") {
    const removeButton = document.createElement("button");
    removeButton.className = "mini-button";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      state.builder[slotId] = null;
      persist();
      renderAll();
    });
    card.append(removeButton);
  }

  return card;
}

function renderPreview() {
  const sentence = buildObjectiveSentence();
  els.preview.textContent = sentence;

  const checks = sentenceSlots.map((slot) => {
    const complete = Boolean(state.builder[slot.id]);
    return renderStatusRow(slot.label, complete);
  });

  els.checklist.replaceChildren(...checks);
}

function renderSorter() {
  els.statementPool.replaceChildren(
    ...state.sorter.pool.map((id) => renderStatementCard(findStatement(id), "pool")),
  );
  els.smartZone.replaceChildren(
    ...state.sorter.smart.map((id) => renderStatementCard(findStatement(id), "smart")),
  );
  els.notSmartZone.replaceChildren(
    ...state.sorter["not-smart"].map((id) => renderStatementCard(findStatement(id), "not-smart")),
  );
}

function renderStatementCard(statement, sourceZone) {
  const card = els.statementTemplate.content.firstElementChild.cloneNode(true);
  card.textContent = statement?.text || "";
  card.dataset.statementId = statement?.id || "";
  card.dataset.sourceZone = sourceZone;

  card.addEventListener("dragstart", () => {
    dragPayload = {
      type: "statement",
      statementId: statement.id,
      sourceZone,
    };
  });

  card.addEventListener("dragend", () => {
    dragPayload = null;
  });

  return card;
}

function handleBuilderDragOver(event) {
  event.preventDefault();
  if (dragPayload?.type === "phrase") {
    event.currentTarget.classList.add("is-over");
  }
}

function handleSorterDragOver(event) {
  event.preventDefault();
  if (dragPayload?.type === "statement") {
    event.currentTarget.classList.add("is-over");
  }
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove("is-over");
}

function handleBuilderDrop(event) {
  event.preventDefault();
  const drop = event.currentTarget;
  drop.classList.remove("is-over");

  if (dragPayload?.type !== "phrase") {
    return;
  }

  const slotId = drop.dataset.slot;
  if (!slotId) {
    return;
  }

  if (dragPayload.slotId !== slotId) {
    return;
  }

  const phrase = findPhrase(dragPayload.optionId);
  if (!phrase) {
    return;
  }

  const ownerSlot = findPhraseOwner(dragPayload.optionId);
  if (ownerSlot) {
    state.builder[ownerSlot] = null;
  }

  state.builder[slotId] = phrase.id;
  dragPayload = null;
  persist();
  renderAll();
}

function handleSorterDrop(event) {
  event.preventDefault();
  const zone = event.currentTarget;
  zone.classList.remove("is-over");

  if (dragPayload?.type !== "statement") {
    return;
  }

  const targetZone = zone.id === "statement-pool" ? "pool" : zone.id === "smart-zone" ? "smart" : "not-smart";
  moveStatement(dragPayload.statementId, dragPayload.sourceZone, targetZone);
  dragPayload = null;
}

function moveStatement(statementId, sourceZone, targetZone) {
  for (const zone of ["pool", "smart", "not-smart"]) {
    state.sorter[zone] = state.sorter[zone].filter((id) => id !== statementId);
  }

  state.sorter[targetZone].push(statementId);
  els.sortFeedback.textContent = "Sort all the statements first, then check.";
  persist();
  renderSorter();
}

function checkSorter() {
  const sortedCount = state.sorter.smart.length + state.sorter["not-smart"].length;
  if (sortedCount < sorterStatements.length) {
    els.sortFeedback.textContent = "Sort every statement before checking the answers.";
    return;
  }

  const correct = sorterStatements.filter((statement) => state.sorter[statement.correctZone].includes(statement.id)).length;
  els.sortFeedback.textContent = `You got ${correct} out of ${sorterStatements.length} correct.`;
}

function resetBuilder() {
  state.builder = structuredClone(defaultState.builder);
  persist();
  renderAll();
}

function resetSorter() {
  state.sorter = structuredClone(defaultState.sorter);
  els.sortFeedback.textContent = "Sort all the statements first, then check.";
  persist();
  renderSorter();
}

async function copyObjective() {
  const text = buildObjectiveSentence();
  try {
    await navigator.clipboard.writeText(text);
    els.copyObjective.textContent = "Copied";
    window.setTimeout(() => {
      els.copyObjective.textContent = "Copy objective";
    }, 1200);
  } catch {
    window.alert("Clipboard access failed. You can still copy the sentence manually.");
  }
}

function buildObjectiveSentence() {
  const fallback = {
    starter: "I will",
    topic: "revise one clear Unit 2 topic",
    measure: "by completing at least 2 focused exam tasks",
    relevant: "so I improve an important Unit 2 weakness",
    deadline: "before the next Unit 2 lesson",
  };

  return sentenceSlots
    .map((slot) => findPhrase(state.builder[slot.id])?.text || fallback[slot.id])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .concat(".");
}

function renderStatusRow(label, complete) {
  const row = document.createElement("div");
  row.className = "check-item";
  row.innerHTML = `
    <strong>${label}</strong>
    <span class="status-pill ${complete ? "status-ready" : "status-waiting"}">${complete ? "Done" : "Missing"}</span>
  `;
  return row;
}

function findPhrase(optionId) {
  return sentenceSlots.flatMap((slot) => slot.options).find((option) => option.id === optionId) || null;
}

function findPhraseOwner(optionId) {
  return sentenceSlots.find((slot) => state.builder[slot.id] === optionId)?.id || null;
}

function findStatement(statementId) {
  return sorterStatements.find((statement) => statement.id === statementId) || null;
}

function loadState() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return structuredClone(defaultState);
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      builder: { ...defaultState.builder, ...parsed.builder },
      sorter: {
        pool: Array.isArray(parsed.sorter?.pool) ? parsed.sorter.pool : [...defaultState.sorter.pool],
        smart: Array.isArray(parsed.sorter?.smart) ? parsed.sorter.smart : [],
        "not-smart": Array.isArray(parsed.sorter?.["not-smart"]) ? parsed.sorter["not-smart"] : [],
      },
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function persist() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
