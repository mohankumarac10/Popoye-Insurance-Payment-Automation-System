
/* =====================================
   POPOYE INSURANCE - RECEIPT PAGE
   File: js/receipt.js
===================================== */

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    const STORAGE_KEY = "popoye_demo_payments";

    const message = document.getElementById("receiptMessage");
    const receiptStatus = document.getElementById("receiptStatus");
    const amountElement = document.getElementById("receiptAmount");
    const referenceElement = document.getElementById("receiptReference");
    const customerElement = document.getElementById("receiptCustomer");
    const vehicleElement = document.getElementById("receiptVehicle");
    const dueDateElement = document.getElementById("receiptDueDate");
    const paymentStatusElement = document.getElementById("receiptPaymentStatus");
    const paymentDateElement = document.getElementById("receiptPaymentDate");
    const printButton = document.getElementById("printReceiptBtn");

    function getPayments() {
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            const payments = storedData ? JSON.parse(storedData) : [];
            return Array.isArray(payments) ? payments : [];
        } catch (error) {
            console.error("Unable to load demo payments:", error);
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
            return "Not available";
        }

        const date = new Date(dateValue + "T00:00:00");

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function setText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }

    function showError(text) {
        setText(message, text);
        setText(receiptStatus, "Receipt unavailable");
        setText(amountElement, "—");

        if (printButton) {
            printButton.disabled = true;
        }
    }

    function loadReceipt() {
        if (!token) {
            showError(
                "No payment reference was provided. Please open the receipt using your payment link."
            );
            return;
        }

        const payments = getPayments();

        const payment = payments.find(function (item) {
            return item.token === token;
        });

        if (!payment) {
            showError(
                "Payment record not found in this browser. Open the original demo payment link on the same browser where the payment record was created."
            );
            return;
        }

        const isPaid = String(payment.status).toLowerCase() === "paid";

        setText(
            message,
            isPaid
                ? "Demo payment status: Paid"
                : "This payment has not been marked as paid."
        );

        setText(
            receiptStatus,
            isPaid ? "DEMO PAYMENT — PAID" : "PAYMENT PENDING"
        );

        setText(amountElement, formatCurrency(payment.amount));
        setText(referenceElement, payment.id || "Not available");
        setText(customerElement, payment.customer || "Not available");
        setText(vehicleElement, payment.vehicle || "Not available");
        setText(dueDateElement, formatDate(payment.dueDate));
        setText(paymentStatusElement, isPaid ? "Paid (Demo)" : "Pending");

        // This is a local demo timestamp, not a gateway-confirmed payment date.
        const demoPaymentDate = isPaid
            ? payment.paidAt || "Recorded in demo"
            : "Not paid";

        setText(paymentDateElement, demoPaymentDate);

        if (printButton) {
            printButton.disabled = false;
        }
    }

    if (printButton) {
        printButton.addEventListener("click", function () {
            window.print();
        });
    }

    loadReceipt();
});
