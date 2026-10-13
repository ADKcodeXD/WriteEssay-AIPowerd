import { Mark, RawCommands } from '@tiptap/core'
import React from 'react'
import { Button, Divider } from '@heroui/react'
import StringDiff from '../StringDiff/StringDiff'
import { useTranslations } from 'next-intl'
import { EssayFeedbackPartial } from '@repo/entity-ts-definition'

const createMarkedSpan = (
  content: Record<string, any>,
  text: string,
  type: 'polish' | 'synonym' | 'goodword' | 'goodsentence'
): HTMLSpanElement => {
  const span = document.createElement('span')
  span.className = `enhanced-${type}`
  span.setAttribute('data-tippy-node-type', 'enhancedText')
  span.setAttribute('data-tippy-type', type)
  span.setAttribute('data-tippy-content', JSON.stringify(content))
  span.textContent = text
  return span
}

const findAndReplaceInNode = (
  node: Node,
  searchText: string,
  context?: string,
  callback?: (textNode: Text, startOffset: number) => Node
): boolean => {
  if (!callback) return false
  if (!searchText?.trim()) return false

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || ''
    let startIndex = text.indexOf(searchText)
    const wholeWord = /^[\p{L}\p{N}'’-]+$/u.test(searchText)
    while (startIndex >= 0 && wholeWord && (
      /[\p{L}\p{N}]/u.test(text[startIndex - 1] || '') ||
      /[\p{L}\p{N}]/u.test(text[startIndex + searchText.length] || '')
    )) startIndex = text.indexOf(searchText, startIndex + 1)

    if (startIndex >= 0) {
      if (!context || (node.parentElement?.closest('p')?.textContent || text).includes(context)) {
        const newNode = callback(node as Text, startIndex)
        node.parentNode?.replaceChild(newNode, node)
        return true
      }
    }
  }

  const childNodes = Array.from(node.childNodes)
  for (const child of childNodes) {
    if (findAndReplaceInNode(child, searchText, context, callback)) {
      return true
    }
  }

  return false
}

const processPolishSentences = (container: HTMLElement, polishSentences: any[]) => {
  polishSentences.forEach(({ origin, polished, explain, context }) => {
    findAndReplaceInNode(container, origin, context, (textNode, startIndex) => {
      const beforeText = textNode.textContent!.substring(0, startIndex)
      const afterText = textNode.textContent!.substring(startIndex + origin.length)

      const fragment = document.createDocumentFragment()
      if (beforeText) fragment.appendChild(document.createTextNode(beforeText))

      fragment.appendChild(
        createMarkedSpan(
          {
            originalSentence: origin,
            polishedSentence: polished,
            reason: explain,
          },
          origin,
          'polish'
        )
      )

      if (afterText) fragment.appendChild(document.createTextNode(afterText))
      return fragment
    })
  })
}

const processSynonyms = (container: HTMLElement, synonymList: any[]) => {
  synonymList.forEach(({ word, synonym, explain, context }) => {
    findAndReplaceInNode(container, word, context, (textNode, startIndex) => {
      const beforeText = textNode.textContent!.substring(0, startIndex)
      const afterText = textNode.textContent!.substring(startIndex + word.length)

      const fragment = document.createDocumentFragment()
      if (beforeText) fragment.appendChild(document.createTextNode(beforeText))

      fragment.appendChild(
        createMarkedSpan(
          {
            originalWord: word,
            synonym,
            reason: explain,
          },
          word,
          'synonym'
        )
      )

      if (afterText) fragment.appendChild(document.createTextNode(afterText))
      return fragment
    })
  })
}

