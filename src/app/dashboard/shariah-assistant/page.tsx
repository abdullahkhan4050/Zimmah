
"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, Lightbulb, Sparkles, Gavel, GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getComplianceTipsAction } from "@/app/actions";
import { type ShariahComplianceOutput } from "@/ai/flows/shariah-compliance-assistant";
import { Badge } from "@/components/ui/badge";

const complianceSchema = z.object({
  financialPractice: z.string().min(10, "Please describe the financial practice (at least 10 characters)."),
});

type AssistanceMode = "ai" | "lawyer" | "scholar" | null;

export default function ShariahAssistantPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [complianceResult, setComplianceResult] = useState<ShariahComplianceOutput | null>(null);
  const [assistanceMode, setAssistanceMode] = useState<AssistanceMode>(null);

  const form = useForm<z.infer<typeof complianceSchema>>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
        financialPractice: ""
    }
  });

  function onSubmit(data: z.infer<typeof complianceSchema>) {
    startTransition(async () => {
        setComplianceResult(null);
        const result = await getComplianceTipsAction(data);
        if(result.success && result.data) {
            setComplianceResult(result.data);
            toast({
                title: "Compliance Check Complete",
                description: "The AI has provided feedback on your query.",
            });
        } else {
             toast({
                title: "Error",
                description: result.error,
                variant: "destructive"
            });
        }
    });
  }
  
  const renderContent = () => {
    switch (assistanceMode) {
      case 'ai':
        return (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Evaluate a Financial Practice</CardTitle>
                <CardDescription>Describe a financial scenario or practice below, and our AI assistant will provide guidance.</CardDescription>
                 <Button variant="link" className="p-0 h-auto justify-start" onClick={() => setAssistanceMode(null)}>&larr; Back to options</Button>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="financialPractice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Financial Practice / Scenario</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., 'Is taking out a student loan with 2% interest permissible?' or 'I want to invest in a tech company stock, how can I ensure it's halal?'"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
                      {isPending ? "Analyzing..." : "Get Compliance Tips"}
                      <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {isPending && <div className="text-center p-8 text-muted-foreground">Analyzing your query...</div>}

            {complianceResult && (
              <Card className="mt-6 animate-in fade-in-50">
                  <CardHeader>
                      <CardTitle className="text-primary">AI Compliance Analysis</CardTitle>
                       <div className="flex items-center gap-2 pt-2">
                          <span className="font-semibold">Compliance Status:</span>
                          <Badge variant={complianceResult.isCompliant ? "default" : "destructive"} className={complianceResult.isCompliant ? 'bg-primary' : ''}>
                              {complianceResult.isCompliant ? "Likely Compliant" : "Likely Not Compliant"}
                          </Badge>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Lightbulb className="text-primary"/> Tips & Reminders</h3>
                          <p className="text-muted-foreground whitespace-pre-wrap">{complianceResult.complianceTips}</p>
                      </div>
                      {complianceResult.reasoning && (
                          <div>
                              <h3 className="font-semibold text-lg mb-2">Reasoning</h3>
                              <p className="text-muted-foreground whitespace-pre-wrap">{complianceResult.reasoning}</p>
                          </div>
                      )}
                  </CardContent>
              </Card>
            )}
          </>
        );
      case 'lawyer':
      case 'scholar':
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Coming Soon</CardTitle>
                    <CardDescription>
                        This feature is currently under development. Soon you'll be able to connect directly with a {assistanceMode}.
                    </CardDescription>
                    <Button variant="link" className="p-0 h-auto justify-start" onClick={() => setAssistanceMode(null)}>&larr; Back to options</Button>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-8 text-muted-foreground">
                        <p>Thank you for your interest!</p>
                    </div>
                </CardContent>
            </Card>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Choose Your Assistance Type</CardTitle>
              <CardDescription>Select how you would like to get Shariah compliance assistance.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" size="lg" className="h-32 flex-col items-start p-4 gap-2" onClick={() => setAssistanceMode('ai')}>
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary"/>
                  <span className="font-semibold text-base">AI Assistant</span>
                </div>
                <p className="font-normal text-sm text-muted-foreground text-left">Get immediate AI-powered analysis.</p>
              </Button>
              <Button variant="outline" size="lg" className="h-32 flex-col items-start p-4 gap-2" onClick={() => setAssistanceMode('lawyer')}>
                <div className="flex items-center gap-2">
                  <Gavel className="text-primary"/>
                  <span className="font-semibold text-base">Lawyer</span>
                </div>
                <p className="font-normal text-sm text-muted-foreground text-left">Connect with a legal professional.</p>
              </Button>
               <Button variant="outline" size="lg" className="h-32 flex-col items-start p-4 gap-2" onClick={() => setAssistanceMode('scholar')}>
                <div className="flex items-center gap-2">
                  <GraduationCap className="text-primary"/>
                  <span className="font-semibold text-base">Scholar</span>
                </div>
                <p className="font-normal text-sm text-muted-foreground text-left">Seek guidance from a Shariah scholar.</p>
              </Button>
            </CardContent>
          </Card>
        );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-primary">
          <ShieldCheck /> Shariah Compliance Assistant
        </h1>
        <p className="text-muted-foreground">Get AI-powered tips and reminders to ensure your financial practices are compliant.</p>
      </header>
      
      {renderContent()}

    </div>
  );
}
