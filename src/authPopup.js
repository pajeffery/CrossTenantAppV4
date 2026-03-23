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
