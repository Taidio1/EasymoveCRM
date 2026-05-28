export interface FieldMapping {
  page: number
  x: number
  y: number
  dataKey: string
  fontSize: number
  maxWidth?: number
}

export interface DocumentMapping {
  id: string
  name: string
  pdfPath: string
  fields: FieldMapping[]
}

export interface DocumentTemplate {
  id: string
  name: string
}
