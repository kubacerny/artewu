import { useState, useEffect } from 'react';

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: '/', label: 'Úvod' },
  { href: '/truhlarstvi', label: 'Truhlářství' },
  { href: '/vyvoj-software', label: 'Vývoj software' },
  { href: '/blog', label: 'Realizace' },
  { href: '/kontakt', label: 'Kontakt' },
];

interface Props {
  currentPath: string;
}

export default function Header({ currentPath }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? currentPath === '/' : currentPath.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled
          ? 'bg-brand-50/95 backdrop-blur shadow-sm'
          : 'bg-brand-50/80 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 font-serif text-2xl font-semibold text-brand-800 hover:text-brand-600 transition-colors"
          >
            <span aria-hidden className="inline-block w-2 h-2 rounded-full bg-brand-500" />
            Artewu
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-brand-700 bg-brand-100'
                    : 'text-brand-800 hover:text-brand-600 hover:bg-brand-100/60'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-brand-800 hover:bg-brand-100"
            aria-label={open ? 'Zavřít menu' : 'Otevřít menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-brand-200 bg-brand-50">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`px-3 py-3 rounded-md text-base font-medium ${
                  isActive(item.href)
                    ? 'text-brand-700 bg-brand-100'
                    : 'text-brand-800 hover:bg-brand-100'
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
