
/* =====================================================
   POPOYE INSURANCE - MAIN JAVASCRIPT
   File: js/app.js

   Front-end prototype:
   - Browser localStorage for demo records
   - Reports exported as CSV
   - Reminder schedules calculated from expiry dates
   - Payments simulated only; no real payment processing
   - No automatic WhatsApp delivery
===================================================== */

"use strict";

const KEYS = {
  customers: "popoye_customers_v1",
  transactions: "popoye_transactions_v1",
  automation: "popoye_automation_v1",
  settings: "popoye_settings_v1",
  reminders: "popoye_reminder_status_v1"
};

const $ = (selector) => document.querySelector(selector);

function read(key, fallback = []) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored);
  } catch (error) {
    console.error("Could not read saved data:", error);
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Could not save data:", error);
    alert("Unable to save data in this browser.");
    return false;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(String(value).slice(0, 10) + "T00:00:00");

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createId(prefix) {
  return prefix + "-" + Date.now().toString(36).toUpperCase() +
    "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function emptyRow(columns, message) {
  return `<tr><td colspan="${columns}" class="empty-message">${
    escapeHTML(message)
  }</td></tr>`;
}

function badge(status) {
  let type = "neutral";

  if (["Paid", "Active", "Success", "Sent", "Renewal Paid"].includes(status)) {
    type = "success";
  } else if (["Pending", "Due Today", "Upcoming"].includes(status)) {
    type = "pending";
  } else if (["Expired", "Failed", "Overdue"].includes(status)) {
    type = "danger";
  }

  return `<span class="badge ${type}">${escapeHTML(status)}</span>`;
}

/* =====================================================
   1. INITIAL DEMO DATA
===================================================== */

function paymentLink(customer) {
  const url = new URL("payments.html", window.location.href);
  url.searchParams.set("demoCustomer", customer.id);
  return url.href;
}

function seedData() {
  if (localStorage.getItem(KEYS.customers) !== null) return;

  const customers = [
    {
      id: "CUS-1001",
      name: "Arun Kumar",
      phone: "9876543210",
      vehicle: "TN 37 AB 1234",
      premium: 1850,
      expiry: dateOffset(7),
      policyNumber: "POP-1001",
      paymentStatus: "Pending"
    },
    {
      id: "CUS-1002",
      name: "Priya S",
      phone: "9876501234",
      vehicle: "TN 38 CD 5678",
      premium: 2200,
      expiry: dateOffset(30),
      policyNumber: "POP-1002",
      paymentStatus: "Paid"
    },
    {
      id: "CUS-1003",
      name: "Karthik R",
      phone: "9789012345",
      vehicle: "TN 66 EF 9012",
      premium: 1650,
      expiry: dateOffset(60),
      policyNumber: "POP-1003",
      paymentStatus: "Pending"
    }
  ];

  customers.forEach(customer => {
    customer.paymentLink = paymentLink(customer);
  });

  if (!save(KEYS.customers, customers)) return;

  save(KEYS.transactions, [{
    id: "TXN-DEMO-1001",
    customerId: "CUS-1002",
    customerName: "Priya S",
    vehicle: "TN 38 CD 5678",
    amount: 2200,
    date: new Date().toISOString(),
    method: "Demo payment",
    status: "Success"
  }]);

  save(KEYS.automation, {
    enabled: false,
    first: 30,
    second: 7,
    final: 1
  });

  save(KEYS.settings, {
    businessName: "Popoye Insurance",
    email: "",
    phone: "",
    currency: "INR"
  });

  save(KEYS.reminders, {});
}

/* =====================================================
   2. CUSTOMER AND POLICY STATUS
===================================================== */

function policyStatus(customer) {
  if (!customer.expiry) return "Unknown";

  const expiry = new Date(customer.expiry + "T23:59:59");

  return expiry < new Date() ? "Expired" : "Active";
}

function getCustomers() {
  return read(KEYS.customers, []);
}

function getTransactions() {
  return read(KEYS.transactions, []);
}

/* =====================================================
   3. DASHBOARD
===================================================== */

function renderDashboard() {
  const customers = getCustomers();
  const transactions = getTransactions();

  const activePolicies = customers.filter(
    customer => policyStatus(customer) === "Active"
  );

  const collected = transactions
    .filter(transaction => transaction.status === "Success")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  setText("#totalCustomers", customers.length);
  setText("#activePolicies", activePolicies.length);
  setText("#paymentsReceived", money(collected));

  setText(
    "#pendingRenewals",
    customers.filter(customer =>
      customer.paymentStatus !== "Paid"
    ).length
  );

  const tbody = $("#recentRenewals");
  if (!tbody) return;

  const recent = [...customers]
    .sort((a, b) => String(a.expiry).localeCompare(String(b.expiry)))
    .slice(0, 6);

  tbody.innerHTML = recent.length
    ? recent.map(customer => `
      <tr>
        <td>${escapeHTML(customer.name)}</td>
        <td>${escapeHTML(customer.vehicle)}</td>
        <td>${money(customer.premium)}</td>
        <td>${formatDate(customer.expiry)}</td>
        <td>${badge(customer.paymentStatus)}</td>
      </tr>
    `).join("")
    : emptyRow(5, "No customers have been added yet.");
}

/* =====================================================
   4. CUSTOMER MANAGEMENT
===================================================== */

function showCustomerForm(show = true) {
  const panel = $("#customerFormPanel");
  if (panel) panel.hidden = !show;
}

function renderCustomers() {
  const tbody = $("#customersTable");
  if (!tbody) return;

  const customers = getCustomers();

  tbody.innerHTML = customers.length
    ? customers.map(customer => `
      <tr>
        <td>${escapeHTML(customer.name)}</td>
        <td>${escapeHTML(customer.phone)}</td>
        <td>${escapeHTML(customer.vehicle)}</td>
        <td>${money(customer.premium)}</td>
        <td>${formatDate(customer.expiry)}</td>
      </tr>
    `).join("")
    : emptyRow(5, "No customers found.");

  filterRows("#customerSearch", "#customersTable");
}

function setupCustomerForm() {
  const form = $("#customerForm");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const data = new FormData(form);

    const customer = {
      id: createId("CUS"),
      name: String(data.get("name") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      vehicle: String(data.get("vehicle") || "").trim().toUpperCase(),
      premium: Number(data.get("premium")),
      expiry: String(data.get("expiry") || ""),
      policyNumber: createId("POP"),
      paymentStatus: "Pending"
    };

    if (
      !customer.name ||
      !customer.phone ||
      !customer.vehicle ||
      !Number.isFinite(customer.premium) ||
      customer.premium <= 0 ||
      !customer.expiry
    ) {
      alert("Please enter valid details in all fields.");
      return;
    }

    customer.paymentLink = paymentLink(customer);

    const customers = getCustomers();
    customers.unshift(customer);

    if (!save(KEYS.customers, customers)) return;

    form.reset();
    showCustomerForm(false);
    refreshAll();

    alert("Customer saved in this browser.");
  });
}

