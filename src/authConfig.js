const msalConfig = {
    auth: {
        clientId: "YOUR_APP_CLIENT_ID_FROM_AZURE", 
        // Use 'common' for multi-tenant apps
        authority: "https://login.microsoftonline.com/common", 
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};

// Scopes for the admin to consent to
const loginRequest = {
    scopes: ["User.Read", "Sites.FullControl.All"]
};

// Scopes for making the actual Graph calls
const tokenRequest = {
    scopes: ["Sites.FullControl.All"],
    forceRefresh: false
};
