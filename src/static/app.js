document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");
  const submitBtn = signupForm.querySelector("button[type='submit']");

  function showMessage(text, type = "info") {
    messageEl.className = `message ${type}`;
    messageEl.textContent = text;
    messageEl.classList.remove("hidden");
    setTimeout(() => messageEl.classList.add("hidden"), 3500);
  }

  async function fetchActivities() {
    activitiesList.innerHTML = "<p>Loading activities...</p>";
    try {
      const res = await fetch("/activities");
      if (!res.ok) throw new Error("Failed to load activities");
      const data = await res.json();
      renderActivities(data);
      populateSelect(data);
    } catch {
      activitiesList.innerHTML = "<p class='error'>Could not load activities.</p>";
    }
  }

  function populateSelect(data) {
    activitySelect.querySelectorAll("option:not([value=''])").forEach(o => o.remove());
    Object.keys(data).forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);
    });
  }

  function renderActivities(data) {
    activitiesList.innerHTML = "";
    Object.entries(data).forEach(([name, info]) => {
      const card = document.createElement("div");
      card.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;
      card.appendChild(title);

      const desc = document.createElement("p");
      desc.textContent = info.description;
      card.appendChild(desc);

      const sched = document.createElement("p");
      sched.textContent = `Schedule: ${info.schedule}`;
      card.appendChild(sched);

      const spots = document.createElement("p");
      spots.textContent = `Spots: ${info.participants.length} / ${info.max_participants}`;
      card.appendChild(spots);

      // Participants section
      const participantsWrap = document.createElement("div");
      participantsWrap.className = "participants";

      const participantsTitle = document.createElement("div");
      participantsTitle.className = "participants-title";

      const titleText = document.createElement("span");
      titleText.textContent = "Participants";
      const countBadge = document.createElement("span");
      countBadge.className = "participants-count";
      countBadge.textContent = info.participants.length;

      participantsTitle.appendChild(titleText);
      participantsTitle.appendChild(countBadge);
      participantsWrap.appendChild(participantsTitle);

      if (info.participants && info.participants.length > 0) {
        const ul = document.createElement("ul");
        ul.className = "participants-list";
        info.participants.forEach(p => {
          const li = document.createElement("li");
          li.className = "participant-item";

          const nameSpan = document.createElement("span");
          nameSpan.className = "participant-name";
          nameSpan.textContent = p;

          const removeBtn = document.createElement("button");
          removeBtn.className = "participant-remove";
          removeBtn.title = "Unregister";
          removeBtn.setAttribute("aria-label", `Unregister ${p} from ${name}`);
          removeBtn.innerHTML = "&times;";

          removeBtn.addEventListener("click", async () => {
            removeBtn.disabled = true;
            try {
              const url = `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`;
              const res = await fetch(url, { method: "DELETE" });
              const data = await res.json();
              if (!res.ok) {
                showMessage(data.detail || data.message || "Unregister failed", "error");
              } else {
                showMessage(data.message || "Unregistered successfully", "success");
                await fetchActivities();
              }
            } catch {
              showMessage("An unexpected error occurred.", "error");
            } finally {
              removeBtn.disabled = false;
            }
          });

          li.appendChild(nameSpan);
          li.appendChild(removeBtn);
          ul.appendChild(li);
        });
        participantsWrap.appendChild(ul);
      } else {
        const none = document.createElement("div");
        none.className = "no-participants";
        none.textContent = "No participants yet.";
        participantsWrap.appendChild(none);
      }

      card.appendChild(participantsWrap);
      activitiesList.appendChild(card);
    });
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activityName = activitySelect.value;
    if (!email) return showMessage("Please enter your email.", "error");
    if (!activityName) return showMessage("Please select an activity.", "error");

    submitBtn.disabled = true;
    try {
      const url = `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showMessage(data.detail || data.message || "Signup failed", "error");
      } else {
        showMessage(data.message || "Signed up successfully", "success");
        signupForm.reset();
        await fetchActivities();
      }
    } catch {
      showMessage("An unexpected error occurred.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  fetchActivities();
});
