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

      // Populate activities list
          // Reset activity select options (keep placeholder)
          activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

          // Build participants section HTML with delete buttons
          const participants = details.participants || [];
          let participantsHtml = `<div class="participants-section">
            <h5 class="participants-title">Participants</h5>`;
          if (participants.length) {
            participantsHtml += `<ul class="participants-list">` + participants.map(p => {
              // each list item will contain the email and a delete button
              return `<li data-email="${p}"><span class="participant-email">${p}</span> <button class="btn-delete" data-email="${p}" data-activity="${name}" aria-label="Unregister ${p}">✖</button></li>`
            }).join("") + `</ul>`;
          } else {
            participantsHtml += `<p class="no-participants">Aucun participant pour l'instant</p>`;
          }
          participantsHtml += `</div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

          // Attach delete handlers for participant buttons inside this activity card
          const deleteButtons = activityCard.querySelectorAll('.btn-delete');
          deleteButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const email = btn.getAttribute('data-email');
              const activityName = btn.getAttribute('data-activity');

              try {
                const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
                const resJson = await resp.json();
                if (resp.ok) {
                  // remove the list item from the DOM
                  const li = activityCard.querySelector(`li[data-email="${email}"]`);
                  if (li) li.remove();
                      await fetchActivities();

                  // update availability text
                  const availabilityP = activityCard.querySelector('p strong');
                  // Recompute spots left locally (best-effort) by decrementing
                  // This is a simple UI update; the server is the source of truth.
                  const spotsLeftText = activityCard.querySelector('p:nth-of-type(3)');
                  if (spotsLeftText) {
                    // find numbers in the text and adjust if possible
                    const match = spotsLeftText.textContent.match(/(\d+) spots left/);
                    if (match) {
                      const n = Math.max(0, parseInt(match[1], 10) + 1); // freed a spot
                      spotsLeftText.textContent = `Availability: ${n} spots left`;
                    }
                  }
                } else {
                  console.error('Failed to unregister:', resJson);
                  alert(resJson.detail || 'Failed to unregister participant');
                }
              } catch (err) {
                console.error('Error unregistering participant:', err);
                alert('Error unregistering participant');
              }
            });
          });

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

            // Refresh activities so the new participant appears immediately
            await fetchActivities();
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
