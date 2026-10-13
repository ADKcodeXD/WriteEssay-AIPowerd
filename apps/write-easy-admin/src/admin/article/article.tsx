import {
  List,
  Datagrid,
  TextField,
  DateField,
  ArrayField,
  SingleFieldList,
  ChipField,
  ImageField,
  FunctionField,
  EditButton,
  SelectInput,
  TextInput,
  useFieldValue,
  CreateButton,
  TopToolbar,
  SelectArrayInput,
  useGetList,
  useListContext,
  TranslatableFields,
  useRecordContext,
  DeleteButton,
} from 'react-admin'
import { Box, Chip, Typography, Button } from '@mui/material'
import { Language, Add } from '@mui/icons-material'
import React from 'react'
import { Grade } from '@repo/entity-ts-definition'
import { I18NShortCut } from '../../components/I18NShortCut'
import { commonGradeChoices } from '../../const/global'

// 标签渲染组件
const TagsField = ({ tagsList }: any) => {
  const tags = useFieldValue({ source: 'article_tag' })
  if (!tags) return null
  return (
    <Box display="flex" gap={1}>
      {tags?.map((tagId: string) => {
        const tag: any = tagsList?.find((tag: any) => parseInt(tag.id) === parseInt(tagId)) || {}
        return <Chip key={tagId} label={tag.name || tagId} size="small" />
      })}
    </Box>
  )
}

// 难度等级显示组件
const GradeField = (props: any) => {
  const gradeColors: Record<Grade, string> = {
    ielts: '#4caf50',
    toefl: '#ff9800',
    gre: '#f44336',
    elementary: '#4caf50',
    graduate: '#ff9800',
    cet6: '#f44336',
    cet4: '#f44336',
  }

  const grade = useFieldValue({ source: 'article_grade' })

  return (
    <Chip
      label={grade}
      size="small"
      sx={{
        bgcolor: gradeColors[grade] || '#757575',
        color: 'white',
      }}
    />
  )
}

// 作文类型显示组件
const TaskTypeField = (props: any) => {
  const taskTypeMap: Record<string, string> = {
    '1': '任务1',
    '2': '任务2',
  }

  const taskType = useFieldValue({ source: 'article_tasktype' })

  return <Chip label={taskTypeMap[taskType] || taskType} size="small" />
}

// 自定义操作栏组件
const ListActions = () => {
  return (
    <TopToolbar>
      <CreateButton />
    </TopToolbar>
  )
}

export const ArticleList = () => {
  const { data } = useGetList(
    'tag', // 表名
    {
      pagination: { page: 1, perPage: 100 }, // 分页设置
      sort: { field: 'id', order: 'ASC' }, // 排序设置
    }
  )

  const choices = data
    ? data.map((tag) => ({
        id: tag.id,
        name: tag.tag_name, // 假设你的 tags 表有 name 字段
      }))
    : []

  return (
    <List
      actions={<ListActions />}
      filters={[
        <TextInput source="article_title" label="搜索标题" alwaysOn />,
        <SelectInput alwaysOn source="article_grade" label="评级" choices={commonGradeChoices} />,
      ]}
      sort={{ field: 'created_at', order: 'DESC' }}
      perPage={10}
    >
      <Datagrid rowClick={false}>
        <TextField source="id" />
        <I18NShortCut fieldName="article_shortcut" labelName="题目简述" />
        <TextField source="article_title" label="题目" />
        <TagsField label="标签" tagsList={choices} />
        <DateField source="created_at" label="创建时间" showTime locales="zh-CN" />
        <TextField source="article_source" label="来源" />
        <ChipField source="article_grade" label="类型" />
        <TaskTypeField source="article_tasktype" label="作文类型" />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  )
}
