
"use client";

import {
  FileText,
  BookOpen,
  HeartHandshake,
  Edit,
  Trash2,
  CheckCircle,
  Eye
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { collection, orderBy, query, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Separator } from "@/components/ui/separator";


type Wasiyat = { id: string; will: string; type: string; createdAt: any };
type Qarz = { id: string; debtor: string; creditor: string; amount: number; startDate: string; dueDate: string; status: 'Pending' | 'Paid'; witnesses: any[] };
type Amanat = { id: string; item: string; description: string; entrustee: string; returnDate: string; status: 'Entrusted' | 'Returned'; witnesses: any[] };

type SelectedRecord = (Qarz & { type: 'qarz' }) | (Amanat & { type: 'amanat' }) | null;


export default function DashboardPage() {
    const { user } = useUser();
    const userName = user?.displayName || "User";
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [itemToDelete, setItemToDelete] = useState<{ id: string; path: string } | null>(null);
    const [recordToUpdate, setRecordToUpdate] = useState<{ path: string; newStatus: string } | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<SelectedRecord>(null);


    const wasiyatQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, `users/${user.uid}/wasiyats`), orderBy("createdAt", "desc"));
    }, [firestore, user?.uid]);
    const { data: wasiyat, loading: wasiyatLoading } = useCollection<Wasiyat>(wasiyatQuery);
    
    const qarzQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, `users/${user.uid}/qarzs`));
    }, [firestore, user?.uid]);
    const { data: qarz, loading: qarzLoading } = useCollection<Qarz>(qarzQuery);

    const amanatQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, `users/${user.uid}/amanats`));
    }, [firestore, user?.uid]);
    const { data: amanat, loading: amanatLoading } = useCollection<Amanat>(amanatQuery);

    const sortedQarz = useMemo(() => {
      if (!qarz) return [];
      return [...qarz].sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return 0;
      });
    }, [qarz]);

    const sortedAmanat = useMemo(() => {
        if (!amanat) return [];
        return [...amanat].sort((a, b) => {
            if (a.status === 'Entrusted' && b.status !== 'Entrusted') return -1;
            if (a.status !== 'Entrusted' && b.status === 'Entrusted') return 1;
            return 0;
        });
    }, [amanat]);


    const loading = wasiyatLoading || qarzLoading || amanatLoading;

    const handleStatusUpdate = async () => {
        if (!recordToUpdate || !firestore) return;
        const { path, newStatus } = recordToUpdate;
        const docRef = doc(firestore, path);
        const updateData = { status: newStatus };
        
        updateDoc(docRef, updateData)
        .then(() => {
            toast({
                title: "Status Updated",
                description: `Record marked as ${newStatus} ✅`,
            });
             if (selectedRecord && selectedRecord.id === docRef.id) {
                setSelectedRecord(prev => prev ? { ...prev, status: newStatus as any } : null);
            }
        })
        .catch(error => {
             errorEmitter.emit("permission-error", new FirestorePermissionError({
                path: docRef.path,
                operation: "update",
                requestResourceData: updateData,
            }));
        })
        .finally(() => {
            setRecordToUpdate(null);
        });
    };

    const handleDelete = async () => {
        if (!itemToDelete || !firestore) return;
        const { path } = itemToDelete;
        const docRef = doc(firestore, path);
        
        deleteDoc(docRef)
        .then(() => {
            toast({
                title: "Record Deleted",
                description: "The record has been successfully deleted.",
            });
             if (selectedRecord && selectedRecord.id === docRef.id) {
                setSelectedRecord(null);
            }
        })
        .catch(error => {
            errorEmitter.emit("permission-error", new FirestorePermissionError({
                path: docRef.path,
                operation: "delete",
            }));
        })
        .finally(() => {
            setItemToDelete(null);
        });
    };
    
    const renderRecordDetails = () => {
        if (!selectedRecord) return null;
        
        const isQarz = selectedRecord.type === 'qarz';
        const isPending = isQarz ? selectedRecord.status === 'Pending' : selectedRecord.status === 'Entrusted';
        const newStatus = isQarz ? 'Paid' : 'Returned';
        const statusText = isQarz ? (isPending ? "Pending Payment" : "Paid in Full") : selectedRecord.status;


        return (
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-primary">{isQarz ? 'Qarz (Debt) Details' : 'Amanat (Trust) Details'}</DialogTitle>
                    <DialogDescription>
                        Full details for the selected record.
                    </DialogDescription>
                </DialogHeader>
                <Separator />
                <div className="grid gap-2 text-sm">
                    {isQarz ? (
                        <>
                        <div className="grid grid-cols-2"><strong>Debtor:</strong> <span>{selectedRecord.debtor}</span></div>
                        <div className="grid grid-cols-2"><strong>Creditor:</strong> <span>{selectedRecord.creditor}</span></div>
                        <div className="grid grid-cols-2"><strong>Amount:</strong> <span>{selectedRecord.amount}</span></div>
                        <div className="grid grid-cols-2"><strong>Start Date:</strong> <span>{selectedRecord.startDate}</span></div>
                        <div className="grid grid-cols-2"><strong>Due Date:</strong> <span>{selectedRecord.dueDate}</span></div>
                        </>
                    ) : (
                         <>
                        <div className="grid grid-cols-2"><strong>Item:</strong> <span>{selectedRecord.item}</span></div>
                        <div className="grid grid-cols-2"><strong>Description:</strong> <span>{selectedRecord.description}</span></div>
                        <div className="grid grid-cols-2"><strong>Entrustee:</strong> <span>{selectedRecord.entrustee}</span></div>
                        <div className="grid grid-cols-2"><strong>Return Date:</strong> <span>{selectedRecord.returnDate}</span></div>
                        </>
                    )}
                     <div className="grid grid-cols-2"><strong>Status:</strong> <Badge className={cn(isPending ? 'bg-orange-500 text-primary-foreground' : 'bg-primary text-primary-foreground', 'w-fit')}>{statusText}</Badge></div>
                      {selectedRecord.witnesses && selectedRecord.witnesses.length > 0 && (
                        <div>
                            <strong>Witnesses:</strong>
                            <ul className="list-disc pl-5">
                                {selectedRecord.witnesses.map(w => <li key={w.id}>{w.name}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
                <Separator />
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {isPending ? (
                        <>
                        <AlertDialog>
                             <AlertDialogTrigger asChild>
                                <Button onClick={() => setRecordToUpdate({ path: `users/${user?.uid}/${selectedRecord.type}s/${selectedRecord.id}`, newStatus: newStatus })}>
                                    <CheckCircle className="mr-2 h-4 w-4" />Mark as {newStatus}
                                </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Do you really want to mark this record as {newStatus}? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleStatusUpdate}>Confirm</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="outline" onClick={() => router.push(`/dashboard/${selectedRecord.type}?id=${selectedRecord.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />Edit
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" onClick={() => setItemToDelete({ id: selectedRecord.id, path: `users/${user?.uid}/${selectedRecord.type}s/${selectedRecord.id}` })}>
                                    <Trash2 className="mr-2 h-4 w-4" />Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete this record.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        </>
                    ) : (
                        <Button disabled><CheckCircle className="mr-2 h-4 w-4" />{selectedRecord.status}</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        )
    }

  return (
    <>
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
        <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedRecord(null)}>
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
                                <li key={item.id} className="p-3 border rounded-lg flex justify-between items-center">
                                    <div>
                                        <p>Will created via {item.type} mode</p>
                                        <p className="text-muted-foreground text-xs">{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : ''}</p>
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/wasiyat?id=${item.id}`)}><Edit className="mr-2 h-4 w-4" />Edit</Button>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="destructive" onClick={() => setItemToDelete({ id: item.id, path: `users/${user?.uid}/wasiyats/${item.id}` })}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete this record.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
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
                     ) : sortedQarz && sortedQarz.length > 0 ? (
                         <ul className="space-y-2 pt-4">
                            {sortedQarz.map((item) => (
                                <li key={item.id} className="p-3 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex flex-col">
                                        <span>Debt of {item.amount} from {item.debtor} to {item.creditor}</span>
                                        <span className="text-muted-foreground text-xs">Due: {item.dueDate}</span>
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2 items-center w-full sm:w-auto">
                                        <Badge className={cn(item.status === 'Pending' ? 'bg-orange-500 text-primary-foreground' : 'bg-primary text-primary-foreground')}>{item.status === 'Pending' ? 'Pending Payment' : 'Paid in Full'}</Badge>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline" onClick={() => setSelectedRecord({...item, type: 'qarz' })}>
                                                <Eye className="mr-2 h-4 w-4" />Details
                                            </Button>
                                        </DialogTrigger>
                                    </div>
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
                     ) : sortedAmanat && sortedAmanat.length > 0 ? (
                        <ul className="space-y-2 pt-4">
                            {sortedAmanat.map((item) => (
                               <li key={item.id} className="p-3 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex flex-col">
                                        <span>{item.item} entrusted to {item.entrustee}</span>
                                        <span className="text-muted-foreground text-xs">Return: {item.returnDate}</span>
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2 items-center w-full sm:w-auto">
                                        <Badge className={cn(item.status === 'Entrusted' ? 'bg-orange-500 text-primary-foreground' : 'bg-primary text-primary-foreground')}>{item.status}</Badge>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline" onClick={() => setSelectedRecord({...item, type: 'amanat' })}>
                                                <Eye className="mr-2 h-4 w-4" />Details
                                            </Button>
                                        </DialogTrigger>
                                    </div>
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
        {renderRecordDetails()}
        </Dialog>
      </section>
    </div>
    <AlertDialog open={!!recordToUpdate}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
          <AlertDialogDescription>
            Do you really want to mark this record as {recordToUpdate?.newStatus}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setRecordToUpdate(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleStatusUpdate}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
