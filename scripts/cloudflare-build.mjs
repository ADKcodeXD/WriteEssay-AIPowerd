import { spawnSync } from 'node:child_process'
import { cpSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildApi } from './build-worker-api.mjs'

const root = process.cwd()
// OpenNext serializes ALL .env values into its bundle. Temporarily exclude
// local files and restore them in finally, including on failed builds.
const saved = []
for (const dir of ['.', 'apps/english-learn-web', 'apps/write-easy-admin']) {
  for (const name of readdirSync(dir)) if (name === '.env' || name.startsWith('.env.')) {
    const path = `${dir}/${name}`
    saved.push([path, readFileSync(path)])
  }
}
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NODE_ENV: 'production',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANNO_KEY: 'build-placeholder',
  NEXT_PUBLIC_BASE_API_URL: '/api', NEXT_PUBLIC_DOMAIN: '', VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'build-placeholder', VITE_PUBLIC_BASE_API_URL: '/api',
}
for (const key of Object.keys(env)) if (/SECRET|TOKEN|API_KEY|SUPABASE_KEY|SERVICE_ROLE|PUBLIC_SUPABASE|APP_ORIGIN/.test(key) && !key.startsWith('NEXT_PUBLIC_')) delete env[key]
function run(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, env, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`Build step failed: ${args[0]}`)
}
try {
  for (const [path] of saved) writeFileSync(path, '')
  run(['node_modules/typescript/bin/tsc', '-p', 'packages/entity-ts-definition'])
  await buildApi()
  run(['node_modules/vite/bin/vite.js', 'build', '--base=/admin/', '--config', 'apps/write-easy-admin/vite.config.js', 'apps/write-easy-admin'])
  run([resolve('node_modules/@opennextjs/cloudflare/dist/cli/index.js'), 'build', '--config', resolve('wrangler.jsonc')], resolve('apps/english-learn-web'))
  cpSync('apps/write-easy-admin/dist', 'apps/english-learn-web/.open-next/assets/admin', { recursive: true })
} finally {
  for (const [path, contents] of saved) writeFileSync(path, contents)
}
run(['scripts/check-build-secrets.mjs'])
