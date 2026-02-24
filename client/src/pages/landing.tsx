import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ClipboardList, Calendar, Sparkles, GraduationCap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">StudyBot</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-8 px-4 py-24 text-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          <span>AI-Powered Learning Assistant</span>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Study Smarter with AI
        </h1>
        
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Get personalized explanations, practice quizzes, study plans, and flashcards powered by advanced AI.
          Track your progress and master any subject.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" asChild data-testid="button-get-started">
            <a href="/api/login">
              Get Started Free
            </a>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <BookOpen className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Tutor</h3>
              <p className="text-muted-foreground">
                Get clear explanations for any topic with examples and practice questions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <ClipboardList className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Practice Quizzes</h3>
              <p className="text-muted-foreground">
                Test your knowledge with AI-generated multiple choice questions and track your scores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Study Plans</h3>
              <p className="text-muted-foreground">
                Create custom study schedules and save them for easy access anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="text-3xl font-bold">Ready to ace your studies?</h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of students learning smarter with StudyBot
          </p>
          <Button size="lg" asChild data-testid="button-cta-login">
            <a href="/api/login">
              Start Learning Now
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 StudyBot. Your AI study companion.</p>
        </div>
      </footer>
    </div>
  );
}
