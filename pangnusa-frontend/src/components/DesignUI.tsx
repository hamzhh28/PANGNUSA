import type { ReactNode } from 'react'

type PageHeadingProps = {
  eyebrow?: string
  title: string
  description: string
  children?: ReactNode
}

export function PageHeading({ eyebrow, title, description, children }: PageHeadingProps) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-[720px]">
        {eyebrow && (
          <p className="mb-2 text-[12px] font-bold tracking-[.14em] text-[#087F8C] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-[-.035em] text-[#142B3B] sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-[#64748B]">{description}</p>
      </div>
      {children}
    </div>
  )
}

export function SurfaceCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_4px_16px_rgba(20,43,59,.035)] ${className}`}>
      {children}
    </section>
  )
}

export function StatusBadge({ kind, children }: { kind: 'defisit' | 'surplus' | 'warning' | 'neutral'; children: ReactNode }) {
  const styles = {
    defisit: 'bg-[#FCEEEE] text-[#B43B43]',
    surplus: 'bg-[#EAF6F0] text-[#23865C]',
    warning: 'bg-[#FFF7E6] text-[#A16B18]',
    neutral: 'bg-[#EEF2F5] text-[#64748B]',
  }
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-semibold ${styles[kind]}`}>
      {children}
    </span>
  )
}
