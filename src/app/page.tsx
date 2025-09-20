"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  BookUser,
  HeartHandshake,
  UserCog,
  ShieldCheck,
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

type Role = "User" | "Scholar" | "Witness" | "Admin";

const roles = [
  {
    name: "User",
    icon: User,
    description: "Manage your debts, trusts, and will.",
  },
  {
    name: "Scholar",
    icon: BookUser,
    description: "Review and verify Shariah compliance.",
  },
  {
    name: "Witness",
    icon: HeartHandshake,
    description: "Witness and verify transactions.",
  },
  {
    name: "Admin",
    icon: UserCog,
    description: "System administration and oversight.",
  },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-100 via-blue-50 to-orange-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <header className="flex flex-col items-center text-center">
          <ZimmahLogo className="h-20 w-20 mb-4" />
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">
            Zimmah Digital Vault
          </h1>
          <p className="text-muted-foreground mt-2 font-body text-base md:text-lg">
            Secure Shariah-Compliant Will Management System
          </p>
        </header>

        <main>
          {!selectedRole ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-center">
                  Select Your Role
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <button
                    key={role.name}
                    onClick={() => setSelectedRole(role.name as Role)}
                    className="p-4 border rounded-lg text-center hover:bg-accent/10 hover:border-primary transition-all group"
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
              <CardHeader className="relative">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="absolute left-4 top-4 text-sm text-muted-foreground hover:text-primary"
                >
                  &larr; Back to roles
                </button>
                <CardTitle className="font-headline text-center pt-8">
                  Login as {selectedRole}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <Link href="/dashboard" className="w-full block">
                    <Button className="w-full" type="submit">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                  </Link>
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