const processGoodWords = (container: HTMLElement, curatedWords: any[]) => {
  curatedWords.forEach(({ word, explain, context }) => {
    findAndReplaceInNode(container, word, context, (textNode, startIndex) => {
      const beforeText = textNode.textContent!.substring(0, startIndex)
      const afterText = textNode.textContent!.substring(startIndex + word.length)

      const fragment = document.createDocumentFragment()
      if (beforeText) fragment.appendChild(document.createTextNode(beforeText))

      fragment.appendChild(
        createMarkedSpan(
          {
            word,
            reason: explain,
          },
          word,
          'goodword'
        )
      )

      if (afterText) fragment.appendChild(document.createTextNode(afterText))
      return fragment
    })
  })
}

const processGoodSentences = (container: HTMLElement, curatedSentences: any[]) => {
  curatedSentences.forEach(({ sentence, explain }) => {
    findAndReplaceInNode(container, sentence, undefined, (textNode, startIndex) => {
      const beforeText = textNode.textContent!.substring(0, startIndex)
      const afterText = textNode.textContent!.substring(startIndex + sentence.length)

      const fragment = document.createDocumentFragment()
      if (beforeText) fragment.appendChild(document.createTextNode(beforeText))

      fragment.appendChild(
        createMarkedSpan(
          {
            sentence,
            reason: explain,
          },
          sentence,
          'goodsentence'
        )
      )

      if (afterText) fragment.appendChild(document.createTextNode(afterText))
      return fragment
    })
  })
}

export const processTextWithMarks = (text: string, result: EssayFeedbackPartial): string => {
  const parser = new DOMParser()
  const textList = text.split('\n').map((item) => {
    const paragraph = document.createElement('p')
    paragraph.textContent = item
    return paragraph.outerHTML
  })
  const doc = parser.parseFromString(`<div>${textList.join('')}</div>`, 'text/html')
  const container = doc.body.firstChild as HTMLElement

  if (result.polishSentence) {
    processPolishSentences(container, result.polishSentence.polishSentence)
  }

  if (result.synonym) {
    processSynonyms(container, result.synonym.synonymList)
  }

  if (result.extractGoodWordsAndSentence?.curatedWords) {
    processGoodWords(container, result.extractGoodWordsAndSentence.curatedWords)
  }

  if (result.extractGoodWordsAndSentence?.curatedSentences) {
    processGoodSentences(container, result.extractGoodWordsAndSentence.curatedSentences)
  }
  return container.outerHTML
}

