const { app } = require('@azure/functions');
const { DefaultAzureCredential } = require("@azure/identity");

app.http('saveClient', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log("Diagnostic Start: Testing Managed Identity...");
        
        try {
            const credential = new DefaultAzureCredential();
            
            // We ask for a token for the Azure Management API as a test
            const token = await credential.getToken("https://management.azure.com/.default");
            
            return { 
                status: 200, 
                jsonBody: { 
                    message: "Identity is working!",
                    expiresOn: token.expiresOnTimestamp,
                    tokenType: typeof token.token === 'string' ? "Received Successfully" : "Malformed"
                } 
            };
        } catch (err) {
            return { 
                status: 500, 
                jsonBody: { 
                    diagnosticError: err.message,
                    stack: err.stack,
                    hint: "If you see 'expires_on' error here, the Identity is definitely not active on the underlying host."
                } 
            };
        }
    }
});
