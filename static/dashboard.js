document.addEventListener("DOMContentLoaded", async function () {
  const TESTING_URI = "http://127.0.0.1:5000";

  // Show loading overlay for 1.5s
  setTimeout(() => {
    document.getElementById("loadingOverlay").style.opacity = "0";
    document.getElementById("content").style.opacity = "1";
    setTimeout(() => {
      document.getElementById("loadingOverlay").style.display = "none";
    }, 500);
  }, 1000);

  // Set current date
  const now = new Date();
  document.getElementById("currentDate").textContent = now.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Fetch data from API
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
  const avgTemp =
    data.reduce((sum, item) => sum + item.temperature, 0) / data.length;
  const avgHumidity =
    data.reduce((sum, item) => sum + item.humidity, 0) / data.length;

  // Count air quality occurrences
  const airQualityCounts = data.reduce((acc, item) => {
    acc[item.air_quality] = (acc[item.air_quality] || 0) + 1;
    return acc;
  }, {});

  // Find most common air quality
  let mostCommonAirQuality = "Good";
  let maxCount = 0;
  for (const [quality, count] of Object.entries(airQualityCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonAirQuality = quality;
    }
  }

  // Update UI with calculated values
  document.getElementById("avgTemp").textContent = avgTemp.toFixed(1) + "°C";
  document.getElementById("avgHumidity").textContent =
    avgHumidity.toFixed(1) + "%";
  document.getElementById("airQualityStatus").textContent =
    mostCommonAirQuality;
  document.getElementById("sensorCount").textContent = data.length;
  document.getElementById("lastUpdate").textContent =
    new Date().toLocaleTimeString();

  // Update progress bars with animation
  setTimeout(() => {
    document.getElementById("tempBar").style.width = (avgTemp / 40) * 100 + "%";
    document.getElementById("humidityBar").style.width = avgHumidity + "%";

    // Set air quality bar
    const airQualityMap = {
      Good: 25,
      Moderate: 50,
      Poor: 75,
      Unhealthy: 100,
    };
    document.getElementById("airQualityBar").style.width =
      airQualityMap["Poor"] + "%";

    // Set air quality bar color
    const airQualityColorMap = {
      Good: "bg-green-500",
      Moderate: "bg-yellow-500",
      Poor: "bg-orange-500",
      Unhealthy: "bg-red-500",
    };
    document.getElementById("airQualityBar").className =
      "h-full rounded-full " + airQualityColorMap[mostCommonAirQuality];
  }, 1000);

  // Refresh button functionality
  document.getElementById("refreshBtn").addEventListener("click", function () {
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Refreshing...';

    setTimeout(() => {
      location.reload();
    }, 1000);
  });

  const labels = data.map((entry) => {
    const time = new Date(entry.timestamp);
    return (
      time.getHours().toString().padStart(2, "0") +
      ":" +
      time.getMinutes().toString().padStart(2, "0")
    );
  });
  const tempData = data.map((entry) => entry.temperature.toFixed(1));
  const humidityData = data.map((entry) => entry.humidity.toFixed(1));

  // Render Temperature Chart
  const tempCtx = document.getElementById("temperatureChart").getContext("2d");
  new Chart(tempCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: tempData,
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 40,
        },
      },
    },
  });

  // Render Humidity Chart
  const humidityCtx = document.getElementById("humidityChart").getContext("2d");
  new Chart(humidityCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Humidity (%)",
          data: humidityData,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 100,
        },
      },
    },
  });
});