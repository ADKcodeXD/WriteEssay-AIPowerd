import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'

function* files(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) yield* files(path)
    else if (entry.isFile()) yield path
  }
}
const secretValues = new Set()
for (const dir of ['apps/english-learn-api', 'apps/english-learn-web', 'apps/write-easy-admin']) {
  for (const entry of readdirSync(dir)) if (entry === '.env' || entry.startsWith('.env.')) {
    for (const line of readFileSync(`${dir}/${entry}`, 'utf8').split(/\r?\n/)) {
      const match = /^([A-Z_]+)\s*=\s*["']?([^\r\n]+?)["']?\s*$/.exec(line)
      if (match && /SECRET|SERCET|SERVICE_ROLE|SUPABASE_KEY|API_KEY/.test(match[1]) && !match[1].startsWith('NEXT_PUBLIC') && match[2].length > 24) secretValues.add(match[2])
    }
  }
}
for (const key of ['SUPABASE_KEY', 'OPENAI_API_KEY', 'CLOUDFLARE_API_TOKEN']) if (process.env[key]?.length > 24) secretValues.add(process.env[key])
const outputs = ['.cloudflare/api.mjs', ...files('apps/english-learn-web/.open-next')]
for (const path of outputs) {
  if (!/\.(?:js|mjs|cjs|json|html|map)$/.test(path)) continue
  const content = readFileSync(path, 'utf8')
  for (const secret of secretValues) if (content.includes(secret)) throw new Error(`A private credential was embedded in ${path}; refusing deployment`)
}
console.log('Build artifacts contain no known private credentials')
