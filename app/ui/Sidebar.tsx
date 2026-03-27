'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    section: 'Operazioni',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/inserimento', label: 'Inserimento ore' },
      { href: '/riepilogo', label: 'Riepilogo Interno' },
    ],
  },
  {
    section: 'Configurazione',
    links: [
      { href: '/anagrafiche', label: 'Anagrafiche' },
    ],
  },
  {
    section: 'Export',
    links: [
      { href: '/barth', label: 'File BARTH' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-quercus">QUERCUS</span>
        <span className="logo-pro">.PRO</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(group => (
          <div key={group.section} className="nav-group">
            <p className="nav-section-label">{group.section}</p>
            {group.links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="account-avatar">UQ</div>
        <div className="account-info">
          <span className="account-name">Account</span>
          <button className="account-logout">Esci</button>
        </div>
      </div>
    </aside>
  );
}
