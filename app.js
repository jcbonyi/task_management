const STORAGE_KEY = "insuranceComplianceTasks";

const initialTasks = [
  {
    id: crypto.randomUUID(),
    title: "Submit state complaint log to regulator",
    category: "Regulatory Filing",
    priority: "High",
    dueDate: "2026-03-15",
    owner: "Compliance Officer",
    reference: "State DOI Bulletin 24-10",
    notes: "Attach complaint trend analysis.",
    status: "Open",
  },
  {
    id: crypto.randomUUID(),
    title: "Quarterly producer training attestation review",
    category: "Training",
    priority: "Medium",
    dueDate: "2026-04-10",
    owner: "HR Compliance Lead",
    reference: "Internal SOP TR-08",
    notes: "Verify CE credits and acknowledgement forms.",
    status: "In Progress",
  },
];

const statusFlow = ["Open", "In Progress", "Blocked", "Completed"];

const form = document.getElementById("task-form");
const taskBody = document.getElementById("task-body");
const statusFilter = document.getElementById("status-filter");
const summary = document.getElementById("summary");
const template = document.getElementById("task-row-template");

let tasks = loadTasks();

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTasks));
    return initialTasks;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : initialTasks;
  } catch {
    return initialTasks;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString();
}

function isOverdue(task) {
  if (task.status === "Completed") {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${task.dueDate}T00:00:00`) < today;
}

function nextStatus(status) {
  const idx = statusFlow.indexOf(status);
  return statusFlow[(idx + 1) % statusFlow.length];
}

function renderSummary(items) {
  const counts = {
    total: items.length,
    overdue: items.filter(isOverdue).length,
    high: items.filter((t) => t.priority === "High").length,
    completed: items.filter((t) => t.status === "Completed").length,
  };

  summary.innerHTML = "";
  [
    `Total: ${counts.total}`,
    `Overdue: ${counts.overdue}`,
    `High Priority: ${counts.high}`,
    `Completed: ${counts.completed}`,
  ].forEach((label) => {
    const chip = document.createElement("span");
    chip.className = "summary-chip";
    chip.textContent = label;
    summary.appendChild(chip);
  });
}

function renderTasks() {
  const filterValue = statusFilter.value;
  const visibleTasks = tasks.filter((task) =>
    filterValue === "All" ? true : task.status === filterValue
  );

  visibleTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  taskBody.innerHTML = "";

  visibleTasks.forEach((task) => {
    const row = template.content.firstElementChild.cloneNode(true);

    row.querySelector(".title-cell").textContent = task.title;
    row.querySelector(".category-cell").textContent = task.category;

    const p = document.createElement("span");
    p.className = `badge priority-${task.priority}`;
    p.textContent = task.priority;
    row.querySelector(".priority-cell").appendChild(p);

    const dueCell = row.querySelector(".due-cell");
    dueCell.textContent = formatDate(task.dueDate);
    if (isOverdue(task)) {
      const overdueBadge = document.createElement("span");
      overdueBadge.className = "badge priority-High";
      overdueBadge.style.marginLeft = "0.5rem";
      overdueBadge.textContent = "Overdue";
      dueCell.appendChild(overdueBadge);
    }

    row.querySelector(".owner-cell").textContent = task.owner;
    row.querySelector(".status-cell").textContent = task.status;
    row.querySelector(".reference-cell").textContent = task.reference || "—";

    const actions = row.querySelector(".actions-cell");
    const advanceBtn = document.createElement("button");
    advanceBtn.className = "small-btn secondary";
    advanceBtn.textContent = "Advance";
    advanceBtn.addEventListener("click", () => {
      task.status = nextStatus(task.status);
      saveTasks();
      renderTasks();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    actions.append(advanceBtn, deleteBtn);
    taskBody.appendChild(row);
  });

  renderSummary(visibleTasks);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const newTask = {
    id: crypto.randomUUID(),
    title: String(data.get("title") || "").trim(),
    category: String(data.get("category") || "").trim(),
    priority: String(data.get("priority") || "").trim(),
    dueDate: String(data.get("dueDate") || ""),
    owner: String(data.get("owner") || "").trim(),
    reference: String(data.get("reference") || "").trim(),
    notes: String(data.get("notes") || "").trim(),
    status: "Open",
  };

  if (!newTask.title || !newTask.dueDate || !newTask.owner) {
    return;
  }

  tasks.push(newTask);
  saveTasks();
  form.reset();
  renderTasks();
});

statusFilter.addEventListener("change", renderTasks);

renderTasks();
