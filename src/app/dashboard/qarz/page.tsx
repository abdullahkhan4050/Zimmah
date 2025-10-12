
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BookOpen, CalendarIcon, PlusCircle, FileSignature, Save, UserCheck, Trash2 } from "lucide-react";
import { format, parse } from "date-fns";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, query } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
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

const qarzSchema = z.object({
  debtor: z.string().min(2, "Debtor name is required."),
  creditor: z.string().min(2, "Creditor name is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  startDate: z.date({ required_error: "Start date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  witnesses: z.array(witnessSchema).optional(),
});

export default function QarzPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qarzId = searchParams.get('id');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWitnesses, setSelectedWitnesses] = useState<Witness[]>([]);

  const form = useForm<z.infer<typeof qarzSchema>>({
    resolver: zodResolver(qarzSchema),
    defaultValues: {
      debtor: "",
      creditor: "",
      amount: 0,
      witnesses: [],
    }
  });

  const witnessesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, `users/${user.uid}/witnesses`));
  }, [firestore, user?.uid]);

  const { data: availableWitnesses, loading: witnessesLoading } = useCollection<Witness>(witnessesQuery);

  useEffect(() => {
    if (qarzId && firestore && user) {
      setIsLoading(true);
      const docRef = doc(firestore, `users/${user.uid}/qarzs`, qarzId);
      getDoc(docRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          form.reset({
            debtor: data.debtor,
            creditor: data.creditor,
            amount: data.amount,
            startDate: parse(data.startDate, "PPP", new Date()),
            dueDate: parse(data.dueDate, "PPP", new Date()),
            witnesses: data.witnesses || [],
          });
          setSelectedWitnesses(data.witnesses || []);
        } else {
          toast({ title: "Error", description: "Qarz record not found.", variant: "destructive" });
        }
      }).finally(() => setIsLoading(false));
    }
  }, [qarzId, firestore, user, form, toast]);
  
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
  
  async function onSubmit(data: z.infer<typeof qarzSchema>) {
    if (!user || !firestore) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to manage a Qarz.",
        variant: "destructive",
      });
      return;
    }
    
    const qarzData: any = {
      ...data,
      userId: user.uid,
      startDate: format(data.startDate, "PPP"),
      dueDate: format(data.dueDate, "PPP"),
      witnesses: selectedWitnesses, // Save selected witnesses
    };
    
    if (qarzId) {
      // Update existing record
      const docRef = doc(firestore, `users/${user.uid}/qarzs`, qarzId);
      updateDoc(docRef, qarzData)
      .then(() => {
          toast({
            title: "Qarz Updated",
            description: "The debt record has been successfully updated.",
          });
          router.push('/dashboard');
      })
      .catch(async (error) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: docRef.path,
          operation: "update",
          requestResourceData: qarzData,
        }));
      });
    } else {
      // Create new record
      qarzData.createdAt = serverTimestamp();
      const collectionPath = `users/${user.uid}/qarzs`;
      const collectionRef = collection(firestore, collectionPath);

      addDoc(collectionRef, qarzData)
        .then(() => {
          toast({
            title: "Qarz Recorded",
            description: "The debt has been successfully recorded.",
          });
          form.reset();
          setSelectedWitnesses([]);
        })
        .catch(async (error) => {
          errorEmitter.emit("permission-error", new FirestorePermissionError({
            path: collectionRef.path,
            operation: "create",
            requestResourceData: qarzData,
          }));
        });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-primary">
          <BookOpen /> Qarz (Debt) Management
        </h1>
        <p className="text-muted-foreground">{qarzId ? "Edit your debt record." : "Record and track your debts according to Shariah principles."}</p>
      </header>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-primary">{qarzId ? "Edit Debt Record" : "Record a New Debt"}</CardTitle>
          <CardDescription>Fill in the details below to {qarzId ? "update this" : "add a new"} debt record.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="debtor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Debtor (Qarz lenay wala)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Ahmed Ali" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="creditor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creditor (Qarz denay wala)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Fatima Zahra" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                 <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
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
                              disabled={(date) => {
                                const startDate = form.getValues("startDate");
                                return startDate ? date < startDate : date < new Date();
                              }}
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
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button>Done</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>


                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Button variant="outline" disabled>
                      <FileSignature className="mr-2 h-4 w-4" />
                      Blockchain Verification (Future Release)
                  </Button>
                  <Button type="submit">
                    {qarzId ? <><Save className="mr-2 h-4 w-4" /> Save Changes</> : <><PlusCircle className="mr-2 h-4 w-4" /> Add Debt Record</>}
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

    