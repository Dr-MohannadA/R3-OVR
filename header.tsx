import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { HHCLogo } from "./logo";
import { useAuthSimple } from "@/hooks/useAuthSimple";
import hhcLogo from "@/assets/hhc-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User } from "lucide-react";

export function Header() {
  const { user, isAuthenticated } = useAuthSimple();
  const [location] = useLocation();
  
  return (
    <header className="glass sticky top-0 z-50 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-14 sm:h-16 relative">
          <Link href="/">
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer button-hover">
              <div className="w-8 h-8 sm:w-11 sm:h-11 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg p-1 sm:p-2">
                <img 
                  src={hhcLogo} 
                  alt="HHC Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">OVR System</h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium hidden sm:block">Riyadh Third Health Cluster</p>
              </div>
            </div>
          </Link>
          
          {isAuthenticated && (
            <div className="absolute right-0 flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-sm text-slate-600">
                  {user?.role?.toUpperCase()}
                </span>
                <span className="text-sm text-slate-600">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem onClick={async () => {
                    try {
                      // Try local logout first
                      await fetch('/api/auth/logout', { method: 'POST' });
                      window.location.href = '/';
                    } catch {
                      // Fallback to Replit logout for admin users
                      window.location.href = '/api/logout';
                    }
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
