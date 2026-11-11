import { useEffect, useRef } from 'react'
import { LayoutDashboard, MapPin, Info, Sprout, X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router'

type SidebarProps = {
  open: boolean
  onClose: () => void
}

const navigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Jelajahi Kabupaten', to: '/jelajahi', icon: MapPin },
  { label: 'Tentang Sistem', to: '/tentang', icon: Info },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { pathname } = useLocation()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) closeButtonRef.current?.focus()
  }, [open])

  function closeDrawer() {
    onClose()
    document.querySelector<HTMLButtonElement>('[data-menu-trigger]')?.focus()
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Tutup navigasi"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={closeDrawer}
        />
      )}

      <aside
        id="pangnusa-sidebar"
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-50 flex w-[258px] max-w-[85vw] flex-col overflow-y-auto overscroll-contain bg-[#142B3B] px-5 py-7 text-white shadow-xl transition-transform duration-200 lg:visible lg:translate-x-0 lg:shadow-none ${open ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}
      >
        <div className="mb-12 flex items-center justify-between gap-2 px-1">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-[#087F8C] shadow-lg shadow-[#063e48]/40">
              <Sprout size={26} strokeWidth={2.1} aria-hidden="true" />
            </span>
            <span>
              <strong className="block text-[19px] font-bold tracking-[.07em]">PANGNUSA</strong>
              <span className="block text-[11px] tracking-wide text-slate-300">
                Peringatan Dini Pangan
              </span>
            </span>
          </NavLink>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            ref={closeButtonRef}
            onClick={closeDrawer}
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-3 px-3 text-[11px] font-bold tracking-[.18em] text-slate-400">
          MENU UTAMA
        </p>
        <nav className="space-y-1" aria-label="Menu website">
          {navigation.map(({ label, to, icon: Icon }) => {
            const isSectionDetail = to === '/jelajahi' && pathname.startsWith('/kabupaten/')
            return (
              <NavLink
                key={to}
                end={to === '/'}
                aria-current={isSectionDetail ? 'page' : undefined}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition-colors ${
                    isActive || isSectionDetail
                      ? 'bg-[#176473] font-semibold text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                {label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
