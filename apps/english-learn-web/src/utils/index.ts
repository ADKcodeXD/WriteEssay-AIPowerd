import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/en'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/ja'
import { getTranslator } from '@/i18n'
import { Grade } from '@repo/entity-ts-definition'

dayjs.extend(relativeTime)
export const limitMap: Record<any, number> = {
  ielts2: 250,
  ielts1: 150,
  ielts: 250,
  elementary: 0,
  toefl: 0,
  graduate: 0,
  gre: 0,
  cet6: 150,
  cet4: 120,
}

export function formatRelativeTime(date: string | Date, locale: any = 'en'): string {
  let locale2: any = locale
  if (locale === 'zh-CN') locale2 = 'zh-cn'
  dayjs.locale(locale2)
  return dayjs(date).locale(locale2).fromNow()
}

export function formatTimeByFormat(
  date: string | Date,
  locale: string,
  format: string = 'YYYY-MM-DD HH:mm'
): string {
  let locale2: any = locale
  if (locale === 'zh-CN') locale2 = 'zh-cn'
  dayjs.locale(locale2)
  return dayjs(date).locale(locale2).format(format)
}

export function caclateWordByInput(input: string) {
  return input
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/).length
}

export const formatShortTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const t = getTranslator()

  if (hours > 0) {
    const second = seconds % 60
    const minute = minutes % 60
    if (!second) {
      return t('hours-minutes', [hours, minute] as any)
    } else if (!minute && !second) {
      return t('hours', [hours] as any)
    } else {
      return t('hours-minutes-seconds', [hours, minute, second] as any)
    }
  } else if (minutes > 0) {
    const second = seconds % 60
    if (!second) {
      return t('minutes', [minutes] as any)
    } else {
      return t('minutes-seconds', [minutes, second] as any)
    }
  } else {
    return t('short-seconds', [seconds] as any)
  }
}

export const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const seconds2 = parseFloat(seconds.toFixed(2))
  const t = getTranslator()

  if (hours > 0) {
    return t('hourMinSec', [hours, minutes % 60, seconds2 % 60] as any)
  } else if (minutes > 0) {
    return t('minsec', [minutes, seconds2 % 60] as any)
  } else {
    return t('seconds-miao', [seconds2] as any)
  }
}

export const getColorByScore = (score: number, isText = true, grade = 'ielts') => {
  const getIeltsColor = (score: number) => {
    if (score < 4) return isText ? 'text-danger-500' : 'danger-500'
    if (score < 6) return isText ? 'text-warning-500' : 'warning-500'
    if (score < 8) return isText ? 'text-success-500' : 'success-500'
    return isText ? 'text-success-500' : 'success-500'
  }

  const gradeColorMap: Record<string, (score: number) => string> = {
    ielts: getIeltsColor,
  }

  return gradeColorMap[grade]?.(score) || 'text-gray-500'
}

export const maxScoreMap = (grade: Grade) => {
  if (grade === 'ielts') return 9
  if (grade === 'toefl') return 30
  return 9
}
