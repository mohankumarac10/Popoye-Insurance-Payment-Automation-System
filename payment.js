
/* =====================================
   POPOYE INSURANCE - CUSTOMER PAYMENT
   DEMO ONLY - NO REAL MONEY TRANSFER
===================================== */

const PAYMENT_STORAGE_KEY = "popoye_demo_payments";

let currentPayment = null;

document.addEventListener("DOMContentLoaded", () => {
    loadCustomerPayment();

    const payButton = document.getElementById("payNowBtn");

    if (payButton) {
        payButton.addEventListener("click", simulatePayment);
    }
});

function loadCustomerPayment() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        showMessage(
            "Payment link is missing its reference token. Please request a valid demo payment link.",
            true
        );
        disablePayButton();
        return;
    }

    let payments;

    try {
        const storedPayments = localStorage.getItem(PAYMENT_STORAGE_KEY);

        if (storedPayments === null) {
            showMessage(
                "No payment records were found in this browser. Create a payment request from the admin Payments page first.",
                true
            );
            disablePayButton();
            return;
        }

        payments = JSON.parse(storedPayments);

        if (!Array.isArray(payments)) {
            throw new Error("Invalid payment data.");
        }
    } catch (error) {
        console.error("Unable to read payment records:", error);

        showMessage(
            "Unable to load payment information. Please check the demo data.",
            true
        );
        disablePayButton();
        return;
    }

    currentPayment = payments.find(payment => payment.token === token);

    if (!currentPayment) {
        showMessage(
            "This payment link is invalid or the payment record was not found.",
            true
        );
        disablePayButton();
        return;
    }

    displayPaymentDetails(currentPayment);

    if (currentPayment.status === "Paid") {
        showMessage(
            "This demo payment is already marked as paid. No further payment action is available."
        );
        disablePayButton();
    } else if (currentPayment.status === "Pending") {
        showMessage(
            "Your payment details are ready. You can continue with the simulated demo payment."
        );
        enablePayButton();
    } else {
        showMessage(
            "This payment is not available for demo payment processing.",
            true
        );
        disablePayButton();
    }
}

function displayPaymentDetails(payment) {
    setText("customerPaymentName", payment.customer);
    setText("customerPaymentVehicle", payment.vehicle);
    setText("customerPaymentReference", payment.id);
    setText("customerPaymentDueDate", formatDate(payment.dueDate));
    setText("customerPaymentAmount", formatCurrency(payment.amount));

    document.title = `Payment ${payment.id} | Popoye Insurance`;
}

function simulatePayment() {
    if (!currentPayment || currentPayment.status !== "Pending") {
        showMessage(
            "This payment request cannot be processed.",
            true
        );
        disablePayButton();
        return;
    }

    const confirmed = window.confirm(
        "DEMO PAYMENT ONLY\n\n" +
        "This will mark the selected payment as Paid in this browser. " +
        "It will NOT transfer money or contact a bank.\n\n" +
        "Continue with the simulation?"
    );

    if (!confirmed) {
        return;
    }

    let payments;

    try {
        payments = JSON.parse(
            localStorage.getItem(PAYMENT_STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(payments)) {
            throw new Error("Invalid payment records.");
        }
    } catch (error) {
        showMessage("Unable to update the demo payment record.", true);
        return;
    }

    const paymentIndex = payments.findIndex(
        payment => payment.token === currentPayment.token
    );

    if (paymentIndex === -1) {
        showMessage(
            "Payment record not found. Please reopen the payment link.",
            true
        );
        disablePayButton();
        return;
    }

    if (payments[paymentIndex].status === "Paid") {
        currentPayment = payments[paymentIndex];

        showMessage("This demo payment is already marked as paid.");
        disablePayButton();
        return;
    }

    // Simulate a successful payment.
    // A real application must verify payments with a payment gateway.
    payments[paymentIndex].status = "Paid";
    payments[paymentIndex].demoPaidAt = new Date().toISOString();

    try {
        localStorage.setItem(
            PAYMENT_STORAGE_KEY,
            JSON.stringify(payments)
        );
    } catch (error) {
        showMessage(
            "Unable to save the simulated payment status.",
            true
        );
        return;
    }

    currentPayment = payments[paymentIndex];

    displayPaymentDetails(currentPayment);

    showMessage(
        "Demo payment completed! The status has been updated in this browser only. No real money was collected."
    );

    disablePayButton();
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function showMessage(message, isError = false) {
    const element = document.getElementById("customerPaymentMessage");

    if (!element) return;

    element.textContent = message;
    element.hidden = false;

    element.style.background = isError ? "#fef2f2" : "#eff6ff";
    element.style.color = isError ? "#b91c1c" : "#1d4ed8";
    element.style.borderColor = isError ? "#fecaca" : "#bfdbfe";
}

function enablePayButton() {
    const button = document.getElementById("payNowBtn");

    if (button) {
        button.disabled = false;
        button.textContent = "Pay Now — Demo";
    }
}

function disablePayButton() {
    const button = document.getElementById("payNowBtn");

    if (button) {
        button.disabled = true;
        button.textContent = "Payment Unavailable";
    }
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
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}
