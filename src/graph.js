async function handleGrant() {
    const siteUrl = document.getElementById('siteUrl').value;
    const status = document.getElementById('statusMessage');
    
    if (!siteUrl) return alert(\"Please enter a site URL\");

    try {
        status.innerText = \"Requesting Permissions...\";

        // 1. Get ONE elevated token for the whole process
        const elevatedRequest = {
            scopes: [\"https://graph.microsoft.com/Sites.FullControl.All\"],
            account: myMSALObj.getAllAccounts()[0]
        };
        const token = await getTokenPopup(elevatedRequest);
        
        // 2. Parse the URL (cleaning up trailing slashes)
        const urlObj = new URL(siteUrl);
        const sitePath = `${urlObj.hostname}:${urlObj.pathname.replace(/\/$/, \"\")}`;

        status.innerText = \"Resolving Site ID...\";

        // 3. Resolve Site ID using the elevated token
        const siteResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${sitePath}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!siteResponse.ok) {
            const errorData = await siteResponse.json();
            throw new Error(`Site Lookup Failed: ${errorData.error.message}`);
        }
        
        const siteData = await siteResponse.json();

        status.innerText = \"Granting Application Access...\";

        // 4. Grant Write permission using the SAME elevated token
        const permissionBody = {
            roles: [\"write\"],
            grantedToIdentities: [{
                application: {
                    id: msalConfig.auth.clientId,
                    displayName: \"Automation App\"
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
            status.innerHTML = \"<span style='color: green;'>Success! Site access granted for Runbook.</span>\";
        } else {
            const err = await grantResponse.json();
            status.innerText = \"Grant Error: \" + err.error.message;
        }
    } catch (error) {
        console.error(error);
        status.innerText = \"Process Failed: \" + error.message;
    }
}
