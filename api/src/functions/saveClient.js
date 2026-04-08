const { app } = require('@azure/functions');
const { TableClient } = require("@azure/data-tables");

const { ManagedIdentityCredential } = require("@azure/identity");

const tableClient = new TableClient(
    "https://crosstenantapp.table.core.windows.net",
    "ClientData",
    new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID)
);

const tableClient = new TableClient(
    "https://crosstenantapp.table.core.windows.net",
    "ClientData",
    new DefaultAzureCredential()
);

app.http('saveClient', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const { tenantId, siteUrl, siteId } = await request.json();

        const entity = {
            partitionKey: "Clients",
            rowKey: tenantId, // Use Tenant ID as the unique identifier
            siteUrl: siteUrl,
            siteId: siteId,
            lastSetup: new Date().toISOString()
        };

        await tableClient.upsertEntity(entity);
        return { status: 200, jsonBody: { message: "Saved to Azure" } };
    }
});
