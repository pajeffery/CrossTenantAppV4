function showWelcomeMessage(account) {
    // 1. Manage Navigation buttons
    document.getElementById("SignIn").classList.add("d-none");
    document.getElementById("SignOut").classList.remove("d-none");

    // 2. Manage the Service Card Steps
    // We show Step 2 (Site Input) only after the user is authenticated
    const step2 = document.getElementById("step-2-config");
    if (step2) {
        step2.classList.remove("d-none");
    }

    // Optional: Gray out or visually complete Step 1
    const onboardBtn = document.getElementById("AdminOnboardFull");
    if (onboardBtn) {
        onboardBtn.innerText = "Tenant Onboarded ✓";
        onboardBtn.style.opacity = "0.6";
        onboardBtn.disabled = true;
    }

    // 3. Update the username in the UI if you have a placeholder for it
    const userField = document.getElementById("username");
    if (userField) userField.innerText = account.username;
}
