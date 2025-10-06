
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState, useRef, useMemo } from "react";
import { updateProfile } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDoc, useFirestore, useAuth } from "@/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const profileSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    address: z.string().optional(),
    avatar: z.string().optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const firestore = useFirestore();
    const auth = useAuth();

    const form = useForm<ProfileData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            address: "",
            avatar: "",
        },
    });
    
    const profileDocRef = useMemo(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: profileData, loading: profileLoading } = useDoc<ProfileData>(profileDocRef, {
        onSuccess: (data) => {
            if (data) {
                form.reset({
                    ...data,
                    email: user?.email || data.email, // Prioritize auth email
                });
                if (data.avatar) {
                    setAvatarPreview(data.avatar);
                } else if (user?.photoURL) {
                    setAvatarPreview(user.photoURL);
                }
            } else if (user) {
                form.reset({
                    fullName: user.displayName || "",
                    email: user.email || "",
                });
                if(user.photoURL) {
                    setAvatarPreview(user.photoURL)
                }
            }
        }
    });

    useEffect(() => {
        if (user && !form.getValues('email')) {
            form.setValue('email', user.email || '');
        }
    }, [user, form]);

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setAvatarPreview(result);
                form.setValue("avatar", result);
            };
            reader.readAsDataURL(file);
        }
    };

    async function onSubmit(values: ProfileData) {
        if (!profileDocRef || !user || !auth) {
            toast({
                title: "Error",
                description: "You must be logged in to update your profile.",
                variant: "destructive",
            });
            return;
        }

        const profileUpdatePromise = updateProfile(user, {
            displayName: values.fullName,
            photoURL: values.avatar,
        });

        const firestoreUpdatePromise = setDoc(profileDocRef, {
            ...values,
            email: user.email, // ensure email is not changed
        }, { merge: true })
        .catch(async (error) => {
             errorEmitter.emit("permission-error", new FirestorePermissionError({
                path: profileDocRef.path,
                operation: "update",
                requestResourceData: values,
            }));
             throw error; // re-throw to be caught by Promise.all
        });


        Promise.all([profileUpdatePromise, firestoreUpdatePromise])
        .then(() => {
            toast({
                title: "Profile Updated",
                description: "Your personal information has been saved.",
            });
        })
        .catch((error) => {
            console.error("Failed to update profile:", error);
            if (! (error instanceof FirestorePermissionError)) {
                 toast({
                    title: "Update Failed",
                    description: error.message || "Could not update your profile.",
                    variant: "destructive",
                });
            }
        });
    }
    
    const currentUser = form.watch();
    const userInitials = currentUser.fullName ? currentUser.fullName.split(' ').map(n => n[0]).join('') : (user?.displayName?.split(' ').map(n => n[0]).join('') || '');
    
    const loading = authLoading || profileLoading;

    if (loading && !profileData) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading Profile...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">User Profile</h1>
                <p className="text-muted-foreground">Manage your personal information and settings.</p>
            </header>

            <Card className="border-2">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={avatarPreview || user?.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${currentUser.email}`} alt={currentUser.fullName} />
                            <AvatarFallback>{userInitials}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <CardTitle className="text-2xl font-headline text-primary">{currentUser.fullName || user?.displayName}</CardTitle>
                            <CardDescription>{currentUser.email || user?.email}</CardDescription>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <Button size="sm" variant="outline" className="w-fit mt-2" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" /> Change Photo
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
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
                                            <FormControl><Input type="email" disabled {...field} /></FormControl>
                                            <FormDescription>Email cannot be changed.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            
                            <div className="flex justify-end">
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
