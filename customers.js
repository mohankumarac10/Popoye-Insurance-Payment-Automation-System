
/* ==========================================
   POPOYE INSURANCE - CUSTOMER MANAGEMENT
   ========================================== */

const STORAGE_KEY = "popoyeCustomers";
const ITEMS_PER_PAGE = 5;

let customers = [];
let currentPage = 1;

// Load customers from browser storage
function loadCustomers() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        customers = saved ? JSON.parse(saved) : [];

        if (!Array.isArray(customers)) {
            customers = [];
        }
    } catch (error) {
        customers = [];
    }
}

// Save customers
function saveCustomers() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

// Calculate status using policy expiry date
function getStatus(customer) {
    if (!customer.expiryDate) {
        return customer.status || "Active";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(customer.expiryDate + "T00:00:00");
    const daysLeft = Math.ceil(
        (expiry.getTime() - today.getTime()) / 86400000
    );

    if (daysLeft < 0) return "Expired";
    if (daysLeft <= 30) return "Due";

    return "Active";
}

// Update dashboard statistics
function updateStats() {
    const total = customers.length;
    const active = customers.filter(c => getStatus(c) === "Active").length;
    const due = customers.filter(c => getStatus(c) === "Due").length;
    const expired = customers.filter(c => getStatus(c) === "Expired").length;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("activeCount").textContent = active;
    document.getElementById("dueCount").textContent = due;
    document.getElementById("expiredCount").textContent = expired;
}

// Render customers table
function renderCustomers() {
    const tableContainer = document.getElementById("customerTable");

    const searchText = document.getElementById("searchInput")
        .value.toLowerCase().trim();

    const selectedStatus = document.getElementById("statusFilter").value;
    const selectedPolicy = document.getElementById("policyFilter").value;

    const filtered = customers.filter(customer => {
        const status = getStatus(customer);

        const searchableText = [
            customer.id,
            customer.name,
            customer.phone,
            customer.vehicleNumber
        ].join(" ").toLowerCase();

        return searchableText.includes(searchText) &&
            (!selectedStatus || status === selectedStatus) &&
            (!selectedPolicy || customer.policyType === selectedPolicy);
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / ITEMS_PER_PAGE)
    );

    currentPage = Math.min(currentPage, totalPages);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageCustomers = filtered.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    tableContainer.replaceChildren();

    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Vehicle Number</th>
                <th>Policy Type</th>
                <th>Premium</th>
                <th>Expiry Date</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    if (pageCustomers.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 8;
        cell.textContent = "No customers found.";
        cell.style.textAlign = "center";
        cell.style.padding = "24px";

        row.appendChild(cell);
        tbody.appendChild(row);
    } else {
        pageCustomers.forEach(customer => {
            const row = document.createElement("tr");
            const status = getStatus(customer);

            const values = [
                customer.id,
                customer.name,
                customer.phone,
                customer.vehicleNumber,
                customer.policyType,
                "₹" + Number(customer.premium || 0).toLocaleString("en-IN"),
                customer.expiryDate || "-",
                status
            ];

            values.forEach((value, index) => {
                const cell = document.createElement("td");
                cell.textContent = value || "-";

                if (index === 7) {
                    cell.classList.add(
                        "status-" + status.toLowerCase()
                    );
                }

                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });
    }

    tableContainer.appendChild(table);

    updateStats();
    renderPagination(filtered.length, totalPages);
}

// Render pagination buttons
function renderPagination(totalItems, totalPages) {
    const pagination = document.getElementById("pagination");
    const pageInfo = document.getElementById("pageInfo");

    pagination.replaceChildren();

    if (totalItems === 0) {
        pageInfo.textContent = "0 customers";
        return;
    }

    pageInfo.textContent =
        `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–` +
        `${Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of ${totalItems}`;

    function createButton(label, page, disabled = false) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.className = "btn";
        button.disabled = disabled;

        if (page === currentPage) {
            button.classList.add("btn-primary");
        }

        button.addEventListener("click", () => {
            currentPage = page;
            renderCustomers();
        });

        pagination.appendChild(button);
    }

    createButton("Previous", currentPage - 1, currentPage === 1);

    for (let page = 1; page <= totalPages; page++) {
        createButton(String(page), page);
    }

    createButton("Next", currentPage + 1, currentPage === totalPages);
}

// Open Add Customer form panel
function openCustomerForm() {
    const panel = document.getElementById("customerFormPanel");

    panel.hidden = false;
    panel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    document.getElementById("customerName").focus();
}

// Close Add Customer form panel
function closeCustomerForm() {
    document.getElementById("customerFormPanel").hidden = true;
    document.getElementById("customerForm").reset();
}

// Save new customer
function addCustomer(event) {
    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const vehicleNumber = document.getElementById("vehicleNumber")
        .value.trim().toUpperCase();
    const policyType = document.getElementById("policyType").value;
    const premium = Number(document.getElementById("premium").value);
    const expiryDate = document.getElementById("expiryDate").value;

    if (!name || !phone || !vehicleNumber || !expiryDate ||
        !Number.isFinite(premium) || premium <= 0) {
        alert("Please complete all fields with valid information.");
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        alert("Enter a valid 10-digit phone number.");
        return;
    }

    const duplicate = customers.some(customer =>
        customer.vehicleNumber.toUpperCase() === vehicleNumber
    );

    if (duplicate) {
        alert("This vehicle number already exists.");
        return;
    }

    const newCustomer = {
        id: "CUS" + Date.now(),
        name,
        phone,
        vehicleNumber,
        policyType,
        premium,
        expiryDate,
        status: "Active",
        createdAt: new Date().toISOString()
    };

    customers.unshift(newCustomer);

    saveCustomers();

    currentPage = 1;
    document.getElementById("searchInput").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("policyFilter").value = "";

    renderCustomers();
    closeCustomerForm();

    alert("Customer added successfully!");
}

// Reset search and filters
function resetFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("policyFilter").value = "";

    currentPage = 1;
    renderCustomers();
}

// Export customer data to CSV
function exportCSV() {
    if (customers.length === 0) {
        alert("No customers available to export.");
        return;
    }

    const headers = [
        "Customer ID",
        "Customer Name",
        "Phone",
        "Vehicle Number",
        "Policy Type",
        "Premium",
        "Expiry Date",
        "Status"
    ];

    const rows = customers.map(customer => [
        customer.id,
        customer.name,
        customer.phone,
        customer.vehicleNumber,
        customer.policyType,
        customer.premium,
        customer.expiryDate,
        getStatus(customer)
    ]);

    const escapeCSV = value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Popoye_Insurance_Customers.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// Connect all buttons and initialise the page
document.addEventListener("DOMContentLoaded", () => {
    loadCustomers();

    document.getElementById("addCustomerBtn")
        .addEventListener("click", openCustomerForm);

    document.getElementById("cancelBtn")
        .addEventListener("click", closeCustomerForm);

    document.getElementById("customerForm")
        .addEventListener("submit", addCustomer);

    document.getElementById("searchInput")
        .addEventListener("input", () => {
            currentPage = 1;
            renderCustomers();
        });

    document.getElementById("statusFilter")
        .addEventListener("change", () => {
            currentPage = 1;
            renderCustomers();
        });

    document.getElementById("policyFilter")
        .addEventListener("change", () => {
            currentPage = 1;
            renderCustomers();
        });

    document.getElementById("resetBtn")
        .addEventListener("click", resetFilters);

    document.getElementById("exportBtn")
        .addEventListener("click", exportCSV);

    renderCustomers();
});
