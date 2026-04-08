const { app } = require('@azure/functions');
const { TableClient } = require("@azure/data-tables");

app.http('saveClient', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { tenantId, siteUrl, siteId, adminEmail } = await request.json();

            const tableClient = TableClient.fromConnectionString(
                process.env.STORAGE_CONNECTION_STRING,
                "ClientData"
            );

            await tableClient.createTable().catch(() => {});

            const entity = {
                partitionKey: "Clients",
                rowKey: tenantId,
                siteUrl: siteUrl,
                siteId: siteId,
                adminEmail: adminEmail,
                lastSetup: new Date().toISOString(),
                isEnabled: false
            };

            await tableClient.upsertEntity(entity);
            return { status: 200, jsonBody: { message: "Saved successfully" } };

        } catch (error) {
            context.log("Error saving to table:", error.message);
            return { status: 500, jsonBody: { error: error.message } };
        }
    }
});
