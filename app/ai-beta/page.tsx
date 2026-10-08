"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Bot, Send, Sparkles, Calendar, RotateCcw } from "lucide-react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AnalyticsResponse = {
  analysis?: string;
  error?: string;
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const renderInlineMarkdown = (text: string): ReactNode[] => {
  const tokenPattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_)/g;
  const parts = text.split(tokenPattern).filter(Boolean);

  return parts.map((part, index) => {
    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.88em] text-foreground">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (
      (part.startsWith("*") && part.endsWith("*")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

const isBlockStart = (line: string) =>
  /^#{1,3}\s|^\s*[-*+]\s+|^\s*\d+[.)]\s+|^\s*>\s|^\s*```/.test(line);

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre
          key={`code-${blocks.length}`}
          className="overflow-x-auto rounded-lg border bg-background/80 p-3 font-mono text-xs"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push(
        <h3 key={`heading-${blocks.length}`} className="font-semibold text-foreground text-sm mt-1">
          {renderInlineMarkdown(heading[2])}
        </h3>
      );
      index += 1;
      continue;
    }

    const unorderedItem = line.match(/^\s*[-*+]\s+(.+)$/);
    const orderedItem = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unorderedItem || orderedItem) {
      const ordered = Boolean(orderedItem);
      const items: string[] = [];
      while (index < lines.length) {
        const itemLine = lines[index].trim();
        const item = ordered
          ? itemLine.match(/^\d+[.)]\s+(.+)$/)
          : itemLine.match(/^[-*+]\s+(.+)$/);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }

      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List
          key={`list-${blocks.length}`}
          className={`space-y-1 pl-4 text-sm ${ordered ? "list-decimal" : "list-disc"}`}
        >
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
          ))}
        </List>
      );
      continue;
    }

    if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="border-l-2 border-primary/50 pl-3 text-muted-foreground italic text-sm"
        >
          {renderInlineMarkdown(line.slice(2))}
        </blockquote>
      );
      index += 1;
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isBlockStart(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${blocks.length}`} className="text-sm leading-relaxed">
        {renderInlineMarkdown(paragraph.join(" "))}
      </p>
    );
  }

  return <div className="space-y-2.5">{blocks}</div>;
}

const SAMPLE_QUESTIONS = [
  "Quali sono le mie spese principali?",
  "Quanto ho speso questo mese e qual è la media giornaliera?",
  "Quali sono le categorie in cui spendo di più?",
  "Consigli per ottimizzare il mio budget?",
];

export default function AiBetaPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = formatLocalDate(new Date());
    setStartDate(`${today.slice(0, 7)}-01`);
    setEndDate(today);
  }, []);

  // Auto-scroll in fondo quando arrivano nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const sendMessage = async (event?: FormEvent<HTMLFormElement>, customQuestion?: string) => {
    if (event) event.preventDefault();
    const content = (customQuestion || question).trim();
    if (!content || isSending) return;
    if (!startDate || !endDate || startDate > endDate) {
      setError("Seleziona un intervallo di date valido.");
      return;
    }

    setQuestion("");
    setError(null);
    setMessages((current) => [...current, { role: "user", content }]);
    setIsSending(true);

    try {
      const response = await apiFetch("/agents/analytics", {
        method: "POST",
        body: JSON.stringify({ question: content, startDate, endDate }),
      });
      const result = (await response.json()) as AnalyticsResponse;

      if (!response.ok) {
        throw new Error(result.error || "Non è stato possibile contattare l'agente.");
      }
      const analysis = result.analysis;
      if (!analysis) {
        throw new Error("L'agente ha restituito una risposta vuota.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: analysis },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Non riesco a raggiungere il server. Avvia flow-wise-server su http://localhost:5030 e verifica che CORS consenta l'origine del client."
          : requestError instanceof Error
            ? requestError.message
            : "Si è verificato un errore durante la richiesta."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      <Navbar />
      <main className="app-page max-w-5xl">
        <div className="app-page-header mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="page-title">AI Beta</h1>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 gap-1 text-xs">
                <Sparkles className="h-3 w-3" /> Assistente Spese
              </Badge>
            </div>
            <p className="page-description">
              Chiedi all&apos;agente AI di analizzare le tue spese, individuare trend e consigliarti come risparmiare.
            </p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Nuova conversazione
            </Button>
          )}
        </div>

        {/* Chat Container a dimensione fissa contenuta */}
        <section
          aria-label="Chat con assistente finanziario AI"
          className="surface-card mx-auto flex h-[calc(100dvh-14rem)] min-h-[500px] max-h-[760px] w-full flex-col overflow-hidden border border-border/80 shadow-sm rounded-2xl"
        >
          {/* Header e Filtro Periodo compatto */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 bg-muted/20 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-foreground">Analisi Spese AI</h2>
                <p className="text-[11px] text-muted-foreground">
                  Modello AI con riepilogo finanziario del periodo
                </p>
              </div>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-background border border-border/70 rounded-lg px-2 py-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Dal:</span>
                <Input
                  id="agent-start-date"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  disabled={isSending}
                  className="h-6 w-28 border-0 p-0 text-xs focus-visible:ring-0 bg-transparent"
                />
                <span className="text-muted-foreground ml-1">Al:</span>
                <Input
                  id="agent-end-date"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  disabled={isSending}
                  className="h-6 w-28 border-0 p-0 text-xs focus-visible:ring-0 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Area Messaggi con Scroll Contenuto */}
          <div
            aria-live="polite"
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center py-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <Bot className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">Cosa vuoi sapere sulle tue spese?</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seleziona una delle domande rapide qui sotto oppure scrivi la tua richiesta:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 w-full pt-2">
                  {SAMPLE_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => void sendMessage(undefined, q)}
                      disabled={isSending}
                      className="text-left text-xs p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/50 hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground"
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? "bg-primary text-primary-foreground rounded-br-xs"
                          : "border border-border/70 bg-card text-card-foreground rounded-bl-xs"
                      }`}
                    >
                      {isUser ? (
                        message.content
                      ) : (
                        <MarkdownContent content={message.content} />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-xs text-muted-foreground rounded-bl-xs flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                  L&apos;agente sta analizzando le tue spese...
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Invio Messaggio fisso in basso */}
          <form onSubmit={(e) => void sendMessage(e)} className="border-t border-border/70 bg-background/50 p-3 sm:p-4">
            <label htmlFor="agent-question" className="sr-only">
              Scrivi un messaggio
            </label>
            <div className="flex items-end gap-2">
              <Textarea
                id="agent-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scrivi una domanda sulle tue spese… (Invio per inviare, Shift+Invio per a capo)"
                maxLength={1000}
                rows={1}
                disabled={isSending}
                className="max-h-28 min-h-11 resize-none py-2.5 text-sm bg-background border-border/80 rounded-xl"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Invia messaggio"
                disabled={
                  isSending ||
                  !question.trim() ||
                  !startDate ||
                  !endDate ||
                  startDate > endDate
                }
                className="h-11 w-11 shrink-0 rounded-xl shadow-xs"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
