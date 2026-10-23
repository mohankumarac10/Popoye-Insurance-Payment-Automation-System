
const reportPayments = [
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

const reportPageSize = 5;
let reportCurrentPage = 1;
let filteredReportPayments = [...reportPayments];

const reportStartDate = document.getElementById("reportStartDate");
const reportEndDate = document.getElementById("reportEndDate");
const reportStatusFilter = document.getElementById("reportStatusFilter");
const reportTable = document.getElementById("reportTable");

function escapeReportText(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatReportDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatRupees(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

function generateReport() {
  const start = reportStartDate.value;
  const end = reportEndDate.value;
  const status = reportStatusFilter.value;
  const message = document.getElementById("reportMessage");

  if (start && end && start > end) {
    message.textContent = "Start date cannot be later than end date.";
    filteredReportPayments = [];
    reportCurrentPage = 1;
    updateReportSummary();
    renderReportTable();
    return;
  }

  filteredReportPayments = reportPayments.filter(payment => {
    const matchesStart = !start || payment.date >= start;
    const matchesEnd = !end || payment.date <= end;
    const matchesStatus = !status || payment.status === status;

    return matchesStart && matchesEnd && matchesStatus;
  });

  message.textContent =
    `Report generated: ${filteredReportPayments.length} payment records found.`;

  reportCurrentPage = 1;
  updateReportSummary();
  renderReportTable();
}

function updateReportSummary() {
  const payments = filteredReportPayments;

  const successful = payments.filter(
    p => p.status === "Successful"
  );

  const pending = payments.filter(
    p => p.status === "Pending"
  );

  const failed = payments.filter(
    p => p.status === "Failed"
  );

  const revenue = successful.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pending.reduce((sum, p) => sum + p.amount, 0);
  const failedAmount = failed.reduce((sum, p) => sum + p.amount, 0);

  const successRate = payments.length
    ? Math.round((successful.length / payments.length) * 100)
    : 0;

  document.getElementById("reportTotalPayments").textContent =
    payments.length;

  document.getElementById("reportSuccessfulPayments").textContent =
    successful.length;

  document.getElementById("reportPendingPayments").textContent =
    pending.length;

  document.getElementById("reportFailedPayments").textContent =
    failed.length;

  document.getElementById("reportRevenue").textContent =
    formatRupees(revenue);

  document.getElementById("reportPendingAmount").textContent =
    formatRupees(pendingAmount);

  document.getElementById("reportFailedAmount").textContent =
    formatRupees(failedAmount);

  document.getElementById("reportSuccessRate").textContent =
    successRate + "%";
}

function renderReportTable() {
  const totalPages = Math.max(
    1,
    Math.ceil(filteredReportPayments.length / reportPageSize)
  );

  if (reportCurrentPage > totalPages) {
    reportCurrentPage = totalPages;
  }

  const startIndex = (reportCurrentPage - 1) * reportPageSize;

  const visiblePayments = filteredReportPayments.slice(
    startIndex,
    startIndex + reportPageSize
  );

  if (visiblePayments.length === 0) {
    reportTable.innerHTML = `
      <tr>
        <td colspan="7">No report records found.</td>
      </tr>
    `;
  } else {
    reportTable.innerHTML = visiblePayments.map(payment => {
      let statusClass = "pending";

      if (payment.status === "Successful") statusClass = "paid";
      if (payment.status === "Failed") statusClass = "failed";

      return `
        <tr>
          <td>${escapeReportText(payment.id)}</td>
          <td>${escapeReportText(payment.customer)}</td>
          <td>${escapeReportText(payment.vehicle)}</td>
          <td>${formatRupees(payment.amount)}</td>
          <td>${escapeReportText(payment.method)}</td>
          <td>${formatReportDate(payment.date)}</td>
          <td>
            <span class="status ${statusClass}">
              ${escapeReportText(payment.status)}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  document.getElementById("reportPageInfo").textContent =
    `Page ${reportCurrentPage} of ${totalPages} · ${filteredReportPayments.length} records`;

  document.getElementById("previousReportPage").disabled =
    reportCurrentPage === 1;

  document.getElementById("nextReportPage").disabled =
    reportCurrentPage === totalPages;
}

function exportReportCSV() {
  if (filteredReportPayments.length === 0) {
    alert("There are no report records to export.");
    return;
  }

  const headers = [
    "Payment ID",
    "Customer",
    "Vehicle Number",
    "Amount",
    "Method",
    "Date",
    "Status"
  ];

  const rows = filteredReportPayments.map(payment => [
    payment.id,
    payment.customer,
    payment.vehicle,
    payment.amount,
    payment.method,
    payment.date,
    payment.status
  ]);

  const csvCell = value =>
    '"' + String(value).replace(/"/g, '""') + '"';

  const csv = [headers, ...rows]
    .map(row => row.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "popoye-insurance-report.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

document.getElementById("generateReport")
  .addEventListener("click", generateReport);

document.getElementById("exportReport")
  .addEventListener("click", exportReportCSV);

document.getElementById("resetReport").addEventListener("click", () => {
  reportStartDate.value = "";
  reportEndDate.value = "";
  reportStatusFilter.value = "";

  document.getElementById("reportMessage").textContent = "";

  filteredReportPayments = [...reportPayments];
  reportCurrentPage = 1;

  updateReportSummary();
  renderReportTable();
});

document.getElementById("previousReportPage")
  .addEventListener("click", () => {
    if (reportCurrentPage > 1) {
      reportCurrentPage--;
      renderReportTable();
    }
  });

document.getElementById("nextReportPage")
  .addEventListener("click", () => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredReportPayments.length / reportPageSize)
    );

    if (reportCurrentPage < totalPages) {
      reportCurrentPage++;
      renderReportTable();
    }
  });

updateReportSummary();
renderReportTable();
