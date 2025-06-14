document.addEventListener("DOMContentLoaded", async function () {
  const API_BASE_URI = "http://127.0.0.1:5000";

  // Show loading overlay then fade it out
  setTimeout(() => {
    document.getElementById("loadingOverlay").style.opacity = "0";
    document.getElementById("content").style.opacity = "1";
    setTimeout(() => {
      document.getElementById("loadingOverlay").style.display = "none";
    }, 500);
  }, 1000);

  // Display current date in header
  const now = new Date();
  document.getElementById("currentDate").textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch flood data from API
  let floodData = [];
  try {
    const response = await fetch(API_BASE_URI + "/api/all"); // Adjusted API endpoint for flood data
    floodData = await response.json();
  } catch (error) {
    console.error("Failed to fetch flood data:", error.message);
    return;
  }

  if (!floodData.length) {
    console.warn("No flood data received from API");
    return;
  }


  // Calculate total flood events
  const totalFloods = floodData.length;

  // Calculate active flood alerts (assuming each alert has a boolean 'active' field)
  const activeFloods = floodData.filter(flood => flood.active).length;

  // Count unique locations monitored (assuming each flood record has a 'location' field)
  const locationsMonitored = new Set(floodData.map(flood => flood.location)).size;

  // Find the latest flood detection timestamp
  const lastDetection = new Date(Math.max(...floodData.map(flood => new Date(flood.timestamp))));s


  // Update dashboard stats with fetched data
  document.getElementById("totalFloods").textContent = totalFloods;
  document.getElementById("activeFloods").textContent = activeFloods;
  document.getElementById("locationCount").textContent = locationsMonitored;
  document.getElementById("lastDetection").textContent = lastDetection.toLocaleString();

  // Prepare data for the flood records table
  const tableBody = document.getElementById("floodTableBody");
  floodData.forEach(entry => {
    const row = document.createElement("tr");
    row.classList.add("hover:bg-gray-50", "transition-colors", "duration-150");

    const idCell = document.createElement("td");
    idCell.classList.add("px-6", "py-4", "whitespace-nowrap", "text-sm", "font-medium", "text-gray-900");
    idCell.textContent = entry.id;
    row.appendChild(idCell);

    const locationCell = document.createElement("td");
    locationCell.classList.add("px-6", "py-4", "whitespace-nowrap", "text-sm", "text-gray-700");
    locationCell.textContent = entry.location;
    row.appendChild(locationCell);

    const statusCell = document.createElement("td");
    statusCell.classList.add("px-6", "py-4", "whitespace-nowrap", "text-sm");
    const statusSpan = document.createElement("span");
    statusSpan.classList.add("inline-flex", "items-center", "px-2", "py-1", "rounded", "text-xs", "font-semibold");
    if (entry.flood_detected) {
      statusSpan.classList.add("bg-blue-100", "text-blue-800");
      statusSpan.textContent = "Flood Detected";
    } else {
      statusSpan.classList.add("bg-green-100", "text-green-800");
      statusSpan.textContent = "No Flood";
    }
    statusCell.appendChild(statusSpan);
    row.appendChild(statusCell);

    const timestampCell = document.createElement("td");
    timestampCell.classList.add("px-6", "py-4", "whitespace-nowrap", "text-sm", "text-gray-500");
    timestampCell.textContent = new Date(entry.timestamp).toLocaleString();
    row.appendChild(timestampCell);

    const actionsCell = document.createElement("td");
    actionsCell.classList.add("px-6", "py-4", "whitespace-nowrap", "text-sm", "text-gray-500");
    const viewBtn = document.createElement("button");
    viewBtn.classList.add("text-blue-600", "hover:text-blue-800");
    viewBtn.setAttribute("title", "View Details");
    viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
    actionsCell.appendChild(viewBtn);

    const downloadBtn = document.createElement("button");
    downloadBtn.classList.add("text-gray-600", "hover:text-gray-800");
    downloadBtn.setAttribute("title", "Download");
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    actionsCell.appendChild(downloadBtn);

    row.appendChild(actionsCell);

    tableBody.appendChild(row);
  });

  // Initialize Flood History Chart
  const labels = floodData.map(entry => {
    const time = new Date(entry.timestamp);
    return time.getHours().toString().padStart(2, "0") + ":" +
           time.getMinutes().toString().padStart(2, "0");
  });

  const floodStatusData = floodData.map(entry => entry.flood_detected ? 1 : 0);

  const ctx = document.getElementById("floodHistoryChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Flood Detection (1 = Detected, 0 = Not Detected)",
        data: floodStatusData,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 1,
        },
      },
    },
  });

  // Refresh button handler
  document.getElementById("refreshFloodBtn").addEventListener("click", function () {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Refreshing...';
    setTimeout(() => location.reload(), 1000);
  });
});
