
const reminderStorageKey = "popoyeReminders";

const defaultReminders = [
  {
    id: "REM1001",
    customer: "Arun Kumar",
    vehicle: "TN 38 AB 1234",
    expiry: "2026-11-15",
    channel: "WhatsApp",
    status: "Upcoming"
  },
  {
    id: "REM1002",
    customer: "Priya S",
    vehicle: "TN 37 CD 5678",
    expiry: "2026-10-28",
    channel: "WhatsApp",
    status: "Upcoming"
  },
  {
    id: "REM1003",
    customer: "Karthik R",
    vehicle: "TN 66 EF 9012",
    expiry: "2026-11-05",
    channel: "SMS",
    status: "Sent"
  },
  {
    id: "REM1004",
    customer: "Divya M",
    vehicle: "TN 39 GH 3456",
    expiry: "2026-10-10",
    channel: "WhatsApp",
    status: "Overdue"
  },
  {
    id: "REM1005",
    customer: "Vijay P",
    vehicle: "TN 40 JK 7890",
    expiry: "2026-11-20",
    channel: "SMS",
    status: "Upcoming"
  },
  {
    id: "REM1006",
    customer: "Meena K",
    vehicle: "TN 41 LM 2345",
    expiry: "2026-10-18",
    channel: "WhatsApp",
    status: "Sent"
  },
  {
    id: "REM1007",
    customer: "Suresh B",
    vehicle: "TN 42 NP 6789",
    expiry: "2026-10-12",
    channel: "SMS",
    status: "Overdue"
  },
  {
    id: "REM1008",
    customer: "Nisha R",
    vehicle: "TN 43 QR 1122",
    expiry: "2026-12-05",
    channel: "WhatsApp",
    status: "Upcoming"
  }
];

function loadReminders() {
  try {
    const saved = localStorage.getItem(reminderStorageKey);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error("Unable to load reminders:", error);
  }

  return defaultReminders.map(reminder => ({ ...reminder }));
}

let reminders = loadReminders();
const reminderPageSize = 5;
let reminderCurrentPage = 1;

const reminderSearch = document.getElementById("reminderSearch");
const reminderStatusFilter = document.getElementById("reminderStatusFilter");
const remindersTable = document.getElementById("remindersTable");

function saveReminders() {
  try {
    localStorage.setItem(reminderStorageKey, JSON.stringify(reminders));
  } catch (error) {
    alert("Could not save changes in this browser.");
  }
}

function escapeReminderText(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatReminderDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function updateReminderStats() {
  document.getElementById("totalReminders").textContent = reminders.length;

  document.getElementById("upcomingReminders").textContent =
    reminders.filter(r => r.status === "Upcoming").length;

  document.getElementById("sentReminders").textContent =
    reminders.filter(r => r.status === "Sent").length;

  document.getElementById("overdueReminders").textContent =
    reminders.filter(r => r.status === "Overdue").length;
}

function getFilteredReminders() {
  const searchTerm = reminderSearch.value.trim().toLowerCase();
  const selectedStatus = reminderStatusFilter.value;

  return reminders.filter(reminder => {
    const matchesSearch = [
      reminder.id,
      reminder.customer,
      reminder.vehicle,
      reminder.channel
    ].some(value => value.toLowerCase().includes(searchTerm));

    const matchesStatus =
      !selectedStatus || reminder.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });
}

function renderReminders() {
  const filteredReminders = getFilteredReminders();

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReminders.length / reminderPageSize)
  );

  if (reminderCurrentPage > totalPages) {
    reminderCurrentPage = totalPages;
  }

  const startIndex = (reminderCurrentPage - 1) * reminderPageSize;
  const visibleReminders = filteredReminders.slice(
    startIndex,
    startIndex + reminderPageSize
  );

  if (visibleReminders.length === 0) {
    remindersTable.innerHTML = `
      <tr>
        <td colspan="7">No reminders found.</td>
      </tr>
    `;
  } else {
    remindersTable.innerHTML = visibleReminders.map(reminder => {
      let statusClass = "pending";

      if (reminder.status === "Sent") statusClass = "paid";
      if (reminder.status === "Overdue") statusClass = "failed";

      const actionButton = reminder.status === "Sent"
        ? `<button class="btn" disabled>Sent</button>`
        : `<button class="btn mark-reminder-sent"
             data-id="${escapeReminderText(reminder.id)}"
             type="button">Mark as Sent</button>`;

      return `
        <tr>
          <td>${escapeReminderText(reminder.id)}</td>
          <td>${escapeReminderText(reminder.customer)}</td>
          <td>${escapeReminderText(reminder.vehicle)}</td>
          <td>${formatReminderDate(reminder.expiry)}</td>
          <td>${escapeReminderText(reminder.channel)}</td>
          <td>
            <span class="status ${statusClass}">
              ${escapeReminderText(reminder.status)}
            </span>
          </td>
          <td>${actionButton}</td>
        </tr>
      `;
    }).join("");
  }

  document.getElementById("reminderPageInfo").textContent =
    `Page ${reminderCurrentPage} of ${totalPages} · ${filteredReminders.length} reminders`;

  document.getElementById("previousReminderPage").disabled =
    reminderCurrentPage === 1;

  document.getElementById("nextReminderPage").disabled =
    reminderCurrentPage === totalPages;
}

remindersTable.addEventListener("click", event => {
  const button = event.target.closest(".mark-reminder-sent");
  if (!button) return;

  const reminder = reminders.find(item => item.id === button.dataset.id);
  if (!reminder) return;

  reminder.status = "Sent";
  saveReminders();
  updateReminderStats();
  renderReminders();
});

reminderSearch.addEventListener("input", () => {
  reminderCurrentPage = 1;
  renderReminders();
});

reminderStatusFilter.addEventListener("change", () => {
  reminderCurrentPage = 1;
  renderReminders();
});

document.getElementById("resetReminderFilters").addEventListener("click", () => {
  reminderSearch.value = "";
  reminderStatusFilter.value = "";
  reminderCurrentPage = 1;
  renderReminders();
});

document.getElementById("previousReminderPage").addEventListener("click", () => {
  if (reminderCurrentPage > 1) {
    reminderCurrentPage--;
    renderReminders();
  }
});

document.getElementById("nextReminderPage").addEventListener("click", () => {
  const totalPages = Math.max(
    1,
    Math.ceil(getFilteredReminders().length / reminderPageSize)
  );

  if (reminderCurrentPage < totalPages) {
    reminderCurrentPage++;
    renderReminders();
  }
});

updateReminderStats();
renderReminders();
