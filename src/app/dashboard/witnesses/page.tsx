
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserCheck, PlusCircle } from "lucide-react";
import { collection, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const witnessSchema = z.object({
  name: z.string().min(2, "Witness name is required."),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, "Invalid CNIC format (e.g., 12345-1234567-1)"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email.").optional().or(z.literal("")),
});

type Witness = z.infer<typeof witnessSchema> & { id: string };

export default function WitnessesPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const form = useForm<z.infer<typeof witnessSchema>>({
    resolver: zodResolver(witnessSchema),
    defaultValues: {
      name: "",
      cnic: "",
      phone: "",
      email: "",
    }
  });

  const witnessesQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "witnesses"), where("userId", "==", user.uid));
  }, [firestore, user]);

  const { data: witnesses, loading } = useCollection<Witness>(witnessesQuery);

  async function onSubmit(data: z.infer<typeof witnessSchema>) {
    if (!firestore || !user) {
        toast({
            title: "Error",
            description: "You must be logged in to add a witness.",
            variant: "destructive",
        });
        return;
    }

    const witnessData = {
      ...data,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    
    const collectionRef = collection(firestore, "witnesses");
    
    addDoc(collectionRef, witnessData)
    .then(() => {
        toast({
            title: "Witness Added",
            description: "The witness has been successfully recorded.",
        });
        form.reset();
    })
    .catch(async (error) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
            path: collectionRef.path,
            operation: "create",
            requestResourceData: witnessData,
        }));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-primary">
          <UserCheck /> Witness Management
        </h1>
        <p className="text-muted-foreground">Add and manage your trusted witnesses.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-primary">Add a New Witness</CardTitle>
              <CardDescription>Fill in the details to add a new witness.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Junaid Ahmed" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cnic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNIC</FormLabel>
                          <FormControl>
                            <Input placeholder="42201-1234567-1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+92 300 1234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="witness@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  <Button type="submit" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Witness
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-primary">Your Witnesses</CardTitle>
              <CardDescription>A list of all your recorded witnesses.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">CNIC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-4 w-36" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && witnesses?.map((witness) => (
                    <TableRow key={witness.id}>
                      <TableCell className="font-medium">{witness.name}</TableCell>
                      <TableCell>{witness.phone}</TableCell>
                      <TableCell className="hidden md:table-cell">{witness.cnic}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!loading && witnesses?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  You haven't added any witnesses yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
