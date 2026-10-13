import React, { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { authenticatedFetch } from '../../api'

type Settings = {
  baseUrl: string
  model: string
  keyConfigured: boolean
  keyHint: string
  updatedAt: string | null
}

const defaultUrl = 'https://generativelanguage.googleapis.com/v1beta'

export const AiSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    baseUrl: defaultUrl,
    model: 'gemini-3.8-flash',
    keyConfigured: false,
    keyHint: '',
    updatedAt: null,
  })
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    authenticatedFetch('/admin/ai-settings')
      .then((response) => {
        const data = response?.data || response
        setSettings((current) => ({ ...current, ...data }))
      })
      .catch((error) => setMessage({ type: 'error', text: error?.message || '无法读取 AI 配置' }))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const response = await authenticatedFetch('/admin/ai-settings', {
        method: 'PUT',
        body: JSON.stringify({ baseUrl: settings.baseUrl, model: settings.model, apiKey }),
      })
      const data = response?.data || response
      setSettings((current) => ({ ...current, ...data }))
      setApiKey('')
      setMessage({ type: 'success', text: 'AI 配置已保存，新的请求会立即使用它。' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || '保存 AI 配置失败' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 760, p: 3 }}>
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5" gutterBottom>AI 服务配置</Typography>
              <Typography color="text.secondary" variant="body2">
                所有 AI 功能统一使用此处配置的模型，默认 Gemini 3.8 Flash。密钥只显示末四位，保存后不会回显。
              </Typography>
            </Box>
            {message && <Alert severity={message.type}>{message.text}</Alert>}
            <TextField
              label="Gemini API Base URL"
              value={settings.baseUrl}
              onChange={(event) => setSettings((current) => ({ ...current, baseUrl: event.target.value }))}
              disabled={loading || saving}
              fullWidth
              helperText="默认：https://generativelanguage.googleapis.com/v1beta；自定义网关必须兼容 Gemini generateContent 接口。"
            />
            <TextField label="模型 ID" value={settings.model}
              onChange={(event) => setSettings((current) => ({ ...current, model: event.target.value }))}
              disabled={loading || saving} fullWidth helperText="默认 gemini-3.8-flash，填写服务支持的 Gemini 模型 ID。" />
            <TextField
              label={settings.keyConfigured ? `API Key（已配置 ${settings.keyHint}）` : 'API Key'}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              disabled={loading || saving}
              fullWidth
              type="password"
              autoComplete="new-password"
              placeholder={settings.keyConfigured ? '留空表示保留当前密钥' : '输入 Gemini API Key'}
              helperText="密钥在 Worker 内加密后写入 KV，不会发送给浏览器。"
            />
            {settings.updatedAt && (
              <Typography color="text.secondary" variant="caption">
                最近更新：{new Date(settings.updatedAt).toLocaleString()}
              </Typography>
            )}
            <Button variant="contained" onClick={save} disabled={loading || saving}>
              {saving ? '保存中…' : '保存 AI 配置'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AiSettings
