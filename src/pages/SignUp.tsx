import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/utils/toast";
import { Package } from "lucide-react";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SignUpPage = () => {
  const { getPlatformName, getPlatformTagline, getPlatformLogo, loading } = usePublicPlatformSettings();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      showError(error.message);
    } else {
      showSuccess("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
      navigate("/login");
    }
    setIsSubmitting(false);
  };

  const platformName = getPlatformName();
  const platformTagline = getPlatformTagline();
  const platformLogo = getPlatformLogo();

  // Don't render platform info if still loading or empty
  const shouldShowPlatformInfo = !loading && (platformName || platformLogo);
  const shouldShowTagline = !loading && platformTagline;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="text-center">
          {shouldShowPlatformInfo && (
            <div className="flex justify-center items-center gap-2 mb-4">
              {platformLogo ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={platformLogo} alt={platformName || 'Logo'} />
                  <AvatarFallback>
                    <Package className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Package className="h-8 w-8" />
              )}
              {platformName && <h1 className="text-2xl font-bold">{platformName}</h1>}
            </div>
          )}
          <CardTitle className="text-2xl">Criar uma conta</CardTitle>
          <CardDescription>
            {shouldShowTagline && `${platformTagline}. `}
            Insira seus dados abaixo para se cadastrar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">Nome</Label>
                  <Input id="first-name" placeholder="Alex" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Sobrenome</Label>
                  <Input id="last-name" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
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
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Criando conta..." : "Criar conta"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{" "}
            <Link to="/login" className="underline">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;