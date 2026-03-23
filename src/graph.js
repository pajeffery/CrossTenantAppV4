async function handleGrant() {
    const siteUrl = document.getElementById('siteUrl').value;
    const status = document.getElementById('statusMessage');
    
    if (!siteUrl) return alert("Please enter a site URL");

    try {
        status.innerText = "Step 1: Requesting Elevated Setup Access...";

        // 1. Dynamic Request for FullControl (Not in your Portal)
        const dynamicRequest = {
            scopes: ["https://graph.microsoft.com/Sites.FullControl.All", "https://graph.microsoft.com/AppRoleAssignment.ReadWrite.All"],
            account: myMSALObj.getAllAccounts()[0]
        };

        const token = await getTokenPopup(dynamicRequest);
        
        // 2. Resolve Site ID
        const urlObj = new URL(siteUrl);
        const sitePath = `${urlObj.hostname}:${urlObj.pathname.replace(/\/$/, "")}`;
        const siteResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${sitePath}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const siteData = await siteResponse.json();
        if (!siteData.id) throw new Error("Site not found.");

        status.innerText = "Step 2: Granting Permanent Runbook Access...";

        // 3. Grant 'write' role to the Application ID (Permanent Application Permission)
        const grantResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteData.id}/permissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roles: ["write"],
                grantedToIdentities: [{
                    application: { id: msalConfig.auth.clientId, displayName: "Automation App" }
                }]
            })
        });

        if (!grantResponse.ok) throw new Error("Failed to grant site access.");

        status.innerText = "Step 3: Cleaning up temporary admin session...";

        // 4. FIND the Service Principal ID for this tenant
        const spResponse = await fetch(`https://graph.microsoft.com/v1.0/servicePrincipals?$filter=appId eq '${msalConfig.auth.clientId}'`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const spData = await spResponse.json();
        const spObjectId = spData.value[0].id;

        // 5. DELETE the Delegated Grant (The "Self-Clean" step)
        // This removes the "FullControl" from the Enterprise App but leaves the Site Permission
        const grantsResponse = await fetch(`https://graph.microsoft.com/v1.0/oauth2PermissionGrants?$filter=clientId eq '${spObjectId}'`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const grantsData = await grantsResponse.json();

        for (const grant of grantsData.value) {
            await fetch(`https://graph.microsoft.com/v1.0/oauth2PermissionGrants/${grant.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
        }

        status.innerHTML = "<span style='color: green;'>Success! Site access granted and admin session revoked.</span>";

    } catch (error) {
        console.error(error);
        status.innerText = "Process Failed: " + error.message;
    }
}
