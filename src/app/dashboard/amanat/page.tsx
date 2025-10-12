
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HeartHandshake, CalendarIcon, PlusCircle, Trash2, Save, UserCheck } from "lucide-react";
import { format, parse } from "date-fns";
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, query } from "firebase/firestore";
import { useMemo, useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type Witness = { id: string; name: string; cnic: string; };

const witnessSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Witness name is required."),
  cnic: z.string().optional(),
  email: z.string().email("Invalid email.").optional().or(z.literal("")),
});

const amanatSchema = z.object({
  item: z.string().min(2, "Item name is required."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(200),
  entrustee: z.string().min(2, "Entrustee name is required."),
  returnDate: z.date({ required_error: "Expected return date is required." }),
  witnesses: z.array(witnessSchema).optional(),
});

export default function AmanatPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const amanatId = searchParams.get('id');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWitnesses, setSelectedWitnesses] = useState<Witness[]>([]);
  
  const form = useForm<z.infer<typeof amanatSchema>>({
    resolver: zodResolver(amanatSchema),
    defaultValues: {
      item: "",
      description: "",
      entrustee: "",
      witnesses: [],
    }
  });

  const witnessesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, `users/${user.uid}/witnesses`));
  }, [firestore, user?.uid]);

  const { data: availableWitnesses, loading: witnessesLoading } = useCollection<Witness>(witnessesQuery);

  useEffect(() => {
    if (amanatId && firestore && user) {
      setIsLoading(true);
      const docRef = doc(firestore, `users/${user.uid}/amanats`, amanatId);
      getDoc(docRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          form.reset({
            item: data.item,
            description: data.description,
            entrustee: data.entrustee,
            returnDate: parse(data.returnDate, "PPP", new Date()),
            witnesses: data.witnesses || [],
          });
          setSelectedWitnesses(data.witnesses || []);
        } else {
          toast({ title: "Error", description: "Amanat record not found.", variant: "destructive" });
        }
      }).finally(() => setIsLoading(false));
    }
  }, [amanatId, firestore, user, form, toast]);
  
  useEffect(() => {
    form.setValue('witnesses', selectedWitnesses);
  }, [selectedWitnesses, form]);


  const handleWitnessSelect = (witness: Witness) => {
    setSelectedWitnesses(prev => 
      prev.some(w => w.id === witness.id)
        ? prev.filter(w => w.id !== witness.id)
        : [...prev, witness]
    );
  };


  async function onSubmit(data: z.infer<typeof amanatSchema>) {
    if (!firestore || !user) {
        toast({
            title: "Error",
            description: "You must be logged in to manage Amanat records.",
            variant: "destructive",
        });
        return;
    }

    const amanatData: any = {
      ...data,
      userId: user.uid,
      returnDate: format(data.returnDate, "PPP"),
      witnesses: selectedWitnesses,
    };

    if (amanatId) {
      // Update existing record
      const docRef = doc(firestore, `users/${user.uid}/amanats`, amanatId);
      updateDoc(docRef, amanatData)
      .then(() => {
          toast({
              title: "Amanat Updated",
              description: "The entrusted item has been successfully updated.",
          });
          router.push('/dashboard');
      })
      .catch(async (error) => {
          errorEmitter.emit("permission-error", new FirestorePermissionError({
              path: docRef.path,
              operation: "update",
              requestResourceData: amanatData,
          }));
      });

    } else {
      // Create new record
      amanatData.createdAt = serverTimestamp();
      const collectionPath = `users/${user.uid}/amanats`;
      const collectionRef = collection(firestore, collectionPath);
      
      addDoc(collectionRef, amanatData)
      .then(() => {
          toast({
              title: "Amanat Recorded",
              description: "The entrusted item has been successfully recorded.",
          });
          form.reset();
          setSelectedWitnesses([]);
      })
      .catch(async (error) => {
          errorEmitter.emit("permission-error", new FirestorePermissionError({
              path: collectionRef.path,
              operation: "create",
              requestResourceData: amanatData,
          }));
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-primary">
          <HeartHandshake /> Amanat (Entrusted Items) Management
        </h1>
        <p className="text-muted-foreground">{amanatId ? "Edit your entrusted item record." : "Keep track of items you have entrusted to others."}</p>
      </header>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-primary">{amanatId ? "Edit Entrusted Item" : "Record a New Entrusted Item"}</CardTitle>
          <CardDescription>Fill in the details below to {amanatId ? "update this" : "add a new"} Amanat record.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="item"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., cash/gold" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Description</FormLabel>
                       <FormControl>
                         <Textarea placeholder="e.g., 50,000 PKR and 1 tola of gold kept for safekeeping." {...field} />
                       </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="entrustee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entrustee (Amanat rakhnay wala)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Ahmed Khan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="returnDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                          <FormLabel>Expected Return Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date() && !amanatId}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
              
               <div className="space-y-4">
                    <FormLabel>Witnesses</FormLabel>
                    <Card className="p-4 border-dashed">
                      <CardContent className="p-0">
                        {selectedWitnesses.length > 0 ? (
                          <div className="space-y-2">
                            {selectedWitnesses.map(w => (
                              <Badge key={w.id} variant="secondary" className="mr-2">
                                {w.name}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 ml-1"
                                  onClick={() => setSelectedWitnesses(prev => prev.filter(sw => sw.id !== w.id))}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No witnesses selected.</p>
                        )}
                      </CardContent>
                    </Card>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline"><UserCheck className="mr-2 h-4 w-4" /> Select Witnesses</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Select Witnesses</DialogTitle>
                                <DialogDescription>Choose from your saved witnesses.</DialogDescription>
                            </DialogHeader>
                             <div className="flex flex-col gap-4">
                                <ScrollArea className="max-h-64">
                                    <div className="space-y-2 p-1">
                                        {witnessesLoading && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                                        {!witnessesLoading && availableWitnesses?.map(witness => (
                                            <div key={witness.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                                <Checkbox
                                                    id={`witness-${witness.id}`}
                                                    onCheckedChange={() => handleWitnessSelect(witness)}
                                                    checked={selectedWitnesses.some(w => w.id === witness.id)}
                                                />
                                                <label
                                                    htmlFor={`witness-${witness.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                                >
                                                    {witness.name} ({witness.cnic})
                                                </label>
                                            </div>
                                        ))}
                                        {!witnessesLoading && availableWitnesses?.length === 0 && (
                                            <p className="text-center text-muted-foreground p-4">No saved witnesses. Add one from the Witnesses page.</p>
                                        )}
                                    </div>
                                </ScrollArea>
                                <Button variant="secondary" asChild>
                                    <Link href="/dashboard/witnesses">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Witness
                                    </Link>
                                </Button>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button>Done</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

              <div className="flex justify-end">
                <Button type="submit">
                  {amanatId ? <><Save className="mr-2 h-4 w-4" /> Save Changes</> : <><PlusCircle className="mr-2 h-4 w-4" /> Add Amanat Record</>}
                </Button>
              </div>
            </form>
          </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

