// ========================================
// POPOYE INSURANCE - DASHBOARD JAVASCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  const readStorage = (key, fallback = []) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(value) || 0);

  const getValue = (item, keys, fallback = "") => {
    for (const key of keys) {
      if (item && item[key] !== undefined && item[key] !== null && item[key] !== "") {
        return item[key];
      }
    }
    return fallback;
  };

  const normalizeStatus = (value) =>
    String(value || "").trim().toLowerCase();

  const isSuccessful = (status) =>
    ["successful", "success", "paid", "completed"].includes(
      normalizeStatus(status)
    );

  const isPending = (status) =>
    ["pending", "due", "unpaid", "processing"].includes(
      normalizeStatus(status)
    );

  // Demo data is used when a page has not saved its own records yet.
  const today = new Date();

  function dateOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function monthOffset(monthsAgo, day = 12) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - monthsAgo);
    date.setDate(Math.min(day, new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate()));
    return date.toISOString().slice(0, 10);
  }

  const demoCustomers = [
    {
      id: "CUS1001",
      name: "Arun Kumar",
      vehicleNumber: "TN38AB1234",
      phone: "9000000001",
      status: "Active"
    },
    {
      id: "CUS1002",
      name: "Priya S",
      vehicleNumber: "TN37CD5678",
      phone: "9000000002",
      status: "Active"
    },
    {
      id: "CUS1003",
      name: "Karthik R",
      vehicleNumber: "TN40EF9012",
      phone: "9000000003",
      status: "Active"
    },
    {
      id: "CUS1004",
      name: "Divya M",
      vehicleNumber: "TN66GH3456",
      phone: "9000000004",
      status: "Active"
    },
    {
      id: "CUS1005",
      name: "Vijay P",
      vehicleNumber: "TN38JK7890",
      phone: "9000000005",
      status: "Active"
    }
  ];

  const demoPolicies = [
    {
      id: "POL1001",
      customerName: "Arun Kumar",
      vehicleNumber: "TN38AB1234",
      expiryDate: dateOffset(8),
      status: "Active"
    },
    {
      id: "POL1002",
      customerName: "Priya S",
      vehicleNumber: "TN37CD5678",
      expiryDate: dateOffset(20),
      status: "Active"
    },
    {
      id: "POL1003",
      customerName: "Karthik R",
      vehicleNumber: "TN40EF9012",
      expiryDate: dateOffset(-5),
      status: "Expired"
    },
    {
      id: "POL1004",
      customerName: "Divya M",
      vehicleNumber: "TN66GH3456",
      expiryDate: dateOffset(65),
      status: "Active"
    },
    {
      id: "POL1005",
      customerName: "Vijay P",
      vehicleNumber: "TN38JK7890",
      expiryDate: dateOffset(12),
      status: "Active"
    }
  ];

  const demoPayments = [
    {
      id: "PAY1001",
      customerName: "Arun Kumar",
      vehicleNumber: "TN38AB1234",
      amount: 1850,
      date: monthOffset(0, 5),
      status: "Successful"
    },
    {
      id: "PAY1002",
      customerName: "Priya S",
      vehicleNumber: "TN37CD5678",
      amount: 2200,
      date: monthOffset(0, 10),
      status: "Pending"
    },
    {
      id: "PAY1003",
      customerName: "Karthik R",
      vehicleNumber: "TN40EF9012",
      amount: 1600,
      date: monthOffset(1, 15),
      status: "Successful"
    },
    {
      id: "PAY1004",
      customerName: "Divya M",
      vehicleNumber: "TN66GH3456",
      amount: 2450,
      date: monthOffset(2, 12),
      status: "Successful"
    },
    {
      id: "PAY1005",
      customerName: "Vijay P",
      vehicleNumber: "TN38JK7890",
      amount: 1900,
      date: monthOffset(0, 17),
      status: "Failed"
    },
    {
      id: "PAY1006",
      customerName: "Arun Kumar",
      vehicleNumber: "TN38AB1234",
      amount: 1850,
      date: monthOffset(3, 8),
      status: "Successful"
    }
  ];

  const demoReminders = [
    { id: "REM1001", status: "Pending" },
    { id: "REM1002", status: "Pending" },
    { id: "REM1003", status: "Sent" }
  ];

  function renderDashboard() {
    // Customers and reminders use the localStorage keys from their pages.
    const storedCustomers = readStorage("popoyeCustomers");
    const storedReminders = readStorage("popoyeReminders");

    const customers = storedCustomers.length
      ? storedCustomers
      : demoCustomers;

    // These fallbacks remain demo data until the other pages save shared records.
    const policies = readStorage("popoyePolicies", demoPolicies);
    const payments = readStorage("popoyePayments", demoPayments);
    const transactions = readStorage("popoyeTransactions", payments);
    const reminders = storedReminders.length
      ? storedReminders
      : demoReminders;

    // Summary cards
    setText("totalCustomers", customers.length);

    const activePoliciesCount = policies.filter((policy) => {
      const status = normalizeStatus(
        getValue(policy, ["status", "policyStatus"], "")
      );
      const expiry = getValue(
        policy,
        ["expiryDate", "expiry", "endDate", "policyExpiry"],
        ""
      );

      if (status === "expired" || status === "cancelled") return false;

      if (expiry) {
        const expiryDate = new Date(expiry);
        expiryDate.setHours(23, 59, 59, 999);
        if (!Number.isNaN(expiryDate.getTime()) && expiryDate < today) {
          return false;
        }
      }

      return status === "active" || Boolean(expiry);
    }).length;

    setText("activePolicies", activePoliciesCount);

    const collectedPayments = payments.filter((payment) =>
      isSuccessful(getValue(payment, ["status", "paymentStatus"], ""))
    );

    const totalCollected = collectedPayments.reduce(
      (total, payment) =>
        total + Number(getValue(payment, ["amount", "premium", "premiumAmount"], 0)),
      0
    );

    setText("totalCollected", money(totalCollected));

    const pendingPaymentsList = payments.filter((payment) =>
      isPending(getValue(payment, ["status", "paymentStatus"], ""))
    );

    const pendingTotal = pendingPaymentsList.reduce(
      (total, payment) =>
        total + Number(getValue(payment, ["amount", "premium", "premiumAmount"], 0)),
      0
    );

    setText("pendingPayments", pendingPaymentsList.length);
    setText("pendingAmount", "Outstanding amount: " + money(pendingTotal));

    // Renewal overview
    const expiring = policies.filter((policy) => {
      const expiry = getValue(
        policy,
        ["expiryDate", "expiry", "endDate", "policyExpiry"],
        ""
      );

      if (!expiry) return false;

      const expiryDate = new Date(expiry);
      if (Number.isNaN(expiryDate.getTime())) return false;

      expiryDate.setHours(23, 59, 59, 999);

      const days = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / 86400000
      );

      const status = normalizeStatus(getValue(policy, ["status"], ""));
      return days >= 0 && days <= 30 && status !== "cancelled";
    }).length;

    const expired = policies.filter((policy) => {
      const status = normalizeStatus(getValue(policy, ["status"], ""));
      const expiry = getValue(
        policy,
        ["expiryDate", "expiry", "endDate", "policyExpiry"],
        ""
      );

      if (status === "expired") return true;
      if (!expiry) return false;

      const expiryDate = new Date(expiry);
      if (Number.isNaN(expiryDate.getTime())) return false;

      expiryDate.setHours(23, 59, 59, 999);
      return expiryDate < today && status !== "cancelled";
    }).length;

    const pendingReminderCount = reminders.filter((reminder) =>
      ["pending", "scheduled", "overdue"].includes(
        normalizeStatus(getValue(reminder, ["status", "reminderStatus"], ""))
      )
    ).length;

    setText("expiringPolicies", expiring);
    setText("expiredPolicies", expired);
    setText("pendingReminders", pendingReminderCount);

    // Recent transactions
    const recent = [...transactions]
      .sort((a, b) => {
        const dateA = new Date(getValue(a, ["date", "paymentDate", "createdAt"], 0));
        const dateB = new Date(getValue(b, ["date", "paymentDate", "createdAt"], 0));
        return dateB - dateA;
      })
      .slice(0, 5);

    renderTransactions(recent);
    renderCollectionChart(collectedPayments);

    const notice = document.getElementById("transactionNotice");
    if (notice) {
      const hasSavedData =
        storedCustomers.length > 0 ||
        localStorage.getItem("popoyePolicies") !== null ||
        localStorage.getItem("popoyePayments") !== null ||
        localStorage.getItem("popoyeTransactions") !== null;

      notice.textContent = hasSavedData
        ? "Dashboard uses saved records where available. Any section without saved records may still show demo data."
        : "Demo mode: these are sample records. Connect shared page data before using this dashboard for real business reporting.";
    }
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function renderTransactions(records) {
    const tbody = document.getElementById("recentTransactions");
    if (!tbody) return;

    if (!records.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">No transaction records available.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = records.map((record) => {
      const id = getValue(
        record,
        ["id", "transactionId", "paymentId", "reference"],
        "—"
      );
      const customer = getValue(
        record,
        ["customerName", "name", "customer"],
        "Customer"
      );
      const vehicle = getValue(
        record,
        ["vehicleNumber", "vehicleNo", "registrationNumber"],
        "—"
      );
      const amount = getValue(
        record,
        ["amount", "premium", "premiumAmount"],
        0
      );
      const date = getValue(
        record,
        ["date", "paymentDate", "createdAt"],
        ""
      );
      const status = getValue(
        record,
        ["status", "paymentStatus"],
        "Pending"
      );

      const statusClass = "status-" +
        normalizeStatus(status).replace(/[^a-z0-9]+/g, "-");

      return `
        <tr>
          <td class="transaction-id">${escapeHTML(id)}</td>
          <td class="customer-cell">${escapeHTML(customer)}</td>
          <td>${escapeHTML(vehicle)}</td>
          <td>${money(amount)}</td>
          <td>${formatDate(date)}</td>
          <td><span class="status-pill ${statusClass}">${escapeHTML(status)}</span></td>
        </tr>
      `;
    }).join("");
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  let paymentChart;

  function renderCollectionChart(successfulPayments) {
    const canvas = document.getElementById("collectionChart");
    if (!canvas || typeof Chart === "undefined") return;

    const monthLabels = [];
    const monthTotals = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(date.toLocaleDateString("en-IN", { month: "short" }));
      monthTotals.push(0);
    }

    successfulPayments.forEach((payment) => {
      const rawDate = getValue(
        payment,
        ["date", "paymentDate", "createdAt"],
        ""
      );

      if (!rawDate) return;

      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;

      const monthDifference =
        (now.getFullYear() - date.getFullYear()) * 12 +
        now.getMonth() - date.getMonth();

      if (monthDifference < 0 || monthDifference > 5) return;

      const index = 5 - monthDifference;
      monthTotals[index] += Number(
        getValue(payment, ["amount", "premium", "premiumAmount"], 0)
      );
    });

    if (paymentChart) paymentChart.destroy();

    paymentChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: monthLabels,
        datasets: [{
          label: "Collections",
          data: monthTotals,
          backgroundColor: "#356df3",
          hoverBackgroundColor: "#214fc0",
          borderRadius: 6,
          maxBarThickness: 38
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => "Collected: " + money(context.raw)
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#7b879b" },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: "#edf1f7" },
            ticks: {
              color: "#7b879b",
              callback: (value) => "₹" + Number(value).toLocaleString("en-IN")
            },
            border: { display: false }
          }
        }
      }
    });
  }

  // Header date and footer year
  setText("todayDate", today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }));

  setText("currentYear", today.getFullYear());

  const refreshButton = document.getElementById("refreshDashboard");
  if (refreshButton) {
    refreshButton.addEventListener("click", renderDashboard);
  }

  renderDashboard();
});