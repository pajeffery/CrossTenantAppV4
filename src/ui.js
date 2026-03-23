function showWelcomeMessage(account) {
    document.getElementById("SignIn").classList.add("d-none");
    document.getElementById("SignOut").classList.remove("d-none");
    document.getElementById("main-content").classList.remove("d-none");
    document.getElementById("username").innerText = account.username;
}
