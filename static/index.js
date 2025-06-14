document.addEventListener("DOMContentLoaded", async function () {
  const API_BASE_URL = "http://127.0.0.1:5000";

  // Intersection Observer for fade-in animations
  const fadeElements = document.querySelectorAll(".fade-in");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
        }
      });
    },
    { threshold: 0.1 }
  );
  fadeElements.forEach((element) => observer.observe(element));

  async function loadHistoricalData() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/all`);
      if (!response.ok) throw new Error("Failed to fetch historical data");
      const historyData = await response.json();
      updateChartWithHistoricalData(historyData);
    } catch (error) {
      console.error("Error loading historical data:", error);
    }
  }

  async function fetchSensorData() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/latest`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      document.getElementById("leakLocation").textContent = data.location || "Unknown";
      document.getElementById("loadingState").classList.add("hidden");
      document.getElementById("dataState").classList.remove("hidden");
      updateUI(data);
      setTimeout(fetchSensorData, 30000); // Update every 30 seconds
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      document.getElementById("statusIndicator").classList.remove("bg-green-500");
      document.getElementById("statusIndicator").classList.add("bg-red-500");
      setTimeout(fetchSensorData, 5000);
    }
  }

  function updateUI(data) {
    document.getElementById("leakStatus").textContent = data.leak_detected ? "Critical" : "No Leak";
    updateGauge("leakGaugeFill", "leakGaugeValue", data.leak_detected ? 1 : 0, 1, "");
    // Flow Rate
    document.getElementById("flowGaugeValue").textContent = `${data.flow_rate} L/min`;
    updateGauge("flowGaugeFill", "flowGaugeValue", data.flow_rate, 30, "L/min");
    // Pressure
    document.getElementById("pressureGaugeValue").textContent = `${data.pressure} psi`;
    updateGauge("pressureGaugeFill", "pressureGaugeValue", data.pressure, 60, "psi");
    updateStatusMessages(data);
  }

  function updateGauge(fillId, valueId, value, max, unit) {
    const percentage = Math.min(value / max, 1);
    const rotation = percentage * 180;
    document.getElementById(fillId).style.transform = `rotate(${rotation}deg)`;
    document.getElementById(valueId).textContent = value.toFixed(1) + unit;
  }

  function updateStatusMessages(data) {
    const leakStatus = document.getElementById("leakStatus");
    if (data.leak_detected) {
      leakStatus.textContent = "Critical Leak";
      leakStatus.className = "font-semibold mt-2 text-red-700";
    } else {
      leakStatus.textContent = "No Leak";
      leakStatus.className = "font-semibold mt-2 text-green-700";
    }
    // Flow Rate Status
    const flowStatus = document.getElementById("flowStatus");
    if (data.flow_rate < 10) {
      flowStatus.textContent = "Low Flow";
      flowStatus.className = "font-semibold mt-2 text-red-700";
    } else if (data.flow_rate < 20) {
      flowStatus.textContent = "Normal Flow";
      flowStatus.className = "font-semibold mt-2 text-yellow-600";
    } else {
      flowStatus.textContent = "High Flow";
      flowStatus.className = "font-semibold mt-2 text-green-700";
    }
    // Pressure Status
    const pressureStatus = document.getElementById("pressureStatus");
    if (data.pressure < 40) {
      pressureStatus.textContent = "Low Pressure";
      pressureStatus.className = "font-semibold mt-2 text-red-700";
    } else if (data.pressure < 50) {
      pressureStatus.textContent = "Normal Pressure";
      pressureStatus.className = "font-semibold mt-2 text-yellow-600";
    } else {
      pressureStatus.textContent = "High Pressure";
      pressureStatus.className = "font-semibold mt-2 text-green-700";
    }
  }

 function updateChartWithHistoricalData(dataArray) {
  const locationMap = {};

  // Group entries by location
  dataArray.forEach((entry) => {
    const time = new Date(entry.timestamp);
    const label = `${time.getHours().toString().padStart(2, "0")}:${time
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    if (!locationMap[entry.location]) {
      locationMap[entry.location] = {
        labels: [],
        data: [],
      };
    }

    locationMap[entry.location].labels.push(label);
    locationMap[entry.location].data.push(entry.leak_detected ? 1 : 0);
  });

  const datasets = [];
  const colorPalette = [
    "rgb(239, 68, 68)",
    "rgb(59, 130, 246)",
    "rgb(34, 197, 94)",
    "rgb(168, 85, 247)",
    "rgb(251, 191, 36)",
  ];

  Object.keys(locationMap).forEach((location, index) => {
    const color = colorPalette[index % colorPalette.length];
    datasets.push({
      label: `${location}`,
      data: locationMap[location].data,
      borderColor: color,
      backgroundColor: color.replace("rgb", "rgba").replace(")", ", 0.2)"),
      tension: 0.3,
      fill: true,
    });
  });

  const ctx = document.getElementById("leakHistoryChart").getContext("2d");

  if (window.sensorChart) {
    window.sensorChart.data.labels = Object.values(locationMap)[0].labels;
    window.sensorChart.data.datasets = datasets;
    window.sensorChart.update();
  } else {
    window.sensorChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.values(locationMap)[0].labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            usePointStyle: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value === 1 ? "Leak" : "No Leak";
              },
            },
          },
        },
      },
    });
  }
}


  // Start fetching data
  await loadHistoricalData();
  await fetchSensorData();
});
