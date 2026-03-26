/* /src/authPopup.js 
    Handles MSAL initialization, Sign-in/out, and Admin Consent Redirects
*/

const myMSALObj = new msal.PublicClientApplication(msalConfig);

/**
 * This checks if the page was loaded as a result of a redirect (like Admin Consent).
 * If a user is already signed in, it automatically updates the UI.
 */
myMSALObj.handleRedirectPromise()
    .then((response) => {
        const currentAccounts = myMSALObj.getAllAccounts();
        if (currentAccounts.length > 0) {
            // User is signed in, trigger UI updates for Step 2
            showWelcomeMessage(currentAccounts[0]);
        }
    })
    .catch((error) => {
        console.error("Redirect error:", error);
    });

/**
 * Standard Sign-In using a Popup
 */
async function signIn() {
    try {
        const loginResponse = await myMSALObj.loginPopup(loginRequest);
        console.log("Sign-in successful");
        showWelcomeMessage(loginResponse.account);
    } catch (error) {
        console.error("Sign-in failed:", error);
    }
}

/**
 * Standard Sign-Out
 */
function signOut() {
    const currentAccounts = myMSALObj.getAllAccounts();
    if (currentAccounts.length === 0) return;

    const logoutRequest = {
        account: currentAccounts[0],
        postLogoutRedirectUri: window.location.origin
    };

    myMSALObj.logoutPopup(logoutRequest);
}

/**
 * STEP 1: Admin Onboarding
 * Redirects the user to Microsoft's official Admin Consent page.
 * After the admin clicks "Accept", they are redirected back to this app.
 */
function redirectForAdminConsent() {
    const clientId = msalConfig.auth.clientId;
    const redirectUri = encodeURIComponent(window.location.origin);
    
    // We use 'organizations' to ensure a tenant-specific admin logs in
    const tenant = "organizations"; 

    // The /.default scope tells Azure to request all permissions configured in the App Registration
    const adminConsentUrl = `https://login.microsoftonline.com/${tenant}/v2.0/adminconsent?client_id=${clientId}&redirect_uri=${redirectUri}&scope=https://graph.microsoft.com/.default`;
    
    window.location.assign(adminConsentUrl);
}

/**
 * Helper to get a token for Graph API calls
 * Used primarily by graph.js
 */
async function getTokenPopup(request) {
    const currentAccounts = myMSALObj.getAllAccounts();
    if (currentAccounts.length === 0) {
        throw new Error("No active account found. Please sign in.");
    }

    request.account = currentAccounts[0];

    try {
        // Try to get token silently from cache first
        const response = await myMSALObj.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        console.warn("Silent token acquisition failed. Acquiring via popup.");
        // Fallback to popup if silent acquisition fails
        const response = await myMSALObj.acquireTokenPopup(request);
        return response.accessToken;
    }
}
