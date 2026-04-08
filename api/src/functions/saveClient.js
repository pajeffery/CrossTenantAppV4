const { app } = require('@azure/functions');
const { TableClient } = require("@azure/data-tables");
const { ManagedIdentityCredential } = require("@azure/identity");

const tableClient = new TableClient(
    "https://crosstenantapp.table.core.windows.net",
    "ClientData",
    new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID)
);

app.http('saveClient', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {

        // --- Diagnostic block ---
        try {
            const cred = new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID);
            const token = await cred.getToken("https://storage.azure.com/.default");
            context.log("Token acquired:", token ? "YES" : "NO");
        } catch (err) {
            context.log("Auth diagnostic error:", err.message);
            return { status: 500, jsonBody: { error: err.message } };
        }
        // --- End diagnostic block ---

        const { tenantId, siteUrl, siteId } = await request.json();

        const entity = {
            partitionKey: "Clients",
            rowKey: tenantId,
            siteUrl: siteUrl,
            siteId: siteId,
            lastSetup: new Date().toISOString()
        };

        await tableClient.upsertEntity(entity);
        return { status: 200, jsonBody: { message: "Saved to Azure" } };
    }
});
