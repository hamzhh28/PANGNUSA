import { Menu, ArrowRight, Sprout } from 'lucide-react'
import { useLocation } from 'react-router'

type TopbarProps = { menuOpen: boolean; onOpenMenu: () => void }

export default function Topbar({ menuOpen, onOpenMenu }: TopbarProps) {
  const { pathname } = useLocation()
  const title = pathname.startsWith('/kabupaten/')
    ? 'Detail Kabupaten'
    : pathname === '/jelajahi'
      ? 'Jelajahi Kabupaten'
      : pathname === '/tentang'
        ? 'Tentang Sistem'
        : 'Dashboard'

  return (
    <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-3 border-b border-[#E2E8F0] bg-white/95 px-5 backdrop-blur-md sm:px-8 lg:px-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Buka menu navigasi"
          aria-controls="pangnusa-sidebar"
          aria-expanded={menuOpen}
          data-menu-trigger="true"
          className="rounded-lg border border-slate-200 p-2 text-[#142B3B] hover:bg-slate-50 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <Sprout size={23} className="text-[#087F8C] lg:hidden" aria-hidden="true" />
        <div>
          <p className="text-[13px] font-bold text-[#142B3B] sm:text-sm">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[#DCE7EA] bg-[#F7FAFB] px-2.5 py-2 text-[11px] font-semibold text-[#4B6674] sm:px-3 sm:text-xs">
        <span>FSVA 2026</span>
        <ArrowRight size={14} className="text-[#087F8C]" aria-hidden="true" />
        <span>2027</span>
      </div>
    </header>
  )
}
