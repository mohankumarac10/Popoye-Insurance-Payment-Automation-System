
/* =====================================
   POPOYE INSURANCE - POLICIES JAVASCRIPT
   Demo version using localStorage
===================================== */

const POLICY_STORAGE_KEY = "popoye_demo_policies";
const CUSTOMER_STORAGE_KEY = "popoye_demo_customers";

let policies = [];

// Sample policies for first-time use
const samplePolicies = [
    {
        id: 1,
        number: "POL-1001",
        customer: "Arun Kumar",
        vehicle: "TN 38 AB 1234",
        provider: "ICICI Lombard",
        premium: 1850,
        expiry: "2026-11-15",
        status: "Active"
    },
    {
        id: 2,
        number: "POL-1002",
        customer: "Priya S",
        vehicle: "TN 37 CD 5678",
        provider: "Bajaj Allianz",
        premium: 2100,
        expiry: "2026-10-28",
        status: "Pending"
    },
    {
        id: 3,
        number: "POL-1003",
        customer: "Karthik R",
        vehicle: "TN 40 EF 9012",
        provider: "HDFC ERGO",
        premium: 1650,
        expiry: "2026-09-20",
        status: "Expired"
    }
];

// Start the page
document.addEventListener("DOMContentLoaded", () => {
    loadPolicies();
    renderPolicies();
    updatePolicyCounts();
    setupPolicyEvents();
});

// Load policies from browser storage
function loadPolicies() {
    try {
        const savedPolicies = localStorage.getItem(POLICY_STORAGE_KEY);

        if (savedPolicies !== null) {
            policies = JSON.parse(savedPolicies);

            if (!Array.isArray(policies)) {
                policies = [];
            }
        } else {
            policies = samplePolicies;
            savePolicies();
        }
    } catch (error) {
        console.error("Could not load policies:", error);
        policies = [];
    }
}

// Save policies to browser storage
function savePolicies() {
    try {
        localStorage.setItem(
            POLICY_STORAGE_KEY,
            JSON.stringify(policies)
        );
    } catch (error) {
        console.error("Could not save policies:", error);
        showPolicyMessage(
            "Could not save data in this browser.",
            true
        );
    }
}

// Connect buttons, form, search and filter
function setupPolicyEvents() {
    const addButton = document.getElementById("addPolicyBtn");
    const cancelButton = document.getElementById("cancelPolicyBtn");
    const form = document.getElementById("policyForm");
    const searchInput = document.getElementById("policySearch");
    const statusFilter = document.getElementById("policyStatusFilter");

    if (addButton) {
        addButton.addEventListener("click", () => {
            const panel = document.getElementById("policyFormPanel");

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
        cancelButton.addEventListener("click", resetPolicyForm);
    }

    if (form) {
        form.addEventListener("submit", addPolicy);
    }

    if (searchInput) {
        searchInput.addEventListener("input", renderPolicies);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", renderPolicies);
    }
}

// Add a new policy
function addPolicy(event) {
    event.preventDefault();

    const number = getValue("policyNumber").toUpperCase();
    const customer = getValue("policyCustomer");
    const vehicle = getValue("policyVehicle").toUpperCase();
    const provider = getValue("policyProvider");
    const premium = Number(getValue("policyPremium"));
    const expiry = getValue("policyExpiry");
    const status = getValue("policyStatus");

    if (
        !number ||
        !customer ||
        !vehicle ||
        !provider ||
        !expiry ||
        !Number.isFinite(premium) ||
        premium <= 0
    ) {
        showPolicyMessage("Please enter valid details in all fields.", true);
        return;
    }

    const duplicate = policies.some(
        policy => policy.number.toLowerCase() === number.toLowerCase()
    );

    if (duplicate) {
        showPolicyMessage("This policy number already exists.", true);
        return;
    }

    const newPolicy = {
        id: Date.now(),
        number,
        customer,
        vehicle,
        provider,
        premium,
        expiry,
        status
    };

    policies.unshift(newPolicy);
    savePolicies();

    renderPolicies();
    updatePolicyCounts();
    resetPolicyForm();

    showPolicyMessage("Policy added successfully.");
}

// Get a form field's value safely
function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
}

// Display policies in the table
function renderPolicies() {
    const tableBody = document.getElementById("policyTableBody");

    if (!tableBody) return;

    const search = (
        document.getElementById("policySearch")?.value || ""
    ).trim().toLowerCase();

    const selectedStatus =
        document.getElementById("policyStatusFilter")?.value || "All";

    const filteredPolicies = policies.filter(policy => {
        const matchesSearch = [
            policy.number,
            policy.customer,
            policy.vehicle,
            policy.provider
        ].some(value =>
            String(value || "").toLowerCase().includes(search)
        );

        const matchesStatus =
            selectedStatus === "All" ||
            policy.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    if (filteredPolicies.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">No policies found.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filteredPolicies.map(policy => `
        <tr>
            <td>${escapeHTML(policy.number)}</td>
            <td>${escapeHTML(policy.customer)}</td>
            <td>${escapeHTML(policy.vehicle)}</td>
            <td>${escapeHTML(policy.provider)}</td>
            <td>${formatCurrency(policy.premium)}</td>
            <td>${formatDate(policy.expiry)}</td>
            <td>
                <span class="badge ${getStatusClass(policy.status)}">
                    ${escapeHTML(policy.status)}
                </span>
            </td>
        </tr>
    `).join("");
}

// Update summary cards
function updatePolicyCounts() {
    const total = policies.length;
    const active = policies.filter(
        policy => policy.status === "Active"
    ).length;
    const pending = policies.filter(
        policy => policy.status === "Pending"
    ).length;
    const expired = policies.filter(
        policy => policy.status === "Expired"
    ).length;

    setText("totalPolicyCount", total);
    setText("activePolicyCount", active);
    setText("pendingPolicyCount", pending);
    setText("expiredPolicyCount", expired);
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

// Status badge styles
function getStatusClass(status) {
    switch (status) {
        case "Active":
            return "badge-active";
        case "Pending":
            return "badge-pending";
        case "Expired":
            return "badge-expired";
        default:
            return "";
    }
}

// Format premium amount
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(dateString);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// Prevent HTML from being interpreted as markup
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Show a message to the user
function showPolicyMessage(message, isError = false) {
    const messageElement = document.getElementById("policyMessage");

    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.style.color = isError ? "#b91c1c" : "#15803d";
}

// Reset and close the form
function resetPolicyForm() {
    const form = document.getElementById("policyForm");
    const panel = document.getElementById("policyFormPanel");

    if (form) {
        form.reset();
    }

    if (panel) {
        panel.hidden = true;
    }
}
