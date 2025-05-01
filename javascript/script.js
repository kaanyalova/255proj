let currentIndex = 0; // Which profile we are currently showing

document.addEventListener("DOMContentLoaded", function () {
  const signInButton = document.getElementById("signInButton");

  signInButton.addEventListener("click", function () {
    const selectedMajor = document.getElementById("major").value;

    if (selectedMajor === "CTIS") {
      document.querySelector(".selection").style.display = "none"; // Hide the form part
      document.getElementById("profiles-container").style.display = "flex"; // Show profiles container
      showProfile(currentIndex);
    } else {
      alert("Only CTIS students can continue!");
    }
  });
});

function showProfile(index) {
  const container = document.getElementById("profiles-container");
  container.innerHTML = ""; // clear previous profile

  if (index >= profiles.length) {
    container.innerHTML = "<h2>No more profiles!</h2>";
    return;
  }

  const profile = profiles[index];

  const card = document.createElement("div");
  card.classList.add("profile-card");

  card.innerHTML = `
        <img src="${profile.image}" alt="${profile.name} ${profile.surname}" class="profile-image">
        <h3>${profile.name} ${profile.surname}</h3>
        <p>Age: ${profile.age}</p>
        <p>${profile.bio}</p>
        <div class="buttons">
            <button class="action-btn dislike" id="dislikeBtn">Dislike</button>
            <button class="action-btn like" id="likeBtn">Like</button>
        </div>
    `;

  container.appendChild(card);

  // Add event listeners for buttons
  document
    .getElementById("likeBtn")
    .addEventListener("click", () => nextProfile());
  document
    .getElementById("dislikeBtn")
    .addEventListener("click", () => nextProfile());
}

function nextProfile() {
  currentIndex++;
  showProfile(currentIndex);
}