async function handleGrant() {
    const siteUrl = document.getElementById('siteUrl').value;
    const status = document.getElementById('statusMessage');
    
    if (!siteUrl) return alert("Please enter a site URL");

    const grantRequest = {
        scopes: [
            "openid", 
            "profile", 
            "offline_access",
            "Sites.FullControl.All",
            "Directory.Read.All",
            "DelegatedPermissionGrant.ReadWrite.All"
        ],
        prompt: "consent"
    };

    try {
        status.innerText = "Opening Authorization Window...";

        // acquireTokenPopup called immediately - before any awaits - so
        // the browser treats it as a direct response to the button click
        let account = myMSALObj.getAllAccounts()[0];
        const response = account
            ? await myMSALObj.acquireTokenPopup({ ...grantRequest, account })
            : await myMSALObj.loginPopup(grantRequest);

        const token = response.accessToken;
        const tenantId = response.tenantId;

        if (!token) throw new Error("Could not acquire an access token.");

        status.innerText = "Step 1: Resolving Site ID...";
        
        const urlObj = new URL(siteUrl);
        const sitePath = `${urlObj.hostname}:${urlObj.pathname.replace(/\/$/, "")}`;
        
        const siteResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${sitePath}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const siteData = await siteResponse.json();
        if (!siteData.id) throw new Error("Site not found.");

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
