import {
  BookOpen,
  FileText,
  HeartHandshake,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stats = [
    { title: "Active Debts (Qarz)", value: "2", icon: BookOpen, change: "+1 this month" },
    { title: "Entrusted Items (Amanat)", value: "5", icon: HeartHandshake, change: "2 pending return" },
    { title: "Wills (Wasiyat)", value: "1", icon: FileText, change: "Draft" },
    { title: "Total Debt Value", value: "$5,231.89", icon: DollarSign, change: "+$201 since last month" },
];

const recentActivities = [
    { type: "Qarz", description: "Loan to Ahmed Khan", amount: "+$500.00", status: "Pending" },
    { type: "Amanat", description: "Received Laptop from Fatima", amount: "", status: "Entrusted" },
    { type: "Wasiyat", description: "Updated beneficiaries", amount: "", status: "Draft" },
    { type: "Qarz", description: "Paid back Ali Raza", amount: "-$250.00", status: "Completed" },
    { type: "Amanat", description: "Returned book to Zainab", amount: "", status: "Returned" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome back, User!</p>
      </header>
      
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
            <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
            </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>An overview of your recent transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentActivities.map((activity, i) => (
                             <TableRow key={i}>
                                <TableCell>
                                    <Badge variant={activity.type === 'Qarz' ? 'default' : 'secondary'} className={activity.type === 'Wasiyat' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' : ''}>
                                        {activity.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{activity.description}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{activity.status}</Badge>
                                </TableCell>
                                <TableCell className={`text-right ${activity.amount.startsWith('+') ? 'text-green-600' : activity.amount.startsWith('-') ? 'text-red-600' : ''}`}>
                                    {activity.amount}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
             <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Start a new record.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Link href="/dashboard/qarz">
                    <Button variant="outline" className="w-full justify-between">
                        <span>Add New Debt (Qarz)</span><BookOpen className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </Link>
                 <Link href="/dashboard/amanat">
                    <Button variant="outline" className="w-full justify-between">
                        <span>Add New Trust (Amanat)</span><HeartHandshake className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </Link>
                 <Link href="/dashboard/wasiyat">
                    <Button variant="outline" className="w-full justify-between">
                        <span>Create/Edit Will (Wasiyat)</span><FileText className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
