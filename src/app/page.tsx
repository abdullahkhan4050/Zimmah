
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  BookUser,
  UserCog,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

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
import { NaiveForceLogo, ZimmahLogo } from "@/components/icons";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Role = "User" | "Scholar" | "Admin";

const roles = [
  {
    name: "User",
    icon: User,
    description: "Manage your debts, trusts, and will.",
    className: "sm:col-span-2"
  },
  {
    name: "Scholar",
    icon: BookUser,
    description: "Review and verify Shariah compliance.",
    className: ""
  },
  {
    name: "Admin",
    icon: UserCog,
    description: "System administration and oversight.",
    className: ""
  },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful!",
        description: "Redirecting you to the dashboard...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-100 via-blue-50 to-orange-50 p-4">
      <div className="flex w-full max-w-4xl flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        <header className="flex flex-col items-center text-center w-full max-w-md">
          <ZimmahLogo className="h-56 w-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
            Zimmah
          </h1>
           <p className="text-muted-foreground mt-2 font-body text-lg md:text-xl">
            Your Digital Vault for Shariah-Compliant Assets
          </p>
        </header>

        <main className="w-full max-w-md">
          {!selectedRole ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-center text-primary">
                  Select Your Role
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <button
                    key={role.name}
                    onClick={() => setSelectedRole(role.name as Role)}
                    className={cn("p-4 border rounded-lg text-center hover:bg-accent/10 hover:border-primary transition-all group", role.className)}
                  >
                    <role.icon className="h-10 w-10 mx-auto text-primary mb-2" />
                    <h3 className="font-semibold text-lg font-headline text-foreground">
                      {role.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-body">
                      {role.description}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="relative text-center">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-primary"
                >
                  &larr; Back
                </button>
                <CardTitle className="font-headline text-primary">
                  Login as {selectedRole}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                        <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  
                  <Button className="w-full" type="submit">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                  
                </form>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="underline text-primary">
                    Sign up
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
      <footer className="absolute bottom-4 text-center text-xs text-muted-foreground font-body">
        <div className="flex items-center gap-2">
          <NaiveForceLogo className="h-6 w-6" />
          <span>© 2024 Naive Force. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
