
"use client";

import {
  FileText,
  BookOpen,
  HeartHandshake,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useEffect, useState, useMemo } from "react";
import { collection, orderBy, query } from "firebase/firestore";
import { useCollection, useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";


type Wasiyat = { id: string; will: string; type: string; createdAt: any };
type Qarz = { id: string; debtor: string; creditor: string; amount: number; dueDate: string };
type Amanat = { id: string; item: string; entrustee: string; returnDate: string };


export default function DashboardPage() {
    const userName = "User";
    const firestore = useFirestore();

    const wasiyatQuery = useMemo(() => firestore ? query(collection(firestore, "wasiyat"), orderBy("createdAt", "desc")) : null, [firestore]);
    const { data: wasiyat, loading: wasiyatLoading } = useCollection<Wasiyat>(wasiyatQuery);
    
    const qarzQuery = useMemo(() => firestore ? query(collection(firestore, "qarz"), orderBy("createdAt", "desc")) : null, [firestore]);
    const { data: qarz, loading: qarzLoading } = useCollection<Qarz>(qarzQuery);

    const amanatQuery = useMemo(() => firestore ? collection(firestore, "amanat") : null, [firestore]);
    const { data: amanat, loading: amanatLoading } = useCollection<Amanat>(amanatQuery);

    const loading = wasiyatLoading || qarzLoading || amanatLoading;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight text-primary">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome back, {userName}!</p>
      </header>
      
      <section className="grid gap-6">
        <Card className="border-2 flex flex-col">
             <CardHeader>
                <CardTitle className="text-primary">Quick Actions</CardTitle>
                <CardDescription>Start a new record.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-3 content-start gap-4">
                 <Link href="/dashboard/wasiyat">
                    <Button variant="outline" className="w-full justify-start gap-4 py-6">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span>Create/Edit Will (Wasiyat)</span>
                    </Button>
                </Link>
                <Link href="/dashboard/qarz">
                    <Button variant="outline" className="w-full justify-start gap-4 py-6">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <span>Add New Debt (Qarz)</span>
                    </Button>
                </Link>
                 <Link href="/dashboard/amanat">
                    <Button variant="outline" className="w-full justify-start gap-4 py-6">
                        <HeartHandshake className="h-5 w-5 text-muted-foreground" />
                        <span>Add New Trust (Amanat)</span>
                    </Button>
                </Link>
            </CardContent>
        </Card>
        <Card className="border-2 flex flex-col">
            <CardHeader>
                <CardTitle className="text-primary">Your Digital Vault</CardTitle>
                <CardDescription>An overview of your recorded assets and liabilities.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col min-h-[300px]">
                <Tabs defaultValue="wasiyat" className="w-full flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="wasiyat">Wasiyat (Wills)</TabsTrigger>
                    <TabsTrigger value="qarz">Qarz (Debts)</TabsTrigger>
                    <TabsTrigger value="amanat">Amanat (Trusts)</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="wasiyat" className="flex-1">
                    {loading ? (
                        <div className="space-y-2 pt-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : wasiyat && wasiyat.length > 0 ? (
                        <ul className="space-y-2 pt-4">
                            {wasiyat.map((item) => (
                                <li key={item.id}>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                <span>Will created via {item.type} mode</span>
                                                <span className="text-muted-foreground text-xs">{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Will Details</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This is the content of your saved will.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                                <div className="font-body whitespace-pre-wrap p-4 bg-muted/50 rounded-md border text-sm max-h-[50vh] overflow-y-auto">
                                                    {item.will}
                                                </div>
                                            <AlertDialogFooter>
                                                <AlertDialogAction>Close</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-center p-4 mt-4">
                            <p className="text-muted-foreground">There is no will generated.</p>
                        </div>
                    )}
                  </TabsContent>

                  <TabsContent value="qarz" className="flex-1">
                     {loading ? (
                         <div className="space-y-2 pt-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                     ) : qarz && qarz.length > 0 ? (
                         <ul className="space-y-2 pt-4">
                            {qarz.map((item) => (
                                <li key={item.id}>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                <span>Debt of {item.amount} from {item.debtor} to {item.creditor}</span>
                                                 <span className="text-muted-foreground text-xs">Due: {item.dueDate}</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Qarz Details</AlertDialogTitle>
                                            </AlertDialogHeader>
                                            <div className="text-sm">
                                                <p><strong>Amount:</strong> {item.amount}</p>
                                                <p><strong>Debtor:</strong> {item.debtor}</p>
                                                <p><strong>Creditor:</strong> {item.creditor}</p>
                                                <p><strong>Due Date:</strong> {item.dueDate}</p>
                                            </div>
                                            <AlertDialogFooter>
                                                <AlertDialogAction>Close</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </li>
                            ))}
                        </ul>
                     ) : (
                        <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-center p-4 mt-4">
                            <p className="text-muted-foreground">No Qarz records found.</p>
                        </div>
                     )}
                  </TabsContent>

                  <TabsContent value="amanat" className="flex-1">
                     {loading ? (
                         <div className="space-y-2 pt-4">
                            <Skeleton className="h-12 w-full" />
                        </div>
                     ) : amanat && amanat.length > 0 ? (
                        <ul className="space-y-2 pt-4">
                            {amanat.map((item) => (
                               <li key={item.id}>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                <span>{item.item} entrusted to {item.entrustee}</span>
                                                <span className="text-muted-foreground text-xs">Return: {item.returnDate}</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Amanat Details</AlertDialogTitle>
                                            </AlertDialogHeader>
                                             <div className="text-sm">
                                                <p><strong>Item:</strong> {item.item}</p>
                                                <p><strong>Entrustee:</strong> {item.entrustee}</p>
                                                <p><strong>Return Date:</strong> {item.returnDate}</p>
                                            </div>
                                            <AlertDialogFooter>
                                                <AlertDialogAction>Close</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </li>
                            ))}
                        </ul>
                     ) : (
                         <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-center p-4 mt-4">
                            <p className="text-muted-foreground">No Amanat records found.</p>
                        </div>
                     )}
                  </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
      </section>
    </div>
  );
}

    
