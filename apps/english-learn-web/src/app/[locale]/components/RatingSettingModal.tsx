import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Radio, RadioGroup } from '@heroui/react'
import { AiRateParams, Grade } from '@repo/entity-ts-definition'
import { useTranslations } from 'next-intl'

export default function RatingSettingModal({ open, onClose, ratingSetting, setRatingParams }: {
  open: boolean
  onClose: any
  ratingSetting?: AiRateParams
  setRatingParams?: any
}) {
  const t = useTranslations()
  function setSelectedGrade(grade: string) {
    setRatingParams?.({ ...ratingSetting, grade: grade as Grade })
  }
  return (
    <Modal backdrop="blur" isOpen={open} onClose={onClose} size="5xl">
      <ModalContent>{(close) => <>
        <ModalHeader>{t('settingRatingparams')}</ModalHeader>
        <ModalBody>
          <RadioGroup label={t('select-grade')} orientation="horizontal" value={ratingSetting?.grade} onValueChange={setSelectedGrade}>
            <Radio value="ielts" description={t('ieltsdesc')}>{t('ielts')}</Radio>
          </RadioGroup>
        </ModalBody>
        <ModalFooter><Button color="primary" onPress={close}>{t('done')}</Button></ModalFooter>
      </>}</ModalContent>
    </Modal>
  )
}
