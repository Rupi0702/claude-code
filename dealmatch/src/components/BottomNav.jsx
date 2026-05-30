import { NavLink } from 'react-router-dom'

const items = [
  { to: '/feed', label: 'Discover', icon: 'M3 11l9-8 9 8M5 10v10h14V10' },
  { to: '/matches', label: 'Matches', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { to: '/profile', label: 'Profile', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-4 4-6 8-6s8 2 8 6' },
]

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-navy-700 bg-navy-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-app items-stretch justify-around">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-gold-500' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
