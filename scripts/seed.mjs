#!/usr/bin/env node
// Local helper: seed a user into Cloudflare KV via /api/dev/seed.
// Usage: pnpm seed <email> [role]  (role defaults to "admin")

const [, , email, role = 'admin'] = process.argv;
const host = process.env.DEV_HOST || 'http://localhost:4321';

if (!email) {
  console.error('Usage: pnpm seed <email> [role]');
  console.error('  role: admin | member (default: admin)');
  process.exit(1);
}
if (role !== 'admin' && role !== 'member') {
  console.error(`Invalid role "${role}" — must be "admin" or "member".`);
  process.exit(1);
}

try {
  const response = await fetch(`${host}/api/dev/seed`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  if (!response.ok) {
    console.error(`Seed failed: ${response.status} ${response.statusText}`);
    console.error(await response.text());
    process.exit(1);
  }
  const data = await response.json();
  console.log(`✓ Seeded ${email} as ${role}.`);
  console.log(`  ${data.users.length} user(s) now in KV:`);
  for (const u of data.users) {
    console.log(`   · ${u.email} (${u.role})`);
  }
  console.log('\nNext step:');
  console.log(`  1. Open ${host}/medlem/logga-in`);
  console.log(`  2. Enter "${email}" and submit`);
  console.log('  3. Copy the magic link from the dev server terminal');
} catch (err) {
  console.error(`Could not reach ${host} — is the dev server running?`);
  console.error(`  pnpm dev   (in another terminal)`);
  console.error('');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
