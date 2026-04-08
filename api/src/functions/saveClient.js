const { app } = require('@azure/functions');
const { TableClient } = require("@azure/data-tables");
const { ManagedIdentityCredential } = require("@azure/identity");

app.http('saveClient', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { tenantId, siteUrl, siteId, adminEmail } = await request.json();

            const credential = new ManagedIdentityCredential();
            
            const tableClient = new TableClient(
                "https://crosstenantapp.table.core.windows.net",
                "ClientData",
                credential
            );

            await tableClient.createTable().catch(() => {});

            const entity = {
                partitionKey: "Clients",
                rowKey: tenantId,
                siteUrl: siteUrl,
                siteId: siteId,
                adminEmail: adminEmail,
                lastSetup: new Date().toISOString()
            };

            await tableClient.upsertEntity(entity);
            return { status: 200, jsonBody: { message: "Saved successfully" } };

        } catch (error) {
            context.log("Error saving to table:", error.message);
            return { status: 500, jsonBody: { error: error.message } };
        }
    }
});
