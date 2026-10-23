
document.addEventListener("DOMContentLoaded", () => {
    // Local storage keys
    const CUSTOMER_KEY = "popoyeCustomers";
    const PAYMENT_KEY = "popoyePayments";
    const ITEMS_PER_PAGE = 5;

    // Payment history elements
    const paymentsTable = document.getElementById("paymentsTable");
    const totalPayments = document.getElementById("totalPayments");
    const successfulPayments = document.getElementById("successfulPayments");
    const pendingPayments = document.getElementById("pendingPayments");
    const failedPayments = document.getElementById("failedPayments");

    const paymentSearch = document.getElementById("paymentSearch");
    const paymentStatusFilter = document.getElementById("paymentStatusFilter");
    const paymentMethodFilter = document.getElementById("paymentMethodFilter");
    const resetPaymentFilters = document.getElementById("resetPaymentFilters");

    const paymentPageInfo = document.getElementById("paymentPageInfo");
    const previousPaymentPage = document.getElementById("previousPaymentPage");
    const nextPaymentPage = document.getElementById("nextPaymentPage");
    const exportPayments = document.getElementById("exportPayments");

    // Make a payment form elements
    const makePaymentForm = document.getElementById("makePaymentForm");
    const payCustomer = document.getElementById("payCustomer");
    const payVehicle = document.getElementById("payVehicle");
    const payAmount = document.getElementById("payAmount");
    const makePaymentMessage = document.getElementById("makePaymentMessage");

    const paySummaryAmount = document.getElementById("paySummaryAmount");
    const paySummaryCustomer = document.getElementById("paySummaryCustomer");
    const paySummaryVehicle = document.getElementById("paySummaryVehicle");
    const paySummaryMethod = document.getElementById("paySummaryMethod");

    let currentPage = 1;

    function readStorage(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`Unable to read ${key}:`, error);
            return [];
        }
    }

    function savePayments(payments) {
        localStorage.setItem(PAYMENT_KEY, JSON.stringify(payments));
    }

    function getCustomers() {
        return readStorage(CUSTOMER_KEY);
    }

    function getPayments() {
        return readStorage(PAYMENT_KEY);
    }

    function getSelectedMethod() {
        const selected = document.querySelector(
            'input[name="paymentMethod"]:checked'
        );
        return selected ? selected.value : "UPI";
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(amount) || 0);
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

    function getVehicleNumber(customer) {
        return customer.vehicleNumber || "";
    }

    function showMessage(message, type = "info") {
        if (!makePaymentMessage) return;

        makePaymentMessage.textContent = message;
        makePaymentMessage.style.color =
            type === "error" ? "#dc2626" :
            type === "success" ? "#15803d" : "#555";
    }

    // Fill the customer dropdown from the Customers page
    function loadCustomerOptions() {
        if (!payCustomer) return;

        const customers = getCustomers();
        const previousValue = payCustomer.value;

        payCustomer.innerHTML = '<option value="">Select a customer</option>';

        customers.forEach((customer, index) => {
            const option = document.createElement("option");
            option.value = String(customer.id ?? index);
            option.textContent =
                `${getCustomerName(customer)} — ${getVehicleNumber(customer)}`;
            payCustomer.appendChild(option);
        });

        if (customers.some((customer, index) =>
            String(customer.id ?? index) === previousValue
        )) {
            payCustomer.value = previousValue;
        }
    }

    function updatePaymentSummary() {
        if (!payCustomer) return;

        const customers = getCustomers();
        const selectedIndex = customers.findIndex((customer, index) =>
            String(customer.id ?? index) === payCustomer.value
        );
        const customer = customers[selectedIndex];

        if (customer) {
            if (payVehicle) {
                payVehicle.value = getVehicleNumber(customer);
            }

            if (payAmount && !payAmount.dataset.edited) {
                payAmount.value = customer.premium ?? "";
            }

            if (paySummaryCustomer) {
                paySummaryCustomer.textContent = getCustomerName(customer);
            }

            if (paySummaryVehicle) {
                paySummaryVehicle.textContent =
                    getVehicleNumber(customer) || "Not provided";
            }
        } else {
            if (payVehicle) payVehicle.value = "";
            if (payAmount) {
                payAmount.value = "";
                delete payAmount.dataset.edited;
            }
            if (paySummaryCustomer) paySummaryCustomer.textContent = "—";
            if (paySummaryVehicle) paySummaryVehicle.textContent = "—";
        }

        if (paySummaryAmount) {
            paySummaryAmount.textContent =
                formatCurrency(payAmount?.value || 0);
        }

        if (paySummaryMethod) {
            paySummaryMethod.textContent = getSelectedMethod();
        }
    }

    // Update dashboard statistics
    function renderStats(payments) {
        if (totalPayments) {
            totalPayments.textContent = payments.length;
        }

        if (successfulPayments) {
            successfulPayments.textContent = payments.filter(
                payment => payment.status === "Successful"
            ).length;
        }

        if (pendingPayments) {
            pendingPayments.textContent = payments.filter(
                payment => payment.status === "Pending"
            ).length;
        }

        if (failedPayments) {
            failedPayments.textContent = payments.filter(
                payment => payment.status === "Failed"
            ).length;
        }
    }

    function getFilteredPayments() {
        const searchTerm = (paymentSearch?.value || "").trim().toLowerCase();
        const status = paymentStatusFilter?.value || "";
        const method = paymentMethodFilter?.value || "";

        return getPayments().filter(payment => {
            const searchableText = [
                payment.id,
                payment.customerName,
                payment.vehicleNumber,
                payment.method,
                payment.status
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);
            const matchesStatus = !status || payment.status === status;
            const matchesMethod = !method || payment.method === method;

            return matchesSearch && matchesStatus && matchesMethod;
        });
    }

    function renderPayments() {
        if (!paymentsTable) return;

        const allPayments = getPayments();
        const filteredPayments = getFilteredPayments();

        renderStats(allPayments);

        const totalPages = Math.max(
            1,
            Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)
        );

        currentPage = Math.min(currentPage, totalPages);

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const pagePayments = filteredPayments.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE
        );

        if (pagePayments.length === 0) {
            paymentsTable.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:24px;">
                        No payments found.
                    </td>
                </tr>`;
        } else {
            paymentsTable.innerHTML = pagePayments.map(payment => {
                const statusClass = String(payment.status || "Pending")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-");

                return `
                    <tr>
                        <td>${escapeHTML(payment.id)}</td>
                        <td>${escapeHTML(payment.customerName)}</td>
                        <td>${escapeHTML(payment.vehicleNumber)}</td>
                        <td>${escapeHTML(formatCurrency(payment.amount))}</td>
                        <td>${escapeHTML(payment.method)}</td>
                        <td>${escapeHTML(payment.date)}</td>
                        <td>
                            <span class="status ${statusClass}">
                                ${escapeHTML(payment.status)}
                            </span>
                        </td>
                    </tr>`;
            }).join("");
        }

        if (paymentPageInfo) {
            paymentPageInfo.textContent =
                `Page ${currentPage} of ${totalPages} • ${filteredPayments.length} payments`;
        }

        if (previousPaymentPage) {
            previousPaymentPage.disabled = currentPage <= 1;
        }

        if (nextPaymentPage) {
            nextPaymentPage.disabled = currentPage >= totalPages;
        }
    }

    // Record a demo payment (not a real money transfer)
    if (makePaymentForm) {
        makePaymentForm.addEventListener("submit", event => {
            event.preventDefault();

            const customers = getCustomers();
            const selectedIndex = customers.findIndex((customer, index) =>
                String(customer.id ?? index) === payCustomer?.value
            );
            const customer = customers[selectedIndex];

            const amount = Number(payAmount?.value);
            const vehicleNumber = (payVehicle?.value || "").trim().toUpperCase();
            const method = getSelectedMethod();

            if (!customer) {
                showMessage("Please select a customer.", "error");
                return;
            }

            if (!vehicleNumber) {
                showMessage("Please enter the vehicle number.", "error");
                return;
            }

            if (!Number.isFinite(amount) || amount <= 0) {
                showMessage("Enter a valid premium amount.", "error");
                return;
            }

            if (!["UPI", "Card", "Net Banking"].includes(method)) {
                showMessage("Please select a valid payment method.", "error");
                return;
            }

            const payments = getPayments();

            const payment = {
                id: "PAY-" + Date.now(),
                customerId: customer.id ?? String(selectedIndex),
                customerName: getCustomerName(customer),
                vehicleNumber,
                amount,
                method,
                date: new Date().toLocaleString("en-IN"),
                status: "Pending",
                demo: true
            };

            payments.unshift(payment);
            savePayments(payments);

            makePaymentForm.reset();
            if (payAmount) delete payAmount.dataset.edited;

            loadCustomerOptions();
            updatePaymentSummary();
            currentPage = 1;
            renderPayments();

            showMessage(
                "Demo payment record created as Pending. No money was transferred.",
                "success"
            );
        });
    }

    // Update summary when form values change
    if (payCustomer) {
        payCustomer.addEventListener("change", () => {
            if (payAmount) delete payAmount.dataset.edited;
            updatePaymentSummary();
        });
    }

    if (payAmount) {
        payAmount.addEventListener("input", () => {
            payAmount.dataset.edited = "true";
            updatePaymentSummary();
        });
    }

    if (payVehicle) {
        payVehicle.addEventListener("input", updatePaymentSummary);
    }

    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
        input.addEventListener("change", updatePaymentSummary);
    });

    // Search and filters
    [paymentSearch, paymentStatusFilter, paymentMethodFilter].forEach(input => {
        if (!input) return;

        input.addEventListener("input", () => {
            currentPage = 1;
            renderPayments();
        });

        input.addEventListener("change", () => {
            currentPage = 1;
            renderPayments();
        });
    });

    if (resetPaymentFilters) {
        resetPaymentFilters.addEventListener("click", () => {
            if (paymentSearch) paymentSearch.value = "";
            if (paymentStatusFilter) paymentStatusFilter.value = "";
            if (paymentMethodFilter) paymentMethodFilter.value = "";

            currentPage = 1;
            renderPayments();
        });
    }

    // Pagination
    if (previousPaymentPage) {
        previousPaymentPage.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderPayments();
            }
        });
    }

    if (nextPaymentPage) {
        nextPaymentPage.addEventListener("click", () => {
            const totalPages = Math.max(
                1,
                Math.ceil(getFilteredPayments().length / ITEMS_PER_PAGE)
            );

            if (currentPage < totalPages) {
                currentPage++;
                renderPayments();
            }
        });
    }

    // Export all filtered payments to CSV
    if (exportPayments) {
        exportPayments.addEventListener("click", () => {
            const payments = getFilteredPayments();

            if (payments.length === 0) {
                showMessage("There are no payments to export.", "error");
                return;
            }

            const headers = [
                "Payment ID",
                "Customer",
                "Vehicle Number",
                "Amount",
                "Method",
                "Date",
                "Status",
                "Demo"
            ];

            const rows = payments.map(payment => [
                payment.id,
                payment.customerName,
                payment.vehicleNumber,
                payment.amount,
                payment.method,
                payment.date,
                payment.status,
                payment.demo ? "Yes" : "No"
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
            link.download = "popoye-payments.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        });
    }

    // Initial page setup
    loadCustomerOptions();
    updatePaymentSummary();
    renderPayments();
});
