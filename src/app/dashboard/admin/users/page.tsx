
"use client";

import { collection } from "firebase/firestore";
import { useCollection, useFirestore } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type User = {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    cnic: string;
    avatar?: string;
};

export default function UsersPage() {
    const firestore = useFirestore();
    const usersQuery = firestore ? collection(firestore, "users") : null;
    const { data: users, loading } = useCollection<User>(usersQuery);

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">User Management</h1>
                <p className="text-muted-foreground">View and manage all registered users.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all users in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead className="hidden md:table-cell">Phone</TableHead>
                                <TableHead className="hidden md:table-cell">CNIC</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div>
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-32 mt-1" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!loading && users?.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{user.fullName}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{user.phone}</TableCell>
                                    <TableCell className="hidden md:table-cell">{user.cnic}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {!loading && users?.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">No users found.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
