/* Updated /src/ui.js - Restores UI transitions */
function showWelcomeMessage(account) {
    console.log("Authenticated as:", account.username);
    
    // Hide both the Sign In and Onboarding buttons
    const buttonsToHide = ["SignIn", "AdminOnboardFull"];
    buttonsToHide.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.add("d-none");
    });

    // Reveal the main content area (where the site URL input is)
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
        mainContent.classList.remove("d-none");
    }

    // Show the Sign Out button and display the username
    const signOutBtn = document.getElementById("SignOut");
    if (signOutBtn) signOutBtn.classList.remove("d-none");
    
    const usernameSpan = document.getElementById("username");
    if (usernameSpan) usernameSpan.innerText = account.username;
}
