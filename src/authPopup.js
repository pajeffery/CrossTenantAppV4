/* /src/authPopup.js */

const myMSALObj = new msal.PublicClientApplication(msalConfig);

/**
 * Handle the redirect after Admin Consent or Login
 */
myMSALObj.handleRedirectPromise()
    .then((response) => {
        const currentAccounts = myMSALObj.getAllAccounts();
        
        // Check 1: Are we officially signed in?
        if (currentAccounts.length > 0) {
            showWelcomeMessage(currentAccounts[0]);
        } 
        
        // Check 2: Did we just return from an Admin Consent redirect?
        // We look for the "admin_consent" parameter Microsoft adds to the URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("admin_consent")) {
            console.log("Admin Consent detected in URL. Unlocking Step 2.");
            unlockStep2();
        }
    })
    .catch((error) => {
        console.error("Auth Error:", error);
    });

/**
 * Specifically reveals Step 2 (The Success Service site input)
 */
function unlockStep2() {
    const step2 = document.getElementById("step-2-config");
    if (step2) {
        step2.classList.remove("d-none");
    }

    // Update Step 1 button to show it's done
    const onboardBtn = document.getElementById("AdminOnboardFull");
    if (onboardBtn) {
        onboardBtn.innerText = "Tenant Onboarded ✓";
        onboardBtn.classList.add("btn-success"); // Assuming you have a success style
        onboardBtn.disabled = true;
    }
}

async function signIn() {
    try {
        const loginResponse = await myMSALObj.loginPopup(loginRequest);
        showWelcomeMessage(loginResponse.account);
    } catch (error) {
        console.error("Sign-in failed:", error);
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

    // This URL sends the user to Microsoft to authorize the app for the whole tenant
    const adminConsentUrl = `https://login.microsoftonline.com/${tenant}/v2.0/adminconsent?client_id=${clientId}&redirect_uri=${redirectUri}&scope=https://graph.microsoft.com/.default`;
    
    window.location.assign(adminConsentUrl);
}

async function getTokenPopup(request) {
    const currentAccounts = myMSALObj.getAllAccounts()[0];
    if (!currentAccounts) {
        // If the box is visible but they aren't signed in, we need to sign them in now
        await signIn();
    }
    
    request.account = myMSALObj.getAllAccounts()[0];

    try {
        const response = await myMSALObj.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        const response = await myMSALObj.acquireTokenPopup(request);
        return response.accessToken;
    }
}
