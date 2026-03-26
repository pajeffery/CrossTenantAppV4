/* /src/ui.js */

function showWelcomeMessage(account) {
    // 1. Update Navigation
    const signInBtn = document.getElementById("SignIn");
    const signOutBtn = document.getElementById("SignOut");
    
    if (signInBtn) signInBtn.classList.add("d-none");
    if (signOutBtn) signOutBtn.classList.remove("d-none");

    // 2. Reveal the User Info (if you have a place for it)
    const userField = document.getElementById("username");
    if (userField) userField.innerText = account.username;

    // 3. Unlock Step 2 of the Success Service
    // This calls the helper we just made in authPopup.js
    if (typeof unlockStep2 === "function") {
        unlockStep2();
    }
}
