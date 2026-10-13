import { Commands } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setEnhancedText: {
      setEnhancedText: (options: {
        from: number
        to: number
        type: 'polish' | 'synonym' | 'goodword' | 'goodsentence'
        content: {
          originalSentence?: string
          polishedSentence?: string
          originalWord?: string
          synonym?: string
          word?: string
          sentence?: string
          reason: string
        }
      }) => ReturnType
    }
    setMisspelledWord: {
      setMisspelledWord: (options: {
        from: number
        to: number
        word: string
        tips: string[]
      }) => ReturnType
    }
    unsetMisspelledWord: {
      unsetMisspelledWord: (options: { from: number; to: number }) => ReturnType
    }
  }
}
