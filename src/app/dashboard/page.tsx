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

export default function DashboardPage({ params }: { params: any }) {
    const userName = "User";
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight text-primary">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome back, {userName}!</p>
      </header>
      
      <section className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3 border-2 flex flex-col">
            <CardHeader>
                <CardTitle className="text-primary">Your Digital Vault</CardTitle>
                <CardDescription>You have no items yet. Get started by adding a new record.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex">
                <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-center p-4">
                    <p className="text-muted-foreground">No activity to display.</p>
                </div>
            </CardContent>
        </Card>
        <Card className="md:col-span-2 border-2 flex flex-col">
             <CardHeader>
                <CardTitle className="text-primary">Quick Actions</CardTitle>
                <CardDescription>Start a new record.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow grid content-start gap-4">
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
      </section>
    </div>
  );
}
