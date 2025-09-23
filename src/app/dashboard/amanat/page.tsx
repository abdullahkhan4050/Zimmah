"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HeartHandshake, CalendarIcon, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { getFirestore, collection, addDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { app } from "@/lib/firebase";

const amanatSchema = z.object({
  item: z.string().min(2, "Item name is required."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(200),
  entrustee: z.string().min(2, "Entrustee name is required."),
  returnDate: z.date({ required_error: "Expected return date is required." }),
});

export default function AmanatPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof amanatSchema>>({
    resolver: zodResolver(amanatSchema),
    defaultValues: {
      item: "",
      description: "",
      entrustee: "",
    }
  });

  async function onSubmit(data: z.infer<typeof amanatSchema>) {
    try {
      const db = getFirestore(app);
      await addDoc(collection(db, "amanat"), {
        ...data,
        returnDate: format(data.returnDate, "PPP"),
      });
      toast({
        title: "Amanat Recorded",
        description: "The entrusted item has been successfully recorded in the database.",
      });
      form.reset();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        title: "Error",
        description: "Failed to record Amanat. Please try again.",
        variant: "destructive",
      });
    }
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
                         <Textarea placeholder="e.g., Macbook Pro 16-inch, M1 Pro, Silver. Kept for safekeeping." {...field} />
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