/* =====================================================
   5. POLICY MANAGEMENT
===================================================== */

function renderPolicies() {
  const tbody = $("#policiesTable");
  if (!tbody) return;

  const customers = getCustomers();

  setText("#policyCount", customers.length);

  setText(
    "#activePolicyCount",
    customers.filter(c => policyStatus(c) === "Active").length
  );

  setText(
    "#expiredPolicyCount",
    customers.filter(c => policyStatus(c) === "Expired").length
  );

  tbody.innerHTML = customers.length
    ? customers.map(customer => `
      <tr>
        <td>${escapeHTML(customer.policyNumber || "—")}</td>
        <td>${escapeHTML(customer.name)}</td>
        <td>${escapeHTML(customer.vehicle)}</td>
        <td>${money(customer.premium)}</td>
        <td>${formatDate(customer.expiry)}</td>
        <td>${badge(policyStatus(customer))}</td>
      </tr>
    `).join("")
    : emptyRow(6, "No policy records found.");

  filterRows("#policySearch", "#policiesTable");
}

/* =====================================================
   6. PAYMENT MANAGEMENT - DEMO ONLY
===================================================== */

function renderPayments() {
  const tbody = $("#paymentsTable");
  if (!tbody) return;

  const customers = getCustomers();
  const paid = customers.filter(c => c.paymentStatus === "Paid").length;

  setText("#paymentRequestCount", customers.length);
  setText("#paidCount", paid);
  setText("#unpaidCount", customers.length - paid);

  tbody.innerHTML = customers.length
    ? customers.map(customer => `
      <tr>
        <td>${escapeHTML(customer.name)}</td>
        <td>${escapeHTML(customer.vehicle)}</td>
        <td>${money(customer.premium)}</td>
        <td>
          <button class="btn secondary" type="button"
            data-copy-link="${escapeHTML(customer.id)}">
            Copy demo link
          </button>
        </td>
        <td>${badge(customer.paymentStatus)}</td>
        <td>
          ${customer.paymentStatus === "Paid"
            ? badge("Completed")
            : `<button class="btn" type="button"
                data-simulate-payment="${escapeHTML(customer.id)}">
                Simulate payment
              </button>`}
        </td>
      </tr>
    `).join("")
    : emptyRow(6, "No payment requests found.");

  filterRows("#paymentSearch", "#paymentsTable");
}

