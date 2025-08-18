import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Chrome } from "lucide-react";

const GoogleAuthButton = () => {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleLogin}>
      <Chrome className="mr-2 h-4 w-4" />
      Entrar com Google
    </Button>
  );
};

export default GoogleAuthButton;