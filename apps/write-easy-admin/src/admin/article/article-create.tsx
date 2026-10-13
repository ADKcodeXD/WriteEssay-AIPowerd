import React, { useCallback } from 'react'
import {
  Edit,
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  DateInput,
  SelectArrayInput,
  TranslatableInputs,
  useGetList,
  ImageInput,
  ImageField,
  DateField,
  useNotify,
  useRedirect,
} from 'react-admin'
import { createEssay } from '../../api/essay'

// 共享的表单配置
const ArticleForm = ({ onSubmit }: { onSubmit?: (values: any) => Promise<void> }) => {
  const { data } = useGetList('tag', {
    pagination: { page: 1, perPage: 100 }, // 分页设置
    sort: { field: 'id', order: 'ASC' }, // 排序设置
  })

  return (
    <SimpleForm onSubmit={onSubmit}>
      <TextInput source="article_title" label="题目" multiline required />
      <DateField source="created_at" label="创建时间" showTime />
      <TranslatableInputs locales={['zh-CN', 'en', 'ja']}>
        <TextInput source="article_shortcut" label="题目简述" />
      </TranslatableInputs>
      <SelectInput
        source="article_grade"
        label="评级"
        choices={[
          { id: 'ielts', name: '雅思' },
          { id: 'toefl', name: '托福' },
          { id: 'gre', name: 'GRE' },
          { id: 'elementary', name: '小学' },
          { id: 'graduate', name: '研究生' },
          { id: 'cet6', name: '大学英语六级' },
          { id: 'cet4', name: '大学英语四级' },
        ]}
        required
      />
      <TextInput source="article_source" label="来源" />
      <SelectInput
        source="article_tasktype"
        label="雅思作文类型"
        choices={[
          {
            id: 1,
            name: 'Task1',
          },
          {
            id: 2,
            name: 'Task2',
          },
        ]}
      />
      <SelectArrayInput source="article_tag" label="标签" choices={data} optionText="tag_name" optionValue="id" />
      <ImageInput
        source="article_cover"
        label="配图"
        accept={{ 'image/*': ['.png', '.jpg', '.webp'] }}
        multiple={false}
        format={(value) => (value ? { src: value } : null)}
        parse={(value) => value?.rawFile || null}
      >
        <ImageField source="src" sx={{ '& img': { maxWidth: 200 } }} />
      </ImageInput>
    </SimpleForm>
  )
}

// 编辑组件
export const ArticleEdit = () => (
  <Edit>
    <ArticleForm />
  </Edit>
)

// 创建组件
export const ArticleCreate = () => {
  const notify = useNotify()
  const redirect = useRedirect()

  const handleSubmit = async (values: any) => {
    try {
      await createEssay(values)
      notify('文章创建成功', { type: 'success' })
      redirect('list', 'article')
    } catch (error) {
      notify(`处理过程中出现错误: ${error.message}`, { type: 'error' })
    }
  }

  return (
    <Create mutationOptions={{ onSuccess: () => null }}>
      <ArticleForm onSubmit={handleSubmit} />
    </Create>
  )
}
