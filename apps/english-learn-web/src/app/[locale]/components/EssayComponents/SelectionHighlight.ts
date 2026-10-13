import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

// Keep the active passage visible when the user focuses an action or language menu.
export const SelectionHighlight = Extension.create({
  name: 'selectionHighlight',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: new PluginKey('selectionHighlight'),
      props: {
        decorations(state) {
          const { from, to, empty } = state.selection
          return empty ? DecorationSet.empty : DecorationSet.create(state.doc, [
            Decoration.inline(from, to, { class: 'editor-active-selection' }),
          ])
        },
      },
    })]
  },
})
