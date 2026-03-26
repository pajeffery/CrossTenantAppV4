const myMSALObj = new msal.PublicClientApplication(msalConfig);

// Automatically check if a user is already signed in on page load
myMSALObj.handleRedirectPromise().then((response) => {
    const currentAccounts = myMSALObj.getAllAccounts();
    if (currentAccounts.length > 0) {
        showWelcomeMessage(currentAccounts[0]);
    }
});

async function signIn() {
    try {
        const loginResponse = await myMSALObj.loginPopup(loginRequest);
        showWelcomeMessage(loginResponse.account);
    } catch (error) {
        console.error("Sign-in failed:", error);
    }
}

function signOut() {
    const logoutRequest = { account: myMSALObj.getAllAccounts()[0] };
    myMSALObj.logoutPopup(logoutRequest);
}

function redirectForAdminConsent() {
    const clientId = msalConfig.auth.clientId;
    const redirectUri = encodeURIComponent(window.location.origin);
    const tenant = "organizations"; 
    const adminConsentUrl = `https://login.microsoftonline.com/${tenant}/v2.0/adminconsent?client_id=${clientId}&redirect_uri=${redirectUri}&scope=https://graph.microsoft.com/.default`;
    window.location.assign(adminConsentUrl);
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
