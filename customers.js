
/* =====================================
   POPOYE INSURANCE
   Customers Management
===================================== */

// DEMO ONLY: Data is stored in this browser.
// Do not use real customer data in production.

const CUSTOMER_STORAGE_KEY = "popoye_demo_customers";

const sampleCustomers = [
    {
        id: "CUS-1001",
        name: "Arun Kumar",
        phone: "9000000001",
        vehicle: "TN 38 AB 1234",
        premium: 1850,
        expiry: "2026-11-15",
        status: "Active"
    },
    {
        id: "CUS-1002",
        name: "Priya S",
        phone: "9000000002",
        vehicle: "TN 37 CD 5678",
        premium: 2100,
        expiry: "2026-10-28",
        status: "Pending"
    },
    {
        id: "CUS-1003",
        name: "Karthik R",
        phone: "9000000003",
        vehicle: "TN 39 EF 9012",
        premium: 1650,
        expiry: "2026-09-30",
        status: "Expired"
    },
    {
        id: "CUS-1004",
        name: "Divya M",
        phone: "9000000004",
        vehicle: "TN 40 GH 3456",
        premium: 1950,
        expiry: "2026-12-10",
        status: "Active"
    },
    {
        id: "CUS-1005",
        name: "Vijay S",
        phone: "9000000005",
        vehicle: "TN 41 JK 7890",
        premium: 2250,
        expiry: "2026-11-02",
        status: "Pending"
    }
];

let customers = loadCustomers();

// Get customer data from browser storage.
function loadCustomers() {
    try {
        const savedData = localStorage.getItem(CUSTOMER_STORAGE_KEY);

        if (savedData !== null) {
            const parsedData = JSON.parse(savedData);

            if (Array.isArray(parsedData)) {
                return parsedData;
            }
        }
    } catch (error) {
        console.error("Could not load customer records:", error);
    }

    return sampleCustomers.map(customer => ({ ...customer }));
}

// Save data in this browser only.
function saveCustomers() {
    try {
        localStorage.setItem(
            CUSTOMER_STORAGE_KEY,
            JSON.stringify(customers)
        );
        return true;
    } catch (error) {
        console.error("Could not save customer records:", error);
        showMessage("Could not save records in this browser.", true);
        return false;
    }
}

// Format Indian currency.
function formatCustomerCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}

// Display a status message.
function showMessage(message, isError = false) {
    const messageBox = document.getElementById("customerMessage");

    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.style.background = isError ? "#ffebeb" : "#e7f8ef";
    messageBox.style.color = isError ? "#b42318" : "#087443";
}

// Convert policy status to a safe CSS class.
function getCustomerStatusClass(status) {
    if (status === "Active") return "badge-success";
    if (status === "Pending") return "badge-warning";
    return "badge-danger";
}

// Format an ISO date for display.
function formatExpiryDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return "Invalid date";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// Update the summary cards.
function updateCustomerSummary() {
    const total = customers.length;
    const active = customers.filter(
        customer => customer.status === "Active"
    ).length;

    const pending = customers.filter(
        customer => customer.status === "Pending"
    ).length;

    document.getElementById("customerCount").textContent = total;
    document.getElementById("activeCustomerCount").textContent = active;
    document.getElementById("pendingCustomerCount").textContent = pending;
}

// Search and filter customers.
function renderCustomers() {
    const tableBody = document.getElementById("customerTableBody");
    const searchInput = document.getElementById("customerSearch");
    const statusFilter = document.getElementById("statusFilter");

    if (!tableBody || !searchInput || !statusFilter) return;

    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = [
            customer.name,
            customer.phone,
            customer.vehicle
        ].some(value =>
            String(value).toLowerCase().includes(searchTerm)
        );

        const matchesStatus =
            selectedStatus === "All" ||
            customer.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    if (filteredCustomers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">No matching customers found.</td>
            </tr>
        `;
        return;
    }

    // Build table rows with DOM methods to avoid inserting
    // customer-entered text as HTML.
    tableBody.replaceChildren();

    filteredCustomers.forEach(customer => {
        const row = document.createElement("tr");

        const values = [
            customer.name,
            customer.phone,
            customer.vehicle,
            formatCustomerCurrency(customer.premium),
            formatExpiryDate(customer.expiry)
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");

        statusBadge.className =
            "badge " + getCustomerStatusClass(customer.status);

        statusBadge.textContent =
            customer.status === "Pending"
                ? "Renewal Pending"
                : customer.status;

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        tableBody.appendChild(row);
    });
}

// Open the Add Customer form.
function openCustomerForm() {
    const panel = document.getElementById("customerFormPanel");

    panel.hidden = false;
    document.getElementById("customerName").focus();

    panel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Close and reset the form.
function closeCustomerForm() {
    document.getElementById("customerForm").reset();
    document.getElementById("customerFormPanel").hidden = true;
}

// Add a customer record.
function handleCustomerSubmit(event) {
    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const vehicle = document.getElementById("vehicleNumber").value
        .trim().toUpperCase();
    const premium = Number(document.getElementById("premiumAmount").value);
    const expiry = document.getElementById("expiryDate").value;
    const status = document.getElementById("policyStatus").value;

    if (!name || !/^[0-9]{10}$/.test(phone)) {
        showMessage("Enter a name and a valid 10-digit phone number.", true);
        return;
    }

    if (!/^[A-Z0-9 -]{5,15}$/.test(vehicle)) {
        showMessage("Enter a valid vehicle registration format.", true);
        return;
    }

    if (!Number.isFinite(premium) || premium <= 0) {
        showMessage("Enter a premium amount greater than zero.", true);
        return;
    }

    if (!expiry || Number.isNaN(Date.parse(expiry))) {
        showMessage("Select a valid insurance expiry date.", true);
        return;
    }

    const duplicateVehicle = customers.some(
        customer => customer.vehicle.toUpperCase() === vehicle
    );

    if (duplicateVehicle) {
        showMessage(
            "This vehicle number already exists in the demo records.",
            true
        );
        return;
    }

    const newCustomer = {
        id: "CUS-" + Date.now(),
        name,
        phone,
        vehicle,
        premium,
        expiry,
        status
    };

    customers.push(newCustomer);

    if (!saveCustomers()) {
        customers.pop();
        return;
    }

    document.getElementById("customerSearch").value = "";
    document.getElementById("statusFilter").value = "All";

    updateCustomerSummary();
    renderCustomers();
    closeCustomerForm();

    showMessage("Demo customer added successfully.");
}

// Set up the page.
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("addCustomerBtn")
        .addEventListener("click", openCustomerForm);

    document.getElementById("cancelCustomerBtn")
        .addEventListener("click", closeCustomerForm);

    document.getElementById("customerForm")
        .addEventListener("submit", handleCustomerSubmit);

    document.getElementById("customerSearch")
        .addEventListener("input", renderCustomers);

    document.getElementById("statusFilter")
        .addEventListener("change", renderCustomers);

    // Save initial sample records the first time.
    if (localStorage.getItem(CUSTOMER_STORAGE_KEY) === null) {
        saveCustomers();
    }

    updateCustomerSummary();
    renderCustomers();

    console.log("Customers page loaded in demo mode.");
});
