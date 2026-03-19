/**
 * Auth pages layout — no background music, just the children.
 * Inherits root layout fonts and direction (rtl).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
