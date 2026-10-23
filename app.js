
"use strict";

const KEYS = {
  customers: "popoye_customers_v1",
  transactions: "popoye_transactions_v1",
  automation: "popoye_automation_v1",
  settings: "popoye_settings_v1"
};

const $ = (selector) => document.querySelector(selector);

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

const read = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const save = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);

function createId(prefix) {
  return prefix + "-" + Date.now().toString(36).toUpperCase();
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value + "T00:00:00").toLocaleDateString("en-IN");
}

function paymentLink(customer) {
  const url = new URL("payments.html", location.href);
  url.searchParams.set("demoCustomer", customer.id);
  return url.href;
}

function seedData() {
  if (localStorage.getItem(KEYS.customers) !== null) return;

  const customers = [
    {
      id: "CUS-1001", name: "Arun Kumar",
      phone: "9876543210", vehicle: "TN 37 AB 1234",
      premium: 1850, expiry: dateOffset(7),
      policyNumber: "POP-1001", paymentStatus: "Pending"
    },
    {
      id: "CUS-1002", name: "Priya S",
      phone: "9876501234", vehicle: "TN 38 CD 5678",
      premium: 2200, expiry: dateOffset(30),
      policyNumber: "POP-1002", paymentStatus: "Paid"
    },
    {
      id: "CUS-1003", name: "Karthik R",
      phone: "9789012345", vehicle: "TN 66 EF 9012",
      premium: 1650, expiry: dateOffset(60),
      policyNumber: "POP-1003", paymentStatus: "Pending"
    }
  ];

  customers.forEach(c => c.paymentLink = paymentLink(c));
  save(KEYS.customers, customers);

  save(KEYS.transactions, [{
    id: "TXN-DEMO-1001",
    customerId: "CUS-1002",
    customerName: "Priya S",
    amount: 2200,
    date: new Date().toISOString(),
    method: "Demo payment",
    status: "Success"
  }]);

  save(KEYS.automation, {
    enabled: false, first: 30, second: 7, final: 1
  });

  save(KEYS.settings, {
    businessName: "Popoye Insurance",
    email: "", phone: "", currency: "INR"
  });
}

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function badge(status) {
  const type = ["Paid", "Active", "Success"].includes(status)
    ? "success"
    : ["Pending", "Due Soon"].includes(status)
      ? "pending"
      : ["Expired", "Failed"].includes(status)
        ? "danger" : "neutral";

  return `<span class="badge ${type}">${escapeHTML(status)}</span>`;
}

function policyStatus(customer) {
  return new Date(customer.expiry + "T23:59:59") < new Date()
    ? "Expired" : "Active";
}

function renderDashboard() {
  const customers = read(KEYS.customers);
  const transactions = read(KEYS.transactions);

  setText("#totalCustomers", customers.length);
  setText("#activePolicies",
    customers.filter(c => policyStatus(c) === "Active").length);

  const collected = transactions
    .filter(t => t.status === "Success")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  setText("#paymentsReceived", money(collected));
  setText("#pendingRenewals",
    customers.filter(c => c.paymentStatus !== "Paid").length);

  const tbody = $("#recentRenewals");
  if (!tbody) return;

  tbody.innerHTML = customers.length
    ? customers.slice(0, 5).map(c => `
      <tr>
        <td>${escapeHTML(c.name)}</td>
        <td>${escapeHTML(c.vehicle)}</td>
        <td>${money(c.premium)}</td>
        <td>${formatDate(c.expiry)}</td>
        <td>${badge(c.paymentStatus)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">No customers yet.</td></tr>`;
}

function showCustomerForm(show = true) {
  const panel = $("#customerFormPanel");
  if (panel) panel.hidden = !show;
}

function renderCustomers() {
  const tbody = $("#customersTable");
  if (!tbody) return;

  const customers = read(KEYS.customers);

  tbody.innerHTML = customers.length
    ? customers.map(c => `
      <tr>
        <td>${escapeHTML(c.name)}</td>
        <td>${escapeHTML(c.phone)}</td>
        <td>${escapeHTML(c.vehicle)}</td>
        <td>${money(c.premium)}</td>
        <td>${formatDate(c.expiry)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">No customer records.</td></tr>`;

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
      name: String(data.get("name")).trim(),
      phone: String(data.get("phone")).trim(),
      vehicle: String(data.get("vehicle")).trim().toUpperCase(),
      premium: Number(data.get("premium")),
      expiry: String(data.get("expiry")),
      policyNumber: createId("POP"),
      paymentStatus: "Pending"
    };

    if (!customer.name || !customer.phone ||
        !customer.vehicle || customer.premium <= 0 ||
        !customer.expiry) {
      alert("Please enter valid customer details.");
      return;
    }

    customer.paymentLink = paymentLink(customer);

    const customers = read(KEYS.customers);
    customers.unshift(customer);
    save(KEYS.customers, customers);

    form.reset();
    showCustomerForm(false);
    refreshAll();
    alert("Customer added successfully.");
  });
}

