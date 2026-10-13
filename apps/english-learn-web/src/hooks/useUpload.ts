import { getPublicConfig } from '@/utils/public-config'
import { useState, useRef, useMemo } from 'react'
import { toast } from 'react-toastify'
import { createClient } from '@supabase/supabase-js'
import { useTranslations } from 'next-intl'

interface UseUploadResult {
  fileInputRef: React.RefObject<HTMLInputElement>
  handleUpload: () => void
  onFileChange: (callback?: any) => void
  isUploading: boolean
  fileList: string[] // 新增：已上传文件的URL列表
  removeFile: (url: string) => void
  onUploadFile: (event: React.ChangeEvent<HTMLInputElement>) => void
  setFileList: (list: string[]) => void
}

export const useUpload = (): UseUploadResult => {
  const t = useTranslations()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fileList, setFileList] = useState<string[]>([]) // 新增：文件列表状态

  const supabase = useMemo(
    () =>
      createClient(
        getPublicConfig().supabaseUrl,
        getPublicConfig().supabaseAnonKey
      ),
    []
  )

  const handleUpload = () => {
    fileInputRef.current?.click()
  }

  const onUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        toast.error(t('only-image-files-are-allowed'))
        return
      }

      // 检查文件大小（2MB = 2 * 1024 * 1024 bytes）
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('file-size-should-not-exceed-2mb'))
        return
      }

      // 检查已上传的图片数量
      if (fileList.length >= 2) {
        toast.error(t('you-can-only-upload-a-maximum-of-2-images'))
        return
      }

      setIsUploading(true)
      try {
        const fileExtension = file.name.split('.').pop() || ''
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        const filePath = `${uniqueId}.${fileExtension}`
        const { data, error } = await supabase.storage.from('WriteEasy').upload(filePath, file, {
          upsert: true,
        })
        if (error) throw error
        const {
          data: { publicUrl },
        } = supabase.storage.from('WriteEasy').getPublicUrl(filePath)

        setFileList((prevList) => [...prevList, publicUrl])
        toast.success(t('file-uploaded-successfully', { file: file.name }))
      } catch (error) {
        toast.error(t('file-upload-failed-please-try-again'))
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
  }

  const onFileChange = (callback?: any) => {
    return fileList
  }

  const removeFile = (url: string) => {
    setFileList((prevList) => prevList.filter((fileUrl) => fileUrl !== url))
  }

  return {
    fileInputRef,
    onUploadFile,
    onFileChange,
    handleUpload,
    isUploading,
    fileList,
    removeFile,
    setFileList,
  }
}
