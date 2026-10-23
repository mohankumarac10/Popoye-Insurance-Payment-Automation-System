
const settingsStorageKey = "popoyeInsuranceSettings";

const defaultSettings = {
  businessName: "Popoye Insurance",
  businessEmail: "",
  businessPhone: "",
  businessAddress: "",
  reminderDays: "30",
  reminderChannel: "WhatsApp",
  enableReminders: true,
  themePreference: "light"
};

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

const businessSettingsForm =
  document.getElementById("businessSettingsForm");

const reminderSettingsForm =
  document.getElementById("reminderSettingsForm");

const displaySettingsForm =
  document.getElementById("displaySettingsForm");

const settingsMessage =
  document.getElementById("settingsMessage");

function saveSettings() {
  try {
    localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    settingsMessage.textContent = "Settings saved successfully.";
    return true;
  } catch (error) {
    settingsMessage.textContent =
      "Unable to save settings. Check your browser storage.";
    return false;
  }
}

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

  document.getElementById("themePreference").value =
    settings.themePreference;
}

function applyTheme() {
  document.body.classList.toggle(
    "dark-mode",
    settings.themePreference === "dark"
  );
}

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

  saveSettings();
});

reminderSettingsForm.addEventListener("submit", event => {
  event.preventDefault();

  settings.reminderDays =
    document.getElementById("reminderDays").value;

  settings.reminderChannel =
    document.getElementById("reminderChannel").value;

  settings.enableReminders =
    document.getElementById("enableReminders").checked;

  saveSettings();
});

displaySettingsForm.addEventListener("submit", event => {
  event.preventDefault();

  settings.themePreference =
    document.getElementById("themePreference").value;

  applyTheme();
  saveSettings();
});

loadSettingsIntoForms();
applyTheme();
