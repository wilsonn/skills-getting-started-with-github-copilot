document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Small helper to avoid XSS when injecting participant strings
      function escapeHtml(str) {
        return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants HTML (custom list, no bullets, with delete icon)
        const participants = Array.isArray(details.participants) ? details.participants : [];
        const participantsHtml = participants.length
          ? `<ul class="participants-list" style="list-style: none; padding-left: 0;">${participants
              .map((p) => `
                <li class="participant-item" style="display: flex; align-items: center; gap: 8px;">
                  <span>${escapeHtml(p)}</span>
                  <button class="delete-participant-btn" title="Eliminar participante" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" style="background: none; border: none; cursor: pointer; color: #c00; font-size: 1.2em;">
                    &#128465;
                  </button>
                </li>`)
              .join("")}
            </ul>`
          : `<p class="no-participants">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section" aria-label="Participants for ${escapeHtml(name)}">
            <h5 class="participants-title">Participants (${participants.length})</h5>
            ${participantsHtml}
          </div>
        `;
  // Delegated event handler for delete participant
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-participant-btn");
    if (btn) {
      const activity = btn.getAttribute("data-activity");
      const email = btn.getAttribute("data-email");
      if (activity && email) {
        try {
          const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
            method: "POST"
          });
          const result = await response.json();
          if (response.ok) {
            // Recargar actividades para reflejar el cambio
            fetchActivities();
          } else {
            alert(result.detail || "No se pudo eliminar el participante.");
          }
        } catch (error) {
          alert("Error al eliminar el participante.");
        }
      }
    }
  });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
