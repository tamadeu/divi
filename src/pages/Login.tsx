import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { Package } from "lucide-react";
import { showError } from "@/utils/toast";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const LoginPage = () => {
  const { session, loading: sessionLoading } = useSession();
  const { getPlatformName, getPlatformTagline, getPlatformLogo } = usePublicPlatformSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showError(error.message);
    }
    // On success, the SessionProvider will handle the redirect
    setLoading(false);
  };

  if (sessionLoading) {
    return null; // Or a loading spinner
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  const platformName = getPlatformName();
  const platformTagline = getPlatformTagline();
  const platformLogo = getPlatformLogo();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            {platformLogo ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={platformLogo} alt={platformName} />
                <AvatarFallback>
                  <Package className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Package className="h-8 w-8" />
            )}
            <h1 className="text-2xl font-bold">{platformName}</h1>
          </div>
          <CardTitle className="text-2xl">Bem-vindo de volta!</CardTitle>
          <CardDescription>
            {platformTagline ? `${platformTagline}. ` : ''}
            Entre com seus dados para acessar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    to="/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>
          <GoogleAuthButton />
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <Link to="/signup" className="underline">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;