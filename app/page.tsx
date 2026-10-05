import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Check,
  CreditCard,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "./flow-wise-logo.svg";

const features = [
  {
    icon: ChartNoAxesCombined,
    title: "Vedi il quadro, non solo i numeri",
    description:
      "Un riepilogo chiaro di entrate, uscite e saldo, con widget che puoi organizzare come vuoi.",
    number: "01",
  },
  {
    icon: Wallet,
    title: "Ogni euro al suo posto",
    description:
      "Tieni insieme portafogli, categorie e transazioni, senza fogli sparsi o calcoli a mano.",
    number: "02",
  },
  {
    icon: CreditCard,
    title: "Parti dai dati che hai già",
    description:
      "Importa le tue transazioni da CSV e ritrova la tua storia finanziaria in un solo posto.",
    number: "03",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f5ef] text-[#142c26]">
      <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Flow Wise home">
          <Image src={Logo} width={36} height={36} alt="" priority />
          <span className="text-lg font-semibold tracking-tight">flow wise</span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-sm font-medium text-[#41524d] transition-colors hover:text-[#142c26] sm:px-4"
          >
            Accedi
          </Link>
          <Button
            asChild
            className="h-10 rounded-full bg-[#153c32] px-4 text-white shadow-none hover:bg-[#205545] sm:px-5"
          >
            <Link href="/register">
              Inizia gratis <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <section className="relative mx-auto grid min-h-[690px] w-full max-w-[1440px] items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:min-h-[720px] lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:px-12 lg:pb-28 lg:pt-14">
        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-7 gap-2 rounded-full border border-[#c8ded3] bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[#23604b] shadow-sm hover:bg-white/70">
            <Sparkles className="h-3.5 w-3.5" />
            Gratis da usare, senza complicazioni
          </Badge>

          <h1 className="max-w-[760px] text-[clamp(3.5rem,8vw,7.25rem)] font-medium leading-[0.91] tracking-[-0.075em] text-[#142c26]">
            I tuoi soldi.
            <br />
            <span className="font-serif italic font-normal text-[#378369]">
              Più in chiaro.
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-7 text-[#53645d] sm:text-lg sm:leading-8">
            Entrate, spese e obiettivi in un unico posto. Flow Wise ti aiuta a
            capire dove va il tuo denaro — senza costarti nulla.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[#153c32] px-6 text-base text-white shadow-[0_12px_28px_-14px_rgba(21,60,50,0.75)] hover:bg-[#205545]"
            >
              <Link href="/register">
                Crea il tuo spazio gratuito
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <span className="px-2 text-sm text-[#687771]">
              Gratis oggi. Nessun abbonamento.
            </span>
          </div>

          <div className="mt-10 flex items-center gap-3 text-sm text-[#53645d]">
            <div className="flex -space-x-2" aria-hidden="true">
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f5f5ef] bg-[#d8e8d9] text-xs">€</span>
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f5f5ef] bg-[#f5dfbf] text-xs">↗</span>
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f5f5ef] bg-[#d9e6e2] text-xs">✓</span>
            </div>
            <span>Un modo più sereno di gestire il quotidiano.</span>
          </div>
        </div>

        <div className="relative mx-auto flex min-h-[420px] w-full max-w-[680px] items-center justify-center sm:min-h-[540px] lg:min-h-[620px]">
          <div
            aria-hidden="true"
            className="absolute left-[8%] top-[4%] h-[82%] w-[82%] rounded-full border border-[#cad9cf] sm:left-[9%] sm:top-[2%]"
          />
          <div
            aria-hidden="true"
            className="absolute left-[17%] top-[13%] h-[64%] w-[64%] rounded-full border border-dashed border-[#d0ddd4]"
          />
          <div className="absolute right-[6%] top-[8%] rotate-[-9deg] rounded-full bg-[#e8b46d] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#3b2d1b] shadow-md sm:right-[2%] sm:top-[10%]">
            Il tuo denaro, in movimento
          </div>

          <Card className="relative z-10 w-[min(100%,430px)] rotate-[-3deg] overflow-hidden rounded-[1.6rem] border-[#dbe3dc] bg-white shadow-[0_35px_90px_-45px_rgba(22,52,42,0.42)] transition-transform duration-500 hover:rotate-0">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-[#edf0ec] px-5 py-4 sm:px-7 sm:py-5">
                <div className="flex items-center gap-2">
                  <Image src={Logo} width={27} height={27} alt="" />
                  <span className="text-sm font-semibold tracking-tight">flow wise</span>
                </div>
                <span className="rounded-full bg-[#edf5ef] px-3 py-1 text-[11px] font-medium text-[#34715a]">
                  ANTEPRIMA
                </span>
              </div>

              <div className="space-y-5 p-5 sm:space-y-6 sm:p-7">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.13em] text-[#7d8981]">
                    Disponibile questo mese
                  </p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-4xl font-medium tracking-[-0.06em] text-[#182f28] sm:text-5xl">
                      €2.840
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#378369]">
                      <ArrowUpRight className="h-3.5 w-3.5" /> 12,8%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#eef6ef] p-3.5 sm:p-4">
                    <div className="flex items-center justify-between text-[#438262]">
                      <span className="text-xs font-medium">Entrate</span>
                      <ArrowDownLeft className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-xl font-semibold tracking-tight text-[#244f3d] sm:text-2xl">
                      €3.250
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fbf1e8] p-3.5 sm:p-4">
                    <div className="flex items-center justify-between text-[#b56c43]">
                      <span className="text-xs font-medium">Uscite</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-xl font-semibold tracking-tight text-[#75452e] sm:text-2xl">
                      €410
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#edf0ec] p-4 sm:p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#263b33]">Il tuo ritmo</p>
                      <p className="mt-1 text-xs text-[#87928b]">Entrate e uscite · esempio</p>
                    </div>
                    <span className="rounded-full bg-[#f3f4ef] px-2.5 py-1 text-[10px] text-[#738078]">ULTIMI 7 GIORNI</span>
                  </div>
                  <div className="flex h-[102px] items-end gap-2 sm:gap-3" aria-label="Grafico illustrativo di entrate e uscite">
                    {[42, 66, 50, 84, 59, 92, 72].map((height, index) => (
                      <div key={index} className="flex h-full flex-1 items-end gap-1">
                        <span className="w-1/2 rounded-t-full bg-[#4f9b78]" style={{ height: `${height}%` }} />
                        <span className="w-1/2 rounded-t-full bg-[#e5b980]" style={{ height: `${Math.max(18, height * 0.48)}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-[10px] text-[#9aa39c]">
                    <span>LUN</span><span>MAR</span><span>MER</span><span>GIO</span><span>VEN</span><span>SAB</span><span>DOM</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#f7f8f4] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm">☕</span>
                    <div>
                      <p className="text-xs font-semibold text-[#33463e]">Piccole spese</p>
                      <p className="text-[11px] text-[#929b95]">Oggi · Quotidiano</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#a35f43]">− €4,50</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="absolute bottom-[8%] left-[0%] z-20 flex -rotate-6 items-center gap-3 rounded-2xl border border-[#e7e8dd] bg-[#fffef9] px-4 py-3 shadow-[0_16px_35px_-20px_rgba(22,52,42,0.5)] sm:bottom-[9%] sm:left-[-1%]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eaf4eb] text-[#438262]">
              <Check className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-[#263b33]">Tutto sotto controllo</p>
              <p className="mt-0.5 text-[11px] text-[#7d8981]">Un passo alla volta.</p>
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-[38%] h-56 w-56 rounded-full bg-[#dce9d9] blur-3xl" />
      </section>

      <section className="relative bg-[#173e33] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9fd2b6]">
              Finalmente, semplice
            </p>
            <h2 className="mt-4 max-w-sm text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-4xl">
              La chiarezza finanziaria non dovrebbe avere un prezzo.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#c3d6cd]">
              Per questo Flow Wise è gratuito. Uno spazio pratico per prendere
              decisioni migliori, con i tuoi tempi.
            </p>
            <Button
              asChild
              variant="secondary"
              className="mt-7 h-11 rounded-full bg-[#d6f0dc] px-5 font-semibold text-[#173e33] hover:bg-white"
            >
              <Link href="/register">
                Provalo gratuitamente <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description, number }) => (
              <Card key={number} className="rounded-2xl border-white/15 bg-white/[0.06] text-white shadow-none backdrop-blur-sm">
                <CardContent className="flex h-full flex-col p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6f0dc]/10 text-[#b6e2c1]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-[#8bb4a0]">{number}</span>
                  </div>
                  <h3 className="mt-8 text-lg font-semibold leading-snug">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#c3d6cd]">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#f5f5ef] px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 text-xs text-[#69766f] sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-[#263b33]">
            <Image src={Logo} width={24} height={24} alt="" />
            flow wise
          </Link>
          <p>Gestisci il presente. Guarda avanti.</p>
          <Link href="/privacy" className="underline decoration-[#aebbb2] underline-offset-4 hover:text-[#153c32]">
            Privacy &amp; termini
          </Link>
        </div>
      </footer>
    </main>
  );
}
