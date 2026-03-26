/* /src/graph.js */

async function handleGrant() {
    const siteUrl = document.getElementById('siteUrl').value;
    const status = document.getElementById('statusMessage');
    
    if (!siteUrl) return alert("Please enter a site URL");

    try {
        status.innerText = "Opening Authorization Window...";

        // Define exactly what we need for this specific action
        const grantRequest = {
            scopes: [
                "https://graph.microsoft.com/Sites.FullControl.All",
                "https://graph.microsoft.com/Directory.Read.All",
                "https://graph.microsoft.com/DelegatedPermissionGrant.ReadWrite.All"
            ],
            prompt: "consent" // Uncomment this to ALWAYS force the consent screen
        };

        // Simplified: Go straight to a popup. 
        // This ignores the background cache and just asks the user directly.
        const response = await myMSALObj.loginPopup(grantRequest);
        
        // The token is now in response.accessToken
        const token = response.accessToken;

        status.innerText = "Step 1: Resolving Site ID...";
        
        // Proceed with your Graph API calls using 'token'
        // e.g., await resolveSiteId(siteUrl, token);

    } catch (error) {
        console.error("Authorization failed:", error);
        status.innerText = "Error: " + error.message;
    }
}
        status.innerText = "Step 1: Resolving Site ID...";
        
        // ... (The rest of your graph.js code remains exactly the same starting from Step 2)
        // 2. Resolve Site ID
        const urlObj = new URL(siteUrl);
        const sitePath = `${urlObj.hostname}:${urlObj.pathname.replace(/\/$/, "")}`;
        const siteResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${sitePath}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const siteData = await siteResponse.json();
        
        if (!siteData.id) throw new Error("Site not found. Check the URL and try again.");

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
                    application: { id: msalConfig.auth.clientId, displayName: "Information Experience Governance" }
                }]
            })
        });

        if (!grantResponse.ok) {
            const errorBody = await grantResponse.json();
            throw new Error(`Failed to grant site access: ${errorBody.error.message}`);
        }

        status.innerText = "Step 3: Cleaning up temporary admin session...";

        // 4. FIND the Service Principal ID for this tenant
        const spResponse = await fetch(`https://graph.microsoft.com/v1.0/servicePrincipals?$filter=appId eq '${msalConfig.auth.clientId}'`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const spData = await spResponse.json();
        
        if (!spData.value || spData.value.length === 0) throw new Error("Service Principal not found in this tenant.");
        const spObjectId = spData.value[0].id;

        // 5. GET and DELETE the Delegated Grants (The Self-Clean)
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
                    console.log(`Deleted grant: ${grant.id}`);
                } catch (innerError) {
                    // Gracefully handle if the token is revoked mid-loop
                    console.warn("Grant deletion interrupted - session likely already revoked.");
                    break; 
                }
            }
        }
        
        status.innerHTML = "<span style='color: green; font-weight: bold;'>Success! Site access granted and admin session revoked.</span>";

    } catch (error) {
        console.error("HandleGrant Error:", error);
        status.innerText = "Process Failed: " + error.message;
    }
} // <--- Added missing closing brace for function
