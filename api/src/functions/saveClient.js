const { app } = require('@azure/functions');
const { TableClient } = require("@azure/data-tables");
const { DefaultAzureCredential } = require("@azure/identity");

app.http('saveClient', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { tenantId, siteUrl, siteId } = await request.json();

            // MOVE INITIALIZATION HERE
            const tableClient = new TableClient(
                "https://crosstenantapp.table.core.windows.net",
                "ClientData",
                new DefaultAzureCredential()
            );

            const entity = {
                partitionKey: "Clients",
                rowKey: tenantId,
                siteUrl: siteUrl,
                siteId: siteId,
                lastSetup: new Date().toISOString()
            };

            await tableClient.upsertEntity(entity);
            
            return { 
                status: 200, 
                jsonBody: { message: "Success! Data saved." } 
            };

        } catch (error) {
            // This will now show up in your Browser "Response" tab
            return { 
                status: 500, 
                jsonBody: { error: error.message, stack: error.stack } 
            };
        }
    }
});
