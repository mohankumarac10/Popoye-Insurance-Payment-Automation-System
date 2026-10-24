
const customers = [
  {id:"CUS1001",name:"Arun Kumar",vehicle:"TN38AB1234",premium:4200,status:"Active"},
  {id:"CUS1002",name:"Priya S",vehicle:"TN37CD2345",premium:1800,status:"Due"},
  {id:"CUS1003",name:"Karthik R",vehicle:"TN66EF3456",premium:3900,status:"Active"},
  {id:"CUS1004",name:"Divya M",vehicle:"TN40GH4567",premium:1600,status:"Expired"},
  {id:"CUS1005",name:"Vijay S",vehicle:"TN41JK5678",premium:4500,status:"Active"}
];

const content = document.getElementById("page-content");

content.innerHTML = `
  <div class="page-heading">
    <div>
      <h2>Welcome back, Admin</h2>
      <p>Here's an overview of your insurance renewal business.</p>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Total Customers</div>
      <div class="stat-value">${customers.length}</div>
      <div class="stat-note">Demo records</div>
    </div>

    <div class="stat">
      <div class="stat-label">Active Policies</div>
      <div class="stat-value">${customers.filter(c => c.status === "Active").length}</div>
      <div class="stat-note">Active in demo data</div>
    </div>

    <div class="stat">
      <div class="stat-label">Renewals Due</div>
      <div class="stat-value">${customers.filter(c => c.status === "Due").length}</div>
      <div class="stat-note">Require follow-up</div>
    </div>

    <div class="stat">
      <div class="stat-label">Expired Policies</div>
      <div class="stat-value">${customers.filter(c => c.status === "Expired").length}</div>
      <div class="stat-note">Check renewal status</div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-head">
      <h2>Recent Customers</h2>
      <a class="btn" href="customers.html">View all →</a>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>CUSTOMER ID</th>
            <th>CUSTOMER</th>
            <th>VEHICLE NUMBER</th>
            <th>PREMIUM</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(c => `
            <tr>
              <td>${c.id}</td>
              <td>${c.name}</td>
              <td>${c.vehicle}</td>
              <td>₹${c.premium.toLocaleString("en-IN")}</td>
              <td><span class="status ${c.status.toLowerCase()}">${c.status}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  </div>

  <div class="panel">
    <p class="muted small">
      Demo mode: the displayed records are sample data, not real customer records.
    </p>
  </div>
`;
