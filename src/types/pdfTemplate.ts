export interface PdfTemplateBlock {
  id: number;
  template_id: number;
  title: string;
  content: string; // HTML
  position: 'before' | 'after';
  order: number;
}

export interface PdfTemplate {
  id: number;
  workspace_id: number;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  blocks: PdfTemplateBlock[];
}

// Versión de bloque para el editor (sin id, para nuevos bloques)
export interface PdfTemplateBlockDraft {
  id?: number;
  title: string;
  content: string;
  position: 'before' | 'after';
  order: number;
}

export interface PdfTemplateDraft {
  name: string;
  is_default: boolean;
  blocks: PdfTemplateBlockDraft[];
}

// Nodos parseados para react-pdf (resultado de parsear el HTML)
export interface TextNode {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export type BlockNodeType = 'paragraph' | 'heading' | 'bullet_list' | 'ordered_list';

export interface ParsedBlock {
  type: BlockNodeType;
  children?: TextNode[];
  items?: TextNode[][];
  level?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

// Bloque resuelto listo para pasar a QuotationPDF
export interface ResolvedTemplateBlock {
  title: string;
  position: 'before' | 'after';
  order: number;
  parsedContent: ParsedBlock[];
}
