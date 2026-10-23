
document.addEventListener("DOMContentLoaded", () => {
    const CUSTOMER_KEY = "popoyeCustomers";
    const REMINDER_KEY = "popoyeReminders";
    const ITEMS_PER_PAGE = 5;

    // Dashboard elements
    const totalReminders = document.getElementById("totalReminders");
    const upcomingReminders = document.getElementById("upcomingReminders");
    const sentReminders = document.getElementById("sentReminders");
    const overdueReminders = document.getElementById("overdueReminders");

    // Table, filters and pagination
    const remindersTable = document.getElementById("remindersTable");
    const reminderSearch = document.getElementById("reminderSearch");
    const reminderStatusFilter = document.getElementById("reminderStatusFilter");
    const resetReminderFilters = document.getElementById("resetReminderFilters");
    const reminderPageInfo = document.getElementById("reminderPageInfo");
    const previousReminderPage = document.getElementById("previousReminderPage");
    const nextReminderPage = document.getElementById("nextReminderPage");

    let currentPage = 1;

    function readStorage(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Unable to read local storage:", error);
            return [];
        }
    }

    function saveReminders(reminders) {
        localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
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

    function getCustomerName(customer) {
        return customer.name || customer.customerName || "Unknown Customer";
    }

    function getToday() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }

    function getExpiryDate(dateString) {
        if (!dateString) return null;

        const date = new Date(`${dateString}T00:00:00`);

        return Number.isNaN(date.getTime()) ? null : date;
    }

    function getAutomaticStatus(expiryDate) {
        const expiry = getExpiryDate(expiryDate);

        if (!expiry) return "Upcoming";

        if (expiry < getToday()) return "Overdue";

        return "Upcoming";
    }

    function getReminderStatus(reminder) {
        // Preserve manually marked sent reminders.
        if (reminder.status === "Sent") {
            return "Sent";
        }

        return getAutomaticStatus(reminder.expiryDate);
    }

    function formatDate(dateString) {
        const date = getExpiryDate(dateString);

        if (!date) return "Not provided";

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    // Generate reminders from the saved customer records.
    function syncReminders() {
        const customers = readStorage(CUSTOMER_KEY);
        const existingReminders = readStorage(REMINDER_KEY);

        const reminders = customers
            .filter(customer => customer.expiryDate)
            .map((customer, index) => {
                const customerId = String(customer.id ?? index);
                const expiryDate = customer.expiryDate;

                // Keep the same reminder when the customer and expiry date match.
                const existing = existingReminders.find(reminder =>
                    String(reminder.customerId) === customerId &&
                    reminder.expiryDate === expiryDate
                );

                return {
                    id: existing?.id || `REM-${customerId}-${expiryDate}`,
                    customerId,
                    customerName: getCustomerName(customer),
                    phone: customer.phone || customer.customerPhone || "",
                    vehicleNumber: customer.vehicleNumber || "",
                    expiryDate,
                    channel: existing?.channel || "WhatsApp",
                    status: existing?.status === "Sent"
                        ? "Sent"
                        : getAutomaticStatus(expiryDate),
                    sentAt: existing?.sentAt || null
                };
            });

        saveReminders(reminders);
        return reminders;
    }

    function renderStats(reminders) {
        totalReminders.textContent = reminders.length;

        upcomingReminders.textContent = reminders.filter(
            reminder => getReminderStatus(reminder) === "Upcoming"
        ).length;

        sentReminders.textContent = reminders.filter(
            reminder => getReminderStatus(reminder) === "Sent"
        ).length;

        overdueReminders.textContent = reminders.filter(
            reminder => getReminderStatus(reminder) === "Overdue"
        ).length;
    }

    function getFilteredReminders() {
        const searchTerm = (reminderSearch.value || "").trim().toLowerCase();
        const selectedStatus = reminderStatusFilter.value;

        return syncReminders().filter(reminder => {
            const status = getReminderStatus(reminder);

            const searchableText = [
                reminder.id,
                reminder.customerName,
                reminder.vehicleNumber,
                reminder.phone,
                reminder.channel
            ].join(" ").toLowerCase();

            return searchableText.includes(searchTerm) &&
                (!selectedStatus || status === selectedStatus);
        });
    }

    function renderReminders() {
        const allReminders = syncReminders();

        renderStats(allReminders);

        const filteredReminders = getFilteredReminders();
        const totalPages = Math.max(
            1,
            Math.ceil(filteredReminders.length / ITEMS_PER_PAGE)
        );

        currentPage = Math.min(currentPage, totalPages);

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageItems = filteredReminders.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE
        );

        if (pageItems.length === 0) {
            remindersTable.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:24px;">
                        No reminders found. Add customers with expiry dates first.
                    </td>
                </tr>`;
        } else {
            remindersTable.innerHTML = pageItems.map(reminder => {
                const status = getReminderStatus(reminder);
                const statusClass = status.toLowerCase();

                return `
                    <tr>
                        <td>${escapeHTML(reminder.id)}</td>
                        <td>${escapeHTML(reminder.customerName)}</td>
                        <td>${escapeHTML(reminder.vehicleNumber)}</td>
                        <td>${escapeHTML(formatDate(reminder.expiryDate))}</td>
                        <td>
                            <select
                                class="reminder-channel"
                                data-id="${escapeHTML(reminder.id)}"
                                aria-label="Reminder channel"
                            >
                                <option value="WhatsApp"
                                    ${reminder.channel === "WhatsApp" ? "selected" : ""}>
                                    WhatsApp
                                </option>
                                <option value="SMS"
                                    ${reminder.channel === "SMS" ? "selected" : ""}>
                                    SMS
                                </option>
                            </select>
                        </td>
                        <td>
                            <span class="status ${statusClass}">
                                ${escapeHTML(status)}
                            </span>
                        </td>
                        <td>
                            <button
                                type="button"
                                class="btn send-reminder-btn"
                                data-id="${escapeHTML(reminder.id)}"
                            >
                                ${status === "Sent" ? "Send Again" : "Send Reminder"}
                            </button>
                        </td>
                    </tr>`;
            }).join("");
        }

        reminderPageInfo.textContent =
            `Page ${currentPage} of ${totalPages} • ${filteredReminders.length} reminders`;

        previousReminderPage.disabled = currentPage <= 1;
        nextReminderPage.disabled = currentPage >= totalPages;
    }

    function saveReminderChannel(reminderId, channel) {
        const reminders = readStorage(REMINDER_KEY);
        const reminder = reminders.find(item => item.id === reminderId);

        if (!reminder) return;

        reminder.channel = channel;
        saveReminders(reminders);
    }

    function getPhoneNumber(phone) {
        // Accept numbers stored as 10-digit Indian mobile numbers or +91 numbers.
        let number = String(phone || "").replace(/\D/g, "");

        if (number.length === 10) {
            number = "91" + number;
        } else if (number.startsWith("0") && number.length === 11) {
            number = "91" + number.slice(1);
        }

        return number;
    }

    function buildMessage(reminder) {
        return `Hello ${reminder.customerName},

This is a renewal reminder from Popoye Insurance.

Vehicle Number: ${reminder.vehicleNumber}
Insurance Expiry Date: ${formatDate(reminder.expiryDate)}

Please contact Popoye Insurance to renew your two-wheeler insurance.

Thank you,
Popoye Insurance`;
    }

    function openReminder(reminder) {
        const phone = getPhoneNumber(reminder.phone);

        if (!phone || phone.length < 10 || phone.length > 15) {
            alert(
                "This customer does not have a valid phone number. " +
                "Please update the phone number on the Customers page."
            );
            return;
        }

        const message = buildMessage(reminder);
        let messageUrl;

        if (reminder.channel === "WhatsApp") {
            messageUrl =
                `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

            // Opens WhatsApp with the message prepared.
            // The user must press Send in WhatsApp.
            window.open(messageUrl, "_blank", "noopener,noreferrer");
        } else {
            // Opens a compatible SMS app where supported.
            messageUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
            window.location.href = messageUrl;
        }

        // Do not claim that a message was sent automatically.
        const markSent = window.confirm(
            `${reminder.channel} has been opened with a prepared message.\n\n` +
            "Did you actually send the message? Choose OK only after sending it."
        );

        if (markSent) {
            const reminders = readStorage(REMINDER_KEY);
            const selected = reminders.find(item => item.id === reminder.id);

            if (selected) {
                selected.status = "Sent";
                selected.sentAt = new Date().toISOString();
                saveReminders(reminders);
            }

            renderReminders();
            alert(
                "Reminder marked as Sent in this demo. " +
                "Delivery has not been verified by the website."
            );
        }
    }

    // Change WhatsApp/SMS channel for an individual reminder.
    remindersTable.addEventListener("change", event => {
        const select = event.target.closest(".reminder-channel");
        if (!select) return;

        saveReminderChannel(select.dataset.id, select.value);
        renderReminders();
    });

    // Send the selected reminder.
    remindersTable.addEventListener("click", event => {
        const button = event.target.closest(".send-reminder-btn");
        if (!button) return;

        const reminder = readStorage(REMINDER_KEY).find(
            item => item.id === button.dataset.id
        );

        if (!reminder) {
            alert("Reminder not found. Please refresh the page.");
            return;
        }

        openReminder(reminder);
    });

    // Search and filter.
    reminderSearch.addEventListener("input", () => {
        currentPage = 1;
        renderReminders();
    });

    reminderStatusFilter.addEventListener("change", () => {
        currentPage = 1;
        renderReminders();
    });

    resetReminderFilters.addEventListener("click", () => {
        reminderSearch.value = "";
        reminderStatusFilter.value = "";
        currentPage = 1;
        renderReminders();
    });

    // Pagination.
    previousReminderPage.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderReminders();
        }
    });

    nextReminderPage.addEventListener("click", () => {
        const totalPages = Math.max(
            1,
            Math.ceil(getFilteredReminders().length / ITEMS_PER_PAGE)
        );

        if (currentPage < totalPages) {
            currentPage++;
            renderReminders();
        }
    });

    // Initial load.
    syncReminders();
    renderReminders();
});
