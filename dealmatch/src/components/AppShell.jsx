import BottomNav from './BottomNav'

// Mobile-first shell: a centered, phone-width column with an optional header
// and a persistent bottom navigation bar.
export default function AppShell({ title, right, children, showNav = true }) {
  return (
    <div className="mx-auto flex min-h-full max-w-app flex-col bg-navy-950">
      {title && (
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-navy-700 bg-navy-900/95 px-4 py-3 backdrop-blur">
          <h1 className="text-lg font-bold tracking-tight">{title}</h1>
          {right}
        </header>
      )}
      <main className="flex-1 px-4 py-4">{children}</main>
      {showNav && <BottomNav />}
    </div>
  )
}