function renderPolicies() {
  const tbody = $("#policiesTable");
  if (!tbody) return;

  const customers = read(KEYS.customers);
  setText("#policyCount", customers.length);
  setText("#activePolicyCount",
    customers.filter(c => policyStatus(c) === "Active").length);
  setText("#expiredPolicyCount",
    customers.filter(c => policyStatus(c) === "Expired").length);

  tbody.innerHTML = customers.map(c => `
    <tr>
      <td>${escapeHTML(c.policyNumber)}</td>
      <td>${escapeHTML(c.name)}</td>
      <td>${escapeHTML(c.vehicle)}</td>
      <td>${money(c.premium)}</td>
      <td>${formatDate(c.expiry)}</td>
      <td>${badge(policyStatus(c))}</td>
    </tr>
  `).join("");

  filterRows("#policySearch", "#policiesTable");
}

function renderPayments() {
  const tbody = $("#paymentsTable");
  if (!tbody) return;

  const customers = read(KEYS.customers);
  setText("#paymentRequestCount", customers.length);
  setText("#paidCount",
    customers.filter(c => c.paymentStatus === "Paid").length);
  setText("#unpaidCount",
    customers.filter(c => c.paymentStatus !== "Paid").length);

  tbody.innerHTML = customers.map(c => `
    <tr>
      <td>${escapeHTML(c.name)}</td>
      <td>${escapeHTML(c.vehicle)}</td>
      <td>${money(c.premium)}</td>
      <td>
        <button class="btn secondary"
          data-copy-link="${escapeHTML(c.id)}">Copy demo link</button>
      </td>
      <td>${badge(c.paymentStatus)}</td>
      <td>${c.paymentStatus === "Paid"
        ? badge("Completed")
        : `<button class="btn"
            data-simulate-payment="${escapeHTML(c.id)}">
            Simulate payment
          </button>`}
      </td>
    </tr>
  `).join("");

  filterRows("#paymentSearch", "#paymentsTable");
}

function simulatePayment(id) {
  const customers = read(KEYS.customers);
  const customer = customers.find(c => c.id === id);
  if (!customer || customer.paymentStatus === "Paid") return;

  if (!confirm(`Simulate payment of ${money(customer.premium)}? No real money will be collected.`)) return;

  customer.paymentStatus = "Paid";
  save(KEYS.customers, customers);

  const transactions = read(KEYS.transactions);
  transactions.unshift({
    id: createId("TXN-DEMO"),
    customerId: customer.id,
    customerName: customer.name,
    amount: customer.premium,
    date: new Date().toISOString(),
    method: "Simulated payment",
    status: "Success"
  });
  save(KEYS.transactions, transactions);

  refreshAll();
}

async function copyDemoLink(id) {
  const customer = read(KEYS.customers).find(c => c.id === id);
  if (!customer) return;

  const link = customer.paymentLink || paymentLink(customer);

  try {
    await navigator.clipboard.writeText(link);
    alert("Demo payment link copied.");
  } catch {
    prompt("Copy this demo link:", link);
  }
}