function simulatePayment(customerId) {
  const customers = getCustomers();
  const customer = customers.find(c => c.id === customerId);

  if (!customer || customer.paymentStatus === "Paid") return;

  const approved = confirm(
    `Simulate a payment of ${money(customer.premium)} for ${customer.name}?\n\nNo real money will be collected.`
  );

  if (!approved) return;

  customer.paymentStatus = "Paid";

  if (!save(KEYS.customers, customers)) return;

  const transactions = getTransactions();

  transactions.unshift({
    id: createId("TXN-DEMO"),
    customerId: customer.id,
    customerName: customer.name,
    vehicle: customer.vehicle,
    amount: Number(customer.premium),
    date: new Date().toISOString(),
    method: "Simulated payment",
    status: "Success"
  });

  if (!save(KEYS.transactions, transactions)) return;

  refreshAll();
  alert("Demo payment recorded. No real payment occurred.");
}

async function copyDemoLink(customerId) {
  const customer = getCustomers().find(c => c.id === customerId);
  if (!customer) return;

  const link = customer.paymentLink || paymentLink(customer);

  try {
    await navigator.clipboard.writeText(link);
    alert("Demo payment link copied.");
  } catch (error) {
    window.prompt("Copy this demo payment link:", link);
  }
}

/* =====================================================
   7. TRANSACTIONS
===================================================== */

function renderTransactions() {
  const tbody = $("#transactionsTable");
  if (!tbody) return;

  const transactions = getTransactions();

  tbody.innerHTML = transactions.length
    ? transactions.map(transaction => `
      <tr>
        <td>${escapeHTML(transaction.id)}</td>
        <td>${escapeHTML(transaction.customerName)}</td>
        <td>${money(transaction.amount)}</td>
        <td>${formatDate(transaction.date)}</td>
        <td>${escapeHTML(transaction.method || "—")}</td>
        <td>${badge(transaction.status)}</td>
      </tr>
    `).join("")
    : emptyRow(6, "No transactions found.");

  filterRows("#transactionSearch", "#transactionsTable");
}

/* =====================================================
   8. REMINDERS
===================================================== */

function reminderDate(expiry, daysBefore) {
  if (!expiry) return "";

  const [year, month, day] = expiry.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() - daysBefore);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function daysUntil(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.round((target - today) / 86400000);
}

function getReminderRows() {
  const customers = getCustomers();

  const automation = read(KEYS.automation, {
    enabled: false,
    first: 30,
    second: 7,
    final: 1
  });

  const sentRecords = read(KEYS.reminders, {});
  const stages = [...new Set([
    Number(automation.first),
    Number(automation.second),
    Number(automation.final)
  ])].filter(Number.isInteger).filter(day => day >= 0 && day <= 90);

  const reminders = [];

  customers.forEach(customer => {
    if (!customer.expiry) return;

    stages.forEach(daysBefore => {
      const date = reminderDate(customer.expiry, daysBefore);
      const remaining = daysUntil(date);
      const key = `${customer.id}_${daysBefore}`;

      let status;

      if (customer.paymentStatus === "Paid") {
        status = "Renewal Paid";
      } else if (sentRecords[key] === "Sent") {
        status = "Sent";
      } else if (remaining < 0) {
        status = "Overdue";
      } else if (remaining === 0) {
        status = "Due Today";
      } else {
        status = "Upcoming";
      }

      reminders.push({
        key,
        customer,
        daysBefore,
        date,
        status
      });
    });
  });

  return reminders.sort((a, b) => a.date.localeCompare(b.date));
}

