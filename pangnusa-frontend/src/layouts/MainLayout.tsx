import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return

    // Saat drawer aktif, cegah scroll halaman di belakangnya pada mobile.
    const oldOverflow = document.body.style.overflow
    if (window.matchMedia('(max-width: 1023px)').matches) {
      document.body.style.overflow = 'hidden'
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        document.querySelector<HTMLButtonElement>('[data-menu-trigger]')?.focus()
      }
      if (event.key === 'Tab' && window.matchMedia('(max-width: 1023px)').matches) {
        const sidebar = document.getElementById('pangnusa-sidebar')
        const focusable = sidebar?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = oldOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-[#1E293B]">
      <a href="#konten-utama" className="sr-only focus:not-sr-only fixed left-3 top-3 z-[70] rounded-lg bg-[#087F8C] px-4 py-3 text-sm font-bold text-white shadow-lg">
        Langsung ke konten utama
      </a>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-h-screen min-w-0 lg:ml-[258px]">
        <Topbar menuOpen={menuOpen} onOpenMenu={() => setMenuOpen(true)} />
        <main id="konten-utama" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[1480px] px-4 py-6 outline-none sm:px-8 sm:py-9 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
