export interface FileOpportunityRaw {
  id:             number
  opportunity_id: number
  name:           string
  file_path:      string
  file_name:      string
  created_at:     string
  updated_at:     string
}

export interface FileOpportunityPage {
  data:        FileOpportunityRaw[]
  total:       number
  totalPages:  number
  page:        number
  pageSize:    number
  nextPage:    number | null
  prevPage:    number | null
}
