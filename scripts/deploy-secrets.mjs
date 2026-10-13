import { spawnSync } from 'node:child_process'

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_KEY', 'GEMINI_API_KEY', 'AI_SETTINGS_ENCRYPTION_KEY']
const optional = ['TEXT_GEARS_SECRET', 'APP_ORIGIN']
for (const key of required) if (!process.env[key]) throw new Error(`Missing GitHub secret: ${key}`)
const secrets = Object.fromEntries([...required, ...optional].filter(key => process.env[key]).map(key => [key, process.env[key]]))
if (process.argv.includes('--check')) {
  console.log('Required deployment secrets are configured')
} else {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'secret', 'bulk'], {
    input: JSON.stringify(secrets), stdio: ['pipe', 'inherit', 'inherit'], env: process.env,
  })
  if (result.status !== 0) process.exit(result.status || 1)
}
