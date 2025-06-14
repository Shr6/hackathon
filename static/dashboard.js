document.addEventListener("DOMContentLoaded", async function () {
  const TESTING_URI = "http://127.0.0.1:5000";

  // Show loading overlay
  setTimeout(() => {
    document.getElementById("loadingOverlay").style.opacity = "0";
    document.getElementById("content").style.opacity = "1";
    setTimeout(() => {
      document.getElementById("loadingOverlay").style.display = "none";
    }, 500);
  }, 1000);

  // Set current date
  const now = new Date();
  document.getElementById("currentDate").textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch data
  let data = [];
  try {
    const res = await fetch(TESTING_URI + "/api/all");
    data = await res.json();
  } catch (error) {
    console.error("Error while fetching data:", error.message);
    return;
  }

  if (!data.length) {
    console.warn("No data received from API");
    return;
  }

  // Calculate averages
  const avgFlow =
    data.reduce((sum, item) => sum + item.flow_rate, 0) / data.length;
  const avgPressure =
    data.reduce((sum, item) => sum + item.pipe_pressure, 0) / data.length;

  // Most common leak status
  const leakCounts = data.reduce((acc, item) => {
    acc[item.leak_status] = (acc[item.leak_status] || 0) + 1;
    return acc;
  }, {});

  let mostCommonLeakStatus = "None";
  let maxLeakCount = 0;
  for (const [status, count] of Object.entries(leakCounts)) {
    if (count > maxLeakCount) {
      maxLeakCount = count;
      mostCommonLeakStatus = status;
    }
  }

  // Update UI
  document.getElementById("avgFlowRate").textContent = avgFlow.toFixed(1) + " L/min";
  document.getElementById("avgPressure").textContent = avgPressure.toFixed(1) + " psi";
  document.getElementById("leakStatus").textContent = mostCommonLeakStatus;
  document.getElementById("sensorCount").textContent = data.length;
  document.getElementById("lastUpdate").textContent = new Date().toLocaleTimeString();

  // Update progress bars
  setTimeout(() => {
    document.getElementById("flowBar").style.width = (avgFlow / 30) * 100 + "%";
    document.getElementById("pressureBar").style.width = (avgPressure / 100) * 100 + "%";

    // Leak bar status
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
    leakBar.style.width = leakLevelMap[mostCommonLeakStatus] + "%";
    leakBar.className = "h-full rounded-full " + leakColorMap[mostCommonLeakStatus];
  }, 1000);

  // Refresh button
  document.getElementById("refreshBtn").addEventListener("click", function () {
    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Refreshing...';
    setTimeout(() => location.reload(), 1000);
  });

  // Chart labels and data
  const labels = data.map((entry) => {
    const time = new Date(entry.timestamp);
    return time.getHours().toString().padStart(2, "0") + ":" +
           time.getMinutes().toString().padStart(2, "0");
  });

  const flowData = data.map((entry) => entry.flow_rate.toFixed(1));
  const pressureData = data.map((entry) => entry.pipe_pressure.toFixed(1));

  // Flow Rate Chart
  const flowCtx = document.getElementById("flowChart").getContext("2d");
  new Chart(flowCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Flow Rate (L/min)",
        data: flowData,
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

  // Pressure Chart
  const pressureCtx = document.getElementById("pressureChart").getContext("2d");
  new Chart(pressureCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Pipe Pressure (psi)",
        data: pressureData,
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
