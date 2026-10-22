
/* =====================================
   POPOYE INSURANCE - PAYMENTS JAVASCRIPT
   Demo only: no real money is collected
===================================== */

const PAYMENT_STORAGE_KEY = "popoye_demo_payments";

let payments = [];

const samplePayments = [
    {
        id: "PAY-DEMO-1001",
        customer: "Arun Kumar",
        vehicle: "TN 38 AB 1234",
        amount: 1850,
        dueDate: "2026-11-15",
        status: "Pending",
        token: "demo-arun-1001"
    },
    {
        id: "PAY-DEMO-1002",
        customer: "Priya S",
        vehicle: "TN 37 CD 5678",
        amount: 2100,
        dueDate: "2026-10-28",
        status: "Paid",
        token: "demo-priya-1002"
    },
    {
        id: "PAY-DEMO-1003",
        customer: "Karthik R",
        vehicle: "TN 40 EF 9012",
        amount: 1650,
        dueDate: "2026-10-30",
        status: "Pending",
        token: "demo-karthik-1003"
    }
];

document.addEventListener("DOMContentLoaded", () => {
    loadPayments();
    renderPayments();
    updatePaymentSummary();
    setupPaymentEvents();
});

function loadPayments() {
    try {
        const saved = localStorage.getItem(PAYMENT_STORAGE_KEY);

        if (saved !== null) {
            const parsed = JSON.parse(saved);
            payments = Array.isArray(parsed) ? parsed : [];
        } else {
            payments = samplePayments;
            savePayments();
        }
    } catch (error) {
        console.error("Unable to load payments:", error);
        payments = [];
    }
}

function savePayments() {
    try {
        localStorage.setItem(
            PAYMENT_STORAGE_KEY,
            JSON.stringify(payments)
        );
        return true;
    } catch (error) {
        console.error("Unable to save payments:", error);
        showPaymentMessage(
            "Unable to save data in this browser.",
            true
        );
        return false;
    }
}

function setupPaymentEvents() {
    const createButton = document.getElementById("createPaymentBtn");
    const cancelButton = document.getElementById("cancelPaymentBtn");
    const form = document.getElementById("paymentForm");
    const search = document.getElementById("paymentSearch");
    const filter = document.getElementById("paymentStatusFilter");

    if (createButton) {
        createButton.addEventListener("click", () => {
            const panel = document.getElementById("paymentFormPanel");

            if (panel) {
                panel.hidden = false;
                panel.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", resetPaymentForm);
    }

    if (form) {
        form.addEventListener("submit", createPayment);
    }

    if (search) {
        search.addEventListener("input", renderPayments);
    }

    if (filter) {
        filter.addEventListener("change", renderPayments);
    }
}

function createPayment(event) {
    event.preventDefault();

    const customer = getInputValue("paymentCustomer");
    const vehicle = getInputValue("paymentVehicle").toUpperCase();
    const amount = Number(getInputValue("paymentAmount"));
    const dueDate = getInputValue("paymentDueDate");
    const status = getInputValue("paymentStatus");

    if (
        !customer ||
        !vehicle ||
        !dueDate ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        showPaymentMessage("Please enter valid payment details.", true);
        return;
    }

    // Generate a unique demo ID and token
    const uniquePart =
        Date.now().toString(36).toUpperCase() +
        Math.random().toString(36).slice(2, 7).toUpperCase();

    const newPayment = {
        id: `PAY-${uniquePart}`,
        customer,
        vehicle,
        amount,
        dueDate,
        status,
        token: `demo-${uniquePart.toLowerCase()}`
    };

    payments.unshift(newPayment);

    if (!savePayments()) {
        payments.shift();
        return;
    }

    renderPayments();
    updatePaymentSummary();
    resetPaymentForm();

    showPaymentMessage(
        "Payment request created. Its link is for demo use only."
    );
}

function getInputValue(id) {
    const input = document.getElementById(id);
    return input ? input.value.trim() : "";
}

function renderPayments() {
    const tableBody = document.getElementById("paymentTableBody");

    if (!tableBody) return;

    const searchTerm = (
        document.getElementById("paymentSearch")?.value || ""
    ).trim().toLowerCase();

    const selectedStatus =
        document.getElementById("paymentStatusFilter")?.value || "All";

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = [
            payment.id,
            payment.customer,
            payment.vehicle
        ].some(value =>
            String(value || "").toLowerCase().includes(searchTerm)
        );

        const matchesStatus =
            selectedStatus === "All" ||
            payment.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    if (filteredPayments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">No payment records found.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filteredPayments.map(payment => {
        const paymentUrl = new URL(
            "payment.html",
            window.location.href
        );

        paymentUrl.searchParams.set("token", payment.token);

        return `
            <tr>
                <td>${escapeHTML(payment.id)}</td>
                <td>${escapeHTML(payment.customer)}</td>
                <td>${escapeHTML(payment.vehicle)}</td>
                <td>${formatCurrency(payment.amount)}</td>
                <td>${formatDate(payment.dueDate)}</td>
                <td>
                    <span class="badge ${getPaymentBadge(payment.status)}">
                        ${escapeHTML(payment.status)}
                    </span>
                </td>
                <td>
                    <button
                        type="button"
                        class="payment-link"
                        data-payment-url="${escapeHTML(paymentUrl.href)}"
                    >
                        Copy Demo Link
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    // Add click handlers to the generated link buttons
    tableBody.querySelectorAll("[data-payment-url]").forEach(button => {
        button.addEventListener("click", async () => {
            const link = button.dataset.paymentUrl;

            try {
                await navigator.clipboard.writeText(link);
                showPaymentMessage("Demo payment link copied.");
            } catch (error) {
                window.prompt("Copy this demo payment link:", link);
            }
        });
    });
}

function updatePaymentSummary() {
    const total = payments.length;

    const paidPayments = payments.filter(
        payment => payment.status === "Paid"
    );

    const pendingPayments = payments.filter(
        payment => payment.status === "Pending"
    );

    const collected = paidPayments.reduce(
        (sum, payment) => sum + (Number(payment.amount) || 0),
        0
    );

    setText("totalPaymentCount", total);
    setText("paidPaymentCount", paidPayments.length);
    setText("pendingPaymentCount", pendingPayments.length);
    setText("collectedAmount", formatCurrency(collected));
}

function getPaymentBadge(status) {
    if (status === "Paid") return "badge-paid";
    if (status === "Pending") return "badge-pending";
    return "";
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
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

function showPaymentMessage(message, isError = false) {
    const element = document.getElementById("paymentMessage");

    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#b91c1c" : "#15803d";
}

function resetPaymentForm() {
    const form = document.getElementById("paymentForm");
    const panel = document.getElementById("paymentFormPanel");

    if (form) form.reset();
    if (panel) panel.hidden = true;
}
