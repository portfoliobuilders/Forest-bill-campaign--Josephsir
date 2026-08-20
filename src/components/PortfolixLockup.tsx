/** Stacked Portfolix / red square / Tech lockup on black. */
export function PortfolixLockup({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col justify-center bg-black text-white ${className}`.trim()} aria-hidden="true">
      <span className="text-[17px] font-bold leading-none tracking-[-0.04em] [font-family:Arial,Helvetica,'Segoe_UI',sans-serif]">
        Portfolix
      </span>
      <span className="mt-[6px] flex items-center gap-[6px]">
        <span className="inline-block size-[13px] shrink-0 bg-[#E10600]" />
        <span className="text-[12px] font-bold leading-none tracking-[0.02em] [font-family:Arial,Helvetica,'Segoe_UI',sans-serif]">
          Tech
        </span>
      </span>
    </span>
  )
}
