"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ChevronLeft, ArrowRight, Plus, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { addClient, type Client } from "@/lib/superbase"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-is-mobile"
import type { ReactNode } from "react"

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  Name:           z.string().min(2, "Imię i nazwisko musi mieć co najmniej 2 znaki."),
  Email:          z.string().optional(),
  Phone:          z.string().optional(),
  KrajPoch:       z.string().optional(),
  Status:         z.string().min(1, "Status jest wymagany."),
  DataZloWnio:    z.string().optional(),
  Birthday:       z.string().optional(),
  CelPobytu:      z.string().optional(),
  PodLegPob:      z.string().optional(),
  Notes:          z.string().optional(),
  FormWni:        z.boolean().default(false),
  ZalNrJed:       z.boolean().default(false),
  KopiaPasz:      z.boolean().default(false),
  ZalBlue:        z.boolean().default(false),
  CzteZdjecia:    z.boolean().default(false),
  Pelnomocnictwo: z.boolean().default(false),
})

type WizardValues = z.infer<typeof schema>

// ─── Constants ───────────────────────────────────────────────────────────────

const STEP_LABELS = ["Dane kontaktowe", "Szczegóły sprawy", "Notatki i dokumenty"] as const

const CHECKBOXES: {
  field: keyof Pick<WizardValues, "FormWni" | "ZalNrJed" | "KopiaPasz" | "ZalBlue" | "CzteZdjecia" | "Pelnomocnictwo">
  label: string
}[] = [
  { field: "FormWni",        label: "Formularz wniosku" },
  { field: "ZalNrJed",       label: "Załącznik nr 1"    },
  { field: "KopiaPasz",      label: "Kopia paszportu"   },
  { field: "ZalBlue",        label: "Niebieska karta"   },
  { field: "CzteZdjecia",    label: "4 zdjęcia"         },
  { field: "Pelnomocnictwo", label: "Pełnomocnictwo"    },
]

const DEFAULT_VALUES: WizardValues = {
  Name: "", Email: "", Phone: "", KrajPoch: "",
  Status: "W trakcie", DataZloWnio: "", Birthday: "",
  CelPobytu: "", PodLegPob: "", Notes: "",
  FormWni: false, ZalNrJed: false, KopiaPasz: false,
  ZalBlue: false, CzteZdjecia: false, Pelnomocnictwo: false,
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AddClientWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientCreated?: () => void
}

// ─── Static JSX (defined outside component to avoid re-creation) ─────────────

const chevronSvg = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─── Component ───────────────────────────────────────────────────────────────

