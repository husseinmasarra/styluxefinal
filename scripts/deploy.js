const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Read token from environment variable or .env.local
let token = process.env.VERCEL_TOKEN;
if (!token) {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^VERCEL_TOKEN=(.+)$/m);
    if (match) token = match[1].trim();
  }
}

if (!token) {
  console.error('❌ Error: VERCEL_TOKEN not found in environment or .env.local');
  process.exit(1);
}

console.log('🚀 Deploying Styluxe to Vercel Production...');
try {
  execSync(`npx vercel deploy --prod --token ${token} --yes`, {
    stdio: 'inherit',
    env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    cwd: path.resolve(__dirname, '..')
  });
  console.log('✅ Production deployment completed successfully!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
