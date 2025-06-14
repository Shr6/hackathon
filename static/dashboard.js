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

  // Fetch leak data from API
  let leakData = [];
  try {
    const response = await fetch(API_BASE_URI + "/api/all");
    leakData = await response.json();
  } catch (error) {
    console.error("Failed to fetch sensor data:", error.message);
    return;
  }

  if (!leakData.length) {
    console.warn("No leak data received from API");
    return;
  }

  // Calculate average flow rate and pipe pressure
  const avgFlowRate =
    leakData.reduce((sum, item) => sum + item.flow_rate, 0) / leakData.length;
  const avgPipePressure =
    leakData.reduce((sum, item) => sum + item.pipe_pressure, 0) / leakData.length;

  // Determine most frequent leak status
  const leakStatusCounts = leakData.reduce((acc, item) => {
    acc[item.leak_status] = (acc[item.leak_status] || 0) + 1;
    return acc;
  }, {});

  let dominantLeakStatus = "None";
  let highestCount = 0;
  for (const [status, count] of Object.entries(leakStatusCounts)) {
    if (count > highestCount) {
      highestCount = count;
      dominantLeakStatus = status;
    }
  }

  // Update dashboard stats
  document.getElementById("avgFlowRate").textContent = avgFlowRate.toFixed(1) + " L/min";
  document.getElementById("avgPressure").textContent = avgPipePressure.toFixed(1) + " psi";
  document.getElementById("leakStatus").textContent = dominantLeakStatus;
  document.getElementById("sensorCount").textContent = leakData.length;
  document.getElementById("lastUpdate").textContent = new Date().toLocaleTimeString();

  // Update progress bars with animation
  setTimeout(() => {
    document.getElementById("flowBar").style.width = (avgFlowRate / 30) * 100 + "%";
    document.getElementById("pressureBar").style.width = (avgPipePressure / 100) * 100 + "%";

    const leakLevelMap = {
      None: 20,
      Minor: 60,
      Critical: 100,
    };
    const leakColorMap = {
      None: "bg-green-500",
      Minor: "bg-yellow-500",
      Critical: "bg-red-500",
    };

    const leakBar = document.getElementById("leakBar");
    leakBar.style.width = leakLevelMap[dominantLeakStatus] + "%";
    leakBar.className = "h-full rounded-full " + leakColorMap[dominantLeakStatus];
  }, 1000);

  // Refresh button handler
  document.getElementById("refreshBtn").addEventListener("click", function () {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Refreshing...';
    setTimeout(() => location.reload(), 1000);
  });

  // Prepare data labels for charts
  const labels = leakData.map((entry) => {
    const time = new Date(entry.timestamp);
    return time.getHours().toString().padStart(2, "0") + ":" +
           time.getMinutes().toString().padStart(2, "0");
  });

  const flowRates = leakData.map((entry) => entry.flow_rate.toFixed(1));
  const pipePressures = leakData.map((entry) => entry.pipe_pressure.toFixed(1));

  // Initialize Flow Rate Chart
  const flowCtx = document.getElementById("flowChart").getContext("2d");
  new Chart(flowCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Flow Rate (L/min)",
        data: flowRates,
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
          suggestedMax: 40,
        },
      },
    },
  });

  // Initialize Pressure Chart
  const pressureCtx = document.getElementById("pressureChart").getContext("2d");
  new Chart(pressureCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Pipe Pressure (psi)",
        data: pipePressures,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
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
          suggestedMax: 100,
        },
      },
    },
  });
});
