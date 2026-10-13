import dictionary from '../../public/dictionaries/words_dictionary.json'

const wordsByLength = new Map<number, string[]>()

// 预处理字典数据
Object.keys(dictionary).forEach((word) => {
  const length = word.length
  if (!wordsByLength.has(length)) {
    wordsByLength.set(length, [])
  }
  wordsByLength.get(length)!.push(word)
})

self.onmessage = (e) => {
  if (e.data === 'getWordsByLength') {
    self.postMessage(Array.from(wordsByLength.entries()))
  }
}
