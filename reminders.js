
/* =====================================
   POPOYE INSURANCE - REMINDERS
   File: js/reminders.js
===================================== */

document.addEventListener("DOMContentLoaded", function () {
    const CUSTOMER_KEY = "popoye_demo_customers";
    const REMINDER_KEY = "popoye_demo_reminders";

    const customerSelect = document.getElementById("reminderCustomer");
    const reminderType = document.getElementById("reminderType");
    const messageInput = document.getElementById("reminderMessage");
    const reminderForm = document.getElementById("reminderForm");
    const generateButton = document.getElementById("generateReminderBtn");
    const searchInput = document.getElementById("reminderSearch");
    const filterSelect = document.getElementById("reminderFilter");
    const tableBody = document.getElementById("reminderTableBody");
    const formMessage = document.getElementById("reminderFormMessage");

    const totalElement = document.getElementById("reminderTotal");
    const dueSoonElement = document.getElementById("reminderDueSoon");
    const expiredElement = document.getElementById("reminderExpired");
    const preparedElement = document.getElementById("reminderPrepared");

    let customers = [];
    let reminders = [];

    function readStorage(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Unable to read browser data:", error);
            return [];
        }
    }

    function saveStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error("Unable to save browser data:", error);
            return false;
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
        if (!value) {
            return null;
        }

        const date = new Date(value + "T00:00:00");

        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatDate(value) {
        const date = parseDate(value);

        if (!date) {
            return "Not available";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function daysUntilExpiry(customer) {
        const expiry = parseDate(customer.expiry);

        if (!expiry) {
            return null;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return Math.round((expiry - today) / 86400000);
    }

    function getRenewalStatus(customer) {
        const days = daysUntilExpiry(customer);

        if (days === null) {
            return { label: "Unknown", className: "pending" };
        }

        if (days < 0) {
            return { label: "Expired", className: "expired" };
        }

        if (days <= 30) {
            return { label: "Due Soon", className: "upcoming" };
        }

        return { label: "Active", className: "active" };
    }

    function showMessage(text) {
        formMessage.textContent = text;
    }

    function loadCustomers() {
        customers = readStorage(CUSTOMER_KEY);

        customerSelect.innerHTML =
            '<option value="">Select a customer</option>';

        customers.forEach(function (customer, index) {
            const option = document.createElement("option");

            option.value = String(index);
            option.textContent =
                (customer.name || "Unnamed customer") +
                " — " + (customer.vehicle || "No vehicle");

            customerSelect.appendChild(option);
        });
    }

    function updateSummary() {
        const dueSoon = customers.filter(function (customer) {
            const days = daysUntilExpiry(customer);
            return days !== null && days >= 0 && days <= 30;
        });

        const expired = customers.filter(function (customer) {
            const days = daysUntilExpiry(customer);
            return days !== null && days < 0;
        });

        totalElement.textContent = customers.length;
        dueSoonElement.textContent = dueSoon.length;
        expiredElement.textContent = expired.length;
        preparedElement.textContent = reminders.length;
    }

    function createMessage(customer, type) {
        const name = customer.name || "Customer";
        const vehicle = customer.vehicle || "Not provided";
        const premium = formatCurrency(customer.premium);
        const expiry = formatDate(customer.expiry);

        if (type === "expired") {
            return [
                "Hello " + name + ",",
                "",
                "Your two-wheeler insurance for vehicle " + vehicle +
                    " shows an expiry date of " + expiry + ".",
                "Please contact Popoye Insurance to check your renewal options.",
                "",
                "Indicative premium in our demo record: " + premium,
                "",
                "Thank you,",
                "Popoye Insurance"
            ].join("\n");
        }

        if (type === "payment") {
            return [
                "Hello " + name + ",",
                "",
                "This is a reminder about the insurance renewal payment",
                "for your vehicle " + vehicle + ".",
                "Demo premium amount: " + premium,
                "",
                "Please contact Popoye Insurance if you need assistance.",
                "",
                "Thank you,",
                "Popoye Insurance"
            ].join("\n");
        }

        return [
            "Hello " + name + ",",
            "",
            "Your two-wheeler insurance for vehicle " + vehicle +
                " is due for renewal on " + expiry + ".",
            "Demo premium amount: " + premium,
            "",
            "Please contact Popoye Insurance to review your renewal.",
            "",
            "Thank you,",
            "Popoye Insurance"
        ].join("\n");
    }

    function generateMessage() {
        const index = customerSelect.value;

        if (index === "" || !customers[index]) {
            showMessage("Please select a customer first.");
            return;
        }

        const customer = customers[index];

        messageInput.value = createMessage(customer, reminderType.value);
        showMessage("Message preview generated. Review it before saving.");
    }

    function renderCustomers() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedFilter = filterSelect.value;

        const filteredCustomers = customers.filter(function (customer) {
            const status = getRenewalStatus(customer);
            const searchableText = [
                customer.name,
                customer.phone,
                customer.vehicle
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);

            let matchesFilter = true;

            if (selectedFilter === "upcoming") {
                const days = daysUntilExpiry(customer);
                matchesFilter = days !== null && days >= 0 && days <= 30;
            } else if (selectedFilter === "expired") {
                matchesFilter = status.className === "expired";
            }

            return matchesSearch && matchesFilter;
        });

        if (filteredCustomers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-reminders">
                        No matching customers found.
                        Add customer records from the Customers page first.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filteredCustomers.map(function (customer) {
            const status = getRenewalStatus(customer);
            const originalIndex = customers.indexOf(customer);

            return `
                <tr>
                    <td>${escapeHTML(customer.name || "N/A")}</td>
                    <td>${escapeHTML(customer.phone || "N/A")}</td>
                    <td>${escapeHTML(customer.vehicle || "N/A")}</td>
                    <td>${formatCurrency(customer.premium)}</td>
                    <td>${formatDate(customer.expiry)}</td>
                    <td>
                        <span class="renewal-status ${status.className}">
                            ${status.label}
                        </span>
                    </td>
                    <td>
                        <button
                            type="button"
                            class="reminder-action-btn"
                            data-customer-index="${originalIndex}">
                            Prepare
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    tableBody.addEventListener("click", function (event) {
        const button = event.target.closest("[data-customer-index]");

        if (!button) {
            return;
        }

        const index = Number(button.dataset.customerIndex);

        if (!Number.isInteger(index) || !customers[index]) {
            return;
        }

        customerSelect.value = String(index);

        const status = getRenewalStatus(customers[index]);

        if (status.className === "expired") {
            reminderType.value = "expired";
        } else {
            reminderType.value = "upcoming";
        }

        generateMessage();

        document.querySelector(".reminder-compose").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    generateButton.addEventListener("click", generateMessage);

    customerSelect.addEventListener("change", function () {
        if (customerSelect.value !== "") {
            generateMessage();
        }
    });

    reminderType.addEventListener("change", function () {
        if (customerSelect.value !== "") {
            generateMessage();
        }
    });

    searchInput.addEventListener("input", renderCustomers);
    filterSelect.addEventListener("change", renderCustomers);

    reminderForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const index = customerSelect.value;

        if (index === "" || !customers[index]) {
            showMessage("Please select a valid customer.");
            return;
        }

        const message = messageInput.value.trim();

        if (!message) {
            showMessage("Generate a message before saving.");
            return;
        }

        const customer = customers[index];

        const reminder = {
            id: "REM-" + Date.now(),
            customerName: customer.name || "Unnamed customer",
            vehicle: customer.vehicle || "",
            phone: customer.phone || "",
            type: reminderType.value,
            message: message,
            createdAt: new Date().toISOString(),
            status: "Prepared"
        };

        reminders.push(reminder);

        if (!saveStorage(REMINDER_KEY, reminders)) {
            reminders.pop();
            showMessage("Unable to save. Check browser storage settings.");
            return;
        }

        updateSummary();
        showMessage(
            "Reminder saved successfully in this browser. No WhatsApp message was sent."
        );
    });

    function refreshData() {
        customers = readStorage(CUSTOMER_KEY);
        reminders = readStorage(REMINDER_KEY);

        loadCustomers();
        updateSummary();
        renderCustomers();
    }

    refreshData();

    // Refresh the displayed records when returning to this browser tab.
    window.addEventListener("focus", refreshData);
});
