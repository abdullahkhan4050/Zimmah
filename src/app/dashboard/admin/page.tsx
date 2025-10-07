
"use client";

import { Users, FileCheck, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { StatCard } from "@/components/admin/StatCard";

export default function AdminDashboardPage() {
    const firestore = useFirestore();
    const usersQuery = firestore ? collection(firestore, "users") : null;
    const { data: users, loading: usersLoading } = useCollection(usersQuery);

    const wasiyatQuery = firestore ? collection(firestore, "wasiyat") : null;
    const { data: wasiyats, loading: wasiyatsLoading } = useCollection(wasiyatQuery);
    
    const qarzQuery = firestore ? collection(firestore, "qarz") : null;
    const { data: qarz, loading: qarzLoading } = useCollection(qarzQuery);

    const amanatQuery = firestore ? collection(firestore, "amanat") : null;
    const { data: amanat, loading: amanatLoading } = useCollection(amanatQuery);

    const loading = usersLoading || wasiyatsLoading || qarzLoading || amanatLoading;

    return (
        <>
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Admin Dashboard</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <StatCard 
                    title="Total Users" 
                    value={users?.length ?? 0} 
                    icon={Users} 
                    loading={loading}
                />
                <StatCard 
                    title="Total Wills (Wasiyat)" 
                    value={wasiyats?.length ?? 0} 
                    icon={FileCheck} 
                    loading={loading}
                />
                <StatCard 
                    title="Total Debts (Qarz)" 
                    value={qarz?.length ?? 0} 
                    icon={Clock} 
                    loading={loading}
                />
                 <StatCard 
                    title="Total Trusts (Amanat)" 
                    value={amanat?.length ?? 0} 
                    icon={Activity} 
                    loading={loading}
                />
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Recent activity feed coming soon.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Approvals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Pending approvals will be listed here.</p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
