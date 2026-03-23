async function handleGrant() {
    const siteUrl = document.getElementById('siteUrl').value;
    const status = document.getElementById('statusMessage');
    
    if (!siteUrl) return alert("Please enter a site URL");

    try {
        status.innerText = "Processing...";
        const token = await getTokenPopup(tokenRequest);
        
        // 1. Parse the URL to get the site path
        // From: https://tenant.sharepoint.com/sites/Marketing
        // To: tenant.sharepoint.com:/sites/Marketing
        const urlObj = new URL(siteUrl);
        const sitePath = `${urlObj.hostname}:${urlObj.pathname}`;

        // 2. Resolve Site ID
        const siteResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${sitePath}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const siteData = await siteResponse.json();

        if (!siteData.id) throw new Error("Site not found.");

        // 3. Grant Write permission to YOUR app's identity
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
            status.innerText = "Success! Access granted to this site.";
        } else {
            const err = await grantResponse.json();
            status.innerText = "Error: " + err.error.message;
        }
    } catch (error) {
        console.error(error);
        status.innerText = "Failed: " + error.message;
    }
}
