import { SupabaseService } from 'src/supabase/supabase.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class StatisticsService {
  constructor(private readonly SupabaseService: SupabaseService) {}

  async getCostStatistics(userUuid: string) {
    const { data, error } = await this.SupabaseService.supabseInstance
      .from('modeloutputRecord')
      .select('*')
      .eq('user_uuid', userUuid)

    if (error) {
      throw new Error(`Error fetching modeloutputRecord: ${error.message}`)
    }

    let totalTokens = 0
    let inputTokens = 0
    let outputTokens = 0

    // 遍历记录并累计 token 数量
    data.forEach((record) => {
      const usage = record.usage
      if ('input_tokens' in usage) {
        totalTokens += usage.input_tokens + usage.output_tokens
        inputTokens += usage.input_tokens
        outputTokens += usage.output_tokens
      } else if ('totalTokens' in usage) {
        // OpenAI 格式
        totalTokens += usage.totalTokens
        inputTokens += usage.promptTokens
        outputTokens += usage.completionTokens
      }
    })

    return {
      totalTokens,
      inputTokens,
      outputTokens,
    }
  }

  async getEssayStatistics(userUuid: string, grade: string) {
    const { data: stats, error: statsError } = await this.SupabaseService.supabseInstance.rpc(
      'get_essay_statistics',
      {
        p_user_uuid: userUuid,
        p_grade: grade,
      }
    )

    if (statsError) {
      throw new Error(`Error fetching statistics: ${statsError.message}`)
    }

    const { data: chartData, error: chartError } = await this.SupabaseService.supabseInstance
      .from('ratelog')
      .select('record_output, record_input, created_at')
      .eq('user_uuid', userUuid)
      .eq('grade', grade)
      .order('created_at', { ascending: false })
      .limit(10)

    if (chartError) {
      throw new Error(`Error fetching chart data: ${chartError.message}`)
    }

    if (!chartData || chartData.length === 0) {
      return {
        totalEssays: 0,
        highestScore: 0,
        lowestScore: 0,
        averageOverallScore: 0,
        averageSubScores: {
          grammaticalRangeAccuracy: 0,
          taskAchievement: 0,
          lexicalResource: 0,
          coherence: 0,
        },
        averageTime: 0,
        highestScoreEssay: null,
        lastEssay: null,
        echartsData: {
          series: [
            {
              name: 'Overall',
              key: 'overall',
              type: 'line',
              data: [],
            },
            {
              name: 'Grammatical Range & Accuracy',
              key: 'grammaticalRangeAccuracy',
              type: 'line',
              data: [],
            },
            {
              name: 'Task Achievement',
              key: 'taskAchievement',
              type: 'line',
              data: [],
            },
            {
              name: 'Lexical Resource',
              key: 'lexicalResource',
              type: 'line',
              data: [],
            },
            {
              name: 'Coherence & Cohesion',
              key: 'coherence',
              type: 'line',
              data: [],
            },
          ],
        },
      }
    }

    chartData.reverse()

    if (!stats || stats.length === 0) {
      return null
    }

    const {
      total_essays,
      highest_score,
      lowest_score,
      avg_overall_score,
      avg_grammatical_score,
      avg_task_score,
      avg_lexical_score,
      avg_coherence_score,
      avg_time,
    } = stats[0]

    const series = [
      {
        name: 'Overall',
        key: 'overall',
        type: 'line',
        data: chartData.map((record) => record.record_output?.score?.overall || 0),
      },
      {
        name: 'Grammatical Range & Accuracy',
        key: 'grammaticalRangeAccuracy',
        type: 'line',
        data: chartData.map((record) => record.record_output?.score?.grammaticalRangeAccuracy || 0),
      },
      {
        name: 'Task Achievement',
        key: 'taskAchievement',
        type: 'line',
        data: chartData.map((record) => record.record_output?.score?.taskAchievement || 0),
      },
      {
        name: 'Lexical Resource',
        key: 'lexicalResource',
        type: 'line',
        data: chartData.map((record) => record.record_output?.score?.lexicalResource || 0),
      },
      {
        name: 'Coherence & Cohesion',
        key: 'coherence',
        type: 'line',
        data: chartData.map((record) => record.record_output?.score?.coherence || 0),
      },
    ]

    // 获取最高分作文
    const { data: highestScoreEssay, error: highestError } =
      await this.SupabaseService.supabseInstance
        .from('ratelog')
        .select('*')
        .eq('user_uuid', userUuid)
        .eq('grade', grade)
        .not('record_output->score->overall', 'is', null)
        .order('record_output->score->overall', { ascending: false })
        .limit(1)
        .single()

    if (highestError) {
      throw new Error(`Error fetching highest score essay: ${highestError.message}`)
    }

    // 获取最新作文
    const { data: lastEssay, error: lastError } = await this.SupabaseService.supabseInstance
      .from('ratelog')
      .select('*')
      .eq('user_uuid', userUuid)
      .eq('grade', grade)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastError) {
      throw new Error(`Error fetching last essay: ${lastError.message}`)
    }

    return {
      totalEssays: total_essays,
      highestScore: highest_score,
      lowestScore: lowest_score,
      averageOverallScore: avg_overall_score,
      averageSubScores: {
        grammaticalRangeAccuracy: avg_grammatical_score,
        taskAchievement: avg_task_score,
        lexicalResource: avg_lexical_score,
        coherence: avg_coherence_score,
      },
      averageTime: avg_time,
      highestScoreEssay,
      lastEssay,
      echartsData: { series },
    }
  }
}
