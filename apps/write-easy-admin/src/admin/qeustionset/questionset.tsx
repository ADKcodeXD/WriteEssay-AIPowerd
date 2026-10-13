import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Datagrid,
  Edit,
  List,
  SimpleForm,
  TextField,
  TextInput,
  SelectInput,
  useNotify,
  DateField,
  EditButton,
  DeleteButton,
  TopToolbar,
  CreateButton,
  Create,
  useRedirect,
  TranslatableInputs,
  useGetList,
  useRecordContext,
  useRefresh,
} from 'react-admin'
import { Button, Box, Typography, Autocomplete, TextField as MuiTextField, CircularProgress } from '@mui/material'
import { I18NShortCut } from '../../components/I18NShortCut'
import {
  createQuestion,
  createQuestionRelation,
  deleteQuestionRelation,
  getRelatedQuestion,
  updateQuestion,
} from '../../api/essay'
import { commonGradeChoices } from '../../const/global'

// 自定义操作栏组件
const ListActions = () => {
  return (
    <TopToolbar>
      <CreateButton />
    </TopToolbar>
  )
}

export const QuestionSet = () => (
  <List
    actions={<ListActions />}
    filters={[
      <TextInput source="set_name" label="搜索名称" alwaysOn />,
      <SelectInput source="set_type" label="题集类型" choices={commonGradeChoices} alwaysOn />,
    ]}
    sort={{ field: 'created_at', order: 'DESC' }}
    perPage={10}
  >
    <Datagrid rowClick={false} bulkActionButtons={false}>
      <TextField source="id" />
      <I18NShortCut fieldName="set_name" labelName="题集名" />
      <I18NShortCut fieldName="set_desc" labelName="题集描述" />
      <TextField source="set_type" label="问题合集类型" />
      <DateField source="created_at" label="创建时间" showTime locales="zh-CN" />
      <TextField source="created_by" label="创建人" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
)

// 关联文章组件
const RelatedArticles = () => {
  const notify = useNotify()
  const refresh = useRefresh()
  const record = useRecordContext() as any
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 10 // 每页显示的文章数量
  const [relatedArticles, setRelatedArticles] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const {
    data: articles,
    isLoading,
    total,
    refetch,
  } = useGetList('article', {
    pagination: { page, perPage },
    sort: { field: 'id', order: 'DESC' },
    filter: searchText ? { article_title: searchText } : {},
  })

  const getRelatedQeustions = async () => {
    try {
      const { data } = await getRelatedQuestion(record?.id)
      setRelatedArticles(data)
    } catch (error: any) {
      notify(`获取关联题目失败: ${error.message}`, { type: 'error' })
      return []
    }
  }

  const handleRelateArticle = async (articleId: number) => {
    try {
      await createQuestionRelation(articleId, record?.id || 0)
      await getRelatedQeustions()
      refresh()
      notify('关联成功', { type: 'success' })
    } catch (error: any) {
      notify(`关联失败: ${error.message}`, { type: 'error' })
    }
  }

  const handleDeleteRelation = async (articleId: number) => {
    try {
      await deleteQuestionRelation(articleId, record?.id)
      await getRelatedQeustions()
      refresh()
      notify('解除关联成功', { type: 'success' })
    } catch (error: any) {
      notify(`解除关联失败: ${error.message}`, { type: 'error' })
    }
  }

  const handleSearch = () => {
    setIsSearching(true)
    setPage(1)
    refetch()
      .then(() => setIsSearching(false))
      .catch(() => setIsSearching(false))
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  useEffect(() => {
    if (record?.id) {
      getRelatedQeustions()
    }
  }, [record])

  const availableArticles = useMemo(() => {
    if (!articles) return []
    return articles.filter((article) => !relatedArticles?.some((related) => related.article?.id === article.id))
  }, [articles, relatedArticles])

  const totalPages = useMemo(() => {
    return Math.ceil((total || 0) / perPage)
  }, [total, perPage])

  return (
    <Box sx={{ mt: 2, width: '100%' }}>
      <Typography variant="h6">关联题目管理</Typography>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <MuiTextField
          label="搜索题目"
          variant="outlined"
          fullWidth
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="输入关键词搜索题目"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            }
          }}
          sx={{ mr: 1 }}
        />
        <Button variant="contained" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? '搜索中...' : '搜索'}
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : availableArticles.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
            没有找到匹配的题目
          </Typography>
        ) : (
          availableArticles.map((article) => (
            <Box
              key={article.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                border: '1px solid #ddd',
                borderRadius: 1,
                mb: 1,
              }}
            >
              <Box>
                {article.article_shortcut?.['zh-CN'] && (
                  <Typography variant="subtitle1">{article.article_shortcut?.['zh-CN']}</Typography>
                )}
                <Typography variant="body2" color="textSecondary">
                  {article.article_title}
                </Typography>
              </Box>
              <Button size="small" variant="outlined" color="primary" onClick={() => handleRelateArticle(article.id)}>
                关联
              </Button>
            </Box>
          ))
        )}

        {!isLoading && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button disabled={page === 1} onClick={() => handlePageChange(page - 1)} sx={{ mx: 0.5 }}>
              上一页
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
              <Typography variant="body2">
                {page} / {totalPages}
              </Typography>
            </Box>
            <Button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} sx={{ mx: 0.5 }}>
              下一页
            </Button>
          </Box>
        )}
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          已关联题目：
        </Typography>
        {relatedArticles?.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
            暂无关联题目
          </Typography>
        ) : (
          relatedArticles?.map((article: any) => (
            <Box
              key={article.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                border: '1px solid #ddd',
                borderRadius: 1,
                mb: 1,
              }}
            >
              <Box>
                {article.article?.article_shortcut?.['zh-CN'] && (
                  <Typography variant="subtitle1">{article.article?.article_shortcut?.['zh-CN']}</Typography>
                )}
                <Typography variant="body2" color="textSecondary">
                  {article.article?.article_title}
                </Typography>
              </Box>
              <Button size="small" color="error" onClick={() => handleDeleteRelation(article.article.id)}>
                解除关联
              </Button>
            </Box>
          ))
        )}
      </Box>
    </Box>
  )
}

