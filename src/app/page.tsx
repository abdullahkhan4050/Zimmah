
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
import { doc, setDoc, getDoc } from "firebase/firestore";
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
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, UserCredential } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

type Role = "User" | "Scholar" | "Admin";

const roles: { name: Role; icon: React.ElementType; description: string; className: string; comingSoon?: boolean }[] = [
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
    className: "",
    comingSoon: true,
  },
  {
    name: "Admin",
    icon: UserCog,
    description: "System administration and oversight.",
    className: "",
    comingSoon: false,
  },
];

const ADMIN_EMAIL = "naiveforce2@gmail.com";

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" >
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
_next/static/chunks/src_app_page_tsx_eb4cd524.js    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.536,44,28.696,44,20C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);


export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
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
      if (email === ADMIN_EMAIL) {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;

    const provider = new GoogleAuthProvider();
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists in Firestore
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // New user, create a document in Firestore
        const newUser = {
          uid: user.uid,
          fullName: user.displayName,
          email: user.email,
          avatar: user.photoURL,
          role: "User", // Default role
        };
        await setDoc(userDocRef, newUser).catch(error => {
           errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: newUser
            }));
             throw error;
        });
        toast({
          title: "Account Created!",
          description: "Welcome to Zimmah. Your account has been created.",
        });
      } else {
        toast({
          title: "Login Successful!",
          description: "Welcome back!",
        });
      }

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Google Sign-In Failed",
        description: error.message,
        variant: "destructive",
      });
      console.error(error);
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-100 via-blue-50 to-orange-50 p-4">
      <div className="flex w-full max-w-4xl flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        <header className="flex flex-col items-center text-center w-full max-w-md">
          <ZimmahLogo className="w-auto h-56 mb-4" />
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
              <CardContent className="grid gap-4">
                 <div className="grid grid-cols-1 gap-4">
                    <button
                        key="User"
                        onClick={() => setSelectedRole("User")}
                        className={cn(
                            "p-4 border rounded-lg text-center transition-all group relative hover:bg-accent/10 hover:border-primary"
                        )}
                    >
                        <User className="h-10 w-10 mx-auto text-primary mb-2" />
                        <h3 className="font-semibold text-lg font-headline text-foreground">User</h3>
                        <p className="text-sm text-muted-foreground font-body">Manage your debts, trusts, and will.</p>
                    </button>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    {roles.filter(r => r.name !== 'User').map((role) => (
                      <button
                        key={role.name}
                        onClick={() => !role.comingSoon && setSelectedRole(role.name as Role)}
                        disabled={role.comingSoon}
                        className={cn(
                            "p-4 border rounded-lg text-center transition-all group relative",
                            role.className,
                            role.comingSoon
                            ? "cursor-not-allowed opacity-60"
                            : "hover:bg-accent/10 hover:border-primary"
                        )}
                      >
                        {role.comingSoon && (
                            <Badge variant="secondary" className="absolute -top-2 right-2">Coming Soon</Badge>
                        )}
                        <role.icon className="h-10 w-10 mx-auto text-primary mb-2" />
                        <h3 className="font-semibold text-lg font-headline text-foreground">
                          {role.name}
                        </h3>
                        <p className="text-sm text-muted-foreground font-body">
                          {role.description}
                        </p>
                      </button>
                    ))}
                 </div>
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
                     {selectedRole === 'User' && (
                        <Link
                            href="#"
                            className="text-sm text-muted-foreground hover:underline"
                        >
                            Forgot Password?
                        </Link>
                     )}
                  </div>
                  
                  <Button className="w-full" type="submit">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                  
                </form>
                 {selectedRole === 'User' && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                        <GoogleIcon />
                        Google
                      </Button>
                      <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="underline text-primary">
                          Sign up
                        </Link>
                      </div>
                    </>
                )}
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

    