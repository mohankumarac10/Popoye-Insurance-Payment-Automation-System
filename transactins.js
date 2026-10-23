
const transactions = [
  {
    id: "TXN5001",
    paymentId: "PAY1001",
    customer: "Arun Kumar",
    amount: 2850,
    method: "UPI",
    date: "2026-10-22",
    status: "Successful"
  },
  {
    id: "TXN5002",
    paymentId: "PAY1002",
    customer: "Priya S",
    amount: 1250,
    method: "Card",
    date: "2026-10-22",
    status: "Pending"
  },
  {
    id: "TXN5003",
    paymentId: "PAY1003",
    customer: "Karthik R",
    amount: 1950,
    method: "Net Banking",
    date: "2026-10-21",
    status: "Successful"
  },
  {
    id: "TXN5004",
    paymentId: "PAY1004",
    customer: "Divya M",
    amount: 3200,
    method: "UPI",
    date: "2026-10-20",
    status: "Failed"
  },
  {
    id: "TXN5005",
    paymentId: "PAY1005",
    customer: "Vijay P",
    amount: 1100,
    method: "Card",
    date: "2026-10-20",
    status: "Successful"
  },
  {
    id: "TXN5006",
    paymentId: "PAY1006",
    customer: "Meena K",
    amount: 2950,
    method: "UPI",
    date: "2026-10-19",
    status: "Pending"
  },
  {
    id: "TXN5007",
    paymentId: "PAY1007",
    customer: "Suresh B",
    amount: 1750,
    method: "Net Banking",
    date: "2026-10-18",
    status: "Failed"
  },
  {
    id: "TXN5008",
    paymentId: "PAY1008",
    customer: "Nisha R",
    amount: 1350,
    method: "UPI",
    date: "2026-10-17",
    status: "Successful"
  }
];

const transactionPageSize = 5;
let transactionCurrentPage = 1;

const transactionSearch =
  document.getElementById("transactionSearch");

const transactionStatusFilter =
  document.getElementById("transactionStatusFilter");

const transactionMethodFilter =
  document.getElementById("transactionMethodFilter");

const transactionsTable =
  document.getElementById("transactionsTable");

function escapeTransactionText(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatTransactionDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function updateTransactionStats() {
  document.getElementById("totalTransactions").textContent =
    transactions.length;

  document.getElementById("successfulTransactions").textContent =
    transactions.filter(t => t.status === "Successful").length;

  document.getElementById("pendingTransactions").textContent =
    transactions.filter(t => t.status === "Pending").length;

  document.getElementById("failedTransactions").textContent =
    transactions.filter(t => t.status === "Failed").length;
}

function getFilteredTransactions() {
  const searchTerm = transactionSearch.value.trim().toLowerCase();
  const selectedStatus = transactionStatusFilter.value;
  const selectedMethod = transactionMethodFilter.value;

  return transactions.filter(transaction => {
    const matchesSearch = [
      transaction.id,
      transaction.paymentId,
      transaction.customer,
      transaction.method
    ].some(value => value.toLowerCase().includes(searchTerm));

    const matchesStatus =
      !selectedStatus || transaction.status === selectedStatus;

    const matchesMethod =
      !selectedMethod || transaction.method === selectedMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });
}

function renderTransactions() {
  const filteredTransactions = getFilteredTransactions();

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / transactionPageSize)
  );

  if (transactionCurrentPage > totalPages) {
    transactionCurrentPage = totalPages;
  }

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
          <td>₹${transaction.amount.toLocaleString("en-IN")}</td>
          <td>${escapeTransactionText(transaction.method)}</td>
          <td>${formatTransactionDate(transaction.date)}</td>
          <td>
            <span class="status ${statusClass}">
              ${transaction.status}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  document.getElementById("transactionPageInfo").textContent =
    `Page ${transactionCurrentPage} of ${totalPages} · ${filteredTransactions.length} transactions`;

  document.getElementById("previousTransactionPage").disabled =
    transactionCurrentPage === 1;

  document.getElementById("nextTransactionPage").disabled =
    transactionCurrentPage === totalPages;
}

transactionSearch.addEventListener("input", () => {
  transactionCurrentPage = 1;
  renderTransactions();
});

transactionStatusFilter.addEventListener("change", () => {
  transactionCurrentPage = 1;
  renderTransactions();
});

transactionMethodFilter.addEventListener("change", () => {
  transactionCurrentPage = 1;
  renderTransactions();
});

document.getElementById("resetTransactionFilters")
  .addEventListener("click", () => {
    transactionSearch.value = "";
    transactionStatusFilter.value = "";
    transactionMethodFilter.value = "";
    transactionCurrentPage = 1;
    renderTransactions();
  });

document.getElementById("previousTransactionPage")
  .addEventListener("click", () => {
    if (transactionCurrentPage > 1) {
      transactionCurrentPage--;
      renderTransactions();
    }
  });

document.getElementById("nextTransactionPage")
  .addEventListener("click", () => {
    const totalPages = Math.max(
      1,
      Math.ceil(
        getFilteredTransactions().length / transactionPageSize
      )
    );

    if (transactionCurrentPage < totalPages) {
      transactionCurrentPage++;
      renderTransactions();
    }
  });

updateTransactionStats();
renderTransactions();
