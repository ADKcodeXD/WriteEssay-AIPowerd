import React, { useEffect, useState, useCallback, memo } from 'react'
import { Editor, Mark } from '@tiptap/core'
import { BubbleMarkPlugin, BubbleMarkPluginKey } from './bubblemark-plugin'
import type { Props as TippyOptions } from 'tippy.js'

export interface BubbleMarkProps {
  editor: Editor
  className?: string
  children:
    | React.ReactNode
    | ((
        markInfo: {
          mark: Mark
          text: string
          pos: number
          start: number
          end: number
        } | null
      ) => React.ReactNode)
  tippyOptions?: Partial<TippyOptions>
  shouldShow?: (props: { marks: any[]; text: string }) => boolean
}

export const BubbleMark: React.FC<BubbleMarkProps> = memo((props) => {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [markInfo, setMarkInfo] = useState<{
    mark: Mark
    text: string
    pos: number
    start: number
    end: number
  } | null>(null)

  const handleUpdate = useCallback(setMarkInfo, [])

  useEffect(() => {
    if (!element || !props.editor) {
      return
    }

    const menuEditor = props.editor

    if (menuEditor?.isDestroyed) {
      return
    }
    const plugin = BubbleMarkPlugin({
      editor: menuEditor,
      element,
      tippyOptions: {
        ...props.tippyOptions,
        content: element,
      },
      shouldShow: props.shouldShow,
      onUpdate: handleUpdate,
    })

    menuEditor.registerPlugin(plugin)

    return () => {
      if (!menuEditor.isDestroyed) {
        menuEditor.unregisterPlugin(BubbleMarkPluginKey)
      }
    }
  }, [element, props.editor])

  return (
    <div ref={setElement} className={props.className}>
      {typeof props.children === 'function' ? props.children(markInfo) : props.children}
    </div>
  )
})
