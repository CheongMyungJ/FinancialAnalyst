/**
 * Git 서비스 - 분석 결과를 GitHub에 커밋
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 프로젝트 루트 디렉토리
const PROJECT_ROOT = path.join(__dirname, '../../..')

/**
 * 분석 결과를 GitHub에 커밋 및 푸시
 */
export async function commitAndPushData(): Promise<boolean> {
  try {
    const now = new Date()
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19)
    const commitMessage = `Update stock analysis data - ${timestamp}`

    console.log('[Git] 변경사항 커밋 시작...')

    // git add
    await execAsync('git add data/', { cwd: PROJECT_ROOT })
    console.log('[Git] 파일 스테이징 완료')

    // git commit
    try {
      await execAsync(`git commit -m "${commitMessage}"`, { cwd: PROJECT_ROOT })
      console.log('[Git] 커밋 완료')
    } catch (commitError: any) {
      // 변경사항이 없는 경우
      if (commitError.message.includes('nothing to commit')) {
        console.log('[Git] 변경사항 없음 - 커밋 스킵')
        return true
      }
      throw commitError
    }

    // git push
    await execAsync('git push origin main', { cwd: PROJECT_ROOT })
    console.log('[Git] 푸시 완료')

    return true
  } catch (error: any) {
    console.error('[Git] 커밋/푸시 실패:', error.message)
    return false
  }
}

/**
 * Git 상태 확인
 */
export async function checkGitStatus(): Promise<string> {
  try {
    const { stdout } = await execAsync('git status --short', { cwd: PROJECT_ROOT })
    return stdout
  } catch (error) {
    return 'Git repository not initialized'
  }
}