export const TooltipContent = ({
  content,
  type,
  onClickReplace,
}: {
  content: string
  type: string
  onClickReplace?: (content: string) => void
}) => {
  const t = useTranslations()
  if (!content || !type) {
    return <div></div>
  }
  let contentObj
  try {
    contentObj = typeof content === 'string' ? JSON.parse(content) : content
    if (typeof contentObj === 'string') contentObj = JSON.parse(contentObj)
    if (!contentObj || typeof contentObj !== 'object') return null
  } catch { return null }
  let component = null

  const polishComponent = (originalSentence: string, polishedSentence: string, reason: string) => (
    <div className="p-2 bg-content1 text-foreground rounded-lg max-w-xl enhanced-content-area">
      <p className="text-md text-foreground-600 mb-2">{t('polishDetails')}</p>
      <div className="content text-sm flex flex-col gap-1">
        <div className="text-foreground-500">
          {t('originalSentence')}: <p>{originalSentence}</p>
        </div>
        <div className="text-foreground-600 flex-col flex">
          <p className="flex items-center flex-wrap">{t('polishedSentence')}: </p>
          <StringDiff oldString={originalSentence} newString={polishedSentence} />
          <p className="text-foreground my-2 italic">{polishedSentence}</p>
        </div>
        <p className="text-foreground text-xs">
          {t('explanation')}: {reason}
        </p>
        <Button
          onClick={() => onClickReplace?.(polishedSentence)}
          size="sm"
          variant="light"
          className="self-end"
        >
          {t('replace')}
        </Button>
      </div>
    </div>
  )

  const synonymComponent = (originalWord: string, synonym: string, reason: string) => (
    <div className="p-2 bg-content1 text-foreground rounded-lg max-w-[224px] enhanced-content-area">
      <div className="content text-sm">
        <span className="text-foreground-400">{originalWord}</span>
        <span> - </span>
        <span className="text-foreground-600 bg-success-300 rounded-sm px-1">{synonym}</span>
        <p className="text-xs mt-2 text-foreground-400">
          {t('explanation')}: {reason}
        </p>
      </div>
    </div>
  )

  const goodSentenceComponent = (sentence: string, reason: string) => (
    <div className="p-2 bg-content1 text-foreground rounded-lg max-w-[400px] enhanced-content-area">
      <div className="content text-sm">
        <p className="text-md text-primary-500 font-bold">{sentence}</p>
        <Divider className="my-2" />
        <p className="text-xs mt-2 text-foreground-400">
          {t('comment')}: {reason}
        </p>
      </div>
    </div>
  )

  const goodWordComponent = (word: string, reason: string) => (
    <div className="p-2 bg-content1 text-foreground rounded-lg max-w-[400px] enhanced-content-area">
      <div className="content text-sm">
        <p className="text-lg text-primary-500 font-bold">{word}</p>
        <Divider className="my-2" />
        <p className="text-xs mt-2 text-foreground-400">
          {t('comment')}: {reason}
        </p>
      </div>
    </div>
  )

  switch (type) {
    case 'polish':
      component = polishComponent(
        contentObj.originalSentence,
        contentObj.polishedSentence,
        contentObj.reason
      )
      break
    case 'synonym':
      component = synonymComponent(contentObj.originalWord, contentObj.synonym, contentObj.reason)
      break
    case 'goodsentence':
      component = goodSentenceComponent(contentObj.sentence, contentObj.reason)
      break
    case 'goodword':
      component = goodWordComponent(contentObj.word, contentObj.reason)
      break
    default:
      component = null
  }

  return <div>{component}</div>
}

const EnhancedTextMark = Mark.create({
  name: 'enhancedText',
  inclusive: false,
  excludes: 'enhancedText',

  addAttributes() {
    return {
      type: {
        default: 'goodword',
      },
      content: {
        default: {},
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.enhanced-goodword',
        getAttrs: (node: HTMLElement) => ({
          type: 'goodword',
          content: node.getAttribute('data-tippy-content'),
        }),
      },
      {
        tag: 'span.enhanced-goodsentence',
        getAttrs: (node: HTMLElement) => ({
          type: 'goodsentence',
          content: node.getAttribute('data-tippy-content'),
        }),
      },
      {
        tag: 'span.enhanced-synonym',
        getAttrs: (node: HTMLElement) => ({
          type: 'synonym',
          content: node.getAttribute('data-tippy-content'),
        }),
      },
      {
        tag: 'span.enhanced-polish',
        getAttrs: (node: HTMLElement) => ({
          type: 'polish',
          content: node.getAttribute('data-tippy-content'),
        }),
      },
    ]
  },

  renderHTML({ mark }) {
    return [
      'span',
      {
        class: `enhanced-${mark.attrs.type}`,
        'data-tippy-content': typeof mark.attrs.content === 'string' ? mark.attrs.content : JSON.stringify(mark.attrs.content),
        'data-tippy-node-type': 'enhancedText',
        'data-tippy-type': mark.attrs.type,
      },
      0,
    ]
  },

  addCommands() {
    return {
      setEnhancedText:
        (attributes: any) =>
        ({ tr, dispatch }: any) => {
          if (dispatch) {
            tr.addMark(attributes.from, attributes.to, this.type.create(attributes))
          }
          return true
        },
      unsetEnhancedText:
        ({ from, to }: any) =>
        ({ tr, dispatch }: any) => {
          if (dispatch) {
            tr.removeMark(from, to, this.type)
          }
          return true
        },
    } as Partial<RawCommands>
  },
})

export default EnhancedTextMark