export const QuestionSetEdit = () => {
  const notify = useNotify()
  const refresh = useRefresh()

  const handleSave = async (values: any) => {
    try {
      const id = values.id
      if (!id) {
        notify('更新失败: 缺少ID', { type: 'error' })
        return Promise.reject(new Error('缺少ID'))
      }

      const saveData = {
        id: id,
        set_name: values.set_name || {},
        set_desc: values.set_desc || {},
        set_type: values.set_type || '',
      }
      await updateQuestion(saveData)
      refresh()
      notify('更新成功', { type: 'success' })
      return values
    } catch (error) {
      console.error('更新失败:', error)
      notify(`更新失败: ${error.message}`, { type: 'error' })
      return Promise.reject(error)
    }
  }

  return (
    <Edit mutationMode="pessimistic">
      <SimpleForm onSubmit={handleSave}>
        <TextInput source="id" label="ID" sx={{ display: 'none' }} />
        <TranslatableInputs locales={['zh-CN', 'en', 'ja']}>
          <TextInput source="set_name" label="题集名" />
        </TranslatableInputs>
        <SelectInput source="set_type" label="题集类型" choices={commonGradeChoices} />
        <TranslatableInputs locales={['zh-CN', 'en', 'ja']}>
          <TextInput source="set_desc" label="题集描述" />
        </TranslatableInputs>
        <RelatedArticles />
      </SimpleForm>
    </Edit>
  )
}

// 创建表单组件
export const QuestionSetCreate = () => {
  const notify = useNotify()
  const redirect = useRedirect()
  const refresh = useRefresh()

  const handleSubmit = async (values: any) => {
    try {
      await createQuestion({
        set_name: values.set_name,
        set_type: values.set_type,
        set_desc: values.set_desc,
        cover: values.cover,
      })
      refresh()
      notify('题目创建成功', { type: 'success' })
      redirect('list', 'questions')
    } catch (error: any) {
      notify(`创建失败: ${error.message}`, { type: 'error' })
    }
  }

  return (
    <Create mutationOptions={{ onSuccess: () => null }}>
      <SimpleForm onSubmit={handleSubmit}>
        <TranslatableInputs locales={['zh-CN', 'en', 'ja']}>
          <TextInput source="set_name" label="题集名" />
        </TranslatableInputs>
        <SelectInput source="set_type" label="题集类型" choices={commonGradeChoices} />
        <TranslatableInputs locales={['zh-CN', 'en', 'ja']}>
          <TextInput source="set_desc" label="题集描述" />
        </TranslatableInputs>
      </SimpleForm>
    </Create>
  )
}
