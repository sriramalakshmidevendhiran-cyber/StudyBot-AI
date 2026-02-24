import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Trash2, 
  Loader2,
  BookOpen,
  GraduationCap,
  Edit,
  Save,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SavedStudyPlan } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function StudyPlans() {
  const { toast } = useToast();
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [editedSubject, setEditedSubject] = useState("");

  const { data: plans, isLoading } = useQuery<SavedStudyPlan[]>({
    queryKey: ["/api/plans/saved"],
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      setDeletingPlanId(planId);
      return apiRequest("DELETE", `/api/plans/${planId}`);
    },
    onSuccess: () => {
      setDeletingPlanId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/plans/saved"] });
      toast({
        title: "Plan deleted",
        description: "Your study plan has been removed.",
      });
    },
    onError: (error: Error) => {
      setDeletingPlanId(null);
      toast({
        title: "Failed to delete",
        description: error.message || "Could not delete study plan.",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, subject }: { planId: number; subject: string }) => {
      return apiRequest<SavedStudyPlan>("PATCH", `/api/plans/${planId}`, { subject });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans/saved"] });
      setEditingPlanId(null);
      toast({
        title: "Plan updated",
        description: "Your study plan has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update",
        description: error.message || "Could not update study plan.",
        variant: "destructive",
      });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ planId, completedTopics }: { planId: number; completedTopics: string[] }) => {
      return apiRequest<SavedStudyPlan>("POST", `/api/plans/${planId}/progress`, { completedTopics });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans/saved"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update progress",
        description: error.message || "Could not save your progress.",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (plan: SavedStudyPlan) => {
    setEditingPlanId(plan.id);
    setEditedSubject(plan.subject);
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditedSubject("");
  };

  const handleSaveEdit = (planId: number) => {
    if (!editedSubject.trim()) {
      toast({
        title: "Subject required",
        description: "Please enter a subject for the study plan.",
        variant: "destructive",
      });
      return;
    }
    updatePlanMutation.mutate({ planId, subject: editedSubject });
  };

  const handleToggleTopicCompletion = (plan: SavedStudyPlan, dayIndex: number, topicIndex: number) => {
    const topicId = `day-${dayIndex}-topic-${topicIndex}`;
    const currentCompleted = (plan.completedTopics as string[]) || [];
    const isCompleted = currentCompleted.includes(topicId);
    
    const newCompleted = isCompleted
      ? currentCompleted.filter(id => id !== topicId)
      : [...currentCompleted, topicId];
    
    updateProgressMutation.mutate({ planId: plan.id, completedTopics: newCompleted });
  };

  const calculateProgress = (plan: SavedStudyPlan) => {
    const planData = plan.plan as Array<{ day: string; topics: string[] }>;
    const totalTopics = planData.reduce((sum, day) => sum + day.topics.length, 0);
    const completedCount = ((plan.completedTopics as string[]) || []).length;
    return totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-12 px-4 md:px-8 bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">My Study Plans</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage and track your personalized study schedules
          </p>
          {plans && plans.length > 0 && (
            <Badge variant="secondary" className="mt-4" data-testid="badge-plan-count">
              {plans.length} {plans.length === 1 ? 'plan' : 'plans'} saved
            </Badge>
          )}
        </div>
      </section>

      {/* Study Plans List */}
      <section className="py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading your study plans...</p>
            </div>
          )}

          {!isLoading && (!plans || plans.length === 0) && (
            <Card className="py-16">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <GraduationCap className="h-16 w-16 mb-4 opacity-20 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No saved plans yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create a study plan from the home page and save it to see it here.
                </p>
                <Button asChild data-testid="button-go-home">
                  <a href="/">
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Study Plan
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {plans && plans.length > 0 && (
            <div className="space-y-6">
              {plans.map((plan) => {
                // Runtime validation for plan.plan
                if (!Array.isArray(plan.plan)) {
                  console.error(`Invalid plan data for plan ${plan.id}:`, plan.plan);
                  return null;
                }
                
                const planData = plan.plan as Array<{ day: string; topics: string[] }>;
                
                // Validate each day has required structure
                const isValidPlan = planData.every(
                  day => day && typeof day.day === 'string' && Array.isArray(day.topics)
                );
                
                if (!isValidPlan) {
                  console.error(`Malformed plan structure for plan ${plan.id}`);
                  return null;
                }
                
                const progress = calculateProgress(plan);
                const isEditing = editingPlanId === plan.id;

                return (
                  <Card key={plan.id} className="hover-elevate" data-testid={`card-study-plan-${plan.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                              <Input
                                value={editedSubject}
                                onChange={(e) => setEditedSubject(e.target.value)}
                                className="text-xl font-semibold"
                                placeholder="Enter subject"
                                data-testid={`input-edit-subject-${plan.id}`}
                              />
                            </div>
                          ) : (
                            <CardTitle className="text-xl mb-2 flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-primary" />
                              {plan.subject}
                            </CardTitle>
                          )}
                          <CardDescription className="flex items-center gap-4 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {plan.days}-day plan
                            </span>
                            {plan.createdAt && (
                              <span>
                                Created {formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true })}
                              </span>
                            )}
                            <Badge variant={progress === 100 ? "default" : "secondary"} data-testid={`badge-progress-${plan.id}`}>
                              {progress}% complete
                            </Badge>
                          </CardDescription>
                          {progress > 0 && (
                            <Progress value={progress} className="mt-3" data-testid={`progress-bar-${plan.id}`} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveEdit(plan.id)}
                                disabled={updatePlanMutation.isPending}
                                data-testid={`button-save-edit-${plan.id}`}
                              >
                                {updatePlanMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                disabled={updatePlanMutation.isPending}
                                data-testid={`button-cancel-edit-${plan.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(plan)}
                              data-testid={`button-edit-plan-${plan.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-destructive/10 hover:text-destructive"
                              disabled={deletingPlanId === plan.id}
                              data-testid={`button-delete-plan-${plan.id}`}
                            >
                              {deletingPlanId === plan.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete study plan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{plan.subject}" from your saved plans. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel 
                                disabled={deletingPlanId === plan.id}
                                data-testid="button-cancel-delete"
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePlanMutation.mutate(plan.id)}
                                disabled={deletingPlanId === plan.id}
                                className="bg-destructive hover:bg-destructive/90"
                                data-testid="button-confirm-delete"
                              >
                                {deletingPlanId === plan.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {planData.map((day, index) => (
                          <Card key={index} className="border-2 bg-muted/30" data-testid={`plan-day-${plan.id}-${index}`}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base font-semibold text-primary flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {day.day}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {day.topics.map((topic, topicIndex) => {
                                  const topicId = `day-${index}-topic-${topicIndex}`;
                                  const isCompleted = ((plan.completedTopics as string[]) || []).includes(topicId);
                                  
                                  return (
                                    <li 
                                      key={topicIndex} 
                                      className="flex items-start gap-3 group"
                                      data-testid={`topic-${plan.id}-${index}-${topicIndex}`}
                                    >
                                      <Checkbox
                                        checked={isCompleted}
                                        onCheckedChange={() => handleToggleTopicCompletion(plan, index, topicIndex)}
                                        className="mt-0.5"
                                        data-testid={`checkbox-topic-${plan.id}-${index}-${topicIndex}`}
                                      />
                                      <span className={`flex-1 ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                        {topic}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