export function AddClientWizard({ open, onOpenChange, onClientCreated }: AddClientWizardProps) {
  const [step, setStep]               = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSmallMobile                 = useIsMobile(560)
  const isXSmall                      = useIsMobile(380)
  const { user }                      = useAuth()

  const { register, watch, setValue, handleSubmit, reset, formState: { errors } } = useForm<WizardValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  // ── Close / reset ──────────────────────────────────────────────────────────
  const handleClose = () => {
    reset(DEFAULT_VALUES)
    setStep(0)
    onOpenChange(false)
  }

  // ── Escape key ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values: WizardValues) => {
    setIsSubmitting(true)
    try {
      const clientData: Omit<Client, "id" | "created_at"> = {
        Name:             values.Name,
        Status:           values.Status,
        Email:            values.Email        || null,
        Phone:            values.Phone        || null,
        KrajPoch:         values.KrajPoch     || null,
        DataZloWnio:      values.DataZloWnio  ? new Date(values.DataZloWnio).toISOString() : null,
        Birthday:         values.Birthday     || null,
        CelPobytu:        values.CelPobytu    || null,
        PodLegPob:        values.PodLegPob    || null,
        Notes:            values.Notes        || null,
        Creator:          user?.email         || null,
        FormWni:          values.FormWni,
        ZalNrJed:         values.ZalNrJed,
        KopiaPasz:        values.KopiaPasz,
        ZalBlue:          values.ZalBlue,
        CzteZdjecia:      values.CzteZdjecia,
        Pelnomocnictwo:   values.Pelnomocnictwo,
        // Fields not collected in wizard — set to null/defaults
        Adres:            null,
        StatusPla:        null,
        CreatedDate:      new Date().toISOString(),
        TotalSpend:       "0",
        Doc:              null,
        NumerSprawy:      null,
        Inspektor:        null,
        DataWydWni:       null,
        DataOdbKartyPob:  null,
        DataOdbDecyzji:   null,
        DataZakLegPob:    null,
        Firma:            null,
        country_id:       null,
        country_name:     null,
      }
      await addClient(clientData)
      toast({ title: "Klient dodany", description: `${values.Name} został dodany do systemu.` })
      onClientCreated?.()
      handleClose()
    } catch {
      toast({ title: "Błąd", description: "Nie udało się dodać klienta.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  // ── Shared class helpers ───────────────────────────────────────────────────
  const inputCls  = "w-full h-10 px-3 rounded-lg border border-border bg-bg text-text text-[13.5px] outline-none focus:ring-2 focus:ring-brand-soft focus:border-brand transition-colors"
  const selectCls = cn(inputCls, "cursor-pointer appearance-none")
  const labelCls  = "block text-[11.5px] font-medium text-text-dim mb-[7px] tracking-[0.01em]"
  const grid2     = cn("grid gap-3", isSmallMobile ? "grid-cols-1" : "grid-cols-2")
  const padCls    = isSmallMobile ? "px-5 pt-5 pb-3" : "px-7 pt-6 pb-3"

  const SelectWrap = ({ children }: { children: ReactNode }) => (
    <div className="relative">
      {children}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-mute">
        {chevronSvg}
      </div>
    </div>
  )

  // ── Step panels ────────────────────────────────────────────────────────────
  const steps = [

    /* Step 1 — Dane kontaktowe */
    <div key={0} className={cn("flex flex-col gap-[15px]", padCls)}>
      <div>
        <label className={labelCls}>Imię i nazwisko <span className="text-danger">*</span></label>
        <input
          {...register("Name")}
          placeholder="Jan Kowalski"
          className={cn(inputCls, "ring-2 ring-brand-soft border-brand")}
          autoFocus
        />
        {errors.Name && (
          <p className="text-[11px] text-danger mt-1">{errors.Name.message}</p>
        )}
      </div>
      <div className={grid2}>
        <div>
          <label className={labelCls}>Email</label>
          <input {...register("Email")} type="email" placeholder="jan@example.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Telefon</label>
          <input {...register("Phone")} placeholder="+48 123 456 789" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Kraj pochodzenia</label>
        <input {...register("KrajPoch")} placeholder="np. Ukraina" className={inputCls} />
      </div>
    </div>,

    /* Step 2 — Szczegóły sprawy */
    <div key={1} className={cn("flex flex-col gap-[15px]", padCls)}>
      <div>
        <label className={labelCls}>Status <span className="text-danger">*</span></label>
        <SelectWrap>
          <select {...register("Status")} className={selectCls}>
            <option value="W trakcie">W trakcie</option>
            <option value="Oczekiwanie">Oczekiwanie</option>
            <option value="Analiza">Analiza</option>
            <option value="Pilne">Pilne</option>
            <option value="Zakończona">Zakończona</option>
          </select>
        </SelectWrap>
      </div>
      <div className={grid2}>
        <div>
          <label className={labelCls}>Data złożenia wniosku <span className="text-danger">*</span></label>
          <input {...register("DataZloWnio")} type="date" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data urodzenia</label>
          <input {...register("Birthday")} type="date" className={inputCls} />
        </div>
      </div>
      <div className={grid2}>
        <div>
          <label className={labelCls}>Cel pobytu</label>
          <SelectWrap>
            <select {...register("CelPobytu")} className={selectCls}>
              <option value="">Wybierz cel pobytu</option>
              <option value="praca">Praca</option>
              <option value="nauka">Nauka</option>
              <option value="rodzina">Rodzina</option>
              <option value="turystyka">Turystyka</option>
              <option value="inne">Inne</option>
            </select>
          </SelectWrap>
        </div>
        <div>
          <label className={labelCls}>Podstawa legalnego pobytu</label>
          <SelectWrap>
            <select {...register("PodLegPob")} className={selectCls}>
              <option value="">Wybierz podstawę</option>
              <option value="pobyt_czasowy">Pobyt czasowy</option>
              <option value="pobyt_staly">Pobyt stały</option>
              <option value="wiza">Wiza krajowa</option>
              <option value="bezwizowy">Ruch bezwizowy</option>
              <option value="karta">Karta pobytu</option>
            </select>
          </SelectWrap>
        </div>
      </div>
    </div>,

    /* Step 3 — Notatki i dokumenty */
    <div key={2} className={cn("flex flex-col gap-[15px]", padCls)}>
      <div>
        <label className={labelCls}>Notatki</label>
        <textarea
          {...register("Notes")}
          rows={3}
          placeholder="Dodatkowe informacje o kliencie..."
          className={cn(inputCls, "h-auto py-2.5 resize-none leading-[1.55]")}
        />
      </div>
      <div>
        <label className={labelCls}>Dodaj pliki</label>
        <button
          type="button"
          className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border text-text-dim text-[12.5px] hover:border-brand hover:text-brand transition-colors"
        >
          <Plus size={13} /> Dodaj dokument
        </button>
      </div>
      <div>
        <label className={labelCls}>Dokumenty do zgromadzenia</label>
        <div className={cn("grid gap-[9px]", isSmallMobile ? "grid-cols-1" : "grid-cols-2")}>
          {CHECKBOXES.map(({ field, label }) => {
            const checked = watch(field) as boolean
            return (
              <label
                key={field}
                className="flex items-center gap-[9px] cursor-pointer text-[13px] text-text select-none"
              >
                <button
                  type="button"
                  onClick={() => setValue(field, !checked)}
                  className={cn(
                    "w-[17px] h-[17px] rounded-[4px] flex-shrink-0 border-[1.5px] flex items-center justify-center transition-all",
                    checked
                      ? "bg-brand border-brand"
                      : "bg-transparent border-border hover:border-brand"
                  )}
                  aria-checked={checked}
                  role="checkbox"
                >
                  {checked && <Check size={9} strokeWidth={2.5} className="text-white" />}
                </button>
                {label}
              </label>
            )
          })}
        </div>
      </div>
    </div>,
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      className={cn(
        "fixed inset-0 z-[300] bg-black/65 backdrop-blur-sm flex",
        isSmallMobile ? "items-end justify-center" : "items-center justify-center p-5"
      )}
    >
      <div className={cn(
        "bg-surface-raised border border-border-strong flex flex-col overflow-hidden w-full",
        "shadow-[0_32px_80px_rgba(0,0,0,0.55)]",
        isSmallMobile
          ? "rounded-t-[18px] max-h-[94svh]"
          : "max-w-[540px] rounded-2xl"
      )}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className={cn(
          "border-b border-border flex-shrink-0",
          isSmallMobile ? "px-5 pt-[18px] pb-4" : "px-7 pt-5 pb-4"
        )}>
          {/* Title row */}
          <div className="flex items-start justify-between mb-[18px]">
            <div>
              <h2 className="m-0 text-[17px] font-semibold tracking-[-0.01em] text-text">
                Dodaj nowego klienta
              </h2>
              <p className="m-0 mt-1 text-xs text-text-dim">
                Krok {step + 1} z 3 — {STEP_LABELS[step]}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-[7px] border border-border flex items-center justify-center text-text-dim hover:text-text transition-colors flex-shrink-0"
              aria-label="Zamknij"
            >
              <X size={14} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="relative">
            {/* Progress track */}
            <div className="absolute top-3 left-[13px] right-[13px] h-0.5 bg-border rounded-full z-0">
              <div
                className="h-full bg-brand rounded-full transition-[width] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
            {/* Dots + labels */}
            <div className="flex justify-between relative z-[1]">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="flex flex-col items-center gap-[7px]">
                  <div className={cn(
                    "w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center",
                    "text-[11px] font-bold font-mono transition-all duration-300",
                    i < step   ? "bg-brand border-brand text-white"           :
                    i === step ? "bg-surface-raised border-brand text-brand"  :
                                 "bg-surface-raised border-border text-text-mute"
                  )}>
                    {i < step
                      ? <Check size={10} strokeWidth={2.5} />
                      : (i + 1)
                    }
                  </div>
                  <span className={cn(
                    "text-[10px] whitespace-nowrap text-center",
                    isXSmall ? "hidden" : "block",
                    i === step ? "font-semibold text-text" :
                    i < step   ? "text-text"               :
                                 "text-text-mute"
                  )}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sliding content ───────────────────────────────────────────────── */}
        <div className="overflow-hidden flex-shrink-0">
          <div
            className="flex transition-transform duration-[360ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: "300%", transform: `translateX(-${(step / 3) * 100}%)` }}
          >
            {steps.map((content, i) => (
              <div key={i} style={{ width: "33.333%" }} className="flex-shrink-0">
                {content}
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className={cn(
          "border-t border-border flex justify-between items-center flex-shrink-0",
          isSmallMobile
            ? "px-5 pt-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))]"
            : "px-7 py-4"
        )}>
          {/* Back / Cancel */}
          <button
            type="button"
            onClick={() => step > 0 ? setStep(s => s - 1) : handleClose()}
            className="h-9 px-4 rounded-lg border border-border text-[13px] font-medium text-text hover:bg-surface-hover transition-colors inline-flex items-center gap-1"
          >
            {step === 0
              ? "Anuluj"
              : <><ChevronLeft size={13} /> Wstecz</>
            }
          </button>

          <div className="flex items-center gap-3">
            {/* Pill dots */}
            <div className="flex gap-1 items-center">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-[6px] rounded-full transition-[width,background-color] duration-300",
                    i === step ? "w-[18px] bg-brand"       :
                    i < step   ? "w-[6px] bg-brand-hover"  :
                                 "w-[6px] bg-border"
                  )}
                />
              ))}
            </div>

            {/* Next / Submit */}
            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="h-9 px-4 rounded-btn bg-brand text-white text-[13px] font-medium hover:bg-brand-deep transition-colors inline-flex items-center gap-1.5"
              >
                Dalej <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="h-9 px-4 rounded-btn bg-brand text-white text-[13px] font-medium hover:bg-brand-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Dodawanie…" : "Dodaj klienta"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
