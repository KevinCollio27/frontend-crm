import type { CampaignBlock } from "./blocks"

export type AudienceMode = "crm" | "custom"

export type CrmFilter = "all" | "recent" | "organization"

export type ContentMode = "blocks" | "html" | "text" | "template" | "ai"

export interface CustomRecipient {
  id: string
  name: string
  email: string
}

export interface CampaignFormState {
  name: string
  subject: string
  preheader: string
  audienceMode: AudienceMode
  crmFilter: CrmFilter
  crmFilterOrganization: string
  crmFilterOrganizationId: number | null
  selectedContactIds: number[]
  customRecipients: CustomRecipient[]
  contentMode: ContentMode
  blocks: CampaignBlock[]
  htmlContent: string
  textContent: string
  templateId: string
  aiPrompt: string
  aiTone: string
}

export function createEmptyCampaignForm(): CampaignFormState {
  return {
    name: "",
    subject: "",
    preheader: "",
    audienceMode: "crm",
    crmFilter: "all",
    crmFilterOrganization: "",
    crmFilterOrganizationId: null,
    selectedContactIds: [],
    customRecipients: [],
    contentMode: "blocks",
    blocks: [],
    htmlContent: "",
    textContent: "",
    templateId: "",
    aiPrompt: "",
    aiTone: "profesional",
  }
}
