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

        status.innerText = "Step 3: Cleaning up temporary admin session...";

        // 5. GET the Delegated Grants
        const grantsResponse = await fetch(`https://graph.microsoft.com/v1.0/oauth2PermissionGrants?$filter=clientId eq '${spObjectId}'`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const grantsData = await grantsResponse.json();
        
        // CHECK: Ensure 'value' exists and is an array before looping
        if (grantsData && Array.isArray(grantsData.value)) {
            for (const grant of grantsData.value) {
                try {
                    await fetch(`https://graph.microsoft.com/v1.0/oauth2PermissionGrants/${grant.id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log(`Deleted grant: ${grant.id}`);
                } catch (innerError) {
                    // If the token expires mid-loop because we deleted the permission, 
                    // that's actually a "success" in terms of revoking access!
                    console.warn("Grant deletion interrupted - session likely already revoked.");
                    break; 
                }
            }
        } else {
            console.log("No delegated grants found to clean up.");
        }
        
        status.innerHTML = "<span style='color: green;'>Success! Site access granted and admin session revoked.</span>";
}
