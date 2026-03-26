/* /src/authPopup.js */

const myMSALObj = new msal.PublicClientApplication(msalConfig);

myMSALObj.handleRedirectPromise()
    .then((response) => {
        const currentAccounts = myMSALObj.getAllAccounts();
        if (currentAccounts.length > 0) {
            showWelcomeMessage(currentAccounts[0]);
        } 
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("admin_consent")) {
            console.log("Admin Consent detected in URL. Unlocking Step 2.");
            unlockStep2();
        }
    })
    .catch((error) => {
        console.error("Auth Error:", error);
    });

function unlockStep2() {
    const step2 = document.getElementById("step-2-config");
    if (step2) {
        step2.classList.remove("d-none");
    }

    const onboardBtn = document.getElementById("AdminOnboardFull");
    if (onboardBtn) {
        onboardBtn.innerText = "Tenant Onboarded ✓";
        onboardBtn.classList.add("btn-success"); 
        onboardBtn.disabled = true;
    }
}

async function signIn() {
    try {
        const loginResponse = await myMSALObj.loginPopup(loginRequest);
        showWelcomeMessage(loginResponse.account);
        return loginResponse.account; // Return the account for other functions to use
    } catch (error) {
        console.error("Sign-in failed:", error);
        throw error;
    }
}

function signOut() {
    const logoutRequest = {
        account: myMSALObj.getAllAccounts()[0],
        postLogoutRedirectUri: window.location.origin
    };
    myMSALObj.logoutPopup(logoutRequest);
}

function redirectForAdminConsent() {
    const clientId = msalConfig.auth.clientId;
    const redirectUri = encodeURIComponent(window.location.origin);
    const tenant = "organizations"; 
    const adminConsentUrl = `https://login.microsoftonline.com/${tenant}/v2.0/adminconsent?client_id=${clientId}&redirect_uri=${redirectUri}&scope=https://graph.microsoft.com/.default`;
    window.location.assign(adminConsentUrl);
}

// THE FIX IS IN THIS FUNCTION
async function getTokenPopup(request) {
    let currentAccount = myMSALObj.getAllAccounts()[0];
    
    // If not signed in, force a sign in first before trying to get the token
    if (!currentAccount) {
        console.warn("No account found, forcing login...");
        currentAccount = await signIn();
    }
    
    request.account = currentAccount;

    try {
        // Try getting token silently
        console.log("Attempting silent token acquisition...");
        const response = await myMSALObj.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        console.warn("Silent token failed. Initiating interactive consent popup...", error.errorCode);
        
        // If silent fails (usually because of consent_required), force the popup
        // The key here is passing 'prompt: "consent"' to ensure the Azure screen shows up
        const interactiveRequest = {
            scopes: request.scopes,
            account: currentAccount,
            prompt: "consent", 
            loginHint: currentAccount.username // Crucial for routing them to the right admin login
        };
        
        try {
            const popupResponse = await myMSALObj.acquireTokenPopup(interactiveRequest);
            return popupResponse.accessToken;
        } catch (popupError) {
            console.error("Interactive consent failed. User may have closed the window.", popupError);
            throw popupError;
        }
    }
}
