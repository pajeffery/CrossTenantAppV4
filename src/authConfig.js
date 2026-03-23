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
// We ask for Sites.FullControl.All DELEGATED. 
// This means: "Let this app do what I (the Admin) can do while I'm here."
const loginRequest = {
    scopes: ["User.Read", "Sites.FullControl.All"]
};

// The /.default will pull whatever permissions are configured in the app registration
const tokenRequest = {
    //scopes: ["Sites.FullControl.All"],
    scopes: ["https://graph.microsoft.com/.default"],
    prompt: "consent",
    forceRefresh: false
};
