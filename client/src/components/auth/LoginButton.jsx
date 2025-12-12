import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function LoginButton() {
  const { signIn, signOut, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Button disabled>Loading...</Button>;
  }

  if (isAuthenticated) {
    return (
      <Button onClick={signOut} variant="outline">
        Sign Out
      </Button>
    );
  }

  return (
    <Button onClick={signIn}>
      Sign in with Google (@somaiya.edu)
    </Button>
  );
}

