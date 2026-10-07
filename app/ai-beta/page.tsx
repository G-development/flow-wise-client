"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Bot, Send } from "lucide-react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
        <code key={index} className="rounded bg-background/70 px-1 py-0.5 font-mono text-[0.9em]">
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
          className="overflow-x-auto rounded-md bg-background/70 p-3 font-mono text-xs"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push(
        <h3 key={`heading-${blocks.length}`} className="font-semibold">
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
          className={`space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}
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
          className="border-l-2 border-primary/40 pl-3 text-muted-foreground"
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
      <p key={`paragraph-${blocks.length}`}>
        {renderInlineMarkdown(paragraph.join(" "))}
      </p>
    );
  }

  return <div className="space-y-3">{blocks}</div>;
}

export default function AiBetaPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = formatLocalDate(new Date());
    setStartDate(`${today.slice(0, 7)}-01`);
    setEndDate(today);
  }, []);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = question.trim();
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
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <>
      <Navbar />
      <main className="app-page">
        <div className="app-page-header">
          <div>
            <h1 className="page-title">AI Beta</h1>
            <p className="page-description">
              Prova l&apos;agente AI e chiedigli di analizzare le tue spese.
            </p>
          </div>
        </div>

        <section
          aria-label="Chat di prova con l'agente"
          className="surface-card mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b p-4 sm:p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold">Agente spese</h2>
              <p className="text-sm text-muted-foreground">
                Le risposte sono generate dall&apos;AI e possono essere imprecise.
              </p>
            </div>
          </div>

          <div className="grid gap-3 border-b p-4 sm:grid-cols-2 sm:p-5">
            <div className="space-y-1.5">
              <label htmlFor="agent-start-date" className="text-sm font-medium">
                Dal
              </label>
              <Input
                id="agent-start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={isSending}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="agent-end-date" className="text-sm font-medium">
                Al
              </label>
              <Input
                id="agent-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                disabled={isSending}
              />
            </div>
          </div>

          <div
            aria-live="polite"
            className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6"
          >
            {messages.length === 0 && (
              <div className="m-auto max-w-md space-y-3 py-10 text-center">
                <Bot className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
                <p className="font-medium">Cosa vuoi sapere sulle tue spese?</p>
                <p className="text-sm text-muted-foreground">
                  Ad esempio: &ldquo;Quali sono le mie spese principali questo
                  mese?&rdquo;
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto border bg-muted"
                }`}
              >
                {message.role === "assistant" ? (
                  <MarkdownContent content={message.content} />
                ) : (
                  message.content
                )}
              </div>
            ))}

            {isSending && (
              <p className="mr-auto rounded-2xl border bg-muted px-4 py-3 text-sm text-muted-foreground">
                L&apos;agente sta rispondendo…
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <form onSubmit={sendMessage} className="space-y-2 border-t p-4 sm:p-5">
            <label htmlFor="agent-question" className="sr-only">
              Scrivi un messaggio
            </label>
            <div className="flex items-end gap-2">
              <Textarea
                id="agent-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scrivi una domanda sulle tue spese…"
                maxLength={1000}
                rows={2}
                disabled={isSending}
                className="max-h-36 min-h-12 resize-y"
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
                className="h-12 w-12 shrink-0"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Invio per spedire, Shift+Invio per andare a capo. Ogni messaggio
              è una richiesta indipendente per il periodo selezionato; la cronologia resta in questa pagina.
              Le spese selezionate vengono inviate al provider AI per l&apos;analisi.
            </p>
          </form>
        </section>
      </main>
    </>
  );
}
