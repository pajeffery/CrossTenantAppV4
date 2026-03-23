const msalConfig = {
    auth: {
        clientId: "a358a2b7-47e7-4a31-ad04-630a7b3fa5cc", 
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
