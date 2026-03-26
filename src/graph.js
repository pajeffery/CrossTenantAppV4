/* /src/graph.js */

async function handleGrant() {
    const siteUrl = document.getElementById('siteUrl').value;
    const status = document.getElementById('statusMessage');
    
    if (!siteUrl) return alert("Please enter a site URL");

    try {
        status.innerText = "Opening Authorization Window...";

        // 1. Define Request 
        // Note: Using the short-form names is often more reliable in MSAL 2.x 
        // when the authority is already set to graph.microsoft.com
        const grantRequest = {
            scopes: [
                "openid", 
                "profile", 
                "Offline_Access",
                "Sites.FullControl.All",
                "Directory.Read.All",
                "DelegatedPermissionGrant.ReadWrite.All"
            ],
            prompt: "consent" 
        };

        // 2. Acquire Token
        const response = await myMSALObj.loginPopup(grantRequest);
        const token = response.accessToken;

        if (!token) throw new Error("Could not acquire an access token.");

        status.innerText = "Step 1: Resolving Site ID...";
        
        // 3. Resolve Site ID
        const urlObj = new URL(siteUrl);
        const sitePath = `${urlObj.hostname}:${urlObj.pathname.replace(/\/$/, "")}`;
        
        const siteResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${sitePath}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const siteData = await siteResponse.json();
        if (!siteData.id) {
            console.error("Site Lookup Data:", siteData);
            throw new Error("Site not found. Ensure the URL is correct and you have access.");
        }

        status.innerText = "Step 2: Granting Permanent Runbook Access...";

        // 4. Grant 'write' role to the Application (Application Permission)
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

        if (!permResponse.ok) {
            const errorBody = await permResponse.json();
            throw new Error(`Permission Grant Failed: ${errorBody.error.message}`);
        }

        status.innerText = "Step 3: Revoking temporary admin session...";

        // 5. FIND the Service Principal ID
        const spResponse = await fetch(`https://graph.microsoft.com/v1.0/servicePrincipals?$filter=appId eq '${msalConfig.auth.clientId}'`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const spData = await spResponse.json();
        
        if (!spData.value || spData.value.length === 0) throw new Error("Service Principal not found.");
        const spObjectId = spData.value[0].id;

        // 6. DELETE the Delegated Grants (Self-Cleanup)
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
                    console.warn("Cleanup interrupted - this is normal if the token was revoked.");
                    break; 
                }
            }
        }
        
        status.innerHTML = "<span style='color: #28a745; font-weight: bold;'>Success! Site access granted and session closed.</span>";

    } catch (error) {
        console.error("HandleGrant Error:", error);
        status.innerText = "Process Failed: " + error.message;
    }
}
