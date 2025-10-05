
"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Info, ShieldCheck, Eye, EyeOff, Mail, KeyRound } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc, collection, addDoc, serverTimestamp } from "firebase/firestore";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const detailsSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, "Invalid CNIC format (e.g., 12345-1234567-1)"),
    phone: z.string().min(10, "Phone number is required"),
    dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date of birth",
    }),
    address1: z.string().min(5, "Address is required"),
    address2: z.string().optional(),
    cnicFile: z.any().optional(),
  });

const passwordSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    agreedToPrinciples: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Shariah principles.",
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type DetailsFormValues = z.infer<typeof detailsSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    const firestore = useFirestore();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState(1);
    const [userDetails, setUserDetails] = useState<DetailsFormValues | null>(null);

    const detailsForm = useForm<DetailsFormValues>({
        resolver: zodResolver(detailsSchema),
        defaultValues: {
            fullName: "",
            email: "",
            cnic: "",
            phone: "",
            dob: "",
            address1: "",
            address2: "",
        },
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            otp: "",
            password: "",
            confirmPassword: "",
            agreedToPrinciples: false,
        },
    });

    async function onDetailsSubmit(values: DetailsFormValues) {
        if (!firestore) {
            toast({
                title: "Error",
                description: "Database connection not available.",
                variant: "destructive",
            });
            return;
        }
        
        setUserDetails(values);
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const pendingUserData: any = {
            ...values,
            otp: otp,
            createdAt: serverTimestamp()
        };

        if (!pendingUserData.cnicFile) {
            delete pendingUserData.cnicFile;
        }

        try {
            await addDoc(collection(firestore, "pending_users"), pendingUserData);

            // In a real app, a Cloud Function would listen to this document creation
            // and send an email with the OTP.
            console.log(`Generated OTP for ${values.email}: ${otp}`);

            setStep(2);

            toast({
                title: "Verification Code Sent",
                description: "Please check your email for the 6-digit OTP.",
            });
        } catch (error) {
            console.error("Error creating pending user:", error);
            toast({
                title: "Error",
                description: "Could not start the registration process. Please try again.",
                variant: "destructive",
            });
        }
    }

    async function onPasswordSubmit(values: PasswordFormValues) {
        if (!auth || !firestore || !userDetails) {
             toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
            return;
        }

        // In a real app, you'd verify the OTP against your backend/firestore
        console.log("Simulating OTP verification with:", values.otp);
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userDetails.email, values.password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: userDetails.fullName,
            });

            const userData: any = {
                fullName: userDetails.fullName,
                email: userDetails.email,
                cnic: userDetails.cnic,
                phone: userDetails.phone,
                dob: userDetails.dob,
                address1: userDetails.address1,
                address2: userDetails.address2,
            };

            if (!userDetails.cnicFile) {
                delete userData.cnicFile;
            }

            await setDoc(doc(firestore, "users", user.uid), userData);

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
            {step === 1 && (
                <>
                <CardHeader>
                    <CardTitle className="font-headline text-primary">Step 1: Your Details</CardTitle>
                    <CardDescription>All fields are required unless stated otherwise.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...detailsForm}>
                    <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={detailsForm.control}
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
                                control={detailsForm.control}
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
                                control={detailsForm.control}
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
                                control={detailsForm.control}
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
                                control={detailsForm.control}
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
                                control={detailsForm.control}
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
                            control={detailsForm.control}
                            name="address1"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">
                            <Mail className="mr-2 h-4 w-4" />
                            Send Verification Code
                        </Button>
                    </form>
                    </Form>
                </CardContent>
                </>
            )}

            {step === 2 && (
                <>
                <CardHeader>
                    <CardTitle className="font-headline text-primary">Step 2: Verification</CardTitle>
                    <CardDescription>Enter the code sent to your email and set your password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                            <Alert>
                                <Mail className="h-4 w-4" />
                                <AlertTitle>Check your email!</AlertTitle>
                                <AlertDescription>
                                    We've sent a 6-digit verification code to <strong>{userDetails?.email}</strong>.
                                </AlertDescription>
                            </Alert>
                             <FormField
                                control={passwordForm.control}
                                name="otp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Verification Code</FormLabel>
                                        <FormControl>
                                          <div className="relative">
                                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="123456" {...field} className="pl-10" />
                                          </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                            <div className="relative">
                                                <Input type={showPassword ? "text" : "password"} {...field} />
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
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                            <div className="relative">
                                                <Input type={showConfirmPassword ? "text" : "password"} {...field} />
                                                <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute inset-y-0 right-0 h-full px-3"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                {showConfirmPassword ? <EyeOff /> : <Eye />}
                                                <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                                                </Button>
                                            </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={passwordForm.control}
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

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
                                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                    &larr; Back to Details
                                </Button>
                                <Button type="submit" className="w-full sm:w-auto">
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Create Account
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
                </>
            )}

            <CardContent>
                 <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/" className="underline text-primary">
                    Log in
                  </Link>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    