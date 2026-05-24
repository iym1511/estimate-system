'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users } from 'lucide-react';

const links = [
  { href: '/', label: '견적 관리', icon: LayoutDashboard },
  { href: '/vendors', label: '업체 관리', icon: Users },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
      style={{
        background: '#ffffff',
        borderTop: '1px solid #e8e8e8',
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {links.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            style={{ color: isActive ? '#3ecf8e' : '#b2b2b2' }}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
