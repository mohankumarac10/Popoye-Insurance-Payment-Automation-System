
document.addEventListener("DOMContentLoaded", () => {
    const POLICY_KEY = "popoyePolicies";
    const CUSTOMER_KEY = "popoyeCustomers";
    const PAGE_SIZE = 5;

    // Demo policies used when no policies have been saved yet.
    const demoPolicies = [
        {
            id: "POL1001",
            customer: "Arun Kumar",
            vehicle: "TN 38 AB 1234",
            type: "Comprehensive",
            premium: 2850,
            start: "2026-11-01",
            expiry: "2027-10-31"
        },
        {
            id: "POL1002",
            customer: "Priya S",
            vehicle: "TN 37 CD 5678",
            type: "Third Party",
            premium: 1250,
            start: "2025-11-01",
            expiry: "2026-10-28"
        },
        {
            id: "POL1003",
            customer: "Karthik R",
            vehicle: "TN 66 EF 9012",
            type: "Own Damage",
            premium: 1950,
            start: "2026-02-01",
            expiry: "2027-01-31"
        },
        {
            id: "POL1004",
            customer: "Divya M",
            vehicle: "TN 39 GH 3456",
            type: "Comprehensive",
            premium: 3200,
            start: "2025-09-01",
            expiry: "2026-09-30"
        },
        {
            id: "POL1005",
            customer: "Vijay P",
            vehicle: "TN 40 JK 7890",
            type: "Third Party",
            premium: 1100,
            start: "2026-08-01",
            expiry: "2027-07-31"
        },
        {
            id: "POL1006",
            customer: "Meena K",
            vehicle: "TN 41 LM 2345",
            type: "Comprehensive",
            premium: 2950,
            start: "2026-10-01",
            expiry: "2027-09-30"
        },
        {
            id: "POL1007",
            customer: "Suresh B",
            vehicle: "TN 42 NP 6789",
            type: "Own Damage",
            premium: 1750,
            start: "2025-08-01",
            expiry: "2026-08-31"
        },
        {
            id: "POL1008",
            customer: "Nisha R",
            vehicle: "TN 43 QR 1122",
            type: "Third Party",
            premium: 1350,
            start: "2026-10-15",
            expiry: "2027-10-14"
        }
    ];

    const policySearch = document.getElementById("policySearch");
    const typeFilter = document.getElementById("typeFilter");
    const statusFilter = document.getElementById("statusFilter");
    const policiesTable = document.getElementById("policiesTable");

    const totalPolicies = document.getElementById("totalPolicies");
    const activePolicies = document.getElementById("activePolicies");
    const expiringPolicies = document.getElementById("expiringPolicies");
    const expiredPolicies = document.getElementById("expiredPolicies");

    const policyPageInfo = document.getElementById("policyPageInfo");
    const previousPage = document.getElementById("previousPage");
    const nextPage = document.getElementById("nextPage");
    const resetFilters = document.getElementById("resetFilters");
    const exportPolicies = document.getElementById("exportPolicies");

    let currentPage = 1;

    function readStorage(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`Could not read ${key}:`, error);
            return [];
        }
    }

    function savePolicies(data) {
        localStorage.setItem(POLICY_KEY, JSON.stringify(data));
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

    function getToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    function parseDate(value) {
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return null;
        }

        const date = new Date(`${value}T00:00:00`);

        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== value
        ) {
            return null;
        }

        return date;
    }

    function formatDate(value) {
        const date = parseDate(value);

        if (!date) return "Not provided";

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    }

    // Calculate status using today's date.
    function getPolicyStatus(expiryDate) {
        const expiry = parseDate(expiryDate);

        if (!expiry) return "Expired";

        const daysRemaining = Math.round(
            (expiry.getTime() - getToday().getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysRemaining < 0) return "Expired";
        if (daysRemaining <= 30) return "Expiring Soon";

        return "Active";
    }

    function getCustomerName(customer) {
        return customer.name || customer.customerName || "";
    }

    function getCustomerVehicle(customer) {
        return customer.vehicleNumber || "";
    }

    // Create initial demo data only once.
    function loadPolicies() {
        const stored = readStorage(POLICY_KEY);

        if (localStorage.getItem(POLICY_KEY) === null) {
            savePolicies(demoPolicies);
            return [...demoPolicies];
        }

        return stored;
    }

    let policies = loadPolicies();

    // Add newly created customer records if their vehicles do not
    // already exist in the policy list.
    function syncCustomers() {
        const customers = readStorage(CUSTOMER_KEY);
        let changed = false;

        customers.forEach((customer, index) => {
            const vehicle = getCustomerVehicle(customer)
                .trim()
                .toUpperCase();

            if (!vehicle) return;

            const exists = policies.some(policy =>
                String(policy.vehicle || "").trim().toUpperCase() === vehicle
            );

            if (exists) return;

            const customerId = String(customer.id ?? index);
            const expiry = customer.expiryDate || "";
            const premium = Number(customer.premium) || 0;

            policies.push({
                id: `POL-CUS-${customerId}`,
                customer: getCustomerName(customer) || "Unknown Customer",
                vehicle,
                type: customer.policyType || "Third Party",
                premium,
                start: "",
                expiry,
                customerId
            });

            changed = true;
        });

        if (changed) {
            savePolicies(policies);
        }
    }

    function getFilteredPolicies() {
        const searchTerm = (policySearch.value || "").trim().toLowerCase();
        const selectedType = typeFilter.value;
        const selectedStatus = statusFilter.value;

        return policies.filter(policy => {
            const status = getPolicyStatus(policy.expiry);

            const searchValues = [
                policy.id,
                policy.customer,
                policy.vehicle,
                policy.type
            ];

            const matchesSearch = searchValues.some(value =>
                String(value || "").toLowerCase().includes(searchTerm)
            );

            const matchesType =
                !selectedType || policy.type === selectedType;

            const matchesStatus =
                !selectedStatus || status === selectedStatus;

            return matchesSearch && matchesType && matchesStatus;
        });
    }

    function updateStats() {
        totalPolicies.textContent = policies.length;

        activePolicies.textContent = policies.filter(
            policy => getPolicyStatus(policy.expiry) === "Active"
        ).length;

        expiringPolicies.textContent = policies.filter(
            policy => getPolicyStatus(policy.expiry) === "Expiring Soon"
        ).length;

        expiredPolicies.textContent = policies.filter(
            policy => getPolicyStatus(policy.expiry) === "Expired"
        ).length;
    }

    function renderPolicies() {
        updateStats();

        const filtered = getFilteredPolicies();
        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / PAGE_SIZE)
        );

        currentPage = Math.min(currentPage, totalPages);

        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const visible = filtered.slice(
            startIndex,
            startIndex + PAGE_SIZE
        );

        if (visible.length === 0) {
            policiesTable.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;padding:24px;">
                        No policies found.
                    </td>
                </tr>`;
        } else {
            policiesTable.innerHTML = visible.map(policy => {
                const status = getPolicyStatus(policy.expiry);

                const statusClass = {
                    "Active": "active",
                    "Expiring Soon": "pending",
                    "Expired": "expired"
                }[status];

                return `
                    <tr>
                        <td>${escapeHTML(policy.id)}</td>
                        <td>${escapeHTML(policy.customer)}</td>
                        <td>${escapeHTML(policy.vehicle)}</td>
                        <td>${escapeHTML(policy.type)}</td>
                        <td>${escapeHTML(formatCurrency(policy.premium))}</td>
                        <td>${escapeHTML(formatDate(policy.start))}</td>
                        <td>${escapeHTML(formatDate(policy.expiry))}</td>
                        <td>
                            <span class="status ${statusClass}">
                                ${escapeHTML(status)}
                            </span>
                        </td>
                    </tr>`;
            }).join("");
        }

        policyPageInfo.textContent =
            `Page ${currentPage} of ${totalPages} · ${filtered.length} policies`;

        previousPage.disabled = currentPage <= 1;
        nextPage.disabled = currentPage >= totalPages;
    }

    // Search and filters.
    policySearch.addEventListener("input", () => {
        currentPage = 1;
        renderPolicies();
    });

    typeFilter.addEventListener("change", () => {
        currentPage = 1;
        renderPolicies();
    });

    statusFilter.addEventListener("change", () => {
        currentPage = 1;
        renderPolicies();
    });

    resetFilters.addEventListener("click", () => {
        policySearch.value = "";
        typeFilter.value = "";
        statusFilter.value = "";
        currentPage = 1;
        renderPolicies();
    });

    // Pagination.
    previousPage.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderPolicies();
        }
    });

    nextPage.addEventListener("click", () => {
        const totalPages = Math.max(
            1,
            Math.ceil(getFilteredPolicies().length / PAGE_SIZE)
        );

        if (currentPage < totalPages) {
            currentPage++;
            renderPolicies();
        }
    });

    // Export filtered policies to CSV.
    if (exportPolicies) {
        exportPolicies.addEventListener("click", () => {
            const filtered = getFilteredPolicies();

            if (filtered.length === 0) {
                alert("There are no policies to export.");
                return;
            }

            const headers = [
                "Policy ID",
                "Customer",
                "Vehicle Number",
                "Policy Type",
                "Premium",
                "Start Date",
                "Expiry Date",
                "Status"
            ];

            const rows = filtered.map(policy => [
                policy.id,
                policy.customer,
                policy.vehicle,
                policy.type,
                policy.premium,
                policy.start,
                policy.expiry,
                getPolicyStatus(policy.expiry)
            ]);

            const csvCell = value =>
                `"${String(value ?? "").replace(/"/g, '""')}"`;

            const csv = [headers, ...rows]
                .map(row => row.map(csvCell).join(","))
                .join("\r\n");

            const blob = new Blob(["\uFEFF" + csv], {
                type: "text/csv;charset=utf-8;"
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = "popoye-insurance-policies.csv";

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        });
    }

    // Initial setup.
    syncCustomers();
    renderPolicies();
});
