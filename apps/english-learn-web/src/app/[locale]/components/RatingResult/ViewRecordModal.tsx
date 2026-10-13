import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react"
import { EssayFeedbackPartial, AiRateParams } from '@repo/entity-ts-definition'
import { useTranslations } from 'next-intl'
import { RatingResult } from './RatingResultReport'

interface ViewRecordModalProps {
  open: boolean
  onClose: () => void
  ratingResult?: {
    result: EssayFeedbackPartial
    input: AiRateParams
  } | null
}

export default function ViewRecordModal({ open, onClose, ratingResult }: ViewRecordModalProps) {
  const t = useTranslations()

  return (
    <Modal backdrop="blur" isOpen={open} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>{t('rating-result')}</ModalHeader>
            <ModalBody>
              <div className="min-h-[60vh] max-h-[80vh]">
                {ratingResult && (
                  <RatingResult
                    essayFeedBack={ratingResult.result}
                    essayInput={ratingResult.input}
                  />
                )}
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
