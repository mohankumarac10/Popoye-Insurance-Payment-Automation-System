
const payments = [
  {
    id: "PAY1001",
    customer: "Arun Kumar",
    vehicle: "TN 38 AB 1234",
    amount: 2850,
    method: "UPI",
    date: "2026-10-22",
    status: "Successful"
  },
  {
    id: "PAY1002",
    customer: "Priya S",
    vehicle: "TN 37 CD 5678",
    amount: 1250,
    method: "Card",
    date: "2026-10-22",
    status: "Pending"
  },
  {
    id: "PAY1003",
    customer: "Karthik R",
    vehicle: "TN 66 EF 9012",
    amount: 1950,
    method: "Net Banking",
    date: "2026-10-21",
    status: "Successful"
  },
  {
    id: "PAY1004",
    customer: "Divya M",
    vehicle: "TN 39 GH 3456",
    amount: 3200,
    method: "UPI",
    date: "2026-10-20",
    status: "Failed"
  },
  {
    id: "PAY1005",
    customer: "Vijay P",
    vehicle: "TN 40 JK 7890",
    amount: 1100,
    method: "Card",
    date: "2026-10-20",
    status: "Successful"
  },
  {
    id: "PAY1006",
    customer: "Meena K",
    vehicle: "TN 41 LM 2345",
    amount: 2950,
    method: "UPI",
    date: "2026-10-19",
    status: "Pending"
  },
  {
    id: "PAY1007",
    customer: "Suresh B",
    vehicle: "TN 42 NP 6789",
    amount: 1750,
    method: "Net Banking",
    date: "2026-10-18",
    status: "Failed"
  },
  {
    id: "PAY1008",
    customer: "Nisha R",
    vehicle: "TN 43 QR 1122",
    amount: 1350,
    method: "UPI",
    date: "2026-10-17",
    status: "Successful"
  }
];

const paymentPageSize = 5;
let paymentCurrentPage = 1;

const paymentSearch = document.getElementById("paymentSearch");
const paymentStatusFilter = document.getElementById("paymentStatusFilter");
const paymentMethodFilter = document.getElementById("paymentMethodFilter");
const paymentsTable = document.getElementById("paymentsTable");

function escapePaymentText(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatPaymentDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function updatePaymentStats() {
  document.getElementById("totalPayments").textContent = payments.length;

  document.getElementById("successfulPayments").textContent =
    payments.filter(payment => payment.status === "Successful").length;

  document.getElementById("pendingPayments").textContent =
    payments.filter(payment => payment.status === "Pending").length;

  document.getElementById("failedPayments").textContent =
    payments.filter(payment => payment.status === "Failed").length;
}

function getFilteredPayments() {
  const searchTerm = paymentSearch.value.trim().toLowerCase();
  const selectedStatus = paymentStatusFilter.value;
  const selectedMethod = paymentMethodFilter.value;

  return payments.filter(payment => {
    const matchesSearch = [
      payment.id,
      payment.customer,
      payment.vehicle,
      payment.method
    ].some(value => value.toLowerCase().includes(searchTerm));

    const matchesStatus =
      !selectedStatus || payment.status === selectedStatus;

    const matchesMethod =
      !selectedMethod || payment.method === selectedMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });
}

function renderPayments() {
  const filteredPayments = getFilteredPayments();
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / paymentPageSize)
  );

  if (paymentCurrentPage > totalPages) {
    paymentCurrentPage = totalPages;
  }

  const startIndex = (paymentCurrentPage - 1) * paymentPageSize;
  const visiblePayments = filteredPayments.slice(
    startIndex,
    startIndex + paymentPageSize
  );

  if (visiblePayments.length === 0) {
    paymentsTable.innerHTML = `
      <tr>
        <td colspan="7">No payments found.</td>
      </tr>
    `;
  } else {
    paymentsTable.innerHTML = visiblePayments.map(payment => {
      let statusClass = "pending";

      if (payment.status === "Successful") statusClass = "paid";
      if (payment.status === "Failed") statusClass = "failed";

      return `
        <tr>
          <td>${escapePaymentText(payment.id)}</td>
          <td>${escapePaymentText(payment.customer)}</td>
          <td>${escapePaymentText(payment.vehicle)}</td>
          <td>₹${payment.amount.toLocaleString("en-IN")}</td>
          <td>${escapePaymentText(payment.method)}</td>
          <td>${formatPaymentDate(payment.date)}</td>
          <td>
            <span class="status ${statusClass}">
              ${payment.status}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  document.getElementById("paymentPageInfo").textContent =
    `Page ${paymentCurrentPage} of ${totalPages} · ${filteredPayments.length} payments`;

  document.getElementById("previousPaymentPage").disabled =
    paymentCurrentPage === 1;

  document.getElementById("nextPaymentPage").disabled =
    paymentCurrentPage === totalPages;
}

paymentSearch.addEventListener("input", () => {
  paymentCurrentPage = 1;
  renderPayments();
});

paymentStatusFilter.addEventListener("change", () => {
  paymentCurrentPage = 1;
  renderPayments();
});

paymentMethodFilter.addEventListener("change", () => {
  paymentCurrentPage = 1;
  renderPayments();
});

document.getElementById("resetPaymentFilters").addEventListener("click", () => {
  paymentSearch.value = "";
  paymentStatusFilter.value = "";
  paymentMethodFilter.value = "";
  paymentCurrentPage = 1;
  renderPayments();
});

document.getElementById("previousPaymentPage").addEventListener("click", () => {
  if (paymentCurrentPage > 1) {
    paymentCurrentPage--;
    renderPayments();
  }
});

document.getElementById("nextPaymentPage").addEventListener("click", () => {
  const totalPages = Math.max(
    1,
    Math.ceil(getFilteredPayments().length / paymentPageSize)
  );

  if (paymentCurrentPage < totalPages) {
    paymentCurrentPage++;
    renderPayments();
  }
});

updatePaymentStats();
renderPayments();
