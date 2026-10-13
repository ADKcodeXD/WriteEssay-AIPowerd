import React from 'react'
import {
  Create,
  Datagrid,
  DateField,
  DeleteButton,
  Edit,
  EditButton,
  List,
  SimpleForm,
  TextField,
  TextInput,
  TranslatableInputs,
} from 'react-admin'
import { I18NShortCut } from '../../components/I18NShortCut'

export const TagList = () => (
  <List>
    <Datagrid rowClick={false}>
      <TextField source="id" />
      <TextField source="tag_name" label="标签名称" />
      <DateField source="created_at" label="创建时间" showTime locales="zh-CN" />
      <I18NShortCut fieldName="tag_i18n" labelName="多语言" />
      <TextField source="tag_desc" label="标签描述" />
      <TextField source="tag_type" label="标签类型" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
)

export const TagCreate = () => {
  return (
    <Create mutationOptions={{ onSuccess: () => null }}>
      <SimpleForm>
        <TextInput source="tag_name" label="标签名称" />
        <TranslatableInputs locales={['zh-CN', 'en', 'ja']}>
          <TextInput source="tag_i18n" label="多语言" />
        </TranslatableInputs>
        <TextInput source="tag_desc" label="标签描述" />
        <TextInput source="tag_type" label="标签类型" />
      </SimpleForm>
    </Create>
  )
}

export const TagEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="tag_name" label="标签名称" />
      <TranslatableInputs locales={['zh-CN', 'en', 'ja']}>
        <TextInput source="tag_i18n" label="多语言" />
      </TranslatableInputs>
      <TextInput source="tag_desc" label="标签描述" />
      <TextInput source="tag_type" label="标签类型" />
    </SimpleForm>
  </Edit>
)
