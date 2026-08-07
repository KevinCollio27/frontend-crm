export interface FileReport {
  id: number
  user_id: number
  file_path: string
  file_name: string
  file_type: string
  status: "Pendiente" | "Generado" | "Error"
  error: string
  created_at: string
  updated_at: string
}
