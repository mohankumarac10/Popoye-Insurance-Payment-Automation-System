
const settingsStorageKey = "popoyeInsuranceSettings";

const defaultSettings = {
  businessName: "Popoye Insurance",
  businessEmail: "",
  businessPhone: "",
  businessAddress: "",

  reminderDays: "30",
  reminderChannel: "WhatsApp",
  enableReminders: true,

  themeMode: "light",
  dateFormat: "DD-MM-YYYY",
  rowsPerPage: "5"
};

// Load settings from localStorage.
function loadSettings() {
  try {
    const saved = localStorage.getItem(settingsStorageKey);

    if (saved) {
      return {
        ...defaultSettings,
        ...JSON.parse(saved)
      };
    }
  } catch (error) {
    console.error("Unable to load settings:", error);
  }

  return { ...defaultSettings };
}

let settings = loadSettings();

// Get forms.
const businessSettingsForm =
  document.getElementById("businessSettingsForm");

const reminderSettingsForm =
  document.getElementById("reminderSettingsForm");

const displaySettingsForm =
  document.getElementById("displaySettingsForm");

// Save all settings in one place.
function saveSettings(messageId) {
  const message = document.getElementById(messageId);

  try {
    localStorage.setItem(
      settingsStorageKey,
      JSON.stringify(settings)
    );

    if (message) {
      message.textContent = "Settings saved successfully.";
    }

    return true;
  } catch (error) {
    console.error("Unable to save settings:", error);

    if (message) {
      message.textContent =
        "Unable to save settings. Check your browser storage.";
    }

    return false;
  }
}

// Load saved values into the HTML forms.
function loadSettingsIntoForms() {
  document.getElementById("businessName").value =
    settings.businessName;

  document.getElementById("businessEmail").value =
    settings.businessEmail;

  document.getElementById("businessPhone").value =
    settings.businessPhone;

  document.getElementById("businessAddress").value =
    settings.businessAddress;

  document.getElementById("reminderDays").value =
    settings.reminderDays;

  document.getElementById("reminderChannel").value =
    settings.reminderChannel;

  document.getElementById("enableReminders").checked =
    settings.enableReminders;

  document.getElementById("themeMode").value =
    settings.themeMode;

  document.getElementById("dateFormat").value =
    settings.dateFormat;

  document.getElementById("rowsPerPage").value =
    settings.rowsPerPage;
}

// Apply the selected theme to the current page.
function applyTheme() {
  document.body.classList.toggle(
    "dark-mode",
    settings.themeMode === "dark"
  );
}

// Save Business Information.
businessSettingsForm.addEventListener("submit", event => {
  event.preventDefault();

  settings.businessName =
    document.getElementById("businessName").value.trim();

  settings.businessEmail =
    document.getElementById("businessEmail").value.trim();

  settings.businessPhone =
    document.getElementById("businessPhone").value.trim();

  settings.businessAddress =
    document.getElementById("businessAddress").value.trim();

  saveSettings("businessMessage");
});

// Save Renewal Reminder Preferences.
reminderSettingsForm.addEventListener("submit", event => {
  event.preventDefault();

  settings.reminderDays =
    document.getElementById("reminderDays").value;

  settings.reminderChannel =
    document.getElementById("reminderChannel").value;

  settings.enableReminders =
    document.getElementById("enableReminders").checked;

  saveSettings("reminderMessage");
});

// Save Display Settings.
displaySettingsForm.addEventListener("submit", event => {
  event.preventDefault();

  settings.themeMode =
    document.getElementById("themeMode").value;

  settings.dateFormat =
    document.getElementById("dateFormat").value;

  settings.rowsPerPage =
    document.getElementById("rowsPerPage").value;

  applyTheme();

  saveSettings("displayMessage");
});

// Initialize the page.
loadSettingsIntoForms();
applyTheme();
