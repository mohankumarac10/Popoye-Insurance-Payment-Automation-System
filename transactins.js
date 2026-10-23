
const PAYMENT_KEY = "popoyePayments";

const transactionPageSize = 5;
let transactionCurrentPage = 1;

// Demo transactions shown only when payment records have not been created yet.
const demoTransactions = [
  { id: "TXN5001", paymentId: "PAY1001", customer: "Arun Kumar", amount: 2850, method: "UPI", date: "2026-10-22", status: "Successful" },
  { id: "TXN5002", paymentId: "PAY1002", customer: "Priya S", amount: 1250, method: "Card", date: "2026-10-22", status: "Pending" },
  { id: "TXN5003", paymentId: "PAY1003", customer: "Karthik R", amount: 1950, method: "Net Banking", date: "2026-10-21", status: "Successful" },
  { id: "TXN5004", paymentId: "PAY1004", customer: "Divya M", amount: 3200, method: "UPI", date: "2026-10-20", status: "Failed" },
  { id: "TXN5005", paymentId: "PAY1005", customer: "Vijay P", amount: 1100, method: "Card", date: "2026-10-20", status: "Successful" },
  { id: "TXN5006", paymentId: "PAY1006", customer: "Meena K", amount: 2950, method: "UPI", date: "2026-10-19", status: "Pending" },
  { id: "TXN5007", paymentId: "PAY1007", customer: "Suresh B", amount: 1750, method: "Net Banking", date: "2026-10-18", status: "Failed" },
  { id: "TXN5008", paymentId: "PAY1008", customer: "Nisha R", amount: 1350, method: "UPI", date: "2026-10-17", status: "Successful" }
];

const transactionSearch =
  document.getElementById("transactionSearch");

const transactionStatusFilter =
  document.getElementById("transactionStatusFilter");

const transactionMethodFilter =
  document.getElementById("transactionMethodFilter");

const transactionsTable =
  document.getElementById("transactionsTable");

let transactions = [];

// Safely escape text before inserting it into HTML.
function escapeTransactionText(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Format Indian currency.
function formatTransactionAmount(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  });
}

// Format dates safely.
function formatTransactionDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(String(dateString).slice(0, 10) + "T00:00:00");

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// Read payment records and convert them into transaction rows.
function loadTransactions() {
  try {
    const savedPayments = localStorage.getItem(PAYMENT_KEY);

    // Use demo records only if the payments key has never been created.
    if (savedPayments === null) {
      transactions = [...demoTransactions];
      return;
    }

    const payments = JSON.parse(savedPayments);

    if (!Array.isArray(payments)) {
      transactions = [];
      return;
    }

    transactions = payments.map((payment, index) => ({
      id: payment.transactionId || `TXN-${payment.id || index + 1}`,
      paymentId: payment.id || "—",
      customer: payment.customerName || payment.customer || "Unknown Customer",
      amount: Number(payment.amount) || 0,
      method: payment.method || "—",
      date: payment.date || "",
      status: normalizeTransactionStatus(payment.status)
    }));
  } catch (error) {
    console.error("Unable to load payment records:", error);
    transactions = [];
  }
}

// Only display known transaction statuses.
function normalizeTransactionStatus(status) {
  const normalized = String(status || "Pending").toLowerCase();

  if (normalized === "successful" || normalized === "success") {
    return "Successful";
  }

  if (normalized === "failed") {
    return "Failed";
  }

  return "Pending";
}

