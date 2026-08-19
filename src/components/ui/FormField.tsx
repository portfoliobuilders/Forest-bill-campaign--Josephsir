import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

import { cx } from '@/lib/cx'
import { inputClass, labelClass } from '@/lib/ui'

function FieldMessage({
  id,
  error,
  hint,
}: {
  id: string
  error?: string
  hint?: string
}) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </>
  )
}

export function TextField({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: {
  id: string
  label: string
  error?: string
  hint?: string
} & InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        className={cx(inputClass, className)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}

export function SelectField({
  id,
  label,
  error,
  hint,
  children,
  className,
  ...props
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select
        id={id}
        className={cx(inputClass, className)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        {...props}
      >
        {children}
      </select>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}

export function TextAreaField({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: {
  id: string
  label: string
  error?: string
  hint?: string
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        className={cx(inputClass, 'min-h-[140px] resize-y py-2', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}
