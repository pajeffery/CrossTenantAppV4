const { app } = require('@azure/functions');
const { TableClient } = require("@azure/data-tables");
// Change this line
const { ManagedIdentityCredential } = require("@azure/identity"); 

app.http('saveClient', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { tenantId, siteUrl, siteId } = await request.json();

            // Initialize inside the handler to ensure the environment is ready
            const credential = new ManagedIdentityCredential();
            const tableClient = new TableClient(
                "https://crosstenantapp.table.core.windows.net",
                "ClientData",
                credential
            );

            const entity = {
                partitionKey: "Clients",
                rowKey: tenantId,
                siteUrl: siteUrl,
                siteId: siteId,
                lastSetup: new Date().toISOString()
            };

            await tableClient.upsertEntity(entity);
            return { status: 200, jsonBody: { message: "Saved to Azure" } };
            
        } catch (error) {
            context.log(`Error in saveClient: ${error.message}`);
            return { status: 500, jsonBody: { error: error.message } };
        }
    }
});
