const myMSALObj = new msal.PublicClientApplication(msalConfig);

async function signIn() {
    try {
        const loginResponse = await myMSALObj.loginPopup(loginRequest);
        console.log("id_token acquired at: " + new Date().toString());
        showWelcomeMessage(loginResponse.account);
    } catch (error) {
        console.error(error);
    }
}

async function getTokenPopup(request) {
    request.account = myMSALObj.getAllAccounts()[0];
    try {
        const response = await myMSALObj.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        return (await myMSALObj.acquireTokenPopup(request)).accessToken;
    }
}

function signOut() {
    const logoutRequest = { account: myMSALObj.getAccountByHomeId(sessionStorage.getItem("homeId")) };
    myMSALObj.logoutPopup(logoutRequest);
}

async function adminOnboarding() {
    const onboardingRequest = {
        // We bypass the Portal's list and ask for exactly what we need here
        scopes: [
            "https://graph.microsoft.com/User.Read", 
            "https://graph.microsoft.com/Sites.Read.All", // To find the site
            "https://graph.microsoft.com/Sites.FullControl.All" // To grant the permission
        ],
        prompt: "consent" 
    };

    try {
        const loginResponse = await myMSALObj.loginPopup(onboardingRequest);
        showWelcomeMessage(loginResponse.account);
    } catch (error) {
        console.error("Onboarding failed:", error);
    }
}

function redirectForAdminConsent() {
    const clientId = msalConfig.auth.clientId;
    const redirectUri = encodeURIComponent(window.location.origin);
    const tenant = "common"; // Use 'common' for multi-tenant
    
    // This URL bypasses MSAL logic and goes straight to the Azure "Master Grant" page
    const adminConsentUrl = `https://login.microsoftonline.com/${tenant}/v2.0/adminconsent?client_id=${clientId}&redirect_uri=${redirectUri}&scope=https://graph.microsoft.com/.default`;
    
    window.location.href = adminConsentUrl;
}
