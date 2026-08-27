const fs = require('fs');
const content = fs.readFileSync('src/components/OwnerDashboard.tsx', 'utf8');

const targetStr = `  const handleGoogleLogin = async () => {
    let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    try {
      const config = await import('../../firebase-applet-config.json');
      if (config.oAuthClientId) clientId = config.oAuthClientId;
    } catch (e) {
      console.warn("Could not load firebase config for client ID");
    }
    if (!(window as any).google?.accounts?.oauth2) {
      toast.error("Google Identity Services script not loaded");
      return;
    }
    const client = (window as any).google?.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (response: any) => {
        if (response.error) {
          console.error(response);
          toast.error('Google Sign-In failed');
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

const replacement = `  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/business.manage');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleToken = credential?.accessToken;

      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'crystalmakeoversalon@gmail.com';
      if (result.user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
        toast.error(\`Access Denied: \${result.user.email} is not the authorized Admin.\`);
        await signOut(auth);
        setToken(null);
        setUserProfile(null);
        return;
      }

      if (googleToken) {
        setToken(googleToken);
        localStorage.setItem('crystal_admin_token', googleToken);
      }

      const profile = {
        name: result.user.displayName || 'Admin',
        email: result.user.email || '',
        picture: result.user.photoURL || ''
      };
      setUserProfile(profile);
      localStorage.setItem('crystal_admin_profile', JSON.stringify(profile));
      toast.success(\`Welcome, Admin (\${profile.name})!\`);
    } catch (err: any) {
      console.error('Login failed', err);
      toast.error('Google Sign-In failed');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setToken(null);
    setUserProfile(null);
    localStorage.removeItem('crystal_admin_token');
    localStorage.removeItem('crystal_admin_profile');
    toast.info('Signed out successfully');
  };`;

const newContent = content.replace(targetStr, replacement);
if (content === newContent) {
  console.log("NOT REPLACED!");
  // Try regex replacement as fallback
  const regex = /const handleGoogleLogin = async \(\) => \{[\s\S]*?const handleSignOut = \(\) => \{[\s\S]*?toast\.info\('Signed out successfully'\);\n  \};/m;
  const match = content.match(regex);
  if (match) {
    fs.writeFileSync('src/components/OwnerDashboard.tsx', content.replace(regex, replacement));
    console.log("Replaced via regex!");
  } else {
    console.log("Regex also failed.");
  }
} else {
  fs.writeFileSync('src/components/OwnerDashboard.tsx', newContent);
  console.log("REPLACED!");
}
