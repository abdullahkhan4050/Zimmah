
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  FileText,
  HeartHandshake,
  Home,
  LogOut,
  MessageSquare,
  ShieldCheck,
  User,
  Loader2,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { ZimmahLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth, useUser as useFirebaseUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const vaultItems = [
  { href: "/dashboard/wasiyat", label: "Wasiyat (Wills)", icon: FileText },
  { href: "/dashboard/qarz", label: "Qarz (Debts)", icon: BookOpen },
  { href: "/dashboard/amanat", label: "Amanat (Trusts)", icon: HeartHandshake },
];

const toolsItems = [
    { href: "/dashboard/shariah-assistant", label: "Shariah Assistant", icon: ShieldCheck },
    { href: "/dashboard/chatbot", label: "Chatbot", icon: MessageSquare },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const auth = useAuth();
  const { user, loading: userLoading } = useFirebaseUser();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };

  if (userLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const userName = user?.displayName || "Test User";
  const userEmail = user?.email || "user@example.com";
  const userInitials = userName ? userName.split(' ').map(n => n[0]).join('') : '';
  const notificationCount = 0;


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2">
            <ZimmahLogo className="w-10 h-10 text-primary" />
            <span className="font-headline text-lg font-semibold text-primary">
              Zimmah
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
           <SidebarMenu>
                 <SidebarMenuItem>
                    <Link href="/dashboard">
                        <SidebarMenuButton isActive={pathname === '/dashboard'} tooltip="Home">
                            <Home />
                            <span>Home</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>

          <SidebarGroup>
            <SidebarGroupLabel>Vault</SidebarGroupLabel>
            <SidebarMenu>
              {vaultItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className="sidebar-menu-button-creative"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          
           <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className="sidebar-menu-button-creative"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
                 <Link href="/dashboard/profile">
                    <SidebarMenuButton isActive={pathname === '/dashboard/profile'} tooltip="Profile">
                        <User />
                        <span>Profile</span>
                    </SidebarMenuButton>
                 </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          <div className="flex-1">
            {/* Can add breadcrumbs here if needed */}
          </div>
          <div className="flex items-center gap-4">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <Badge className="absolute -bottom-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-2 text-xs text-white">
                      {notificationCount}
                    </Badge>
                  )}
                  <span className="sr-only">Toggle notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationCount > 0 ? (
                  <>
                    {/* <DropdownMenuItem>Your Qarz record is due soon.</DropdownMenuItem>
                    <DropdownMenuItem>Wasiyat draft requires witness.</DropdownMenuItem>
                    <DropdownMenuItem>New Shariah tip available.</DropdownMenuItem> */}
                  </>
                ) : (
                  <DropdownMenuItem>No new notifications.</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src={user?.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${userEmail}`} alt={userName} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/dashboard/profile">Profile</Link></DropdownMenuItem>
                <DropdownMenuItem>Emergency Access</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
