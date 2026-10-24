
const policies = [
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

const policyPageSize = 5;
let policyCurrentPage = 1;

const policySearch = document.getElementById("policySearch");
const typeFilter = document.getElementById("typeFilter");
const statusFilter = document.getElementById("statusFilter");
const policiesTable = document.getElementById("policiesTable");

function getPolicyStatus(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate + "T00:00:00");
  const daysRemaining = Math.ceil(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0) return "Expired";
  if (daysRemaining <= 30) return "Expiring Soon";
  return "Active";
}

function formatPolicyDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function escapePolicyText(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getFilteredPolicies() {
  const searchTerm = policySearch.value.trim().toLowerCase();
  const selectedType = typeFilter.value;
  const selectedStatus = statusFilter.value;

  return policies.filter(policy => {
    const status = getPolicyStatus(policy.expiry);

    const matchesSearch = [
      policy.id,
      policy.customer,
      policy.vehicle,
      policy.type
    ].some(value => value.toLowerCase().includes(searchTerm));

    const matchesType =
      !selectedType || policy.type === selectedType;

    const matchesStatus =
      !selectedStatus || status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });
}

function updatePolicyStats() {
  document.getElementById("totalPolicies").textContent = policies.length;

  document.getElementById("activePolicies").textContent =
    policies.filter(p => getPolicyStatus(p.expiry) === "Active").length;

  document.getElementById("expiringPolicies").textContent =
    policies.filter(p => getPolicyStatus(p.expiry) === "Expiring Soon").length;

  document.getElementById("expiredPolicies").textContent =
    policies.filter(p => getPolicyStatus(p.expiry) === "Expired").length;
}

function renderPolicies() {
  const filteredPolicies = getFilteredPolicies();
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPolicies.length / policyPageSize)
  );

  if (policyCurrentPage > totalPages) {
    policyCurrentPage = totalPages;
  }

  const startIndex = (policyCurrentPage - 1) * policyPageSize;
  const visiblePolicies = filteredPolicies.slice(
    startIndex,
    startIndex + policyPageSize
  );

  if (visiblePolicies.length === 0) {
    policiesTable.innerHTML = `
      <tr>
        <td colspan="8">No policies found.</td>
      </tr>
    `;
  } else {
    policiesTable.innerHTML = visiblePolicies.map(policy => {
      const status = getPolicyStatus(policy.expiry);
      let statusClass = "active";

      if (status === "Expired") statusClass = "expired";
      if (status === "Expiring Soon") statusClass = "pending";

      return `
        <tr>
          <td>${escapePolicyText(policy.id)}</td>
          <td>${escapePolicyText(policy.customer)}</td>
          <td>${escapePolicyText(policy.vehicle)}</td>
          <td>${escapePolicyText(policy.type)}</td>
          <td>₹${policy.premium.toLocaleString("en-IN")}</td>
          <td>${formatPolicyDate(policy.start)}</td>
          <td>${formatPolicyDate(policy.expiry)}</td>
          <td>
            <span class="status ${statusClass}">
              ${status}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  document.getElementById("policyPageInfo").textContent =
    `Page ${policyCurrentPage} of ${totalPages} · ${filteredPolicies.length} policies`;

  document.getElementById("previousPage").disabled =
    policyCurrentPage === 1;

  document.getElementById("nextPage").disabled =
    policyCurrentPage === totalPages;
}

policySearch.addEventListener("input", () => {
  policyCurrentPage = 1;
  renderPolicies();
});

typeFilter.addEventListener("change", () => {
  policyCurrentPage = 1;
  renderPolicies();
});

statusFilter.addEventListener("change", () => {
  policyCurrentPage = 1;
  renderPolicies();
});

document.getElementById("resetFilters").addEventListener("click", () => {
  policySearch.value = "";
  typeFilter.value = "";
  statusFilter.value = "";
  policyCurrentPage = 1;
  renderPolicies();
});

document.getElementById("previousPage").addEventListener("click", () => {
  if (policyCurrentPage > 1) {
    policyCurrentPage--;
    renderPolicies();
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  const totalPages = Math.max(
    1,
    Math.ceil(getFilteredPolicies().length / policyPageSize)
  );

  if (policyCurrentPage < totalPages) {
    policyCurrentPage++;
    renderPolicies();
  }
});

updatePolicyStats();
renderPolicies();
