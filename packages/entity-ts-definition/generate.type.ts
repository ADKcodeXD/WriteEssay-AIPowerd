import { execSync } from 'child_process'
import * as dotenv from 'dotenv'

dotenv.config()

const generateTypes = () => {
  try {
    // 确保环境变量存在
    if (!process.env.SUPABASE_PROJECT_ID) {
      throw new Error('Missing required environment variables')
    }

    // 执行 Supabase CLI 命令生成类型
    console.log('Generating types...')
    execSync(
      `npx supabase gen types typescript --project-id "${process.env.SUPABASE_PROJECT_ID}" --schema public > ./type/database.ts`,
      { stdio: 'inherit' }
    )
    console.log('Types generated successfully!')
    // 执行 build
    console.log('Building project...')
    execSync('npm run build', { stdio: 'inherit' })
    console.log('Build completed successfully!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

generateTypes()
