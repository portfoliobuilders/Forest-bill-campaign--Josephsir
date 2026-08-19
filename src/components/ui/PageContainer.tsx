import { cx } from '@/lib/cx'

export function PageContainer({
  children,
  width = 'default',
  as: Tag = 'main',
  className,
}: {
  children: React.ReactNode
  width?: 'default' | 'wide' | 'narrow'
  as?: 'main' | 'div'
  className?: string
}) {
  const max = width === 'wide' ? 'max-w-5xl' : width === 'narrow' ? 'max-w-xl' : 'max-w-3xl'
  return <Tag className={cx('mx-auto w-full px-4 py-6 sm:px-6', max, className)}>{children}</Tag>
}
