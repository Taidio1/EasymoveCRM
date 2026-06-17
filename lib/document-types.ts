export interface FieldMapping {
  page: number
  x: number
  y: number
  dataKey: string
  fontSize: number
  maxWidth?: number
  type?: "text" | "grid"
  boxWidth?: number
  maxCharsPerRow?: number
  rowHeight?: number
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

export interface DocumentTemplateInput {
  id: string
  name: string
  pdfPath: string
}

export interface DocumentFieldDefinition {
  id: string
  label: string
  dataKey: string
  category?: string
  description?: string
  transform?: string
  createdAt?: string
  updatedAt?: string
}

export interface DocumentFieldDefinitionInput {
  label: string
  dataKey: string
  category?: string
  description?: string
  transform?: string
}

export interface FieldOverride {
  value: string
  x?: number
  y?: number
  fontSize?: number
}
