
/* =====================================
   POPOYE INSURANCE - TRANSACTIONS
   File: js/transactions.js
===================================== */

document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_KEY = "popoye_demo_payments";

    const totalElement = document.getElementById("transactionTotal");
    const paidElement = document.getElementById("transactionPaid");
    const pendingElement = document.getElementById("transactionPending");
    const amountElement = document.getElementById("transactionAmount");

    const searchInput = document.getElementById("transactionSearch");
    const statusFilter = document.getElementById("transactionStatusFilter");
    const tableBody = document.getElementById("transactionTableBody");
    const messageElement = document.getElementById("transactionMessage");
    const refreshButton = document.getElementById("refreshTransactions");

    function getPayments() {
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            const payments = storedData ? JSON.parse(storedData) : [];

            return Array.isArray(payments) ? payments : [];
        } catch (error) {
            console.error("Unable to read demo payments:", error);
            return [];
        }
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(amount) || 0);
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return "—";
        }

        const date = new Date(dateValue + "T00:00:00");

        if (Number.isNaN(date.getTime())) {
            return escapeHTML(dateValue);
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    // Prevent stored text from being interpreted as HTML.
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

    function getStatus(payment) {
        return String(payment.status || "Pending").toLowerCase() === "paid"
            ? "Paid"
            : "Pending";
    }

    function updateSummary(payments) {
        const paidPayments = payments.filter(function (payment) {
            return getStatus(payment) === "Paid";
        });

        const pendingPayments = payments.filter(function (payment) {
            return getStatus(payment) === "Pending";
        });

        const collectedAmount = paidPayments.reduce(function (total, payment) {
            return total + (Number(payment.amount) || 0);
        }, 0);

        totalElement.textContent = payments.length;
        paidElement.textContent = paidPayments.length;
        pendingElement.textContent = pendingPayments.length;
        amountElement.textContent = formatCurrency(collectedAmount);
    }

    function renderTransactions() {
        const payments = getPayments();

        updateSummary(payments);

        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        const filteredPayments = payments.filter(function (payment) {
            const status = getStatus(payment).toLowerCase();

            const searchableText = [
                payment.id,
                payment.customer,
                payment.vehicle,
                payment.amount
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);

            const matchesStatus =
                selectedStatus === "all" || status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        if (filteredPayments.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-transactions">
                        No transactions found. Try changing your search
                        or create a payment from the Payments page.
                    </td>
                </tr>
            `;

            messageElement.textContent =
                payments.length === 0
                    ? "No demo payment records found in this browser."
                    : "No transactions match your current filters.";

            return;
        }

        messageElement.textContent =
            "Showing " + filteredPayments.length + " of " +
            payments.length + " demo transactions.";

        tableBody.innerHTML = filteredPayments.map(function (payment) {
            const status = getStatus(payment);
            const statusClass = status.toLowerCase();

            return `
                <tr>
                    <td>
                        <span class="transaction-id">
                            ${escapeHTML(payment.id || "N/A")}
                        </span>
                    </td>

                    <td>${escapeHTML(payment.customer || "N/A")}</td>

                    <td>${escapeHTML(payment.vehicle || "N/A")}</td>

                    <td>${formatCurrency(payment.amount)}</td>

                    <td>${formatDate(payment.dueDate)}</td>

                    <td>
                        <span class="transaction-status ${statusClass}">
                            ${status}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    searchInput.addEventListener("input", renderTransactions);
    statusFilter.addEventListener("change", renderTransactions);
    refreshButton.addEventListener("click", renderTransactions);

    renderTransactions();
});
