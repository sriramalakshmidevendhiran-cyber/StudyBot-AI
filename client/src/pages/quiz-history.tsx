import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, Trophy, Calendar, Award, Medal, ThumbsUp, Target } from "lucide-react";
import { format } from "date-fns";

type QuizResult = {
  id: number;
  userId: string;
  topic: string;
  score: number;
  totalQuestions: number;
  createdAt: string;
  questions: any[];
};

export default function QuizHistory() {
  const { data: quizHistory, isLoading } = useQuery<QuizResult[]>({
    queryKey: ["/api/quiz/history"],
  });

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 70) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreIcon = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage === 100) return Trophy;
    if (percentage >= 70) return Award;
    if (percentage >= 50) return Medal;
    return Target;
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your quiz history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Quiz History
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your learning progress over time
          </p>
        </div>
        {quizHistory && quizHistory.length > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {quizHistory.length} quiz{quizHistory.length !== 1 ? "zes" : ""} completed
          </Badge>
        )}
      </div>

      {!quizHistory || quizHistory.length === 0 ? (
        <Card className="min-h-[300px]">
          <CardContent className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <ClipboardList className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-center">
              No quiz history yet. Start taking quizzes to track your progress!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quizHistory.map((quiz) => (
            <Card key={quiz.id} className="hover-elevate" data-testid={`card-quiz-result-${quiz.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2" data-testid={`text-quiz-topic-${quiz.id}`}>
                      {quiz.topic}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span data-testid={`text-quiz-date-${quiz.id}`}>
                        {format(new Date(quiz.createdAt), "PPP 'at' p")}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div 
                      className={`${getScoreColor(quiz.score, quiz.totalQuestions)} text-white px-4 py-2 rounded-md font-bold text-lg`}
                      data-testid={`badge-score-${quiz.id}`}
                    >
                      {quiz.score} / {quiz.totalQuestions}
                    </div>
                    <div className={`${getScoreColor(quiz.score, quiz.totalQuestions).replace('bg-', 'text-')} p-2 rounded-md bg-muted`} data-testid={`icon-score-${quiz.id}`}>
                      {(() => {
                        const ScoreIcon = getScoreIcon(quiz.score, quiz.totalQuestions);
                        return <ScoreIcon className="h-6 w-6" />;
                      })()}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quiz.questions.map((question: any, idx: number) => {
                    const isCorrect = question.userAnswer === question.ans;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-md border ${
                          isCorrect 
                            ? 'bg-green-500/10 border-green-500' 
                            : 'bg-red-500/10 border-red-500'
                        }`}
                        data-testid={`question-result-${quiz.id}-${idx}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-sm">Q{idx + 1}:</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">{question.q}</p>
                            <div className="text-xs text-muted-foreground">
                              <span className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                Your answer: {question.userAnswer || "Not answered"}
                              </span>
                              {!isCorrect && (
                                <span className="ml-2">
                                  | Correct: <span className="font-semibold">{question.ans}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-lg">
                            {isCorrect ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
