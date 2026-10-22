
/* =====================================
   POPOYE INSURANCE
   Dashboard JavaScript
===================================== */

// Sample demo data.
// These are NOT real customer or payment records.

const dashboardData = {
    totalCustomers: 250,
    activePolicies: 186,
    pendingPayments: 32,
    premiumCollected: 245000
};

const recentTransactions = [
    {
        id: "DEMO-1001",
        customer: "Arun Kumar",
        vehicle: "TN 38 AB 1234",
        amount: 1850,
        date: "Sample date",
        status: "Paid (Demo)"
    },
    {
        id: "DEMO-1002",
        customer: "Priya S",
        vehicle: "TN 37 CD 5678",
        amount: 2100,
        date: "Sample date",
        status: "Pending"
    },
    {
        id: "DEMO-1003",
        customer: "Karthik R",
        vehicle: "TN 39 EF 9012",
        amount: 1650,
        date: "Sample date",
        status: "Failed (Demo)"
    }
];

// Format amounts using Indian currency notation.
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}

// Update a dashboard statistic safely.
function updateText(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }
}

// Display the dashboard statistics.
function loadDashboardStats() {
    updateText(
        "totalCustomers",
        dashboardData.totalCustomers.toLocaleString("en-IN")
    );

    updateText(
        "activePolicies",
        dashboardData.activePolicies.toLocaleString("en-IN")
    );

    updateText(
        "pendingPayments",
        dashboardData.pendingPayments.toLocaleString("en-IN")
    );

    updateText(
        "premiumCollected",
        formatCurrency(dashboardData.premiumCollected)
    );
}

// Choose a badge based on the transaction status.
function getStatusBadge(status) {
    if (status === "Paid (Demo)") {
        return '<span class="badge badge-success">Paid (Demo)</span>';
    }

    if (status === "Pending") {
        return '<span class="badge badge-warning">Pending</span>';
    }

    return '<span class="badge badge-danger">Failed (Demo)</span>';
}

// Display recent demo transactions.
function loadRecentTransactions() {
    const tableBody = document.getElementById("recentTransactions");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = recentTransactions.map(transaction => `
        <tr>
            <td>${transaction.id}</td>
            <td>${transaction.customer}</td>
            <td>${transaction.vehicle}</td>
            <td>${formatCurrency(transaction.amount)}</td>
            <td>${transaction.date}</td>
            <td>${getStatusBadge(transaction.status)}</td>
        </tr>
    `).join("");
}

// Run the dashboard when the page loads.
document.addEventListener("DOMContentLoaded", function () {
    loadDashboardStats();
    loadRecentTransactions();

    console.log("Popoye Insurance dashboard loaded in demo mode.");
});
