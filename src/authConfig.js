const msalConfig = {
    auth: {
        clientId: "a358a2b7-47e7-4a31-ad04-630a7b3fa5cc", 
        authority: "https://login.microsoftonline.com/common", 
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};
