import React, { useEffect, useRef, useCallback } from 'react'
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { Button, Divider, Tooltip } from '@heroui/react'
import StringDiff from '../StringDiff/StringDiff'
import { getTranslator } from '@/i18n'
import '@/assets/tippyAnimation.scss'
import '@/assets/anime.scss'
import { useStore } from '@/app/[locale]/context/StoreContext'

import { Node, NodeViewRenderer, RawCommands } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const EnhancedTextNode = Node.create({
  name: 'enhancedTextNode',
  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      type: {
        default: 'goodword',
      },
      content: {
        default: '',
      },
      text: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'span.enhanced-goodword' },
      { tag: 'span.enhanced-goodsentence' },
      { tag: 'span.enhanced-synonym' },
      { tag: 'span.enhanced-polish' },
    ]
  },

  renderHTML({ node }) {
    return [
      'span',
      {
        class: `enhanced-${node.attrs.type}`,
        'data-tippy-content': JSON.stringify(node.attrs.content),
        'data-tippy-node-type': 'enhancedText',
        'data-tippy-type': node.attrs.type,
      },
      node.attrs.text,
    ]
  },

  addCommands() {
    return {
      setEnhancedTextNode:
        (attributes: any) =>
        ({ tr, dispatch }: any) => {
          if (dispatch) {
            const node = this.type.create({
              ...attributes,
              text: tr.doc.textBetween(attributes.from, attributes.to),
            })
            tr.replaceRangeWith(attributes.from, attributes.to, node)
          }
          return true
        },
      unsetEnhancedTextNode:
        ({ from, to }: any) =>
        ({ tr, dispatch }: any) => {
          if (dispatch) {
            tr.delete(from, to)
          }
          return true
        },
    } as Partial<RawCommands>
  },

  addNodeView() {
    return ReactNodeViewRenderer(EnhancedTextNodeView)
  },
})

// 从用户设置中获取翻译模型
export const getTranslationModel = (userExt1: string | null): string => {
  try {
    if (userExt1) {
      const userSettings = JSON.parse(userExt1)
      if (userSettings.tranlateModel) {
        return userSettings.tranlateModel
      }
    }
  } catch (error) {
    console.error('Failed to parse user settings:', error)
  }

  return 'google' // 默认使用谷歌翻译
}

const TooltipContent = ({ node, onClickAction, translationModel }: any) => {
  const t = getTranslator()

  const { originalSentence, polishedSentence, synonym, sentence, word, reason, from, to, type } =
    node.attrs

  const polishComponent = (originalSentence: string, polishedSentence: string, reason: string) => (
    <div className="p-2 bg-content1 text-foreground rounded-lg max-w-xl shadow-lg border-solid border-1 border-foreground-200">
      <p className="text-md text-foreground-600 mb-2">{t('polishDetails')}</p>
      <div className="content text-sm">
        <div className="text-foreground-500">
          {t('originalSentence')}: {originalSentence}
        </div>
        <div className="text-foreground-600 flex-col flex">
          <p className="flex items-center flex-wrap">{t('polishedSentence')}: </p>
          <StringDiff oldString={originalSentence || ''} newString={polishedSentence || ''} />
          <p className="text-foreground my-2 italic">{polishedSentence}</p>
        </div>
        <div className="text-foreground text-xs">
          {t('explanation')}: {reason}
        </div>
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            color="primary"
            variant="light"
            className="text-xs"
            onClick={() => onClickAction(polishedSentence, from, to)}
          >
            {t('replace')}
          </Button>
        </div>
      </div>
    </div>
  )

  const synonymComponent = (originalWord: string, synonym: string, reason: string) => (
    <div className="p-2 bg-content1 text-foreground rounded-lg max-w-[224px] shadow-lg border-solid border-1 border-foreground-200">
      <div className="content text-sm">
        <span className="text-foreground-400">{originalWord}</span>
        <span> - </span>
        <span className="text-foreground-600 bg-success-300 rounded-sm px-1">{synonym}</span>
        <p className="text-xs mt-2 text-foreground-400">
          {t('explanation')}: {reason}
        </p>
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            color="primary"
            variant="light"
            className="text-xs"
            onClick={() => onClickAction(synonym, from, to)}
          >
            {t('replace')}
          </Button>
        </div>
      </div>
    </div>
  )

  const goodSentenceComponent = (sentence: string, reason: string) => (
    <div className="p-2 bg-content1 text-foreground rounded-lg max-w-[400px] shadow-lg border-solid border-1 border-foreground-200">
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
    <div className="p-2 bg-content1 text-foreground rounded-lg max-w-[400px] shadow-lg border-solid border-1 border-foreground-200">
      <div className="content text-sm">
        <p className="text-lg text-primary-500 font-bold">{word}</p>
        <Divider className="my-2" />
        <p className="text-xs mt-2 text-foreground-400">
          {t('comment')}: {reason}
        </p>
      </div>
    </div>
  )

  let component = null
  switch (type) {
    case 'polish':
      component = polishComponent(originalSentence, polishedSentence, reason)
      break
    case 'synonym':
      component = synonymComponent(word, synonym, reason)
      break
    case 'goodsentence':
      component = goodSentenceComponent(sentence, reason)
      break
    case 'goodword':
      component = goodWordComponent(word, reason)
      break
  }

  return component
}

export const EnhancedTextNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  editor,
}) => {
  const { userStore } = useStore()

  // 获取用户设置的翻译模型
  const getDefaultTranslationModel = useCallback(() => {
    return getTranslationModel(userStore.userInfo?.user_ext1 as string | null)
  }, [userStore.userInfo])

  return (
    <NodeViewWrapper className="enhanced-text-node">
      <Tooltip content={node.attrs.text}>
        <TooltipContent
          node={node}
          onClickAction={() => {}}
          translationModel={getDefaultTranslationModel()}
        />
      </Tooltip>
    </NodeViewWrapper>
  )
}
