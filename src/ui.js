/* Updated /src/ui.js */
function showWelcomeMessage(account) {
    // Change "SignIn" to "AdminOnboardFull"
    if (document.getElementById("AdminOnboardFull")) {
        document.getElementById("AdminOnboardFull").classList.add("d-none");
    }
    
    document.getElementById("SignOut").classList.remove("d-none");
    document.getElementById("main-content").classList.remove("d-none");
    document.getElementById("username").innerText = account.username;
}
