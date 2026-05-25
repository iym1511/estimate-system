'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: '견적 관리', icon: LayoutDashboard },
  { href: '/vendors', label: '업체 관리', icon: Users },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-col w-56"
      style={{
        height: '100%',
        background: '#ffffff',
        borderRight: '1px solid #e8e8e8',
      }}
    >
      {/* 로고 */}
      <div
        className="flex items-center gap-2.5 px-5"
        style={{ height: 56, borderBottom: '1px solid #f0f0f0' }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 28, height: 28, background: '#3ecf8e', borderRadius: 7 }}
        >
          <span style={{ fontSize: 10, fontWeight: 900, color: '#171717', letterSpacing: '-0.5px' }}>QM</span>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#171717', lineHeight: 1.2, letterSpacing: '-0.2px' }}>그린설비</p>
          <p style={{ fontSize: 10, color: '#9a9a9a', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 1 }}>Repair Admin</p>
        </div>
      </div>

      {/* 메뉴 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        <p style={{ fontSize: 10, color: '#b2b2b2', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px 8px' }}>메뉴</p>
        <div className="space-y-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md transition-all',
                  'text-sm font-medium'
                )}
                style={{
                  height: 36,
                  padding: '0 10px',
                  background: isActive ? '#f0fdf8' : 'transparent',
                  color: isActive ? '#171717' : '#707070',
                  border: isActive ? '1px solid #d1f5e4' : '1px solid transparent',
                }}
              >
                <Icon
                  size={15}
                  style={{ color: isActive ? '#3ecf8e' : '#b2b2b2', flexShrink: 0 }}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 하단 */}
      <div className="p-4">
        <div
          className="rounded-lg p-3.5"
          style={{ background: '#f7f7f7', border: '1px solid #efefef' }}
        >
          <p style={{ fontSize: 12, color: '#9a9a9a', lineHeight: 1.6 }}>
            오늘도{' '}
            <span style={{ color: '#3ecf8e', fontWeight: 600 }}>안전하게</span>{' '}
            화이팅!
          </p>
        </div>
      </div>
    </nav>
  );
}
