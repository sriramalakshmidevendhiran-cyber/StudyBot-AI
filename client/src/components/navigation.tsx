import { GraduationCap, LogOut, ClipboardList, Home, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import type { User } from "@shared/schema";

export function Navigation() {
  const { user, isAuthenticated } = useAuth() as { user: User | undefined, isAuthenticated: boolean, isLoading: boolean };
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 h-16 md:h-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">StudyBot</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">AI College Assistant</p>
            </div>
          </div>
          
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                size="sm"
                asChild
                data-testid="link-home"
              >
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
              <Button
                variant={location === "/quiz-history" ? "secondary" : "ghost"}
                size="sm"
                asChild
                data-testid="link-quiz-history"
              >
                <Link href="/quiz-history">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Quiz History
                </Link>
              </Button>
              <Button
                variant={location === "/study-plans" ? "secondary" : "ghost"}
                size="sm"
                asChild
                data-testid="link-study-plans"
              >
                <Link href="/study-plans">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Study Plans
                </Link>
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {user.firstName?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">
                  {user.firstName || user.email}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                data-testid="button-logout"
              >
                <a href="/api/logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </a>
              </Button>
            </>
          ) : (
            <>
              <a 
                href="#features" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
                data-testid="link-features"
              >
                Features
              </a>
              <a 
                href="#main-interaction"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
                data-testid="link-get-started"
              >
                Get Started
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
