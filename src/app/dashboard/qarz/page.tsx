
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BookOpen, CalendarIcon, PlusCircle, FileSignature } from "lucide-react";
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

const qarzSchema = z.object({
  debtor: z.string().min(2, "Debtor name is required."),
  creditor: z.string().min(2, "Creditor name is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  dueDate: z.date({ required_error: "Due date is required." }),
  witnesses: z.string().optional(),
});

export default function QarzPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof qarzSchema>>({
    resolver: zodResolver(qarzSchema),
    defaultValues: {
      debtor: "",
      creditor: "",
      amount: 0,
      witnesses: "",
    }
  });

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

      await addDoc(collection(db, "qarz"), {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
        dueDate: format(data.dueDate, "PPP"),
      });
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
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
          <BookOpen /> Qarz (Debt) Management
        </h1>
        <p className="text-muted-foreground">Record and track your debts according to Shariah principles.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Record a New Debt</CardTitle>
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
                        <Input placeholder="e.g., John Doe" {...field} />
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
                        <Input placeholder="e.g., Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                name="witnesses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Witnesses (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Ali Khan, Fatima Ahmed" {...field} />
                    </FormControl>
                     <p className="text-sm text-muted-foreground">
                        Add witnesses by their registered emails, separated by commas.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Button variant="outline" disabled>
                    <FileSignature className="mr-2 h-4 w-4" />
                    Blockchain Verification (Coming Soon)
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
