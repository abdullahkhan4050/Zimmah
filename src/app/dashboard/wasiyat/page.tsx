
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { FileText, Lightbulb, UserCheck, Share2, Printer, Sparkles, AlertTriangle, Edit, Save, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { useSearchParams } from 'next/navigation';
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateWillAction } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const wasiyatSchema = z.object({
  prompt: z.string().min(50, "Please provide a detailed description of your wishes (at least 50 characters)."),
});

const manualWasiyatSchema = z.object({
    manualWill: z.string().min(1, "Will content cannot be empty."),
});

const newWitnessSchema = z.object({
  name: z.string().min(2, "Witness name is required."),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, "Invalid CNIC format (e.g., 12345-1234567-1)"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email.").optional().or(z.literal("")),
});

type Witness = { id: string; name: string; cnic: string };
type WasiyatDoc = { id: string; will: string; type: string; createdAt: any; };
type WriteMode = 'ai' | 'manual' | null;

export default function WasiyatPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [willDraft, setWillDraft] = useState<string | null>(null);
  const [writeMode, setWriteMode] = useState<WriteMode>(null);
  const [manualWill, setManualWill] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedWill, setEditedWill] = useState("");
  const [selectedWitnesses, setSelectedWitnesses] = useState<Witness[]>([]);
  const firestore = useFirestore();
  const { user } = useUser();
  const draftContainerRef = useRef<HTMLDivElement>(null);
  const [existingWill, setExistingWill] = useState<WasiyatDoc | null>(null);
  const searchParams = useSearchParams();
  const wasiyatId = searchParams.get('id');
  const [isLoading, setIsLoading] = useState(false);

  const wasiyatQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || wasiyatId) return null; // Don't run this if we are editing a specific will by ID
    return query(collection(firestore, `users/${user.uid}/wasiyats`), orderBy("createdAt", "desc"));
  }, [firestore, user?.uid, wasiyatId]);

  const { data: wasiyatDocs, loading: wasiyatLoading } = useCollection<WasiyatDoc>(wasiyatQuery, {
      onSuccess: (data) => {
          if(data && data.length > 0 && !wasiyatId) {
              setExistingWill(data[0]);
          } else if (!wasiyatId) {
              setExistingWill(null);
              setWillDraft(null);
          }
      },
  });

  useEffect(() => {
    if (wasiyatId && firestore && user) {
        setIsLoading(true);
        const docRef = doc(firestore, `users/${user.uid}/wasiyats`, wasiyatId);
        getDoc(docRef).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data() as Omit<WasiyatDoc, 'id'>;
                const willData = { id: docSnap.id, ...data };
                setExistingWill(willData);
                setWillDraft(willData.will);
                setEditedWill(willData.will);
                setIsEditing(true); // Go directly into edit mode
                setWriteMode(willData.type as WriteMode);
            } else {
                toast({ title: "Error", description: "Will record not found.", variant: "destructive" });
            }
        }).finally(() => setIsLoading(false));
    } else {
        setIsLoading(wasiyatLoading);
    }
  }, [wasiyatId, firestore, user, toast, wasiyatLoading]);

  const witnessesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, `users/${user.uid}/witnesses`));
  }, [firestore, user?.uid]);

  const { data: witnesses, loading: witnessesLoading, error: witnessesError } = useCollection<Witness>(witnessesQuery);

  const aiForm = useForm<z.infer<typeof wasiyatSchema>>({
    resolver: zodResolver(wasiyatSchema),
    defaultValues: {
        prompt: ""
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const scrollToDraft = () => {
    draftContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  async function onAiSubmit(data: z.infer<typeof wasiyatSchema>) {
    startTransition(async () => {
        const result = await generateWillAction(data);
        if(result.success && result.data) {
            setWillDraft(result.data.willDraft);
            setEditedWill(result.data.willDraft);
            setIsEditing(false); // Start in view mode, not edit mode
            toast({
                title: "Will Draft Generated",
                description: "Review your draft below. You can edit it before saving.",
            });
            scrollToDraft();
        } else {
             toast({
                title: "Error",
                description: result.error,
                variant: "destructive"
            });
        }
    });
  }

  async function handleSaveWill(content: string, type: 'ai' | 'manual') {
    if (!content || !firestore || !user) {
      toast({
        title: "Error",
        description: !user ? "You must be logged in to save." : "Will content cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const wasiyatData = {
      will: content,
      type: type,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    
    const collectionPath = `users/${user.uid}/wasiyats`;
    const collectionRef = collection(firestore, collectionPath);

    addDoc(collectionRef, wasiyatData)
      .then((docRef) => {
          toast({
            title: "Will Saved",
            description: `Your ${type}-created will has been saved to your vault.`,
          });
          setExistingWill({ id: docRef.id, ...wasiyatData });
          setWillDraft(content);
          setEditedWill(content);
          setIsEditing(false);
      })
      .catch((error) => {
          errorEmitter.emit("permission-error", new FirestorePermissionError({
            path: collectionRef.path,
            operation: "create",
            requestResourceData: wasiyatData,
          }));
      });
  }

   const handleEditSave = async () => {
    if (!editedWill || !existingWill || !firestore || !user) return;
    
    const docRef = doc(firestore, `users/${user.uid}/wasiyats`, existingWill.id);
    
    const updatedData = { will: editedWill };

    updateDoc(docRef, updatedData)
    .then(() => {
        setWillDraft(editedWill);
        setExistingWill(prev => prev ? { ...prev, will: editedWill } : null);
        setIsEditing(false);
        toast({
            title: "Changes Saved",
            description: "Your edits to the will have been saved.",
        });
    })
    .catch((error) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
            path: docRef.path,
            operation: "update",
            requestResourceData: updatedData,
        }));
    });
  };

  const handleRecreate = async () => {
    if (!existingWill || !firestore || !user) return;
    const docRef = doc(firestore, `users/${user.uid}/wasiyats`, existingWill.id);
    
    deleteDoc(docRef).then(() => {
        setExistingWill(null);
        setWillDraft(null);
        setWriteMode(null);
        setIsEditing(false);
        aiForm.reset();
        setManualWill("");
        toast({
            title: "Previous Will Deleted",
            description: "You can now create a new will.",
        });
    }).catch(error => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
            path: docRef.path,
            operation: "delete",
        }));
    });
  }

  const handleWitnessSelect = (witness: Witness) => {
    setSelectedWitnesses(prev => 
      prev.some(w => w.id === witness.id)
        ? prev.filter(w => w.id !== witness.id)
        : [...prev, witness]
    );
  };
  
  const handleAssignWitnesses = () => {
    if (selectedWitnesses.length === 0) {
      toast({
        title: "No Witnesses Selected",
        description: "Please select at least one witness.",
        variant: "destructive"
      });
      return;
    }

    const witnessSection = `\n\n**7. Witnesses**\n\nThis Wasiyat is made and signed in the presence of the following witnesses, who affirm that the Testator executed this document willingly and in full awareness.\n\n${selectedWitnesses
      .map((w, i) => 
        `Witness ${i + 1}:\nName: ${w.name}\nCNIC: ${w.cnic}\nSignature: ___________________________`
      )
      .join("\n\n")}`;
    
    const baseWill = isEditing ? editedWill : willDraft || "";
    // A simple way to replace or append the witness section
    const willWithoutWitnesses = baseWill.split("\n\n**7. Witnesses**")[0];
    const newWillContent = willWithoutWitnesses + witnessSection;

    setEditedWill(newWillContent);
    if (!isEditing && willDraft) {
        setIsEditing(true); // Switch to edit mode after assigning witnesses to a non-saved draft
    }
    
    toast({
      title: "Witnesses Assigned",
      description: "The selected witnesses have been added to your will draft. You can now save the changes."
    });
  };

  const renderContent = () => {
      if(isLoading && !wasiyatDocs) {
          return (
             <div className="lg:col-span-1 flex flex-col gap-6 print:hidden">
                <Card className="border-2"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
            </div>
          )
      }
      
      // This is the main "existing will" view if not in edit mode
      if (existingWill && !isEditing) {
          return (
            <div className="lg:col-span-1 flex flex-col gap-6 print:hidden">
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="text-primary">Your Wasiyat</CardTitle>
                        <CardDescription>You have an existing will. You can edit it or recreate a new one.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4">
                       <Button variant="outline" size="lg" className="h-auto min-h-20 flex-col items-start p-4 gap-1" onClick={() => { setIsEditing(true); setEditedWill(existingWill.will); setWillDraft(existingWill.will); setWriteMode(existingWill.type as WriteMode)}}>
                           <div className="flex items-center gap-2">
                            <Edit className="text-primary"/>
                            <span className="font-semibold text-base">Edit Existing Will</span>
                           </div>
                           <p className="font-normal text-sm text-muted-foreground text-left whitespace-normal">Make changes to your current will.</p>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive" size="lg" className="h-auto min-h-20 flex-col items-start p-4 gap-1">
                                   <div className="flex items-center gap-2">
                                    <Trash2/>
                                    <span className="font-semibold text-base">Recreate Wasiyat</span>
                                   </div>
                                   <p className="font-normal text-sm text-muted-foreground text-left whitespace-normal">This will delete your current will and let you start over.</p>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete your current will. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRecreate}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
          );
      }

      // This is the creation/editing view
      return (
        <div className="lg:col-span-1 flex flex-col gap-6 print:hidden">
            {(!writeMode && !isEditing) && (
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="text-primary">How would you like to create your will?</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4">
                       <Button variant="outline" size="lg" className="h-auto min-h-20 flex-col items-start p-4 gap-1" onClick={() => setWriteMode('ai')}>
                           <div className="flex items-center gap-2">
                            <Sparkles className="text-primary"/>
                            <span className="font-semibold text-base">Write with AI</span>
                           </div>
                           <p className="font-normal text-sm text-muted-foreground text-left whitespace-normal">Let our AI generate a draft for you.</p>
                        </Button>
                        <Button variant="outline" size="lg" className="h-auto min-h-20 flex-col items-start p-4 gap-1" onClick={() => { setWriteMode('manual'); setWillDraft(null); }}>
                           <div className="flex items-center gap-2">
                            <Edit className="text-primary"/>
                            <span className="font-semibold text-base">Write Manually</span>
                           </div>
                           <p className="font-normal text-sm text-muted-foreground text-left whitespace-normal">Draft your will using our text editor.</p>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {(writeMode === 'ai' || (isEditing && writeMode === 'ai')) && !willDraft && (
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Sparkles className="text-primary"/> AI Will Assistant
                        </CardTitle>
                        <Button variant="link" className="p-0 h-auto justify-start" onClick={() => {setWriteMode(null); if(wasiyatId) {router.push('/dashboard/wasiyat')}; setIsEditing(false);}}>&larr; Back</Button>
                    </CardHeader>
                    <CardContent>
                        <Form {...aiForm}>
                            <form onSubmit={aiForm.handleSubmit(onAiSubmit)} className="space-y-6">
                                <FormField
                                    control={aiForm.control}
                                    name="prompt"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Describe Your Wishes</FormLabel>
                                        <FormControl>
                                        <Textarea
                                            placeholder="Describe your beneficiaries, assets, and any specific instructions. For example: 'I want to leave my house at 123 Main St to my son, Ahmed. My savings of $10,000 should be split equally between my two daughters, Fatima and Aisha. I also want to donate 10% of my remaining assets to the local mosque...'"
                                            className="min-h-[200px]"
                                            {...field}
                                        />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending ? "Generating..." : "Generate Will Draft"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}

            {(writeMode === 'manual' || (isEditing && writeMode === 'manual')) && !willDraft && (
                 <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Edit className="text-primary"/> Manual Will Editor
                        </CardTitle>
                         <Button variant="link" className="p-0 h-auto justify-start" onClick={() => {setWriteMode(null); if(wasiyatId) {router.push('/dashboard/wasiyat')}; setIsEditing(false);}}>&larr; Back</Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="Start writing your will here..."
                            className="min-h-[300px] font-body"
                            value={manualWill}
                            onChange={(e) => setManualWill(e.target.value)}
                        />
                         <Button className="w-full" onClick={() => handleSaveWill(manualWill, 'manual')}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Will
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Shariah Guidance</AlertTitle>
                <AlertDescription>
                   A Wasiyat can only be made for up to 1/3 of your total assets after debts and funeral expenses. The remaining 2/3 is distributed according to fixed Islamic inheritance shares (Fara'id).
                </AlertDescription>
            </Alert>
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-6" id="wasiyat-page">
      <header className="print:hidden">
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight flex items-center gap-2 text-primary">
          <FileText /> Wasiyat (Will) Creation
        </h1>
        <p className="text-muted-foreground">Create your Shariah-compliant will with our assistant.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderContent()}

        <div className="lg:col-span-2" ref={draftContainerRef}>
             <Card className="min-h-[600px] flex flex-col border-2 print:border-0 print:shadow-none" id="printable-will">
                <CardHeader className="print:hidden">
                    <CardTitle className="text-primary">Will Draft</CardTitle>
                    <CardDescription>This is your will document. Please review it carefully.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col print:p-0">
                    {isLoading && <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading Will...</p></div>}
                    
                    {!isLoading && isPending && <div className="text-center p-8 m-auto">Generating your will draft... <Sparkles className="inline-block animate-pulse" /></div>}
                    
                    {!isLoading && !willDraft && !isEditing && (
                        <div className="m-auto text-center p-8 text-muted-foreground print:hidden">
                           <p>Choose an option to start creating your will, or edit an existing one.</p>
                        </div>
                    )}

                    {(willDraft || isEditing) && !isLoading && (
                        <div className="space-y-6 flex-1 flex flex-col">
                             <Alert variant="destructive" className="print:hidden">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Disclaimer</AlertTitle>
                                <AlertDescription>
                                This is not a legally binding document. It is a draft generated for review purposes. Consult a qualified Islamic scholar and legal professional before finalizing.
                                </AlertDescription>
                            </Alert>
                             {isEditing ? (
                                <Textarea
                                    className="font-body whitespace-pre-wrap p-6 bg-muted/50 rounded-md border text-sm flex-1 min-h-[400px]"
                                    value={editedWill}
                                    onChange={(e) => setEditedWill(e.target.value)}
                                />
                            ) : (
                                <div className="font-body whitespace-pre-wrap p-6 bg-muted/50 rounded-md border text-sm overflow-x-auto flex-1 print:bg-transparent print:border-none print:p-0">
                                    {willDraft}
                                </div>
                            )}
                            <Separator className="print:hidden" />
                            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-between items-center print:hidden">
                                <div className="flex flex-wrap gap-2">
                                     {isEditing ? (
                                        <>
                                            <Button onClick={handleEditSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                                            <Button variant="outline" onClick={() => { setIsEditing(false); setEditedWill(willDraft || ""); if(wasiyatId){router.push('/dashboard/wasiyat')}; }}>Cancel</Button>
                                        </>
                                    ) : (
                                        <>
                                            {!existingWill && willDraft && writeMode === 'ai' && (
                                                <Button onClick={() => handleSaveWill(willDraft, 'ai')}><Save className="mr-2 h-4 w-4" /> Save AI Draft</Button>
                                            )}
                                        </>
                                    )}
                                     <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline"><UserCheck className="mr-2 h-4 w-4" /> Assign Witnesses</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Assign Witnesses</DialogTitle>
                                                <DialogDescription>
                                                    Select from your list of saved witnesses or add a new one.
                                                </DialogDescription>
                                            </DialogHeader>
                                            
                                            <div className="flex flex-col gap-4">
                                                <ScrollArea className="max-h-64">
                                                    <div className="space-y-2 p-1">
                                                        {witnessesLoading && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                                                        {witnessesError && <p className="text-destructive text-center">Could not load witnesses.</p>}
                                                        {!witnessesLoading && witnesses?.map(witness => (
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
                                                        {!witnessesLoading && witnesses?.length === 0 && (
                                                            <p className="text-center text-muted-foreground p-4">No saved witnesses found.</p>
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
                                                    <Button variant="outline">Cancel</Button>
                                                </DialogClose>
                                                <DialogClose asChild>
                                                    <Button onClick={handleAssignWitnesses}>Assign Selected</Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="outline" disabled><Share2 className="mr-2 h-4 w-4" /> Send for Scholar Review (Coming Soon)</Button>
                                </div>
                                 <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print / Save as PDF</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