function renderTransactions() {
  const tbody = $("#transactionsTable");
  if (!tbody) return;

  const transactions = read(KEYS.transactions);
  tbody.innerHTML = transactions.length
    ? transactions.map(t => `
      <tr>
        <td>${escapeHTML(t.id)}</td>
        <td>${escapeHTML(t.customerName)}</td>
        <td>${money(t.amount)}</td>
        <td>${formatDate(String(t.date).slice(0, 10))}</td>
        <td>${escapeHTML(t.method)}</td>
        <td>${badge(t.status)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="6">No transactions found.</td></tr>`;

  filterRows("#transactionSearch", "#transactionsTable");
}

function renderReports() {
  const customers = read(KEYS.customers);
  const transactions = read(KEYS.transactions);
  const paid = customers.filter(c => c.paymentStatus === "Paid");
  const pending = customers.filter(c => c.paymentStatus !== "Paid");
  const collected = transactions
    .filter(t => t.status === "Success")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  setText("#reportCustomers", customers.length);
  setText("#reportPaid", paid.length);
  setText("#reportPending", pending.length);
  setText("#reportCollection", money(collected));

  const tbody = $("#reportsTable");
  if (tbody) {
    const rows = [
      ["Total customers", customers.length],
      ["Paid customers", paid.length],
      ["Pending payments", pending.length],
      ["Successful demo transactions", transactions.filter(t => t.status === "Success").length],
      ["Demo collection", money(collected)]
    ];

    tbody.innerHTML = rows.map(([name, value]) => `
      <tr><td>${escapeHTML(name)}</td><td>${escapeHTML(value)}</td></tr>
    `).join("");
  }
}

function exportReport() {
  const customers = read(KEYS.customers);
  const headers = [
    "Customer ID", "Name", "Phone", "Vehicle",
    "Policy Number", "Premium INR", "Expiry Date", "Payment Status"
  ];

  const rows = customers.map(c => [
    c.id, c.name, c.phone, c.vehicle, c.policyNumber,
    c.premium, c.expiry, c.paymentStatus
  ]);

  const cell = value =>
    '"' + String(value ?? "").replace(/"/g, '""') + '"';

  const csv = [headers, ...rows]
    .map(row => row.map(cell).join(","))
    .join("\r\n");

  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = "popoye-insurance-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function setupAutomation() {
  const form = $("#automationForm");
  if (!form) return;

  const settings = read(KEYS.automation, {
    enabled: false, first: 30, second: 7, final: 1
  });

  $("#automationEnabled").checked = settings.enabled;
  $("#firstReminder").value = settings.first;
  $("#secondReminder").value = settings.second;
  $("#finalReminder").value = settings.final;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const first = Number($("#firstReminder").value);
    const second = Number($("#secondReminder").value);
    const final = Number($("#finalReminder").value);

    if (first <= second || second <= final ||
        first > 90 || first < 1 || second < 1 ||
        final < 0 || final > 30) {
      alert("Use descending reminder days, for example 30, 7, 1.");
      return;
    }

    save(KEYS.automation, {
      enabled: $("#automationEnabled").checked,
      first, second, final
    });

    setText("#automationMessage",
      "Settings saved. Actual WhatsApp delivery requires API integration.");
  });
}

function setupSettings() {
  const form = $("#settingsForm");
  if (!form) return;

  const settings = read(KEYS.settings, {
    businessName: "Popoye Insurance",
    email: "", phone: "", currency: "INR"
  });

  Object.entries(settings).forEach(([name, value]) => {
    if (form.elements[name]) form.elements[name].value = value;
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);

    save(KEYS.settings, {
      businessName: String(data.get("businessName")).trim(),
      email: String(data.get("email")).trim(),
      phone: String(data.get("phone")).trim(),
      currency: "INR"
    });

    setText("#settingsMessage", "Settings saved in this browser.");
  });
}

function filterRows(inputSelector, tableSelector) {
  const input = $(inputSelector);
  const table = $(tableSelector);
  if (!input || !table) return;

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    table.querySelectorAll("tr").forEach(row => {
      row.hidden = !row.textContent.toLowerCase().includes(query);
    });
  });
}

function refreshAll() {
  renderDashboard();
  renderCustomers();
  renderPolicies();
  renderPayments();
  renderTransactions();
  renderReports();
}

document.addEventListener("DOMContentLoaded", () => {
  seedData();
  refreshAll();
  setupCustomerForm();
  setupAutomation();
  setupSettings();

  const paymentTable = $("#paymentsTable");
  if (paymentTable) {
    paymentTable.addEventListener("click", event => {
      const copy = event.target.closest("[data-copy-link]");
      const pay = event.target.closest("[data-simulate-payment]");

      if (copy) copyDemoLink(copy.dataset.copyLink);
      if (pay) simulatePayment(pay.dataset.simulatePayment);
    });
  }

  const params = new URLSearchParams(location.search);
  const demoCustomerId = params.get("demoCustomer");

  if (demoCustomerId && $("#paymentsTable")) {
    const customer = read(KEYS.customers).find(c => c.id === demoCustomerId);
    if (customer) {
      alert(
        `DEMO PAYMENT\nCustomer: ${customer.name}\n` +
        `Vehicle: ${customer.vehicle}\nAmount: ${money(customer.premium)}\n\n` +
        "This is not a real payment page."
      );
    }
  }
});
