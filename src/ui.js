/* Updated /src/ui.js */
function showWelcomeMessage(account) {
    // Check for the new button ID instead of "SignIn"
    const loginButton = document.getElementById("AdminOnboardFull");
    if (loginButton) {
        loginButton.classList.add("d-none");
    }

    // This line reveals the section containing your input box
    document.getElementById("main-content").classList.remove("d-none");
    
    // Update the UI with the user's name
    document.getElementById("SignOut").classList.remove("d-none");
    document.getElementById("username").innerText = account.username;
}
