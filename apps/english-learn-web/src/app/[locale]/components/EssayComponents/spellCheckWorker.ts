import Typo from 'typo-js'

const dictionary = new (Typo as any)('en_US', false, false, { dictionaryPath: '/dictionaries' })
self.onmessage = ({ data }) => {
  const results = data.words.map((entry: { word: string; from: number; to: number }) => {
    const correct = entry.word.length < 3 || dictionary.check(entry.word)
    return { ...entry, correct, tips: correct ? [] : dictionary.suggest(entry.word).slice(0, 5) }
  })
  self.postMessage({ requestId: data.requestId, results })
}
