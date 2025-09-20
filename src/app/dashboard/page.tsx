import {
  BookOpen,
  FileText,
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

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome back, User!</p>
      </header>
      
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle>Your Digital Vault</CardTitle>
                <CardDescription>You have no items yet. Get started by adding a new record.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-center p-4">
                    <p className="text-muted-foreground">No activity to display.</p>
                </div>
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
             <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Start a new record.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Link href="/dashboard/qarz">
                    <Button variant="outline" className="w-full justify-start gap-4">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>Add New Debt (Qarz)</span>
                    </Button>
                </Link>
                 <Link href="/dashboard/amanat">
                    <Button variant="outline" className="w-full justify-start gap-4">
                        <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                        <span>Add New Trust (Amanat)</span>
                    </Button>
                </Link>
                 <Link href="/dashboard/wasiyat">
                    <Button variant="outline" className="w-full justify-start gap-4">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Create/Edit Will (Wasiyat)</span>
                    </Button>
                </Link>
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
