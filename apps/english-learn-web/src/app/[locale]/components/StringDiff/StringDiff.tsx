import React from 'react'
import { diffWords } from 'diff'

interface StringDiffProps {
  oldString: string
  newString: string
}

const StringDiff: React.FC<StringDiffProps> = ({ oldString, newString }) => {
  const diff = diffWords(oldString, newString, {})

  return (
    <p>
      {diff.map((part, index) => {
        return (
          <span
            key={index}
            style={{
              textDecoration: part.removed ? 'line-through' : 'none',
            }}
            className={`rounded-sm ${part.added ? 'bg-green-400' : ''} ${
              part.removed ? 'bg-red-400' : ''
            } ${part.added ? 'text-green-600' : ''} ${part.removed ? 'text-red-600' : ''}`}
          >
            {part.value}
          </span>
        )
      })}
    </p>
  )
}

export default StringDiff
