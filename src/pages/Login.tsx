import { Navigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { Package } from "lucide-react";

const LoginPage = () => {
  const { session, loading } = useSession();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Package className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Finance Inc</h1>
          </div>
          <CardTitle className="text-2xl">Bem-vindo de volta!</CardTitle>
          <CardDescription>
            Entre com sua conta Google para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleAuthButton />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;