function renderReminders() {
  const tbody = $("#remindersTable");
  if (!tbody) return;

  const reminders = getReminderRows();

  setText(
    "#reminderDueCount",
    reminders.filter(r => r.status === "Due Today").length
  );

  setText(
    "#reminderOverdueCount",
    reminders.filter(r => r.status === "Overdue").length
  );

  setText(
    "#reminderUpcomingCount",
    reminders.filter(r => r.status === "Upcoming").length
  );

  tbody.innerHTML = reminders.length
    ? reminders.map(reminder => `
      <tr>
        <td>${escapeHTML(reminder.customer.name)}</td>
        <td>${escapeHTML(reminder.customer.vehicle)}</td>
        <td>${money(reminder.customer.premium)}</td>
        <td>${formatDate(reminder.customer.expiry)}</td>
        <td>${formatDate(reminder.date)}</td>
        <td>${badge(reminder.status)}</td>
        <td>
          <button class="btn secondary" type="button"
            data-copy-reminder="${escapeHTML(reminder.customer.id)}"
            data-days-before="${reminder.daysBefore}">
            Copy message
          </button>
          ${!["Sent", "Renewal Paid"].includes(reminder.status)
            ? `<button class="btn" type="button"
                data-mark-reminder="${escapeHTML(reminder.key)}">
                Mark sent
              </button>`
            : ""}
        </td>
      </tr>
    `).join("")
    : emptyRow(7, "No reminders found.");

  filterRows("#reminderSearch", "#remindersTable");
}

function copyReminderMessage(customerId) {
  const customer = getCustomers().find(c => c.id === customerId);
  if (!customer) return;

  const message =
    `Hi ${customer.name}, your two-wheeler insurance for ` +
    `${customer.vehicle} is due for renewal on ` +
    `${formatDate(customer.expiry)}. Premium amount: ` +
    `${money(customer.premium)}. Please contact Popoye Insurance ` +
    `to renew your policy. Thank you.`;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(message)
      .then(() => alert("Reminder message copied."))
      .catch(() => window.prompt("Copy the reminder message:", message));
  } else {
    window.prompt("Copy the reminder message:", message);
  }
}

function markReminderSent(key) {
  if (!confirm("Mark this reminder as sent?")) return;

  const sentRecords = read(KEYS.reminders, {});
  sentRecords[key] = "Sent";

  if (save(KEYS.reminders, sentRecords)) {
    renderReminders();
  }
}

/* =====================================================
   9. REPORTS DASHBOARD
===================================================== */

function getReportMetrics() {
  const customers = getCustomers();
  const transactions = getTransactions();

  const paid = customers.filter(c => c.paymentStatus === "Paid");
  const pending = customers.filter(c => c.paymentStatus !== "Paid");

  const activePolicies = customers.filter(
    c => policyStatus(c) === "Active"
  );

  const expiredPolicies = customers.filter(
    c => policyStatus(c) === "Expired"
  );

  const successfulTransactions = transactions.filter(
    t => t.status === "Success"
  );

  const collected = successfulTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0
  );

  const reminders = getReminderRows();

  return {
    customers,
    transactions,
    paid,
    pending,
    activePolicies,
    expiredPolicies,
    successfulTransactions,
    collected,
    reminders
  };
}

function renderReports() {
  const reportBody = $("#reportsTable");
  const metrics = getReportMetrics();

  setText("#reportCustomers", metrics.customers.length);
  setText("#reportActivePolicies", metrics.activePolicies.length);
  setText("#reportPaid", metrics.paid.length);
  setText("#reportCollection", money(metrics.collected));

  if (!reportBody) return;

  const rows = [
    ["Total customers", metrics.customers.length],
    ["Active policies", metrics.activePolicies.length],
    ["Expired policies", metrics.expiredPolicies.length],
    ["Paid customers", metrics.paid.length],
    ["Customers awaiting payment", metrics.pending.length],
    ["Successful transactions", metrics.successfulTransactions.length],
    ["Demo collection total", money(metrics.collected)],
    ["Reminders due today", metrics.reminders.filter(r => r.status === "Due Today").length],
    ["Overdue reminders", metrics.reminders.filter(r => r.status === "Overdue").length],
    ["Upcoming reminders", metrics.reminders.filter(r => r.status === "Upcoming").length]
  ];

  reportBody.innerHTML = rows.map(([metric, value]) => `
    <tr>
      <td>${escapeHTML(metric)}</td>
      <td>${escapeHTML(value)}</td>
    </tr>
  `).join("");
}

