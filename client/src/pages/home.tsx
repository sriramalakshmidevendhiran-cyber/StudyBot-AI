import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  ClipboardList, 
  Calendar, 
  Mic, 
  MicOff,
  Sparkles,
  GraduationCap,
  Brain,
  Loader2,
  Zap,
  Battery,
  Coffee,
  HelpCircle,
  AlertCircle,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX
} from "lucide-react";
import type { TutorResponse, QuizResponse, StudyPlanResponse, EmotionResponse, EmotionType, RevisionListResponse, DifficultyLevel } from "@shared/schema";

// Mood history type for localStorage
interface MoodHistory {
  timestamp: number;
  mood: EmotionType;
  textSnippet: string;
  confidence: number;
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState("tutor");
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [currentMood, setCurrentMood] = useState<EmotionType | null>(null);
  const [moodConfidence, setMoodConfidence] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const { toast} = useToast();

  // Load mood history and voice preference from localStorage
  useEffect(() => {
    try {
      const history = localStorage.getItem('studybot_mood_history');
      if (history) {
        const parsed: MoodHistory[] = JSON.parse(history);
        // Get most recent mood if within last hour
        const recent = parsed.find(h => Date.now() - h.timestamp < 3600000);
        if (recent) {
          setCurrentMood(recent.mood);
          setMoodConfidence(recent.confidence);
        }
      }
      
      // Load voice preference
      const voicePref = localStorage.getItem('studybot_voice_enabled');
      if (voicePref !== null) {
        setVoiceEnabled(voicePref === 'true');
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  // Save mood to history
  const saveMoodToHistory = (mood: EmotionType, confidence: number, text: string) => {
    try {
      const history = localStorage.getItem('studybot_mood_history');
      const parsed: MoodHistory[] = history ? JSON.parse(history) : [];
      
      // Add new entry
      parsed.unshift({
        timestamp: Date.now(),
        mood,
        textSnippet: text.slice(0, 100),
        confidence
      });
      
      // Keep last 50 entries
      const trimmed = parsed.slice(0, 50);
      localStorage.setItem('studybot_mood_history', JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save mood history:', e);
    }
  };

  // Save voice preference
  const saveVoicePreference = (enabled: boolean) => {
    try {
      localStorage.setItem('studybot_voice_enabled', enabled.toString());
    } catch (e) {
      console.error('Failed to save voice preference:', e);
    }
  };

  // Toggle voice
  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    saveVoicePreference(newState);
    
    // Cancel any ongoing speech when turning off
    if (!newState && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    toast({
      title: `Voice ${newState ? 'enabled' : 'disabled'}`,
      description: `AI explanations will ${newState ? 'be spoken aloud' : 'appear as text only'}.`,
      duration: 2000,
    });
  };

  // TTS configuration based on mood
  const getTTSConfig = (mood: EmotionType | null) => {
    const configs = {
      motivated: { rate: 1.1, pitch: 1.1 },
      tired: { rate: 0.9, pitch: 0.9 },
      bored: { rate: 1.05, pitch: 1.0 },
      confused: { rate: 0.95, pitch: 1.0 },
      stressed: { rate: 0.9, pitch: 0.95 },
      confident: { rate: 1.1, pitch: 1.05 }
    };
    return mood ? configs[mood] : { rate: 1.0, pitch: 1.0 };
  };

  // Emotion detection mutation
  const emotionMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest<EmotionResponse>("POST", "/api/emotion", { text });
    },
    onSuccess: (data) => {
      setCurrentMood(data.emotion);
      setMoodConfidence(data.confidence);
      saveMoodToHistory(data.emotion, data.confidence, topic);
    },
    onError: () => {
      // Silent fail - mood detection is optional
      setCurrentMood("motivated");
      setMoodConfidence(0.3);
    }
  });

  const tutorMutation = useMutation({
    mutationFn: async ({ topic, mood }: { topic: string; mood: EmotionType | null }) => {
      return apiRequest<TutorResponse>("POST", "/api/tutor", { topic, mood: mood || undefined });
    },
    onSuccess: (data, variables) => {
      console.log('Tutor response received:', data);
      console.log('Voice enabled:', voiceEnabled);
      
      if (data.result && 'speechSynthesis' in window && voiceEnabled) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Use mood from variables (the fresh mood passed to mutation)
        const ttsConfig = getTTSConfig(variables.mood);
        const utterance = new SpeechSynthesisUtterance(data.result);
        utterance.rate = ttsConfig.rate;
        utterance.pitch = ttsConfig.pitch;
        window.speechSynthesis.speak(utterance);
      }
      
      // Auto-save topic for revision tracking (medium difficulty by default)
      learnTopicMutation.mutate({ 
        topic: variables.topic, 
        difficulty: "medium" 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Oops! Something went wrong",
        description: error.message || "Failed to get explanation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const quizMutation = useMutation({
    mutationFn: async (topic: string) => {
      return apiRequest<QuizResponse>("POST", "/api/quiz", { topic });
    },
    onSuccess: (data) => {
      // Reset quiz state when new quiz is generated
      setUserAnswers({});
      setQuizSubmitted(false);
      setQuizScore(0);
      
      if ('speechSynthesis' in window && voiceEnabled) {
        const utterance = new SpeechSynthesisUtterance(`Here is your quiz on ${topic}`);
        window.speechSynthesis.speak(utterance);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Oops! Something went wrong",
        description: error.message || "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveQuizMutation = useMutation({
    mutationFn: async (quizData: { topic: string; questions: any; score: number; totalQuestions: number }) => {
      return apiRequest("POST", "/api/quiz/save", quizData);
    },
    onSuccess: () => {
      // Invalidate quiz history to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/quiz/history"] });
      
      toast({
        title: "Quiz saved!",
        description: "Your quiz results have been saved to your history.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message || "Could not save quiz results.",
        variant: "destructive",
      });
    },
  });

  const planMutation = useMutation({
    mutationFn: async (topicToUse: string) => {
      return apiRequest<StudyPlanResponse>("POST", "/api/plan", { 
        subject: topicToUse, 
        days: 5 
      });
    },
    onSuccess: (data) => {
      console.log('Plan response received:', data);
      console.log('Voice enabled:', voiceEnabled);
      
      if ('speechSynthesis' in window && voiceEnabled && data.subject) {
        const utterance = new SpeechSynthesisUtterance(`Here is your five-day plan for ${data.subject}`);
        window.speechSynthesis.speak(utterance);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Oops! Something went wrong",
        description: error.message || "Failed to create study plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Revision System - Query for revision schedule
  const revisionQuery = useQuery<RevisionListResponse>({
    queryKey: ["/api/revision"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Mutation to complete a revision
  const completeRevisionMutation = useMutation({
    mutationFn: async (topicId: number) => {
      return apiRequest("POST", `/api/revision/${topicId}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/revision"] });
      toast({
        title: "Revision completed!",
        description: "The topic has been rescheduled for your next review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete revision",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to save a learned topic for revision tracking
  const learnTopicMutation = useMutation({
    mutationFn: async ({ topic, difficulty }: { topic: string; difficulty: DifficultyLevel }) => {
      return apiRequest("POST", "/api/topics/learn", { topic, difficulty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/revision"] });
    },
    onError: () => {
      // Silent fail - learning topic tracking is optional
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: async (planData: { subject: string; days: number; plan: any }) => {
      return apiRequest("POST", "/api/plans/save", planData);
    },
    onSuccess: () => {
      // Invalidate saved plans to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/plans/saved"] });
      
      toast({
        title: "Study plan saved!",
        description: "Your study plan has been saved to your dashboard.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message || "Could not save study plan.",
        variant: "destructive",
      });
    },
  });

  const handleExplain = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic to learn about.",
        variant: "destructive",
      });
      return;
    }
    
    // Detect mood first if topic is long enough
    let detectedMood = currentMood;
    if (topic.length > 10) {
      try {
        const emotionResult = await emotionMutation.mutateAsync(topic);
        detectedMood = emotionResult.emotion;
      } catch (error) {
        // On error, use current mood or default
        console.error("Mood detection failed:", error);
      }
    }
    
    tutorMutation.mutate({ topic, mood: detectedMood });
  };

  const handleQuiz = () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for the quiz.",
        variant: "destructive",
      });
      return;
    }
    quizMutation.mutate(topic);
  };

  const handlePlan = () => {
    if (!topic.trim()) {
      toast({
        title: "Subject required",
        description: "Please enter a subject for your study plan.",
        variant: "destructive",
      });
      return;
    }
    planMutation.mutate(topic);
  };

  const handleSavePlan = () => {
    if (!planMutation.data?.plan || !planMutation.data?.subject || !planMutation.data?.days) {
      toast({
        title: "No plan to save",
        description: "Please generate a study plan first.",
        variant: "destructive",
      });
      return;
    }
    
    savePlanMutation.mutate({
      subject: planMutation.data.subject,
      days: planMutation.data.days,
      plan: planMutation.data.plan
    });
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (!quizSubmitted) {
      setUserAnswers(prev => ({
        ...prev,
        [questionIndex]: answer
      }));
    }
  };

  const handleQuizSubmit = () => {
    if (!quizMutation.data?.questions) return;
    
    const questions = quizMutation.data.questions;
    let correct = 0;
    
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.ans) {
        correct++;
      }
    });
    
    setQuizScore(correct);
    setQuizSubmitted(true);
    
    // Save quiz results
    const questionsWithAnswers = questions.map((q, idx) => ({
      ...q,
      userAnswer: userAnswers[idx] || null
    }));
    
    saveQuizMutation.mutate({
      topic,
      questions: questionsWithAnswers,
      score: correct,
      totalQuestions: questions.length
    });
  };

  // Get mood icon and emoji
  const getMoodDisplay = (mood: EmotionType | null) => {
    const displays = {
      motivated: { icon: Zap, emoji: "⚡", label: "Motivated", color: "text-green-600" },
      tired: { icon: Battery, emoji: "🔋", label: "Tired", color: "text-blue-500" },
      bored: { icon: Coffee, emoji: "☕", label: "Bored", color: "text-yellow-600" },
      confused: { icon: HelpCircle, emoji: "❓", label: "Confused", color: "text-purple-600" },
      stressed: { icon: AlertCircle, emoji: "😰", label: "Stressed", color: "text-red-600" },
      confident: { icon: Trophy, emoji: "🏆", label: "Confident", color: "text-orange-600" }
    };
    return mood ? displays[mood] : null;
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTopic(transcript);
      setIsListening(false);
      
      // Detect mood from voice input
      if (transcript.length > 10) {
        emotionMutation.mutate(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice input failed",
        description: "Please try again or type your topic.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const currentMutation = activeTab === "tutor" ? tutorMutation : activeTab === "quiz" ? quizMutation : planMutation;
  const isLoading = currentMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Trusted by 10,000+ students
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                Your AI College Assistant
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Master any topic with AI-powered explanations, personalized quizzes, and smart study plans. StudyBot makes learning simple, efficient, and fun.
              </p>
              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  className="gap-2"
                  onClick={() => document.getElementById('main-interaction')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="button-get-started"
                >
                  <GraduationCap className="h-5 w-5" />
                  Get Started
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="button-learn-more"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <div className="relative bg-card border border-card-border rounded-2xl p-8 shadow-lg">
                  <Brain className="h-32 w-32 text-primary mx-auto" />
                  <div className="mt-6 space-y-3">
                    <div className="h-3 bg-primary/30 rounded-full w-full"></div>
                    <div className="h-3 bg-primary/20 rounded-full w-4/5"></div>
                    <div className="h-3 bg-primary/10 rounded-full w-3/5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interaction Panel */}
      <section id="main-interaction" className="py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-2">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-semibold text-center">
                What would you like to learn today?
              </CardTitle>
              <CardDescription className="text-center text-base">
                Enter any topic and choose how you want to study
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Section */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Photosynthesis, Calculus, World War II..."
                    className="h-14 text-base px-4"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (activeTab === "tutor") handleExplain();
                        else if (activeTab === "quiz") handleQuiz();
                        else handlePlan();
                      }
                    }}
                    data-testid="input-topic"
                  />
                </div>
                <Button
                  size="icon"
                  variant={isListening ? "default" : "outline"}
                  className={`h-14 w-14 rounded-full ${isListening ? 'animate-pulse' : ''}`}
                  onClick={startVoiceInput}
                  disabled={isListening}
                  data-testid="button-voice-input"
                  aria-label="Voice input"
                >
                  {isListening ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              </div>

              {/* Mood Indicator with Manual Override */}
              <Card className="bg-muted/30" data-testid="card-mood-indicator">
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-3 px-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Brain className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Mood:</span>
                    {currentMood && getMoodDisplay(currentMood) && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">{getMoodDisplay(currentMood)?.emoji}</span>
                        <Badge 
                          variant="outline" 
                          className={`${getMoodDisplay(currentMood)?.color} border-current`}
                          data-testid="badge-mood"
                        >
                          {getMoodDisplay(currentMood)?.label}
                        </Badge>
                        {moodConfidence > 0.7 && (
                          <Badge variant="secondary" className="text-xs" data-testid="badge-confidence">
                            {Math.round(moodConfidence * 100)}%
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Override:</span>
                    <Select 
                      value={currentMood || undefined} 
                      onValueChange={(value) => {
                        setCurrentMood(value as EmotionType);
                        setMoodConfidence(1.0);
                        saveMoodToHistory(value as EmotionType, 1.0, topic || "manual override");
                      }}
                    >
                      <SelectTrigger className="w-32 h-8" data-testid="select-mood-override">
                        <SelectValue placeholder="Auto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motivated">⚡ Motivated</SelectItem>
                        <SelectItem value="tired">🔋 Tired</SelectItem>
                        <SelectItem value="bored">☕ Bored</SelectItem>
                        <SelectItem value="confused">❓ Confused</SelectItem>
                        <SelectItem value="stressed">😰 Stressed</SelectItem>
                        <SelectItem value="confident">🏆 Confident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={voiceEnabled ? "default" : "outline"}
                      onClick={toggleVoice}
                      className="h-8 px-3"
                      data-testid="button-voice-toggle"
                      aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
                    >
                      {voiceEnabled ? (
                        <>
                          <Volume2 className="h-4 w-4 mr-1" />
                          <span className="text-xs">Voice On</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="h-4 w-4 mr-1" />
                          <span className="text-xs">Voice Off</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for different features */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-12">
                  <TabsTrigger value="tutor" className="gap-2" data-testid="tab-tutor">
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Explain</span>
                  </TabsTrigger>
                  <TabsTrigger value="quiz" className="gap-2" data-testid="tab-quiz">
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline">Quiz</span>
                  </TabsTrigger>
                  <TabsTrigger value="plan" className="gap-2" data-testid="tab-plan">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Plan</span>
                  </TabsTrigger>
                  <TabsTrigger value="revision" className="gap-2" data-testid="tab-revision">
                    <Brain className="h-4 w-4" />
                    <span className="hidden sm:inline">Revision</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tutor" className="mt-6 space-y-4">
                  <Button
                    onClick={handleExplain}
                    className="w-full h-12 text-base font-medium gap-2"
                    disabled={isLoading}
                    data-testid="button-explain"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-5 w-5" />
                        Explain This Topic
                      </>
                    )}
                  </Button>
                  
                  {/* Output Area */}
                  <Card className="min-h-[300px] bg-muted/30">
                    <CardContent className="p-6">
                      {tutorMutation.isPending && (
                        <div className="flex flex-col items-center justify-center h-[268px] space-y-4">
                          <Loader2 className="h-12 w-12 animate-spin text-primary" />
                          <p className="text-muted-foreground">AI is crafting your explanation...</p>
                        </div>
                      )}
                      {tutorMutation.data && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <div className="whitespace-pre-wrap text-foreground leading-relaxed font-mono text-sm" data-testid="text-tutor-response">
                            {tutorMutation.data.result}
                          </div>
                        </div>
                      )}
                      {!tutorMutation.isPending && !tutorMutation.data && (
                        <div className="flex flex-col items-center justify-center h-[268px] text-muted-foreground">
                          <BookOpen className="h-16 w-16 mb-4 opacity-20" />
                          <p className="text-center">Your AI tutor will explain the topic here with examples and a quiz question.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="quiz" className="mt-6 space-y-4">
                  <Button
                    onClick={handleQuiz}
                    className="w-full h-12 text-base font-medium gap-2"
                    disabled={isLoading}
                    data-testid="button-quiz"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ClipboardList className="h-5 w-5" />
                        Generate Quiz
                      </>
                    )}
                  </Button>

                  <Card className="min-h-[300px] bg-muted/30">
                    <CardContent className="p-6">
                      {quizMutation.isPending && (
                        <div className="flex flex-col items-center justify-center h-[268px] space-y-4">
                          <Loader2 className="h-12 w-12 animate-spin text-primary" />
                          <p className="text-muted-foreground">Creating quiz questions...</p>
                        </div>
                      )}
                      {quizMutation.data && quizMutation.data.questions && quizMutation.data.questions.length > 0 && (
                        <div className="space-y-6">
                          <div className="space-y-4">
                            {quizMutation.data.questions.map((question, index) => (
                              <Card key={index} className="border-2" data-testid={`card-quiz-question-${index}`}>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base font-medium">
                                    Question {index + 1}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <p className="font-medium text-foreground">{question.q}</p>
                                  <div className="space-y-2">
                                    {['A', 'B', 'C', 'D'].map((option) => {
                                      const isSelected = userAnswers[index] === option;
                                      const isCorrect = question.ans === option;
                                      const showResult = quizSubmitted;
                                      
                                      let styling = 'p-3 rounded-md border cursor-pointer transition-colors ';
                                      
                                      if (showResult) {
                                        if (isCorrect) {
                                          styling += 'bg-green-500/10 border-green-500 font-medium';
                                        } else if (isSelected && !isCorrect) {
                                          styling += 'bg-red-500/10 border-red-500';
                                        } else {
                                          styling += 'bg-background border-border';
                                        }
                                      } else {
                                        styling += isSelected 
                                          ? 'bg-primary/10 border-primary font-medium' 
                                          : 'bg-background border-border hover-elevate';
                                      }
                                      
                                      return (
                                        <div 
                                          key={option} 
                                          className={styling}
                                          onClick={() => handleAnswerSelect(index, option)}
                                          data-testid={`option-${index}-${option}`}
                                        >
                                          <span className="font-semibold mr-2">{option}.</span>
                                          {question[option as keyof typeof question]}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {quizSubmitted && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      {userAnswers[index] === question.ans ? (
                                        <span className="text-green-600 dark:text-green-400 font-medium">✓ Correct!</span>
                                      ) : (
                                        <span className="text-red-600 dark:text-red-400">
                                          ✗ Incorrect. Correct answer: <span className="font-semibold">{question.ans}</span>
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          
                          {!quizSubmitted ? (
                            <Button 
                              onClick={handleQuizSubmit}
                              className="w-full h-12 text-base font-medium"
                              disabled={Object.keys(userAnswers).length !== quizMutation.data.questions.length}
                              data-testid="button-submit-quiz"
                            >
                              Submit Answers
                            </Button>
                          ) : (
                            <Card className="border-2 border-primary">
                              <CardContent className="p-6 text-center">
                                <h3 className="text-2xl font-bold mb-2">
                                  Score: {quizScore} / {quizMutation.data.questions.length}
                                </h3>
                                <p className="text-lg text-muted-foreground">
                                  {quizScore === quizMutation.data.questions.length 
                                    ? "Perfect score!" 
                                    : quizScore >= quizMutation.data.questions.length * 0.7 
                                    ? "Great job!" 
                                    : "Keep practicing!"}
                                </p>
                                <Button 
                                  onClick={handleQuiz}
                                  className="mt-4"
                                  variant="outline"
                                  data-testid="button-retry-quiz"
                                >
                                  Try Another Quiz
                                </Button>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}
                      {quizMutation.data && (!quizMutation.data.questions || quizMutation.data.questions.length === 0) && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <div className="whitespace-pre-wrap text-foreground leading-relaxed font-mono text-sm" data-testid="text-quiz-response">
                            {quizMutation.data.result}
                          </div>
                        </div>
                      )}
                      {!quizMutation.isPending && !quizMutation.data && (
                        <div className="flex flex-col items-center justify-center h-[268px] text-muted-foreground">
                          <ClipboardList className="h-16 w-16 mb-4 opacity-20" />
                          <p className="text-center">Test your knowledge with AI-generated multiple choice questions.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="plan" className="mt-6 space-y-4">
                  <Button
                    onClick={handlePlan}
                    className="w-full h-12 text-base font-medium gap-2"
                    disabled={isLoading}
                    data-testid="button-plan"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Planning...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-5 w-5" />
                        Create Study Plan
                      </>
                    )}
                  </Button>

                  <Card className="min-h-[300px] bg-muted/30">
                    <CardContent className="p-6">
                      {planMutation.isPending && (
                        <div className="flex flex-col items-center justify-center h-[268px] space-y-4">
                          <Loader2 className="h-12 w-12 animate-spin text-primary" />
                          <p className="text-muted-foreground">Organizing your 5-day study plan...</p>
                        </div>
                      )}
                      {planMutation.data && planMutation.data.plan && planMutation.data.plan.length > 0 && (
                        <>
                          <div className="space-y-3">
                            {planMutation.data.plan.map((day, index) => (
                              <Card key={index} className="border-2" data-testid={`card-plan-day-${index}`}>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base font-semibold text-primary flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {day.day}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ul className="space-y-2">
                                    {day.topics.map((topic, topicIndex) => (
                                      <li 
                                        key={topicIndex} 
                                        className="flex items-start gap-2"
                                        data-testid={`topic-${index}-${topicIndex}`}
                                      >
                                        <span className="text-primary mt-1">•</span>
                                        <span className="text-foreground">{topic}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          <Button
                            onClick={handleSavePlan}
                            className="w-full mt-4 gap-2"
                            variant="default"
                            disabled={savePlanMutation.isPending}
                            data-testid="button-save-plan"
                          >
                            {savePlanMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <BookOpen className="h-4 w-4" />
                                Save to My Plans
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      {planMutation.data && (!planMutation.data.plan || planMutation.data.plan.length === 0) && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <div className="whitespace-pre-wrap text-foreground leading-relaxed font-mono text-sm" data-testid="text-plan-response">
                            {planMutation.data.result}
                          </div>
                        </div>
                      )}
                      {!planMutation.isPending && !planMutation.data && (
                        <div className="flex flex-col items-center justify-center h-[268px] text-muted-foreground">
                          <Calendar className="h-16 w-16 mb-4 opacity-20" />
                          <p className="text-center">Get a structured 5-day study plan tailored to your subject.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="revision" className="mt-6 space-y-4">
                  <Card className="min-h-[300px] bg-muted/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Brain className="h-5 w-5 text-primary" />
                        Smart Revision Schedule
                      </CardTitle>
                      <CardDescription>
                        Based on the Ebbinghaus Forgetting Curve
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {revisionQuery.isLoading && (
                        <div className="flex flex-col items-center justify-center h-[268px] space-y-4">
                          <Loader2 className="h-12 w-12 animate-spin text-primary" />
                          <p className="text-muted-foreground">Loading your revision schedule...</p>
                        </div>
                      )}

                      {revisionQuery.data && (
                        <div className="space-y-6">
                          {/* Overdue Revisions */}
                          {revisionQuery.data.overdue && revisionQuery.data.overdue.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-destructive" />
                                <h3 className="font-semibold text-destructive">
                                  Overdue Revisions ({revisionQuery.data.overdue.length})
                                </h3>
                              </div>
                              <div className="space-y-2">
                                {revisionQuery.data.overdue.map((item) => (
                                  <Card 
                                    key={item.id} 
                                    className="border-l-4 border-l-destructive"
                                    data-testid={`card-revision-overdue-${item.id}`}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-medium text-foreground" data-testid={`topic-${item.id}`}>
                                              {item.topic}
                                            </h4>
                                            <Badge 
                                              variant="outline" 
                                              className={
                                                item.difficulty === "easy" 
                                                  ? "border-green-500 text-green-700 dark:text-green-400"
                                                  : item.difficulty === "medium"
                                                  ? "border-yellow-500 text-yellow-700 dark:text-yellow-400"
                                                  : "border-red-500 text-red-700 dark:text-red-400"
                                              }
                                            >
                                              {item.difficulty}
                                            </Badge>
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-destructive">
                                              <Clock className="h-3 w-3" />
                                              <span>{Math.abs(item.daysUntilReview)} days overdue</span>
                                            </div>
                                            <div className="space-y-1">
                                              <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Memory Retention</span>
                                                <span className="font-medium">{item.retentionPercentage}%</span>
                                              </div>
                                              <Progress value={item.retentionPercentage} className="h-2" />
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => completeRevisionMutation.mutate(item.id)}
                                          disabled={completeRevisionMutation.isPending}
                                          data-testid={`button-complete-${item.id}`}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Complete
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Upcoming Revisions */}
                          {revisionQuery.data.upcoming && revisionQuery.data.upcoming.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">
                                  Upcoming Revisions ({revisionQuery.data.upcoming.length})
                                </h3>
                              </div>
                              <div className="space-y-2">
                                {revisionQuery.data.upcoming.map((item) => (
                                  <Card 
                                    key={item.id} 
                                    className="border-l-4 border-l-primary"
                                    data-testid={`card-revision-upcoming-${item.id}`}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-medium text-foreground" data-testid={`topic-${item.id}`}>
                                              {item.topic}
                                            </h4>
                                            <Badge 
                                              variant="outline"
                                              className={
                                                item.difficulty === "easy" 
                                                  ? "border-green-500 text-green-700 dark:text-green-400"
                                                  : item.difficulty === "medium"
                                                  ? "border-yellow-500 text-yellow-700 dark:text-yellow-400"
                                                  : "border-red-500 text-red-700 dark:text-red-400"
                                              }
                                            >
                                              {item.difficulty}
                                            </Badge>
                                          </div>
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                              <Clock className="h-3 w-3" />
                                              <span>
                                                {item.daysUntilReview === 0 
                                                  ? "Review today" 
                                                  : `Review in ${item.daysUntilReview} day${item.daysUntilReview !== 1 ? 's' : ''}`}
                                              </span>
                                            </div>
                                            <div className="space-y-1">
                                              <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Memory Retention</span>
                                                <span className="font-medium">{item.retentionPercentage}%</span>
                                              </div>
                                              <Progress value={item.retentionPercentage} className="h-2" />
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => completeRevisionMutation.mutate(item.id)}
                                          disabled={completeRevisionMutation.isPending}
                                          data-testid={`button-complete-${item.id}`}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Complete
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Empty State */}
                          {(!revisionQuery.data.overdue || revisionQuery.data.overdue.length === 0) && 
                           (!revisionQuery.data.upcoming || revisionQuery.data.upcoming.length === 0) && (
                            <div className="flex flex-col items-center justify-center h-[268px] text-muted-foreground">
                              <Brain className="h-16 w-16 mb-4 opacity-20" />
                              <p className="text-center">No topics to review yet.</p>
                              <p className="text-center text-sm mt-2">
                                Topics you learn will appear here for optimal spaced repetition.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {revisionQuery.isError && (
                        <div className="flex flex-col items-center justify-center h-[268px] text-destructive">
                          <XCircle className="h-16 w-16 mb-4 opacity-20" />
                          <p className="text-center">Failed to load revision schedule.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 md:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Learning Tools</h2>
            <p className="text-muted-foreground text-lg">Everything you need to excel in your studies</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate transition-all duration-200" data-testid="card-feature-tutor">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">AI Tutor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  Get clear explanations with bullet points, real-world examples, and practice questions for any topic.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-200" data-testid="card-feature-quiz">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Quiz Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  Test your knowledge with AI-generated multiple choice questions tailored to your topic.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-200" data-testid="card-feature-plan">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Study Planner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  Create personalized multi-day study plans that break down complex subjects into manageable chunks.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-8 border-t">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Made for students who want to learn smarter, not harder
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by OpenAI • Built with care for education
          </p>
        </div>
      </footer>
    </div>
  );
}