// Update transaction count and amount summaries.
function updateTransactionStats() {
  const successful = transactions.filter(
    transaction => transaction.status === "Successful"
  );

  const pending = transactions.filter(
    transaction => transaction.status === "Pending"
  );

  const failed = transactions.filter(
    transaction => transaction.status === "Failed"
  );

  setText("totalTransactions", transactions.length);
  setText("successfulTransactions", successful.length);
  setText("pendingTransactions", pending.length);
  setText("failedTransactions", failed.length);

  // These amount fields are included in the updated transactions.html.
  setText(
    "totalTransactionAmount",
    formatTransactionAmount(
      transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
    )
  );

  setText(
    "successfulTransactionAmount",
    formatTransactionAmount(
      successful.reduce((sum, transaction) => sum + transaction.amount, 0)
    )
  );

  setText(
    "pendingTransactionAmount",
    formatTransactionAmount(
      pending.reduce((sum, transaction) => sum + transaction.amount, 0)
    )
  );
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

// Search and filter transactions.
function getFilteredTransactions() {
  const searchTerm = (transactionSearch?.value || "")
    .trim()
    .toLowerCase();

  const selectedStatus = transactionStatusFilter?.value || "";
  const selectedMethod = transactionMethodFilter?.value || "";

  return transactions.filter(transaction => {
    const searchableValues = [
      transaction.id,
      transaction.paymentId,
      transaction.customer,
      transaction.method
    ];

    const matchesSearch = searchableValues.some(value =>
      String(value || "").toLowerCase().includes(searchTerm)
    );

    const matchesStatus =
      !selectedStatus || transaction.status === selectedStatus;

    const matchesMethod =
      !selectedMethod || transaction.method === selectedMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });
}

// Display the current page.
function renderTransactions() {
  const filteredTransactions = getFilteredTransactions();

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / transactionPageSize)
  );

  transactionCurrentPage = Math.min(transactionCurrentPage, totalPages);

  const startIndex =
    (transactionCurrentPage - 1) * transactionPageSize;

  const visibleTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + transactionPageSize
  );

  if (visibleTransactions.length === 0) {
    transactionsTable.innerHTML = `
      <tr>
        <td colspan="7">No transactions found.</td>
      </tr>
    `;
  } else {
    transactionsTable.innerHTML = visibleTransactions.map(transaction => {
      let statusClass = "pending";

      if (transaction.status === "Successful") {
        statusClass = "paid";
      } else if (transaction.status === "Failed") {
        statusClass = "failed";
      }

      return `
        <tr>
          <td>${escapeTransactionText(transaction.id)}</td>
          <td>${escapeTransactionText(transaction.paymentId)}</td>
          <td>${escapeTransactionText(transaction.customer)}</td>
          <td>${formatTransactionAmount(transaction.amount)}</td>
          <td>${escapeTransactionText(transaction.method)}</td>
          <td>${formatTransactionDate(transaction.date)}</td>
          <td>
            <span class="status ${statusClass}">
              ${escapeTransactionText(transaction.status)}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  setText(
    "transactionPageInfo",
    `Page ${transactionCurrentPage} of ${totalPages} · ${filteredTransactions.length} transactions`
  );

  const previousButton =
    document.getElementById("previousTransactionPage");

  const nextButton =
    document.getElementById("nextTransactionPage");

  if (previousButton) {
    previousButton.disabled = transactionCurrentPage === 1;
  }

  if (nextButton) {
    nextButton.disabled = transactionCurrentPage === totalPages;
  }
}

// Export currently filtered transactions to CSV.
function exportTransactionsCSV() {
  const filteredTransactions = getFilteredTransactions();

  if (filteredTransactions.length === 0) {
    alert("No transactions available to export.");
    return;
  }

  const headers = [
    "Transaction ID",
    "Payment ID",
    "Customer",
    "Amount",
    "Method",
    "Date",
    "Status"
  ];

  const rows = filteredTransactions.map(transaction => [
    transaction.id,
    transaction.paymentId,
    transaction.customer,
    transaction.amount,
    transaction.method,
    transaction.date,
    transaction.status
  ]);

  // Escape commas, quotes and line breaks for valid CSV.
  const csvCell = value =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csvContent = [headers, ...rows]
    .map(row => row.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "popoye-insurance-transactions.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

// Reset filters.
document.getElementById("resetTransactionFilters")
  ?.addEventListener("click", () => {
    if (transactionSearch) transactionSearch.value = "";
    if (transactionStatusFilter) transactionStatusFilter.value = "";
    if (transactionMethodFilter) transactionMethodFilter.value = "";

    transactionCurrentPage = 1;
    renderTransactions();
  });

// Search.
transactionSearch?.addEventListener("input", () => {
  transactionCurrentPage = 1;
  renderTransactions();
});

// Status filter.
transactionStatusFilter?.addEventListener("change", () => {
  transactionCurrentPage = 1;
  renderTransactions();
});

// Payment method filter.
transactionMethodFilter?.addEventListener("change", () => {
  transactionCurrentPage = 1;
  renderTransactions();
});

// Previous page.
document.getElementById("previousTransactionPage")
  ?.addEventListener("click", () => {
    if (transactionCurrentPage > 1) {
      transactionCurrentPage--;
      renderTransactions();
    }
  });

// Next page.
document.getElementById("nextTransactionPage")
  ?.addEventListener("click", () => {
    const totalPages = Math.max(
      1,
      Math.ceil(getFilteredTransactions().length / transactionPageSize)
    );

    if (transactionCurrentPage < totalPages) {
      transactionCurrentPage++;
      renderTransactions();
    }
  });

// Export CSV button.
document.getElementById("exportTransactions")
  ?.addEventListener("click", exportTransactionsCSV);

// Start the page.
loadTransactions();
updateTransactionStats();
renderTransactions();

// Refresh when another tab updates localStorage.
window.addEventListener("storage", event => {
  if (event.key === PAYMENT_KEY) {
    loadTransactions();
    updateTransactionStats();
    transactionCurrentPage = 1;
    renderTransactions();
  }
});
