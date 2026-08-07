import type { SignalType } from "./mock-data"

// Tipos de la API real (opportunity_suggestion) — paso 11 del plan. Reusa
// SignalType/SIGNAL_CONFIG/Priority/PRIORITY_CONFIG de mock-data.ts (son
// config de UI, no datos de ejemplo). Ver SugerenciasIA_Plan.md.

export interface RealEmailDraft {
  to: string | null
  subject: string
  body: string
  signatureName: string
  signatureEmail: string
  from: string
}

export interface RealCalendarDraft {
  title: string
  date: string
  time: string
  duration: string
  attendee: string | null
  description: string
}

export interface PendingActivityItem {
  id: number
  title: string
  dueDate: string
  overdueDays: number
}

export interface FormSubmissionField {
  label: string
  value: string
}

export interface FormSubmissionInfo {
  formName: string
  submittedAt: string
  fields: FormSubmissionField[]
}

export type SuggestionAction =
  | { actionType: "email"; suggestionId: number; suggestedActionLabel: string; draft: RealEmailDraft; userContext: string | null }
  | { actionType: "calendar_event"; suggestionId: number; suggestedActionLabel: string; draft: RealCalendarDraft; userContext: string | null }
  | { actionType: "status_action"; suggestionId: number; suggestedActionLabel: string; recommendation: "Ganada" | "Perdida" }
  | { actionType: "activity_task"; suggestionId: number; suggestedActionLabel: string; activities: PendingActivityItem[] }

export interface SuggestionGroup {
  id: string
  opportunityId: number
  opportunityName: string
  organizationName: string | null
  contactName: string | null
  stageName: string | null
  stageOrder: number | null
  stageTotal: number | null
  signal: SignalType
  priority: "Alta" | "Media" | "Baja"
  daysAgo: number
  amount: string | null
  responsible: string
  createdDaysAgo: number
  signalDetail: string
  timeline: { date: string; label: string }[]
  reason: string
  formSubmission: FormSubmissionInfo | null
  actions: SuggestionAction[]
}
