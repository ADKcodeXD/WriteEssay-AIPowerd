import React from 'react'
import { useRecordContext } from 'react-admin'
import { TranslatableFields, TextField } from 'react-admin'

// 快捷键多语言显示组件
export const I18NShortCut = ({ fieldName, labelName }: any) => {
  const record = useRecordContext()
  if (!record?.[fieldName]) return null
  return (
    <TranslatableFields locales={['zh-CN', 'en', 'ja']} groupKey={fieldName}>
      <TextField source={fieldName} label={labelName} />
    </TranslatableFields>
  )
}
