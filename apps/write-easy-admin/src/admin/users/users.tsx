import { publicConfig } from '../../config'
import React, { useState } from 'react'
import {
  Create,
  Datagrid,
  Edit,
  List,
  SimpleForm,
  TextField,
  TextInput,
  NumberInput,
  DateInput,
  SelectInput,
  useNotify,
  useRedirect,
  DateField,
  NumberField,
  EditButton,
  DeleteButton,
  ImageField,
  useInput,
} from 'react-admin'
import { Button } from '@mui/material'
import { createClient } from '@supabase/supabase-js'

export const UserList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <ImageField
        source="user_avatar"
        label="头像"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100px',
          '& img': {
            height: '100px',
            width: '100px',
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
            margin: 'auto',
            overflow: 'hidden',
          },
        }}
      />
      <TextField source="user_name" label="用户名" />
      <TextField source="user_email" label="邮箱" />
      <NumberField source="user_status" label="状态" />
      <DateField source="created_at" label="创建时间" />
      <TextField source="user_source" label="来源" />
      <NumberField source="normal_quota" label="普通配额" />
      <NumberField source="high_quota" label="高级配额" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
)

const AvatarInput = ({ source, label }: { source: string; label?: string }) => {
  const [preview, setPreview] = useState<string | null>(null)
  const { field } = useInput({ source })
  const supabase = createClient(publicConfig.supabaseUrl, publicConfig.supabaseAnonKey)
  const notify = useNotify()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      setPreview(URL.createObjectURL(file))
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage.from('WriteEasy').upload(fileName, file)
      if (uploadError) throw uploadError
      // 获取公共URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('WriteEasy').getPublicUrl(fileName)
      field.onChange(publicUrl)
    } catch (error) {
      notify(`上传失败: ${error.message}`, { type: 'error' })
    }
  }

  return (
    <div>
      <input accept="image/*" style={{ display: 'none' }} id="avatar-upload" type="file" onChange={handleFileUpload} />
      <label htmlFor="avatar-upload">
        <Button variant="contained" component="span">
          上传头像
        </Button>
      </label>
      {(preview || field.value) && (
        <div style={{ marginTop: 10 }}>
          <img
            src={preview || field.value}
            alt="Avatar preview"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}
    </div>
  )
}

const UserForm = () => (
  <SimpleForm>
    <AvatarInput source="user_avatar" label="头像" />
    <TextInput source="user_name" label="用户名" />
    <TextInput source="user_email" label="邮箱" />
    <TextInput source="user_phone" label="电话" />
    <TextInput source="user_password" label="密码" />
    <TextInput source="user_desc" label="描述" />
    <NumberInput source="user_level" label="等级" />
    <TextInput source="user_location" label="位置" />
    <TextInput source="user_source" label="来源" />
    <SelectInput
      source="user_gender"
      label="性别"
      choices={[
        { id: 0, name: '未知' },
        { id: 1, name: '男' },
        { id: 2, name: '女' },
      ]}
    />
    <SelectInput
      source="user_status"
      label="状态"
      choices={[
        { id: 0, name: '禁用' },
        { id: 1, name: '正常' },
      ]}
    />
    <NumberInput source="normal_quota" label="普通配额" />
    <NumberInput source="high_quota" label="高级配额" />
  </SimpleForm>
)

export const UserEdit = () => {
  return (
    <Edit>
      <UserForm />
    </Edit>
  )
}
