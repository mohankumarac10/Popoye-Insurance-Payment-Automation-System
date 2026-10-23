
const storageKey = "popoyeCustomers";

const sampleCustomers = [
  {id:"CUS1001",name:"Arun Kumar",phone:"9876543210",vehicle:"TN38AB1234",policy:"Comprehensive",premium:4200,expiry:"2026-11-10",status:"Active"},
  {id:"CUS1002",name:"Priya S",phone:"9876543211",vehicle:"TN37CD2345",policy:"Third Party",premium:1800,expiry:"2026-10-28",status:"Due"},
  {id:"CUS1003",name:"Karthik R",phone:"9876543212",vehicle:"TN66EF3456",policy:"Comprehensive",premium:3900,expiry:"2026-12-15",status:"Active"},
  {id:"CUS1004",name:"Divya M",phone:"9876543213",vehicle:"TN40GH4567",policy:"Third Party",premium:1600,expiry:"2026-10-20",status:"Expired"},
  {id:"CUS1005",name:"Vijay S",phone:"9876543214",vehicle:"TN41JK5678",policy:"Comprehensive",premium:4500,expiry:"2026-11-22",status:"Active"},
  {id:"CUS1006",name:"Meena P",phone:"9876543215",vehicle:"TN42LM6789",policy:"Third Party",premium:1750,expiry:"2026-11-01",status:"Due"},
  {id:"CUS1007",name:"Suresh B",phone:"9876543216",vehicle:"TN43NP7890",policy:"Comprehensive",premium:5100,expiry:"2027-01-12",status:"Active"}
];

function loadCustomers() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (error) {
      console.error("Could not load saved customers", error);
    }
  }
  localStorage.setItem(storageKey, JSON.stringify(sampleCustomers));
  return [...sampleCustomers];
}

let customers = loadCustomers();
let filteredCustomers = [...customers];
let currentPage = 1;
const pageSize = 5;

const $ = id => document.getElementById(id);

function saveCustomers() {
  localStorage.setItem(storageKey, JSON.stringify(customers));
}

function getStatus(expiry) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const date = new Date(expiry + "T00:00:00");
  if (date < today) return "Expired";

  const daysLeft = Math.ceil((date - today) / 86400000);
  return daysLeft <= 30 ? "Due" : "Active";
}

function updateCounts() {
  $("totalCount").textContent = customers.length;
  $("activeCount").textContent = customers.filter(c => getStatus(c.expiry) === "Active").length;
  $("dueCount").textContent = customers.filter(c => getStatus(c.expiry) === "Due").length;
  $("expiredCount").textContent = customers.filter(c => getStatus(c.expiry) === "Expired").length;
}

function renderCustomers() {
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filteredCustomers.slice(start, start + pageSize);

  $("customerTable").innerHTML = visible.length ? `
    <table>
      <thead><tr>
        <th>CUSTOMER ID</th><th>CUSTOMER</th><th>PHONE</th>
        <th>VEHICLE</th><th>POLICY</th><th>PREMIUM</th>
        <th>EXPIRY</th><th>STATUS</th>
      </tr></thead>
      <tbody>
        ${visible.map(c => {
          const status = getStatus(c.expiry);
          return `<tr>
            <td>${c.id}</td><td>${escapeHTML(c.name)}</td>
            <td>${escapeHTML(c.phone)}</td><td>${escapeHTML(c.vehicle)}</td>
            <td>${escapeHTML(c.policy)}</td>
            <td>₹${Number(c.premium).toLocaleString("en-IN")}</td>
            <td>${c.expiry}</td>
            <td><span class="status ${status.toLowerCase()}">${status}</span></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>` : `<div class="empty">No customers found.</div>`;

  $("pageInfo").textContent = filteredCustomers.length
    ? `Showing ${start + 1}–${Math.min(start + pageSize, filteredCustomers.length)} of ${filteredCustomers.length}`
    : "No records found";

  $("pagination").innerHTML = `
    <button class="btn" id="previous" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
    <span class="muted small">Page ${currentPage} of ${totalPages}</span>
    <button class="btn" id="next" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
  `;

  $("previous").onclick = () => {
    if (currentPage > 1) { currentPage--; renderCustomers(); }
  };
  $("next").onclick = () => {
    if (currentPage < totalPages) { currentPage++; renderCustomers(); }
  };
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#39;"
  })[char]);
}

function applyFilters() {
  const query = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const policy = $("policyFilter").value;

  filteredCustomers = customers.filter(c => {
    const matchesSearch = [c.id,c.name,c.phone,c.vehicle]
      .some(value => String(value).toLowerCase().includes(query));
    return matchesSearch &&
      (!status || getStatus(c.expiry) === status) &&
      (!policy || c.policy === policy);
  });

  currentPage = 1;
  renderCustomers();
}

["searchInput","statusFilter","policyFilter"].forEach(id => {
  $(id).addEventListener(id === "searchInput" ? "input" : "change", applyFilters);
});

$("resetBtn").onclick = () => {
  $("searchInput").value = "";
  $("statusFilter").value = "";
  $("policyFilter").value = "";
  applyFilters();
};

$("exportBtn").onclick = () => {
  const columns = ["Customer ID","Name","Phone","Vehicle","Policy","Premium INR","Expiry","Status"];
  const rows = filteredCustomers.map(c => [
    c.id,c.name,c.phone,c.vehicle,c.policy,c.premium,c.expiry,getStatus(c.expiry)
  ]);
  const csv = "\uFEFF" + [columns,...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))
    .join("\r\n");

  const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = "popoye-customers.csv";
  link.click();
  URL.revokeObjectURL(url);
};

$("addCustomerBtn").onclick = () => {
  $("customerFormPanel").hidden = false;
  $("customerFormPanel").scrollIntoView({behavior:"smooth"});
};

$("cancelBtn").onclick = () => {
  $("customerFormPanel").hidden = true;
  $("customerForm").reset();
};

$("customerForm").onsubmit = event => {
  event.preventDefault();

  const expiry = $("expiryDate").value;
  const customer = {
    id:"CUS" + Date.now(),
    name:$("customerName").value.trim(),
    phone:$("customerPhone").value.trim(),
    vehicle:$("vehicleNumber").value.trim().toUpperCase(),
    policy:$("policyType").value,
    premium:Number($("premium").value),
    expiry,
    status:getStatus(expiry)
  };

  const duplicate = customers.some(c =>
    c.vehicle.toLowerCase() === customer.vehicle.toLowerCase()
  );

  if (duplicate) {
    alert("A customer with this vehicle number already exists.");
    return;
  }

  customers.push(customer);
  saveCustomers();
  updateCounts();

  $("customerForm").reset();
  $("customerFormPanel").hidden = true;
  applyFilters();

  alert("Customer added successfully.");
};

updateCounts();
applyFilters();
