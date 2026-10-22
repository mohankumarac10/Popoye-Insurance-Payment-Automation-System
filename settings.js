
/* =====================================
   POPOYE INSURANCE - SETTINGS
   File: js/settings.js
===================================== */

document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_KEY = "popoye_insurance_settings";

    const form = document.getElementById("settingsForm");
    const message = document.getElementById("settingsMessage");
    const resetButton = document.getElementById("resetSettingsBtn");

    const fields = {
        companyName: document.getElementById("companyName"),
        companyEmail: document.getElementById("companyEmail"),
        companyPhone: document.getElementById("companyPhone"),
        companyAddress: document.getElementById("companyAddress"),
        currency: document.getElementById("currency"),
        paymentMode: document.getElementById("paymentMode"),
        paymentExpiry: document.getElementById("paymentExpiry"),
        reminderDays: document.getElementById("reminderDays"),
        reminderChannel: document.getElementById("reminderChannel"),
        remindersEnabled: document.getElementById("remindersEnabled")
    };

    // Store the original HTML defaults for the Reset Changes button.
    const defaults = {};

    Object.keys(fields).forEach(function (key) {
        const field = fields[key];

        defaults[key] = field.type === "checkbox"
            ? field.checked
            : field.value;
    });

    function showMessage(text, isError = false) {
        message.textContent = text;
        message.classList.toggle("error", isError);
    }

    function readSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                return null;
            }

            const settings = JSON.parse(saved);

            if (
                !settings ||
                typeof settings !== "object" ||
                Array.isArray(settings)
            ) {
                return null;
            }

            return settings;
        } catch (error) {
            console.error("Could not read settings:", error);
            showMessage(
                "Unable to read saved settings. Check your browser storage.",
                true
            );
            return null;
        }
    }

    function applySettings(settings) {
        Object.keys(fields).forEach(function (key) {
            if (!Object.prototype.hasOwnProperty.call(settings, key)) {
                return;
            }

            const field = fields[key];
            const value = settings[key];

            if (field.type === "checkbox") {
                field.checked = Boolean(value);
            } else {
                // Only accept values supported by each form field.
                const allowedValues = field.tagName === "SELECT"
                    ? Array.from(field.options).map(function (option) {
                        return option.value;
                    })
                    : null;

                if (
                    allowedValues &&
                    !allowedValues.includes(String(value))
                ) {
                    return;
                }

                if (typeof value === "string") {
                    field.value = value;
                }
            }
        });
    }

    function collectSettings() {
        const settings = {};

        Object.keys(fields).forEach(function (key) {
            const field = fields[key];

            settings[key] = field.type === "checkbox"
                ? field.checked
                : field.value.trim();
        });

        return settings;
    }

    function saveSettings(event) {
        event.preventDefault();
        showMessage("");

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const settings = collectSettings();

        if (!settings.companyName) {
            showMessage("Please enter your company name.", true);
            fields.companyName.focus();
            return;
        }

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );

            showMessage(
                "Settings saved successfully in this browser."
            );
        } catch (error) {
            console.error("Could not save settings:", error);

            showMessage(
                "Settings could not be saved. Browser storage may be unavailable.",
                true
            );
        }
    }

    function resetSettings() {
        Object.keys(fields).forEach(function (key) {
            const field = fields[key];

            if (field.type === "checkbox") {
                field.checked = defaults[key];
            } else {
                field.value = defaults[key];
            }
        });

        showMessage(
            "Unsaved changes have been reset. Click Save Settings to save these values."
        );
    }

    function loadSettings() {
        const settings = readSettings();

        if (settings) {
            applySettings(settings);
        }
    }

    form.addEventListener("submit", saveSettings);
    resetButton.addEventListener("click", resetSettings);

    loadSettings();
});
