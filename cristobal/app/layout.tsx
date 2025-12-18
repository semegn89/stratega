import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Root layout required by Next.js App Router.
  // The actual HTML shell and locale handling live in `app/[locale]/layout.tsx`.
  return <>{children}</>;
}
