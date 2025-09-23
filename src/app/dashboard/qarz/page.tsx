
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BookOpen, CalendarIcon, PlusCircle, FileSignature, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { app } from "@/lib/firebase";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const witnessSchema = z.object({
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
  addWitnesses: z.boolean().default(false),
  witnesses: z.array(witnessSchema).max(3, "You can add a maximum of 3 witnesses."),
});

export default function QarzPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof qarzSchema>>({
    resolver: zodResolver(qarzSchema),
    defaultValues: {
      debtor: "",
      creditor: "",
      amount: 0,
      addWitnesses: false,
      witnesses: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "witnesses",
  });

  const watchAddWitnesses = form.watch("addWitnesses");

  async function onSubmit(data: z.infer<typeof qarzSchema>) {
    try {
      const db = getFirestore(app);
      const auth = getAuth(app);
      const user = auth.currentUser;

      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to record a Qarz.",
          variant: "destructive",
        });
        return;
      }
      
      const qarzData: any = {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
        startDate: format(data.startDate, "PPP"),
        dueDate: format(data.dueDate, "PPP"),
      };

      if (!data.addWitnesses) {
        delete qarzData.witnesses;
      }


      await addDoc(collection(db, "qarz"), qarzData);
      toast({
        title: "Qarz Recorded",
        description: "The debt has been successfully recorded.",
      });
      form.reset();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        title: "Error",
        description: "Failed to record Qarz. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-primary">
          <BookOpen /> Qarz (Debt) Management
        </h1>
        <p className="text-muted-foreground">Record and track your debts according to Shariah principles.</p>
      </header>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-primary">Record a New Debt</CardTitle>
          <CardDescription>Fill in the details below to add a new debt record.</CardDescription>
        </CardHeader>
        <CardContent>
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

               <FormField
                control={form.control}
                name="addWitnesses"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Do you want to add witnesses?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {watchAddWitnesses && (
                <Card className="p-4 border-2">
                  <CardHeader className="p-2">
                    <CardTitle className="text-lg text-primary">Witness Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg relative">
                        <h4 className="font-semibold mb-2">Witness {index + 1}</h4>
                        <Separator className="mb-4" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`witnesses.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name (Mandatory)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Bilal Ahmed" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`witnesses.${index}.cnic`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CNIC (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 42201-1234567-1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`witnesses.${index}.email`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., witness@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => remove(index)}>
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    ))}
                     <FormMessage>{form.formState.errors.witnesses?.root?.message}</FormMessage>

                    {fields.length < 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ name: "", cnic: "", email: "" })}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Witness
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}


              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Button variant="outline" disabled>
                    <FileSignature className="mr-2 h-4 w-4" />
                    Blockchain Verification (Future Release)
                </Button>
                <Button type="submit">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Debt Record
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

