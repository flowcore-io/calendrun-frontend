"use client";

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function SignOutButton({ className, children }: SignOutButtonProps) {
  const handleSignOut = () => {
    // Redirect to our custom sign out API route that handles Keycloak logout
    // This route will:
    // 1. Get the id_token from the JWT
    // 2. Redirect to Keycloak's logout endpoint with the id_token
    // 3. Keycloak will clear the SSO session and redirect back to our app
    window.location.href = "/api/auth/signout-keycloak";
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={className}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
        cursor: "pointer",
      }}
    >
      {children ?? "Sign out"}
    </button>
  );
}
