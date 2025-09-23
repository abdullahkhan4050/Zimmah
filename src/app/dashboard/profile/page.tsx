"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getFirestore, collection, addDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { app } from "@/lib/firebase";

const profileSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is required"),
    address: z.string().min(5, "Address is required"),
});

export default function ProfilePage() {
    const { toast } = useToast();
    
    // Placeholder user data
    const currentUser = {
        fullName: "Bilal Khan",
        email: "bilal.khan@example.com",
        phone: "+92 300 1234567",
        address: "123 Main St, Islamabad"
    };

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: currentUser,
    });

    const userInitials = currentUser.fullName.split(' ').map(n => n[0]).join('');

    async function onSubmit(values: z.infer<typeof profileSchema>) {
        try {
            const db = getFirestore(app);
            // Assuming you have a 'users' collection and want to save profile data.
            // In a real app, you would likely use the user's UID as the document ID.
            await addDoc(collection(db, "users"), values);
            toast({
                title: "Profile Updated",
                description: "Your personal information has been saved.",
            });
        } catch (error) {
            console.error("Error updating profile: ", error);
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        }
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
                            <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${currentUser.email}`} alt={currentUser.fullName} />
                            <AvatarFallback>{userInitials}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <CardTitle className="text-2xl font-headline text-primary">{currentUser.fullName}</CardTitle>
                            <CardDescription>{currentUser.email}</CardDescription>
                            <Button size="sm" variant="outline" className="w-fit mt-2">
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
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" />
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
