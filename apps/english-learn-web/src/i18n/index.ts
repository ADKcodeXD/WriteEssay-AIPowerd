import { createTranslator } from 'next-intl'
// 导入所有语言的消息
import enMessages from '../../public/locales/en.json'
import jaMessages from '../../public/locales/ja.json'
import zhCNMessages from '../../public/locales/zh-CN.json'

const messages = {
  en: enMessages,
  ja: jaMessages,
  'zh-CN': zhCNMessages,
}

type SupportedLocale = keyof typeof messages

let currentLocale: SupportedLocale = 'en'
let translator = createTranslator({ messages: messages[currentLocale], locale: currentLocale })

function getPreferredLocale(): SupportedLocale {
  // 1. 尝试从 URL 参数获取
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const urlLocale = urlParams.get('locale')
    if (urlLocale && urlLocale in messages) {
      return urlLocale as SupportedLocale
    }
  }

  // 2. 尝试从 cookie 获取
  if (typeof document !== 'undefined') {
    const cookieLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith('locale='))
      ?.split('=')[1]
    if (cookieLocale && cookieLocale in messages) {
      return cookieLocale as SupportedLocale
    }
  } else {
    const cookies = require('js-cookie')
    const cookieLocale = cookies.get('locale')
    if (cookieLocale && cookieLocale in messages) {
      return cookieLocale as SupportedLocale
    }
  }

  // 3. 尝试从浏览器语言获取
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language
    if (browserLang in messages) {
      return browserLang as SupportedLocale
    }
  }

  // 4. 默认返回英语
  return 'en'
}

export function initializeLanguage() {
  const detectedLocale = getPreferredLocale()
  setLocale(detectedLocale)
}

export function setLocale(locale: 'en' | 'ja' | 'zh-CN') {
  currentLocale = locale
  translator = createTranslator({ messages: messages[locale], locale })
}

export function getTranslator() {
  return translator
}

export function getCurrentLocale() {
  return currentLocale
}

initializeLanguage()
