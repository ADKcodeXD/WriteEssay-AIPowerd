import { Button, forwardRef, Tooltip } from "@heroui/react"
import { useTranslations } from 'next-intl'
import { memo, useImperativeHandle } from 'react'
import { MdOutlineMotionPhotosPause, MdOutlinePlayCircleOutline } from 'react-icons/md'
import { useTimerContext } from '../../context/TimerContext'

const TimerDisplay = memo(
  forwardRef((props, ref) => {
    const { formattedTime, isActive, toggleActive, seconds } = useTimerContext()
    const t = useTranslations()

    useImperativeHandle(ref, () => ({
      getTime: () => seconds,
    }))

    return (
      <Tooltip showArrow={true} content={t('pause')} placement="top-start">
        <div className="mr-4 flex items-center">
          <span className="dot rounded-full w-2 h-2 bg-success-600 mr-1"></span>
          <Button
            isIconOnly
            variant="light"
            className="h-4 w-4 min-w-4 mr-2"
            onClick={toggleActive}
          >
            {isActive ? <MdOutlineMotionPhotosPause /> : <MdOutlinePlayCircleOutline />}
          </Button>
          {t('startwrite')}&nbsp;
          {formattedTime}
        </div>
      </Tooltip>
    )
  })
)

export default TimerDisplay
