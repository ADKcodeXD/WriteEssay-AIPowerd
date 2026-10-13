import { useLocale } from 'next-intl'

type LocalizedField =
  | {
      [key: string]: string
    }
  | string
  | null
  | undefined

/**
 * 创建一个本地化字段处理函数
 * 返回一个函数，可以直接处理多语言字段
 *
 * @returns 处理多语言字段的函数
 */
export function useLocalizedFieldFunction() {
  const locale = useLocale()

  /**
   * 处理多语言字段，返回最合适的语言版本
   *
   * @param field 多语言字段对象
   * @param defaultValue 默认值，当所有语言都不可用时返回
   * @returns 当前最适合显示的文本
   */
  return function localizedField(field: LocalizedField | any, defaultValue: string = ''): string {
    // 如果字段不存在或不是对象，直接返回字段值或默认值
    if (!field || typeof field !== 'object') {
      return (field as string) || defaultValue
    }

    // 优先尝试当前语言
    if (field[locale] && field[locale].trim() !== '') {
      return field[locale]
    }

    // 其次尝试中文
    if (field['zh-CN'] && field['zh-CN'].trim() !== '') {
      return field['zh-CN']
    }

    // 再次尝试英文
    if (field['en'] && field['en'].trim() !== '') {
      return field['en']
    }

    // 最后尝试任何可用的语言
    const availableLanguage = Object.keys(field).find(
      (key) => field[key] && field[key].trim() !== ''
    )
    if (availableLanguage) {
      return field[availableLanguage]
    }

    // 如果都没有，返回默认值
    return defaultValue
  }
}
