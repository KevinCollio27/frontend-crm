export type FollowUpAlert = "critical" | "at_risk" | "on_track"
export type ResponsibleRole = "owner" | "admin" | "member"

export interface FollowUpOpportunityRaw {
  id: number
  name: string
  lastActivity: string
  daysSinceContact: number
  alert: FollowUpAlert
  organizationName: string | null
  responsible: { name: string; avatarUrl: string | null; role: ResponsibleRole } | null
  stageOrder: number | null
  stageTotal: number
}

export interface FollowUpPage {
  data: FollowUpOpportunityRaw[]
  total: number
}
