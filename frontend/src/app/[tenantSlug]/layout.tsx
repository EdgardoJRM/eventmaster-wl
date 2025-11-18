'use client';

import { ReactNode } from 'react';

// Layout simple para páginas públicas del tenant
// El ThemeProvider ya está en el layout root, no necesitamos anidarlo
export default function TenantLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

