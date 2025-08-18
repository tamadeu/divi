import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";

const LoginPage = () => {
  const { session } = useSession();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-md p-8">
        <h1 className="mb-6 text-center text-2xl font-bold">Bem-vindo ao Finance Inc</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google", "github"]}
          theme="light"
        />
      </div>
    </div>
  );
};

export default LoginPage;