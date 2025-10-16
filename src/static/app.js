document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Funzione per ottenere i partecipanti tramite API
  async function getParticipantInfo(activity) {
    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/participants`);
      const participants = await response.json();
      return participants;
    } catch (error) {
      console.error("Error fetching participant info:", error);
      return [];
    }
  }

  // Funzione per creare la scheda attività con partecipanti
  async function createActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const spotsLeft = details.max_participants - details.participants.length;

    activityCard.innerHTML = `
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p><strong>Schedule:</strong> ${details.schedule}</p>
      <p class="spots"><strong>Availability:</strong> ${spotsLeft} spots left</p>
      <div class="participants-section">
        <div class="participants-header">
          <strong>Participants</strong> <span class="badge">0</span>
        </div>
        <ul class="participants-list">
          <li class="participant-item empty">Loading participants...</li>
        </ul>
      </div>
    `;

    // Recupera i partecipanti e aggiorna la lista
    const ul = activityCard.querySelector('.participants-list');
    const badge = activityCard.querySelector('.participants-header .badge');
    const participants = await getParticipantInfo(name);

    ul.innerHTML = '';
    if (participants && participants.length > 0) {
      participants.forEach(p => {
        const li = document.createElement('li');
        li.className = 'participant-item';
        
        const participantText = document.createElement('span');
        participantText.textContent = p;
        li.appendChild(participantText);
        
        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'delete-icon';
        deleteIcon.innerHTML = '✕';
        deleteIcon.addEventListener('click', async () => {
          try {
            const response = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, {
              method: 'DELETE'
            });
            
            if (response.ok) {
              // Rimuovi il partecipante dalla lista
              li.remove();
              
              // Aggiorna il contatore
              const badge = activityCard.querySelector('.participants-header .badge');
              const currentCount = parseInt(badge.textContent) - 1;
              badge.textContent = currentCount;
              
              // Se non ci sono più partecipanti, mostra il messaggio vuoto
              if (currentCount === 0) {
                const emptyLi = document.createElement('li');
                emptyLi.className = 'participant-item empty';
                emptyLi.textContent = 'No participants yet.';
                ul.appendChild(emptyLi);
              }

              // Aggiorna il testo degli spot disponibili
              const spots = activityCard.querySelector('.spots');
              const spotsLeft = parseInt(spots.textContent.split('left')[0].trim()) + 1;
              spots.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
            }
          } catch (error) {
            console.error('Error unregistering participant:', error);
          }
        });
        li.appendChild(deleteIcon);
        ul.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.className = 'participant-item empty';
      li.textContent = 'No participants yet.';
      ul.appendChild(li);
    }
    badge.textContent = participants.length;

    return activityCard;
  }

  // Funzione per caricare le attività e popolare la UI
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll('option:not([value=""])').forEach(o => o.remove());

      // Popola la lista attività
      for (const [name, details] of Object.entries(activities)) {
        const activityCard = await createActivityCard(name, details);
        activitiesList.appendChild(activityCard);

        // Aggiungi opzione al select
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      }
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Gestione invio form
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

        // Aggiorna la lista partecipanti nella scheda corrispondente
        const card = Array.from(document.querySelectorAll('.activity-card')).find(
          c => c.querySelector('h4').textContent === activity
        );
        if (card) {
          const ul = card.querySelector('.participants-list');
          const badge = card.querySelector('.participants-header .badge');
          // Aggiorna la lista tramite API
          const participants = await getParticipantInfo(activity);
          ul.innerHTML = '';
          if (participants.length > 0) {
            participants.forEach(p => {
              const li = document.createElement('li');
              li.className = 'participant-item';
              
              const participantText = document.createElement('span');
              participantText.textContent = p;
              li.appendChild(participantText);
              
              const deleteIcon = document.createElement('span');
              deleteIcon.className = 'delete-icon';
              deleteIcon.innerHTML = '✕';
              deleteIcon.addEventListener('click', async () => {
                try {
                  const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(p)}`, {
                    method: 'DELETE'
                  });
                  
                  if (response.ok) {
                    // Rimuovi il partecipante dalla lista
                    li.remove();
                    
                    // Aggiorna il contatore
                    const badge = card.querySelector('.participants-header .badge');
                    const currentCount = parseInt(badge.textContent) - 1;
                    badge.textContent = currentCount;
                    
                    // Se non ci sono più partecipanti, mostra il messaggio vuoto
                    if (currentCount === 0) {
                      const emptyLi = document.createElement('li');
                      emptyLi.className = 'participant-item empty';
                      emptyLi.textContent = 'No participants yet.';
                      ul.appendChild(emptyLi);
                    }

                    // Aggiorna il testo degli spot disponibili
                    const spots = card.querySelector('.spots');
                    const spotsLeft = parseInt(spots.textContent.split('left')[0].trim()) + 1;
                    spots.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
                  }
                } catch (error) {
                  console.error('Error unregistering participant:', error);
                }
              });
              li.appendChild(deleteIcon);
              ul.appendChild(li);
            });
          } else {
            const li = document.createElement('li');
            li.className = 'participant-item empty';
            li.textContent = 'No participants yet.';
            ul.appendChild(li);
          }
          badge.textContent = participants.length;
          // Aggiorna spots
          const spots = card.querySelector('.spots');
          const spotsLeft = card && card.querySelector('h4') && result.spots_left !== undefined
            ? result.spots_left
            : null;
          if (spots && spotsLeft !== null) {
            spots.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
          } else if (spots) {
            // fallback: calcola spots left
            const max = activitiesList.querySelectorAll('.activity-card').length > 0
              ? activitiesList.querySelector('.activity-card').querySelector('.spots').textContent.split(' ').pop()
              : details.max_participants;
            spots.innerHTML = `<strong>Availability:</strong> ${participants.length} / ${max}`;
          }
        }
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

  // Inizializza app
  fetchActivities();
});