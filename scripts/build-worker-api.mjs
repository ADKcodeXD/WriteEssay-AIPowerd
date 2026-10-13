import { build } from 'esbuild'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { isBuiltin } from 'node:module'

export async function buildApi(outfile = '.cloudflare/api.mjs') {
  const result = await build({
    entryPoints: ['cloudflare/api.ts'], outfile, bundle: true, format: 'esm', platform: 'node',
    target: 'es2022', minify: true, sourcemap: false,
    tsconfig: 'apps/english-learn-api/tsconfig.json',
    alias: {
      '@nestjs/common': resolve('cloudflare/service-decorators.ts'),
      'src/config/configuration': resolve('cloudflare/configuration.ts'),
      'punycode': resolve('node_modules/punycode/punycode.js'),
    },
    define: { 'process.env.NODE_ENV': '"production"', 'process.env.mode': '"production"' },
    write: false,
    metafile: true,
  })
  // Expose CommonJS builtins through static ESM imports so Wrangler can apply
  // its supported Node compatibility shims (dynamic require bypasses them).
  const imports = Object.values(result.metafile.outputs).flatMap(output => output.imports)
  const required = [...new Set(imports.filter(entry => entry.external && entry.kind === 'require-call' && isBuiltin(entry.path)).map(entry => entry.path))]
  const header = required.map((name, index) => `import * as builtin${index} from ${JSON.stringify(name.startsWith('node:') ? name : `node:${name}`)};`).join('\n')
  const table = required.map((name, index) => `${JSON.stringify(name)}: builtin${index}.default ?? builtin${index}`).join(',')
  await mkdir(dirname(outfile), { recursive: true })
  await writeFile(outfile, `${header}\nconst builtins = {${table}}; const require = name => { if (name in builtins) return builtins[name]; throw new Error('Unsupported module: ' + name); };\n${result.outputFiles[0].text}`)
  return result
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildApi()
