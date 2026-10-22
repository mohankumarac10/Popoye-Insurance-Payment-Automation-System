
/* =====================================
   POPOYE INSURANCE - REPORTS & ANALYTICS
   File: js/reports.js
===================================== */

document.addEventListener("DOMContentLoaded", function () {
    const CUSTOMER_KEY = "popoye_demo_customers";
    const POLICY_KEY = "popoye_demo_policies";
    const PAYMENT_KEY = "popoye_demo_payments";

    const customerCount = document.getElementById("reportCustomers");
    const policyCount = document.getElementById("reportPolicies");
    const paidCount = document.getElementById("reportPaidCount");
    const collection = document.getElementById("reportCollection");

    const paidAmount = document.getElementById("reportPaidAmount");
    const pendingAmount = document.getElementById("reportPendingAmount");

    const paidProgress = document.getElementById("reportPaidProgress");
    const pendingProgress = document.getElementById("reportPendingProgress");

    const activeRenewals = document.getElementById("reportActiveRenewals");
    const dueRenewals = document.getElementById("reportDueRenewals");
    const expiredRenewals = document.getElementById("reportExpiredRenewals");

    const activeProgress = document.getElementById("reportActiveProgress");
    const dueProgress = document.getElementById("reportDueProgress");
    const expiredProgress = document.getElementById("reportExpiredProgress");

    const paymentNote = document.getElementById("paymentReportNote");
    const searchInput = document.getElementById("reportSearch");
    const statusFilter = document.getElementById("reportStatusFilter");
    const tableBody = document.getElementById("reportsTableBody");
    const message = document.getElementById("reportsMessage");

    const refreshButton = document.getElementById("refreshReports");
    const exportButton = document.getElementById("exportReports");

    let customers = [];
    let policies = [];
    let payments = [];

    function readStorage(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(value) ? value : [];
        } catch (error) {
            console.error("Unable to read report data:", error);
            return [];
        }
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(amount) || 0);
    }

    function parseDate(value) {
        if (!value) return null;

        const date = new Date(value + "T00:00:00");
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDate(value) {
        const date = parseDate(value);

        if (!date) return "—";

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function getPaymentStatus(payment) {
        return String(payment.status || "").toLowerCase() === "paid"
            ? "Paid"
            : "Pending";
    }

    function getRenewalStatus(customer) {
        const expiry = parseDate(customer.expiry);

        if (!expiry) return "unknown";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days = Math.round((expiry - today) / 86400000);

        if (days < 0) return "expired";
        if (days <= 30) return "due";
        return "active";
    }

    function setProgress(element, percentage) {
        element.style.width = Math.max(0, Math.min(100, percentage)) + "%";
    }

    function updateOverview() {
        const paidPayments = payments.filter(function (payment) {
            return getPaymentStatus(payment) === "Paid";
        });

        const pendingPayments = payments.filter(function (payment) {
            return getPaymentStatus(payment) === "Pending";
        });

        const collected = paidPayments.reduce(function (sum, payment) {
            return sum + (Number(payment.amount) || 0);
        }, 0);

        const pendingTotal = pendingPayments.reduce(function (sum, payment) {
            return sum + (Number(payment.amount) || 0);
        }, 0);

        customerCount.textContent = customers.length;
        policyCount.textContent = policies.length;
        paidCount.textContent = paidPayments.length;
        collection.textContent = formatCurrency(collected);

        paidAmount.textContent = formatCurrency(collected);
        pendingAmount.textContent = formatCurrency(pendingTotal);

        const totalPaymentAmount = collected + pendingTotal;

        const paidPercentage = totalPaymentAmount > 0
            ? (collected / totalPaymentAmount) * 100
            : 0;

        const pendingPercentage = totalPaymentAmount > 0
            ? (pendingTotal / totalPaymentAmount) * 100
            : 0;

        setProgress(paidProgress, paidPercentage);
        setProgress(pendingProgress, pendingPercentage);

        paymentNote.textContent =
            payments.length + " payment records found in this browser. " +
            "These amounts reflect demo statuses only.";

        const active = customers.filter(function (customer) {
            return getRenewalStatus(customer) === "active";
        }).length;

        const due = customers.filter(function (customer) {
            return getRenewalStatus(customer) === "due";
        }).length;

        const expired = customers.filter(function (customer) {
            return getRenewalStatus(customer) === "expired";
        }).length;

        activeRenewals.textContent = active;
        dueRenewals.textContent = due;
        expiredRenewals.textContent = expired;

        const validRenewalCount = active + due + expired;

        setProgress(
            activeProgress,
            validRenewalCount ? (active / validRenewalCount) * 100 : 0
        );

        setProgress(
            dueProgress,
            validRenewalCount ? (due / validRenewalCount) * 100 : 0
        );

        setProgress(
            expiredProgress,
            validRenewalCount ? (expired / validRenewalCount) * 100 : 0
        );
    }

    function renderPayments() {
        const term = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        const filtered = payments.filter(function (payment) {
            const searchable = [
                payment.id,
                payment.customer,
                payment.vehicle,
                payment.amount
            ].join(" ").toLowerCase();

            const status = getPaymentStatus(payment).toLowerCase();

            return searchable.includes(term) &&
                (selectedStatus === "all" || status === selectedStatus);
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-reports">
                        No matching payment records found.
                    </td>
                </tr>
            `;

            message.textContent = payments.length === 0
                ? "No demo payment records are available."
                : "No records match your search or filter.";

            return;
        }

        message.textContent =
            "Showing " + filtered.length + " of " + payments.length +
            " demo payment records.";

        tableBody.innerHTML = filtered.map(function (payment) {
            const status = getPaymentStatus(payment);

            return `
                <tr>
                    <td>
                        <span class="report-payment-id">
                            ${escapeHTML(payment.id || "N/A")}
                        </span>
                    </td>

                    <td>${escapeHTML(payment.customer || "N/A")}</td>
                    <td>${escapeHTML(payment.vehicle || "N/A")}</td>
                    <td>${formatCurrency(payment.amount)}</td>
                    <td>${formatDate(payment.dueDate)}</td>

                    <td>
                        <span class="report-status ${status.toLowerCase()}">
                            ${status}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    function escapeCSV(value) {
        let text = String(value ?? "");

        // Avoid spreadsheet formula execution for text fields.
        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return '"' + text.replace(/"/g, '""') + '"';
    }

    function exportCSV() {
        const term = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        const filtered = payments.filter(function (payment) {
            const searchable = [
                payment.id,
                payment.customer,
                payment.vehicle,
                payment.amount
            ].join(" ").toLowerCase();

            const status = getPaymentStatus(payment).toLowerCase();

            return searchable.includes(term) &&
                (selectedStatus === "all" || status === selectedStatus);
        });

        if (filtered.length === 0) {
            message.textContent = "There are no records to export.";
            return;
        }

        const rows = [
            [
                "Payment ID",
                "Customer",
                "Vehicle Number",
                "Amount (INR)",
                "Due Date",
                "Status"
            ]
        ];

        filtered.forEach(function (payment) {
            rows.push([
                payment.id || "",
                payment.customer || "",
                payment.vehicle || "",
                Number(payment.amount) || 0,
                payment.dueDate || "",
                getPaymentStatus(payment)
            ]);
        });

        const csv = rows.map(function (row) {
            return row.map(escapeCSV).join(",");
        }).join("\r\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "popoye-insurance-payment-report.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        message.textContent = "CSV report exported successfully.";
    }

    function refreshReports() {
        customers = readStorage(CUSTOMER_KEY);
        policies = readStorage(POLICY_KEY);
        payments = readStorage(PAYMENT_KEY);

        updateOverview();
        renderPayments();
    }

    searchInput.addEventListener("input", renderPayments);
    statusFilter.addEventListener("change", renderPayments);
    refreshButton.addEventListener("click", refreshReports);
    exportButton.addEventListener("click", exportCSV);

    window.addEventListener("focus", refreshReports);

    refreshReports();
});
