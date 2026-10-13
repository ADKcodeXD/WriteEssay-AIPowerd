import { publicConfig } from '../config'
import { Admin, Resource, DataProvider } from 'react-admin'
import { LoginPage, supabaseDataProvider, supabaseAuthProvider } from 'ra-supabase'
import { ArticleList } from './article/article'
import React from 'react'
import { ArticleEdit } from './article/article-create'
import { ArticleCreate } from './article/article-create'
import { createClient } from '@supabase/supabase-js'
import isEqual from 'lodash/isEqual'
import { TagEdit, TagList } from './tag/tag'
import { TagCreate } from './tag/tag'
import { UserEdit, UserList } from './users/users'
import { QuestionSet, QuestionSetEdit, QuestionSetCreate } from './qeustionset/questionset'
import { AiSettings } from './settings/AiSettings'

const supabase = createClient(publicConfig.supabaseUrl, publicConfig.supabaseAnonKey)

// 创建 authProvider
const authProvider = supabaseAuthProvider(supabase, {})

// 创建 dataProvider
const baseDataProvider = supabaseDataProvider({
  instanceUrl: publicConfig.supabaseUrl,
  apiKey: publicConfig.supabaseAnonKey,
})

const dataProvider: DataProvider = {
  ...baseDataProvider,
  async update(resource, params) {
    const changedFields = Object.keys(params.data).reduce(
      (acc, key) => {
        if (!isEqual(params.data[key], params.previousData[key])) {
          acc[key] = params.data[key]
        }
        return acc
      },
      {} as Record<string, any>
    )
    if (changedFields.article_cover) {
      try {
        const file = changedFields.article_cover
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `article-covers/${fileName}`
        const { data, error } = await supabase.storage.from('WriteEasy').upload(filePath, file)
        if (error) throw error
        const {
          data: { publicUrl },
        } = supabase.storage.from('WriteEasy').getPublicUrl(filePath)
        changedFields.article_cover = publicUrl
      } catch (error) {
        throw error
      }
    }
    try {
      const { error, data } = await supabase
        .from(resource)
        .update(changedFields)
        .eq('id', params.id)
        .select()
        .order('id', { ascending: false })
        .limit(1)
      if (error) {
        console.error('Update error:', error)
        throw error
      }
      return { data: data?.[0] || {} }
    } catch (error) {
      console.error('Error in update:', error)
      throw error
    }
  },
}

const App = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider} loginPage={LoginPage} dashboard={AiSettings}>
    <Resource name="article" list={ArticleList} create={ArticleCreate} edit={ArticleEdit} />
    <Resource name="tag" list={TagList} create={TagCreate} edit={TagEdit} />
    <Resource name="users" list={UserList} edit={UserEdit} />
    <Resource name="questions" list={QuestionSet} create={QuestionSetCreate} edit={QuestionSetEdit} />
  </Admin>
)

export default App
