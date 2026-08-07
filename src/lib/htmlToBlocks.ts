import { ParsedBlock, TextNode } from '@/types/pdfTemplate';

function parseInlineNodes(node: ChildNode, marks: { bold?: boolean; italic?: boolean; underline?: boolean } = {}): TextNode[] {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        return text ? [{ type: 'text', text, ...marks }] : [];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const newMarks = { ...marks };
    if (tag === 'strong' || tag === 'b') newMarks.bold = true;
    if (tag === 'em' || tag === 'i') newMarks.italic = true;
    if (tag === 'u') newMarks.underline = true;

    return Array.from(el.childNodes).flatMap(child => parseInlineNodes(child, newMarks));
}

function parseListItemInline(li: Element): TextNode[] {
    // TipTap wraps li content in <p> — unwrap it
    const inner = li.querySelector('p') || li;
    return parseInlineNodes(inner);
}

function parseBlockNode(node: ChildNode): ParsedBlock | null {
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (tag === 'p') {
        const children = parseInlineNodes(el);
        if (children.length === 0) return null;
        const textAlign = (el as HTMLElement).style?.textAlign as 'left' | 'center' | 'right' | 'justify' | undefined;
        return { type: 'paragraph', children, ...(textAlign ? { textAlign } : {}) };
    }
    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
        const textAlign = (el as HTMLElement).style?.textAlign as 'left' | 'center' | 'right' | 'justify' | undefined;
        return { type: 'heading', level: parseInt(tag[1]), children: parseInlineNodes(el), ...(textAlign ? { textAlign } : {}) };
    }
    if (tag === 'ul') {
        const items = Array.from(el.querySelectorAll(':scope > li')).map(parseListItemInline);
        return { type: 'bullet_list', items };
    }
    if (tag === 'ol') {
        const items = Array.from(el.querySelectorAll(':scope > li')).map(parseListItemInline);
        return { type: 'ordered_list', items };
    }
    return null;
}

/**
 * Parsea HTML (output de TipTap) a una estructura de bloques para react-pdf.
 * Debe llamarse en el hilo principal (antes de invocar pdf()), no dentro de un componente react-pdf.
 */
export function parseHtmlToBlocks(html: string): ParsedBlock[] {
    if (typeof window === 'undefined' || !html?.trim()) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return Array.from(doc.body.childNodes)
        .map(parseBlockNode)
        .filter((b): b is ParsedBlock => b !== null);
}

/**
 * Reemplaza variables {{variable}} en el HTML con los valores reales de la cotización.
 */
export function resolveTemplateVariables(html: string, quotation: any): string {
    const contact = quotation?.opportunity?.person;
    const org = contact?.organization;
    const sender = quotation?.created_user;
    const workspace = quotation?.opportunity?.workspace;

    const variables: Record<string, string> = {
        'contact.name': contact?.name || '',
        'contact.first_name': contact?.name?.split(' ')[0] || '',
        'organization.name': org?.name || '',
        'quotation.code': quotation?.id ? String(quotation.id).padStart(4, '0') : '',
        'quotation.total': quotation?.amount ? formatCurrency(quotation.amount, quotation?.currency?.symbol) : '',
        'quotation.valid_until': quotation?.valid_until ? formatDate(quotation.valid_until) : '',
        'sender.name': sender?.name || '',
        'workspace.name': workspace?.trade_name || workspace?.legal_name || '',
        'date': new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }),
    };

    return html.replace(/\{\{([^}]+)\}\}/g, (match, key) => variables[key.trim()] ?? match);
}

function formatCurrency(amount: number, currencyCode?: string): string {
    const formatted = new Intl.NumberFormat('es-CL').format(Math.round(amount));
    return `$${formatted} ${currencyCode || 'CLP'}`;
}

function formatDate(date: string | Date): string {
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getUTCFullYear()}`;
}
