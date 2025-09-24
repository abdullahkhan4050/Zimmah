
"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Info, ShieldCheck } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ZimmahLogo } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";

const formSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, "Invalid CNIC format (e.g., 12345-1234567-1)"),
    phone: z.string().min(10, "Phone number is required"),
    dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date of birth",
    }),
    address1: z.string().min(5, "Address is required"),
    address2: z.string().optional(),
    cnicFile: z.any().optional(), // In a real app, use a more specific type
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    agreedToPrinciples: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Shariah principles.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    const firestore = useFirestore();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            cnic: "",
            phone: "",
            dob: "",
            address1: "",
            address2: "",
            password: "",
            confirmPassword: "",
            agreedToPrinciples: false,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!auth || !firestore) {
             toast({
                title: "Error",
                description: "Firebase not initialized.",
                variant: "destructive",
            });
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: values.fullName,
            });

            await setDoc(doc(firestore, "users", user.uid), {
                fullName: values.fullName,
                email: values.email,
                cnic: values.cnic,
                phone: values.phone,
                dob: values.dob,
                address1: values.address1,
                address2: values.address2,
            });

            toast({
                title: "Registration Successful!",
                description: "Redirecting you to the dashboard...",
            });
            router.push('/dashboard');
        } catch (error: any) {
             toast({
                title: "Registration Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-2xl space-y-6">
        <header className="flex flex-col items-center text-center">
          <ZimmahLogo className="h-16 w-16 mb-4" />
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">
            Create Your Account
          </h1>
          <p className="text-muted-foreground mt-2 font-body">
            Join Zimmah to securely manage your assets according to Shariah.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-primary">Registration Details</CardTitle>
            <CardDescription>All fields are required unless stated otherwise.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Bilal Khan" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl><Input placeholder="m@example.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="cnic"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CNIC</FormLabel>
                                <FormControl><Input placeholder="00000-0000000-0" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl><Input placeholder="+92 300 1234567" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="dob"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cnicFile"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CNIC Upload (Optional)</FormLabel>
                                <FormControl>
                                    <Input type="file" className="pt-2 text-sm" />
                                </FormControl>
                                <FormDescription>Upload a scan of your CNIC.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
                
                <FormField
                    control={form.control}
                    name="address1"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl><Input type="password" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl><Input type="password" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                  control={form.control}
                  name="agreedToPrinciples"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2">
                          I agree to the Shariah principles and terms of service.
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Our platform operates strictly under Shariah law, ensuring all transactions are ethical and compliant.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Create Account
                </Button>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/" className="underline text-primary">
                    Log in
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
