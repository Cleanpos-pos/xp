
import React from 'react';

// This layout is now simplified as the root layout handles the main auth styling.
// It ensures that routes within (auth) like /settings are still processed correctly
// and will inherit the root layout (which is now the AuthLayout).
export default function AuthSubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
