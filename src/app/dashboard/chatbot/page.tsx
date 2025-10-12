
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { chatAction } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";


const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});

type Message = {
  role: 'user' | 'bot';
  text: string;
}

const initialBotMessage: Message = {
    role: 'bot',
    text: "Hello! I'm the Zimmah AI assistant. How can I help you today with Wasiyat (Wills), Qarz (Debts), or Amanat (Trusts)?"
};


export default function ChatbotPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<Message[]>([initialBotMessage]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  const form = useForm<z.infer<typeof chatSchema>>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
        message: ""
    }
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  function onSubmit(data: z.infer<typeof chatSchema>) {
    const userMessage: Message = { role: 'user', text: data.message };
    setMessages(prev => [...prev, userMessage]);
    form.reset();

    startTransition(async () => {
        const result = await chatAction({ message: data.message });
        if(result.success && result.data) {
            const botMessage: Message = { role: 'bot', text: result.data.response };
            setMessages(prev => [...prev, botMessage]);
        } else {
             toast({
                title: "Error",
                description: result.error,
                variant: "destructive"
            });
             setMessages(prev => prev.slice(0, -1)); // Remove user message on error
        }
    });
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-primary">
          <Bot /> AI Chatbot
        </h1>
        <p className="text-muted-foreground">Your friendly Shariah-compliant assistant.</p>
      </header>
      
      <Card className="flex-1 flex flex-col border-2">
          <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                 <div className="space-y-6">
                  {messages.map((msg, index) => (
                    <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      {msg.role === 'bot' && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback><Bot /></AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn("max-w-md p-3 rounded-lg", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      {msg.role === 'user' && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isPending && (
                     <div className="flex items-start gap-3 justify-start">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback><Bot /></AvatarFallback>
                        </Avatar>
                        <div className="max-w-md p-3 rounded-lg bg-muted">
                           <Sparkles className="inline-block animate-pulse" />
                        </div>
                     </div>
                  )}
                 </div>
              </ScrollArea>
               <div className="p-4 border-t">
                 <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Type your message..."
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="icon" disabled={isPending}>
                      <Send />
                      <span className="sr-only">Send</span>
                    </Button>
                  </form>
                </Form>
               </div>
          </CardContent>
      </Card>
    </div>
  );
}
