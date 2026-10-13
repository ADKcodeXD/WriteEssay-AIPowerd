import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// wrangler.jsonc intentionally uses strict JSON so this script does not need
// a second configuration parser or a second source of resource names.
const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'))
const queues = new Set(config.queues.producers.map(binding => binding.queue))
for (const name of queues) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'queues', 'create', name], { encoding: 'utf8' })
  const output = `${result.stdout || ''}\n${result.stderr || ''}`
  if (result.status !== 0 && !/already exists/i.test(output)) {
    console.error(output)
    throw new Error(`Cannot provision queue ${name}`)
  }
  console.log(`Queue ready: ${name}`)
}
const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy'], { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status || 1)
