const fs = require('fs');
let text = fs.readFileSync('src/components/OwnerDashboard.tsx', 'utf8');
text = text.replace(/Sign in with your verified salon Google Account \(<span className="font-semibold text-rose-600">\{import\.meta\.env\.VITE_ADMIN_EMAIL \|\| 'crystalmakeoversalon@gmail\.com'\}<\/span>\) to monitor live reviews and automate sentiment-tailored AI responses\./g, 'Sign in securely as the verified Admin to monitor live Google reviews and automate AI responses.');
fs.writeFileSync('src/components/OwnerDashboard.tsx', text);
