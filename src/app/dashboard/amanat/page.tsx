
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HeartHandshake, CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const witnessSchema = z.object({
  name: z.string().min(2, "Witness name is required."),
  cnic: z.string().optional(),
  email: z.string().email("Invalid email.").optional().or(z.literal("")),
}).refine(data => !!data.cnic || !!data.email, {
  message: "Either CNIC or Email must be filled.",
  path: ["cnic"],
});

const amanatSchema = z.object({
  item: z.string().min(2, "Item name is required."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(200),
  entrustee: z.string().min(2, "Entrustee name is required."),
  returnDate: z.date({ required_error: "Expected return date is required." }),
  addWitnesses: z.boolean().default(false),
  witnesses: z.array(witnessSchema).max(3, "You can add a maximum of 3 witnesses."),
});

export default function AmanatPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof amanatSchema>>({
    resolver: zodResolver(amanatSchema),
    defaultValues: {
      item: "",
      description: "",
      entrustee: "",
      addWitnesses: false,
      witnesses: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "witnesses",
  });

  const watchAddWitnesses = form.watch("addWitnesses");

  async function onSubmit(data: z.infer<typeof amanatSchema>) {
    if (!firestore || !user) {
        toast({
            title: "Error",
            description: "You must be logged in to record an Amanat.",
            variant: "destructive",
        });
        return;
    }

    const amanatData: any = {
      ...data,
      userId: user.uid,
      createdAt: serverTimestamp(),
      returnDate: format(data.returnDate, "PPP"),
    };

    if (!data.addWitnesses) {
      delete amanatData.witnesses;
    }
    
    const collectionRef = collection(firestore, "amanat");
    
    addDoc(collectionRef, amanatData)
    .then(() => {
        toast({
            title: "Amanat Recorded",
            description: "The entrusted item has been successfully recorded in the database.",
        });
        form.reset();
    })
    .catch(async (error) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
            path: collectionRef.path,
            operation: "create",
            requestResourceData: amanatData,
        }));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-primary">
          <HeartHandshake /> Amanat (Entrusted Items) Management
        </h1>
        <p className="text-muted-foreground">Keep track of items you have entrusted to others.</p>
      </header>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-primary">Record a New Entrusted Item</CardTitle>
          <CardDescription>Fill in the details below to add a new Amanat record.</CardDescription>
        </CardHeader>
        <CardContent>
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
                                disabled={(date) => date < new Date()}
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
                                <FormLabel>CNIC</FormLabel>
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
                                <FormLabel>Email</FormLabel>
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


              <div className="flex justify-end">
                <Button type="submit">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Amanat Record
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
