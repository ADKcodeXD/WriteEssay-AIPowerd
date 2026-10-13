import { Tables } from './database'

export interface EnglishWritingIELTSResponse {
  score: {
    taskAchievement: number
    coherence: number
    lexicalResource: number
    grammaticalRangeAccuracy: number
    overall: number
  }
  suggestions: Array<{
    originalSentence: string
    amend: string
    explain: string
  }>
  incorrectVocabularies: Array<{
    incorrect: string
    correct: string
  }>
}

export interface Score {
  overall: number
  coherence: number
  lexicalResource: number
  taskAchievement: number
  grammaticalRangeAccuracy: number
}

export interface Synonym {
  word: string
  synonym: string
  explain: string
  context: string
}

export interface SynonymList {
  synonymList: Synonym[]
}

export interface ScoreReason {
  coherence: string
  lexicalResource: string
  taskAchievement: string
  grammaticalRangeAccuracy: string
}

export interface PolishSentence {
  polishSentence: {
    origin: string
    polished: string
    explain: string
  }[]
}

export interface ExampleArticle {
  title: string
  example: string
}

export interface RatingDeepReason {
  coherence: string
  lexicalResource: string
  taskAchievement: string
  grammaticalRangeAccuracy: string
}

export interface ExtractGoodWordsAndSentence {
  curatedWords: {
    word: string
    explain: string
    context: string
  }[]
  curatedSentences: {
    explain: string
    sentence: string
  }[]
}

export interface EssayFeedback {
  score: Score
  synonym: SynonymList
  scoreReason: ScoreReason
  polishSentence: PolishSentence
  exampleArticle: ExampleArticle
  ratingDeepReason: RatingDeepReason
  extractGoodWordsAndSentence: ExtractGoodWordsAndSentence
}

export type EssayFeedbackPartial = Partial<EssayFeedback>

export interface CostStatistics {
  totalTokens: number
  inputTokens: number
  outputTokens: number
}

export interface EssayStatistics {
  highestScore: number
  lowestScore: number
  totalEssays: number
  averageOverallScore: number
  averageTime: number
  averageSubScores: {
    grammaticalRangeAccuracy: number
    taskAchievement: number
    lexicalResource: number
    coherence: number
  }
  highestScoreEssay: Tables<'ratelog'>
  lastEssay: Tables<'ratelog'>
  echartsData: {
    series: Array<{
      name: string
      key: string
      type: string
      data: number[]
    }>
  }
}

export interface Statistics {
  costStatistics: CostStatistics
  essayStatistics: EssayStatistics | null
}
