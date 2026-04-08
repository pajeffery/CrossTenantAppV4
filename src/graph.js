/* /src/graph.js */

async function handleGrant() {
    const siteUrl = document.getElementById('siteUrl').value;
    const status = document.getElementById('statusMessage');
    
    if (!siteUrl) return alert("Please enter a site URL");

    const tenantHostname = new URL(siteUrl).hostname;

    const grantRequest = {
        scopes: [
            "openid", 
            "profile", 
            "offline_access",
            "Sites.FullControl.All",
            "Directory.Read.All",
            "DelegatedPermissionGrant.ReadWrite.All",
            `https://${tenantHostname}/AllSites.FullControl`
        ],
        prompt: "consent"
    };

    try {
        status.innerText = "Opening Authorization Window...";

        let account = myMSALObj.getAllAccounts()[0];
        const response = account
            ? await myMSALObj.acquireTokenPopup({ ...grantRequest, account })
            : await myMSALObj.loginPopup(grantRequest);

        const token = response.accessToken;
        const tenantId = response.tenantId;

        if (!token) throw new Error("Could not acquire an access token.");

        status.innerText = "Step 1: Checking if site exists...";

        let siteData;

        try {
            const urlObj = new URL(siteUrl);
            const sitePath = `${urlObj.hostname}:${urlObj.pathname.replace(/\/$/, "")}`;

            const siteResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${sitePath}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const siteJson = await siteResponse.json();

            if (siteJson.id) {
                siteData = siteJson;
                status.innerText = "Site found. Continuing...";
            } else {
                const create = confirm(
                    `A site with the URL "${siteUrl}" was not found in this tenant.\n\nWould you like to create it now?\n\nA new Communication Site titled "Success Reporting" will be created at this URL.`
                );

                if (!create) {
                    status.innerText = "Process cancelled.";
                    return;
                }

                status.innerText = "Creating site...";

                // Get a SharePoint-scoped token for the SPSiteManager API
                const spTokenResponse = await myMSALObj.acquireTokenSilent({
                    scopes: [`https://${tenantHostname}/AllSites.FullControl`],
                    account: response.account
                });
                const spToken = spTokenResponse.accessToken;

                const createResponse = await fetch(`https://${tenantHostname}/_api/SPSiteManager/create`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${spToken}`,
                        "Content-Type": "application/json;odata=verbose",
                        "Accept": "application/json;odata=verbose"
                    },
                    body: JSON.stringify({
                        request: {
                            Title: "Success Reporting",
                            Url: siteUrl,
                            Lcid: 1033,
                            ShareByEmailEnabled: false,
                            Description: "",
                            WebTemplate: "SITEPAGEPUBLISHING#0",
                            SiteDesignId: "00000000-0000-0000-0000-000000000000",
                            HubSiteId: "00000000-0000-0000-0000-000000000000",
                            Owner: response.account.username
                        }
                    })
                });

                const createJson = await createResponse.json();

                if (!createResponse.ok || createJson.d?.Create?.SiteStatus === 0) {
                    throw new Error("Site creation failed: " + (createJson.error?.message || JSON.stringify(createJson)));
                }

                // Fetch the newly created site to get its ID
                const newSiteResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${sitePath}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                siteData = await newSiteResponse.json();
                if (!siteData.id) throw new Error("Site created but could not retrieve site ID.");

                status.innerText = "Site created successfully. Continuing...";
            }

        } catch (siteError) {
            throw new Error("Could not check or create site: " + siteError.message);
        }

        status.innerText = "Step 2: Granting Permanent Runbook Access...";

        const permResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteData.id}/permissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roles: ["write"],
                grantedToIdentities: [{
                    application: { 
                        id: msalConfig.auth.clientId, 
                        displayName: "Information Experience Governance" 
                    }
                }]
            })
        });

        if (!permResponse.ok) throw new Error("Permission Grant Failed.");

        status.innerText = "Step 3: Saving configuration to Azure...";

        try {
            await fetch('/api/saveClient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: tenantId,
                    siteId: siteData.id,
                    siteUrl: siteUrl,
                    adminEmail: response.account.username
                })
            });
        } catch (saveError) {
            console.error("Failed to save to Table Storage, but permissions were granted:", saveError);
        }

        status.innerText = "Step 4: Revoking temporary admin session...";

        const spResponse = await fetch(`https://graph.microsoft.com/v1.0/servicePrincipals?$filter=appId eq '${msalConfig.auth.clientId}'`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const spData = await spResponse.json();
        const spObjectId = spData.value[0].id;

        const grantsResponse = await fetch(`https://graph.microsoft.com/v1.0/oauth2PermissionGrants?$filter=clientId eq '${spObjectId}'`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const grantsData = await grantsResponse.json();
        
        if (grantsData && Array.isArray(grantsData.value)) {
            for (const grant of grantsData.value) {
                try {
                    await fetch(`https://graph.microsoft.com/v1.0/oauth2PermissionGrants/${grant.id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (innerError) {
                    break; 
                }
            }
        }
        
        status.innerHTML = "<span style='color: #28a745; font-weight: bold;'>Success! Access saved and session closed.</span>";

    } catch (error) {
        status.innerText = "Process Failed: " + error.message;
    }
}
