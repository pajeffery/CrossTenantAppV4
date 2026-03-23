async function handleGrant() {
    const siteUrl = document.getElementById('siteUrl').value;
    const status = document.getElementById('statusMessage');
    
    if (!siteUrl) return alert("Please enter a site URL");

    try {
        status.innerText = "Requesting elevated access...";

        // DYNAMIC REQUEST: This scope is NOT in your app registration.
        // It is requested only now to perform the administrative grant.
        const dynamicRequest = {
            scopes: ["https://graph.microsoft.com/Sites.FullControl.All"],
            account: myMSALObj.getAllAccounts()[0]
        };

        // This triggers a popup for the 'FullControl' scope
        const token = await getTokenPopup(dynamicRequest);
        
        // Parse the URL to get the site path
        // From: https://tenant.sharepoint.com/sites/Marketing
        // To: tenant.sharepoint.com:/sites/Marketing
        const urlObj = new URL(siteUrl);
        const sitePath = `${urlObj.hostname}:${urlObj.pathname.replace(/\/$/, "")}`;

        // 1. Resolve Site ID using the elevated token
        const siteResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${sitePath}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const siteData = await siteResponse.json();
        if (!siteData.id) throw new Error("Site not found.");

        // 2. Grant 'write' role to the Application ID
        const permissionBody = {
            roles: ["write"],
            grantedToIdentities: [{
                application: {
                    id: msalConfig.auth.clientId,
                    displayName: "Automation App"
                }
            }]
        };

        const grantResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteData.id}/permissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(permissionBody)
        });

        if (grantResponse.ok) {
            status.innerHTML = "<span style='color: green;'>Success! Site access granted.</span>";
        } else {
            const err = await grantResponse.json();
            status.innerText = "Grant Error: " + err.error.message;
        }
    } catch (error) {
        status.innerText = "Failed: " + error.message;
    }
}
