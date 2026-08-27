const fs = require('fs');
let text = fs.readFileSync('src/components/OwnerDashboard.tsx', 'utf8');

const regex = /const handleGoogleLogin = async \(\) => \{[\s\S]*?const handleSignOut = async \(\) => \{[\s\S]*?toast\.info\('Signed out successfully'\);\n  \};/m;

const replacement = `const handleGoogleLogin = async () => {
    let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    try {
      const config = await import('../../firebase-applet-config.json');
      if (config.oAuthClientId) clientId = config.oAuthClientId;
    } catch (e) {
      console.warn("Could not load firebase config for client ID");
    }
    
    if (!(window as any).google?.accounts?.oauth2) {
      toast.error("Google Identity Services script not loaded. Check index.html");
      return;
    }
    
    const client = (window as any).google?.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (response: any) => {
        if (response.error) {
          console.error(response);
          toast.error('Google Sign-In failed: ' + response.error);
          return;
        }
        
        try {
          const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: \`Bearer \${response.access_token}\` }
          });
          
          if (profileRes.ok) {
            const profile = await profileRes.json();
            const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'crystalmakeoversalon@gmail.com';
            if (profile.email.toLowerCase() !== adminEmail.toLowerCase()) {
              toast.error(\`Access Denied: \${profile.email} is not the authorized Admin.\`);
              setToken(null);
              setUserProfile(null);
              return;
            }
            setToken(response.access_token);
            setUserProfile(profile);
            localStorage.setItem('crystal_admin_token', response.access_token);
            localStorage.setItem('crystal_admin_profile', JSON.stringify(profile));
            toast.success(\`Welcome, Admin (\${profile.name})!\`);
          }
        } catch (err) {
          console.error('Failed to fetch profile', err);
          toast.error('Failed to verify profile.');
        }
      },
    });
    
    client?.requestAccessToken();
  };

  const handleSignOut = () => {
    setToken(null);
    setUserProfile(null);
    localStorage.removeItem('crystal_admin_token');
    localStorage.removeItem('crystal_admin_profile');
    toast.info('Signed out successfully');
  };`;

const match = text.match(regex);
if (match) {
  fs.writeFileSync('src/components/OwnerDashboard.tsx', text.replace(regex, replacement));
  console.log("Patched successfully!");
} else {
  console.log("Regex match failed.");
}
