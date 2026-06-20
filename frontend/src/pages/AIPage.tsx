import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Brain, Send, Sparkles } from "lucide-react";
import { api, type ChatMessage } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge, Spinner } from "@/components/ui/Badge";

const SUGGESTIONS = [
  "What should I tell my doctor this week?",
  "Summarize my blood pressure trend",
  "Are there any concerning patterns in my symptoms?",
  "Help me prepare questions for my next visit",
];

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: api.insights,
  });

  const chatMutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: ChatMessage[] }) =>
      api.chat(message, history),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || chatMutation.isPending) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    chatMutation.mutate({ message: text, history: [...messages, userMsg] });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">AI Health Assistant</h1>
        <p className="text-slate-500">Doctor-visit prep grounded in your health data</p>
      </div>

      {insights && (
        <Card className="border-clinical-500/20 shrink-0">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-clinical-600" />
              <CardTitle className="text-base">Weekly Insight</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <Spinner />
            ) : (
              <p className="text-sm text-slate-700">{insights.summary}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-clinical-600" />
            <CardTitle className="text-base">Doctor Visit Prep Chat</CardTitle>
            <Badge>Grounded AI</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 text-center py-4">
                  Ask anything about your logged health data
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-sm p-3 rounded-lg border border-slate-200 hover:border-clinical-500/40 hover:bg-clinical-50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-clinical-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-xl px-4 py-3">
                  <Spinner className="h-4 w-4" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-slate-100 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your health data..."
                disabled={chatMutation.isPending}
              />
              <Button type="submit" disabled={chatMutation.isPending || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