/* =====================================================
   10. CSV REPORT EXPORT
===================================================== */

function getReportExportData(reportType) {
  const metrics = getReportMetrics();

  switch (reportType) {
    case "customers":
      return {
        filename: "popoye-customers-report.csv",
        headers: [
          "Customer ID", "Customer Name", "Phone", "Vehicle Number",
          "Policy Number", "Premium INR", "Expiry Date", "Payment Status"
        ],
        rows: metrics.customers.map(c => [
          c.id, c.name, c.phone, c.vehicle,
          c.policyNumber, c.premium, c.expiry, c.paymentStatus
        ])
      };

    case "policies":
      return {
        filename: "popoye-policies-report.csv",
        headers: [
          "Policy Number", "Customer ID", "Customer Name",
          "Vehicle Number", "Premium INR", "Expiry Date", "Policy Status"
        ],
        rows: metrics.customers.map(c => [
          c.policyNumber, c.id, c.name, c.vehicle,
          c.premium, c.expiry, policyStatus(c)
        ])
      };

    case "payments":
      return {
        filename: "popoye-payments-report.csv",
        headers: [
          "Customer ID", "Customer Name", "Vehicle Number",
          "Premium INR", "Payment Status"
        ],
        rows: metrics.customers.map(c => [
          c.id, c.name, c.vehicle, c.premium, c.paymentStatus
        ])
      };

    case "transactions":
      return {
        filename: "popoye-transactions-report.csv",
        headers: [
          "Transaction ID", "Customer ID", "Customer Name",
          "Vehicle Number", "Amount INR", "Date", "Method", "Status"
        ],
        rows: metrics.transactions.map(t => [
          t.id, t.customerId, t.customerName, t.vehicle || "",
          t.amount, t.date, t.method, t.status
        ])
      };

    case "reminders":
      return {
        filename: "popoye-reminders-report.csv",
        headers: [
          "Customer ID", "Customer Name", "Phone", "Vehicle Number",
          "Premium INR", "Policy Expiry", "Days Before Expiry",
          "Reminder Date", "Reminder Status"
        ],
        rows: metrics.reminders.map(r => [
          r.customer.id, r.customer.name, r.customer.phone,
          r.customer.vehicle, r.customer.premium, r.customer.expiry,
          r.daysBefore, r.date, r.status
        ])
      };

    case "summary":
    default:
      return {
        filename: "popoye-business-summary.csv",
        headers: ["Metric", "Value"],
        rows: [
          ["Total customers", metrics.customers.length],
          ["Active policies", metrics.activePolicies.length],
          ["Expired policies", metrics.expiredPolicies.length],
          ["Paid customers", metrics.paid.length],
          ["Customers awaiting payment", metrics.pending.length],
          ["Successful transactions", metrics.successfulTransactions.length],
          ["Demo collection total INR", metrics.collected],
          ["Reminders due today", metrics.reminders.filter(r => r.status === "Due Today").length],
          ["Overdue reminders", metrics.reminders.filter(r => r.status === "Overdue").length],
          ["Upcoming reminders", metrics.reminders.filter(r => r.status === "Upcoming").length]
        ]
      };
  }
}

function exportReport() {
  const selector = $("#reportType");
  const reportType = selector ? selector.value : "summary";
  const report = getReportExportData(reportType);

  const safeCell = value => {
    let text = String(value ?? "");

    // Reduce spreadsheet formula-injection risk in text cells.
    if (/^[\s]*[=+\-@]/.test(text)) {
      text = "'" + text;
    }

    return '"' + text.replace(/"/g, '""') + '"';
  };

  const csv = [report.headers, ...report.rows]
    .map(row => row.map(safeCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = report.filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  setText(
    "#exportMessage",
    `${report.filename} downloaded. It contains ${report.rows.length} data rows.`
  );
}

function setupReportExport() {
  const form = $("#reportExportForm");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();
    exportReport();
  });
}

/* =====================================================
   11. AUTOMATION SETTINGS
===================================================== */

function setupAutomation() {
  const form = $("#automationForm");
  if (!form) return;

  const settings = read(KEYS.automation, {
    enabled: false,
    first: 30,
    second: 7,
    final: 1
  });

  $("#automationEnabled").checked = Boolean(settings.enabled);
  $("#firstReminder").value = settings.first;
  $("#secondReminder").value = settings.second;
  $("#finalReminder").value = settings.final;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const first = Number($("#firstReminder").value);
    const second = Number($("#secondReminder").value);
    const final = Number($("#finalReminder").value);

    if (
      ![first, second, final].every(Number.isInteger) ||
      first < 1 || first > 90 ||
      second < 1 || second > 90 ||
      final < 0 || final > 30 ||
      first <= second || second <= final
    ) {
      alert("Use valid reminder days in descending order, for example 30, 7, 1.");
      return;
    }

    const success = save(KEYS.automation, {
      enabled: $("#automationEnabled").checked,
      first,
      second,
      final
    });

    if (success) {
      setText(
        "#automationMessage",
        $("#automationEnabled").checked
          ? "Settings saved. Actual message delivery requires a backend and WhatsApp API."
          : "Settings saved. The demo reminder workflow is disabled."
      );

      renderReminders();
      renderReports();
    }
  });
}

/* =====================================================
   12. BUSINESS SETTINGS
===================================================== */

function setupSettings() {
  const form = $("#settingsForm");
  if (!form) return;

  const settings = read(KEYS.settings, {
    businessName: "Popoye Insurance",
    email: "",
    phone: "",
    currency: "INR"
  });

  Object.entries(settings).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (field) field.value = value;
  });

  form.addEventListener("submit", event => {
    event.preventDefault();

    const data = new FormData(form);

    const newSettings = {
      businessName: String(data.get("businessName") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      currency: "INR"
    };

    if (!newSettings.businessName) {
      alert("Please enter a business name.");
      return;
    }

    if (save(KEYS.settings, newSettings)) {
      setText("#settingsMessage", "Business settings saved in this browser.");
    }
  });
}

/* =====================================================
   13. TABLE SEARCH
===================================================== */

function filterRows(inputSelector, tableSelector) {
  const input = $(inputSelector);
  const table = $(tableSelector);

  if (!input || !table || input.dataset.bound === "true") return;

  input.dataset.bound = "true";

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();

    table.querySelectorAll("tr").forEach(row => {
      row.hidden = !row.textContent.toLowerCase().includes(query);
    });
  });
}

/* =====================================================
   14. REFRESH ALL PAGE DATA
===================================================== */

function refreshAll() {
  renderDashboard();
  renderCustomers();
  renderPolicies();
  renderPayments();
  renderTransactions();
  renderReminders();
  renderReports();
}

/* =====================================================
   15. STARTUP AND BUTTON EVENTS
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  seedData();
  refreshAll();

  setupCustomerForm();
  setupAutomation();
  setupSettings();
  setupReportExport();

  const paymentTable = $("#paymentsTable");

  if (paymentTable) {
    paymentTable.addEventListener("click", event => {
      const copyButton = event.target.closest("[data-copy-link]");
      const payButton = event.target.closest("[data-simulate-payment]");

      if (copyButton) {
        copyDemoLink(copyButton.dataset.copyLink);
      }

      if (payButton) {
        simulatePayment(payButton.dataset.simulatePayment);
      }
    });
  }

  const remindersTable = $("#remindersTable");

  if (remindersTable) {
    remindersTable.addEventListener("click", event => {
      const copyButton = event.target.closest("[data-copy-reminder]");
      const sentButton = event.target.closest("[data-mark-reminder]");

      if (copyButton) {
        copyReminderMessage(copyButton.dataset.copyReminder);
      }

      if (sentButton) {
        markReminderSent(sentButton.dataset.markReminder);
      }
    });
  }

  const parameters = new URLSearchParams(window.location.search);
  const demoCustomerId = parameters.get("demoCustomer");

  if (demoCustomerId && $("#paymentsTable")) {
    const customer = getCustomers().find(c => c.id === demoCustomerId);

    if (customer) {
      alert(
        "DEMO PAYMENT\n\n" +
        `Customer: ${customer.name}\n` +
        `Vehicle: ${customer.vehicle}\n` +
        `Amount: ${money(customer.premium)}\n\n` +
        "This is a demonstration, not a real payment page."
      );
    }
  }
});
