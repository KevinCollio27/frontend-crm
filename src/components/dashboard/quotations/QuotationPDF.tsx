import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { generateQuotationCode } from '@/lib/quotation-utils';
import { ResolvedTemplateBlock, ParsedBlock, TextNode } from '@/types/pdfTemplate';
import { resolveFieldKey } from './shared/resolve-field-key';
import { getUnitLabel } from './shared/units';

// Función para formatear valores de Cargo (extraer solo el nombre)
const formatCargoValue = (value: any, labelType: string) => {
  // Si el valor es un objeto JSON string, parsearlo
  if (typeof value === 'string' && value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value);
      // Extraer el nombre según el tipo
      if (labelType === 'cargo_vessels' && parsed.vessel_name) {
        return parsed.vessel_ship_type
          ? `${parsed.vessel_name} (${parsed.vessel_ship_type})`
          : parsed.vessel_name;
      }
      if (labelType === 'cargo_addresses' && parsed.address_name) {
        return parsed.address_name;
      }
      if (labelType === 'cargo_routes' && parsed.route_name) {
        return parsed.route_name;
      }
      if (labelType === 'cargo_geofences' && parsed.geofence_name) {
        return parsed.geofence_name;
      }
    } catch (e) {
      // Si falla el parse, devolver el valor original
      return value;
    }
  }

  // Si es un objeto directo (no string)
  if (typeof value === 'object' && value !== null) {
    if (labelType === 'cargo_vessels' && value.vessel_name) {
      return value.vessel_ship_type
        ? `${value.vessel_name} (${value.vessel_ship_type})`
        : value.vessel_name;
    }
    if (labelType === 'cargo_addresses' && value.address_name) {
      return value.address_name;
    }
    if (labelType === 'cargo_routes' && value.route_name) {
      return value.route_name;
    }
    if (labelType === 'cargo_geofences' && value.geofence_name) {
      return value.geofence_name;
    }
  }

  return value;
};

// Estilos del PDF
const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: '2 solid #9ca3af',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 70,
    height: 'auto',
  },
  companyDetails: {
    flex: 1,
  },
  companyInfo: {
    fontSize: 7,
    color: '#4b5563',
    marginBottom: 1,
  },
  companyName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 3,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  quotationNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 3,
  },
  emissionDate: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 2,
  },
  // Sección de cliente
  clientSection: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 3,
    borderLeft: '3 solid #9ca3af',
  },
  clientTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  clientName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 3,
  },
  clientInfo: {
    fontSize: 8,
    color: '#4b5563',
    marginBottom: 2,
  },
  // Sección de servicios
  servicesSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    paddingBottom: 3,
  },
  // === NUEVO DISEÑO: Service Cards ===
  serviceCard: {
    marginBottom: 10,
    border: '1 solid #e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottom: '1 solid #e5e7eb',
  },
  serviceCardTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  serviceCardBadge: {
    fontSize: 7,
    color: '#6b7280',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  serviceCardBody: {
    flexDirection: 'row',
    padding: 10,
  },
  // Columna izquierda: Especificaciones técnicas (etiquetas dinámicas)
  specsColumn: {
    flex: 3,
    paddingRight: 10,
    borderRight: '1 solid #e5e7eb',
  },
  specsTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specItem: {
    width: '25%',
    marginBottom: 4,
  },
  specLabel: {
    fontSize: 7,
    color: '#6b7280',
  },
  specValue: {
    fontSize: 8,
    color: '#111827',
    fontWeight: 'bold',
  },
  // Columna derecha: Resumen financiero (columnas fijas)
  financialColumn: {
    flex: 1,
    paddingLeft: 10,
  },
  financialTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  financialLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  financialValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#111827',
  },
  financialTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTop: '1 solid #e5e7eb',
  },
  financialTotalLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#065f46',
  },
  financialTotalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#065f46',
  },
  // Resumen de totales
  totalsSection: {
    marginTop: 10,
    marginLeft: 'auto',
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#d1fae5',
    borderRadius: 3,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065f46',
  },
  grandTotalValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#065f46',
  },
  // Adicionales
  additionalsSection: {
    marginTop: 5,
    padding: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
  },
  additionalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  additionalLabel: {
    fontSize: 7,
    color: '#6b7280',
  },
  additionalValue: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  // Comentarios / Observaciones
  commentsSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 3,
    borderLeft: '3 solid #6b7280',
  },
  commentsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  commentsText: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 20,
    right: 20,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 7,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 5,
  },
  // Sin datos
  noData: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    paddingVertical: 10,
  },
  // Template blocks
  templateBlock: {
    marginBottom: 6,
  },
  templateBlockTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  templateParagraph: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.4,
    marginBottom: 3,
  },
  templateHeading: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  templateListItem: {
    flexDirection: 'row' as const,
    marginBottom: 2,
  },
  templateBullet: {
    fontSize: 8,
    color: '#374151',
    marginRight: 5,
    width: 10,
  },
  templateListText: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.4,
    flex: 1,
  },
});

// Renderizadores de bloques de template (deben vivir fuera del componente)
function renderTextNodes(nodes: TextNode[]): any {
  return nodes.map((node, i) => {
    const hasMark = node.bold || node.italic || node.underline;
    if (!hasMark) return node.text;
    const style: any = {};
    if (node.bold) style.fontWeight = 'bold';
    if (node.italic) style.fontStyle = 'italic';
    if (node.underline) style.textDecoration = 'underline';
    return <Text key={i} style={style}>{node.text}</Text>;
  });
}

function renderParsedBlock(block: ParsedBlock, i: number): any {
  switch (block.type) {
    case 'paragraph':
      return (
        <Text key={i} style={[styles.templateParagraph, block.textAlign ? { textAlign: block.textAlign } : {}]}>
          {renderTextNodes(block.children || [])}
        </Text>
      );
    case 'heading':
      return (
        <Text key={i} style={[styles.templateHeading, block.textAlign ? { textAlign: block.textAlign } : {}]}>
          {renderTextNodes(block.children || [])}
        </Text>
      );
    case 'bullet_list':
      return (
        <View key={i}>
          {(block.items || []).map((item, j) => (
            <View key={j} style={styles.templateListItem}>
              <Text style={styles.templateBullet}>•</Text>
              <Text style={styles.templateListText}>{renderTextNodes(item)}</Text>
            </View>
          ))}
        </View>
      );
    case 'ordered_list':
      return (
        <View key={i}>
          {(block.items || []).map((item, j) => (
            <View key={j} style={styles.templateListItem}>
              <Text style={styles.templateBullet}>{j + 1}.</Text>
              <Text style={styles.templateListText}>{renderTextNodes(item)}</Text>
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

function renderTemplateBlocks(blocks: ResolvedTemplateBlock[], position: 'before' | 'after'): any {
  return blocks
    .filter(b => b.position === position)
    .sort((a, b) => a.order - b.order)
    .map((block, i) => (
      <View key={i} style={styles.templateBlock} wrap={false}>
        {block.title && <Text style={styles.templateBlockTitle}>{block.title}</Text>}
        {block.parsedContent.map((node, j) => renderParsedBlock(node, j))}
      </View>
    ));
}

interface QuotationPDFProps {
  quotation: any;
  resolvedBlocks?: ResolvedTemplateBlock[];
}

// Datos por defecto de GOxT
const DEFAULT_COMPANY_INFO = {
  logo: '/images/goxt-negro.png',
  legal_name: 'GOXT SPA',
  tax_id: '77.956.037-6',
  industry: 'Transporte & Logistica',
  company_address: 'SANTA ELENA DE HUECHURABA 1399',
  company_phone: '+56 9 5936 4734',
  company_email: 'contacto@goxt.com',
  company_website: 'https://crm.goxt.io'
};

const QuotationPDF: React.FC<QuotationPDFProps> = ({ quotation, resolvedBlocks = [] }) => {
  // Obtener workspace desde la cotización
  const workspace = quotation?.opportunity?.workspace;

  // Función para obtener información de la empresa con fallback
  const getCompanyInfo = () => {
    // Si no hay workspace, usar datos por defecto
    if (!workspace) {
      return DEFAULT_COMPANY_INFO;
    }

    // Verificar si hay al menos un campo empresarial configurado
    const hasCompanyInfo = !!(workspace.legal_name || workspace.tax_id || workspace.company_address || workspace.company_phone || workspace.company_email);

    return {
      logo: workspace.logo || DEFAULT_COMPANY_INFO.logo,
      legal_name: hasCompanyInfo && workspace.legal_name ? workspace.legal_name : DEFAULT_COMPANY_INFO.legal_name,
      tax_id: hasCompanyInfo && workspace.tax_id ? workspace.tax_id : DEFAULT_COMPANY_INFO.tax_id,
      industry: hasCompanyInfo && workspace.industry ? workspace.industry : DEFAULT_COMPANY_INFO.industry,
      company_address: hasCompanyInfo && workspace.company_address ? workspace.company_address : DEFAULT_COMPANY_INFO.company_address,
      company_phone: hasCompanyInfo && workspace.company_phone ? workspace.company_phone : DEFAULT_COMPANY_INFO.company_phone,
      company_email: hasCompanyInfo && workspace.company_email ? workspace.company_email : DEFAULT_COMPANY_INFO.company_email,
      company_website: workspace.company_website || DEFAULT_COMPANY_INFO.company_website
    };
  };

  const companyInfo = getCompanyInfo();

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin fecha límite';
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  };

  // Obtener código de moneda de la cotización
  const currencyCode = quotation?.currency?.symbol || 'CLP';

  // Formatear moneda con símbolo
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL').format(value);
  };

  // Formatear moneda con código
  const formatCurrencyWithCode = (value: number) => {
    return `$${formatCurrency(value)} ${currencyCode}`;
  };

  // Agrupar servicios por índice
  const groupServicesByIndex = () => {
    if (!quotation?.quotation_fields) return [];

    const servicesByIndex: Record<number, any> = {};
    const labels = quotation?.product?.product_label ?? [];
    quotation.quotation_fields.forEach((field: any) => {
      const serviceIndex = field.service_index || 0;
      if (!servicesByIndex[serviceIndex]) {
        servicesByIndex[serviceIndex] = {
          rate: null,
          quantity: 1,
          discount: null,
          measurement_unit: 'unit'
        };
      }

      // Cotizaciones del frontend anterior guardan field_key = nombre de la etiqueta
      // (no su key) — se resuelve a la key canónica actual antes de todo lo demás.
      const resolvedKey = resolveFieldKey(field.field_key, labels);

      // Procesar field_value: si es JSON de Cargo, extraer solo el nombre
      let processedValue = field.field_value;

      const label = labels.find((l: any) => l.key === resolvedKey);
      if (label && label.type?.startsWith('cargo_')) {
        processedValue = formatCargoValue(field.field_value, label.type);
      }

      servicesByIndex[serviceIndex][resolvedKey] = processedValue;

      if (field.rate !== null && field.rate !== undefined) {
        servicesByIndex[serviceIndex].rate = parseFloat(field.rate);
      }
      if (field.quantity !== null && field.quantity !== undefined) {
        servicesByIndex[serviceIndex].quantity = field.quantity;
      }
      if (field.discount !== null && field.discount !== undefined) {
        servicesByIndex[serviceIndex].discount = field.discount;
      }
      if (field.measurement_unit) {
        servicesByIndex[serviceIndex].measurement_unit = field.measurement_unit;
      }
    });

    return Object.values(servicesByIndex);
  };

  // Obtener etiquetas del producto
  const getProductLabels = () => {
    if (!quotation?.product?.product_label) return [];

    return quotation.product.product_label
      .filter((label: any) => !label.is_conditional)
      .sort((a: any, b: any) => (a.order_number || 0) - (b.order_number || 0));
  };

  // Obtener label de unidad de medida
  const getMeasurementUnitLabel = (value: string) => {
    return value ? getUnitLabel(value) : 'Por Unidad';
  };

  // Función para truncar textos largos (ej: direcciones)
  const truncateText = (text: string, maxLength: number = 18) => {
    if (!text || typeof text !== 'string') return text;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const services = groupServicesByIndex();
  const labels = getProductLabels();

  // Formatear fecha de emisión (solo fecha, sin hora)
  const formatEmissionDate = () => {
    const now = new Date();
    return now.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obtener datos del cliente
  const person = quotation?.opportunity?.person;
  const organization = person?.organization;

  const clientName = person?.name || 'Sin información';
  const clientOrganization = organization?.name || 'Sin información';
  const clientRut = organization?.document_number || null;

  // Extraer email y phone de person_detail (sistema de labels)
  const personDetails = person?.person_detail || [];

  // Buscar email por formato (contiene @)
  const emailDetail = personDetails.find((d: any) =>
    d.value && typeof d.value === 'string' && d.value.includes('@')
  );

  // Buscar teléfono por formato (solo números, espacios, +, -)
  const phoneDetail = personDetails.find((d: any) =>
    d.value &&
    typeof d.value === 'string' &&
    /^[\d\s\-+()]+$/.test(d.value) &&
    d.value.length >= 8
  );

  const clientEmail = emailDetail?.value || null;
  const clientPhone = phoneDetail?.value || null;

  // Extraer dirección de organization_detail
  const orgDetails = organization?.organization_detail || [];

  // Buscar dirección (texto largo que no sea email ni teléfono)
  const addressDetail = orgDetails.find((d: any) =>
    d.value &&
    typeof d.value === 'string' &&
    d.value.length > 20 &&
    !d.value.includes('@') &&
    !/^[\d\s\-+()]+$/.test(d.value)
  );
  const clientAddress = addressDetail?.value || null;

  // Formatear valor para mostrar en especificaciones
  const formatSpecValue = (value: any, label: any) => {
    if (!value || value === '-') return '-';

    // Formatear según tipo
    if (label.type === 'currency' || label.type === 'money') {
      return `$${formatCurrency(parseFloat(value) || 0)}`;
    } else if (label.type === 'number') {
      return formatCurrency(parseFloat(value) || 0);
    }

    return String(value);
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header con logo y datos de la empresa */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Logo a la izquierda */}
            <View style={styles.logoContainer}>
              <Image
                src={companyInfo.logo}
                style={styles.logo}
              />
            </View>
            {/* Info de empresa al lado del logo */}
            <View style={styles.companyDetails}>
              <Text style={styles.companyName}>{companyInfo.legal_name}</Text>
              <Text style={styles.companyInfo}>Rut: {companyInfo.tax_id}</Text>
              <Text style={styles.companyInfo}>Industria: {companyInfo.industry}</Text>
              <Text style={styles.companyInfo}>Dirección: {companyInfo.company_address}</Text>
              <Text style={styles.companyInfo}>Tel: {companyInfo.company_phone} | Mail: {companyInfo.company_email}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quotationNumber}>N° Cotización: {generateQuotationCode(organization?.id, quotation?.id)}</Text>
            {/* {quotation?.sku && (
              <Text style={[styles.emissionDate, { fontWeight: 'bold', color: '#111827', fontSize: 8 }]}>
                SKU: {quotation.sku}
              </Text>
            )} */}
            <Text style={styles.emissionDate}>Fecha de Emisión: {formatEmissionDate()}</Text>
          </View>
        </View>

        {/* Bloques ANTES de la base */}
        {resolvedBlocks.length > 0 && renderTemplateBlocks(resolvedBlocks, 'before')}

        {/* Información del cliente */}
        <View style={styles.clientSection}>
          <Text style={styles.clientName}>Cliente: {clientOrganization}</Text>
          {clientRut && <Text style={styles.clientInfo}>Rut: {clientRut}</Text>}
          {clientAddress && <Text style={styles.clientInfo}>Dirección: {clientAddress}</Text>}
          <Text style={styles.clientInfo}>
            Contacto: {clientName}
            {clientEmail && ` | ${clientEmail}`}
            {clientPhone && ` | ${clientPhone}`}
          </Text>
        </View>

        {/* Servicios - NUEVO DISEÑO CON CARDS */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>
            Detalle de Servicios ({services.length} {services.length === 1 ? 'Item' : 'Items'})
          </Text>

          {services.length > 0 ? (
            services.map((service: any, index: number) => {
              const rate = service.rate || 0;
              const quantity = service.quantity || 1;
              const baseAmount = rate * quantity;
              const discount = service.discount || 0;
              const totalWithDiscount = Math.round(baseAmount - (baseAmount * discount / 100));

              return (
                <View key={index} style={styles.serviceCard} wrap={false}>
                  {/* Header del Card */}
                  <View style={styles.serviceCardHeader}>
                    <Text style={styles.serviceCardTitle}>
                      SERVICIO #{index + 1}
                    </Text>
                    <Text style={styles.serviceCardBadge}>
                      {getMeasurementUnitLabel(service.measurement_unit)}
                    </Text>
                  </View>

                  {/* Body del Card */}
                  <View style={styles.serviceCardBody}>
                    {/* Columna Izquierda: Especificaciones Técnicas */}
                    <View style={styles.specsColumn}>
                      <Text style={styles.specsTitle}>Especificaciones Técnicas</Text>
                      <View style={styles.specsGrid}>
                        {labels.map((label: any) => {
                          const value = service[label.key];
                          const displayValue = formatSpecValue(value, label);

                          return (
                            <View key={label.name} style={styles.specItem}>
                              <Text style={styles.specLabel}>{label.name}:</Text>
                              <Text style={styles.specValue}>{displayValue || '-'}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Columna Derecha: Resumen Financiero */}
                    <View style={styles.financialColumn}>
                      <Text style={styles.financialTitle}>Resumen Financiero</Text>

                      <View style={styles.financialRow}>
                        <Text style={styles.financialLabel}>Precio Unitario:</Text>
                        <Text style={styles.financialValue}>{formatCurrencyWithCode(rate)}</Text>
                      </View>

                      <View style={styles.financialRow}>
                        <Text style={styles.financialLabel}>Cantidad:</Text>
                        <Text style={styles.financialValue}>{quantity}</Text>
                      </View>

                      {quotation?.apply_discounts && discount > 0 && (
                        <View style={styles.financialRow}>
                          <Text style={[styles.financialLabel, { color: '#dc2626' }]}>Descuento:</Text>
                          <Text style={[styles.financialValue, { color: '#dc2626' }]}>-{discount}%</Text>
                        </View>
                      )}

                      <View style={styles.financialTotal}>
                        <Text style={styles.financialTotalLabel}>Total:</Text>
                        <Text style={styles.financialTotalValue}>{formatCurrencyWithCode(totalWithDiscount)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noData}>No hay servicios registrados</Text>
          )}
        </View>

        {/* Totales */}
        {services.length > 0 && (
          <View style={styles.totalsSection}>
            {/* Subtotal — comentado a pedido: para servicios mensuales cotizados a varios
                meses (ej. $20M/mes x 3), el subtotal multiplicado se ve inflado y genera
                fricción con el cliente aunque el precio real sea el mensual. Descomentar
                si en algún momento se vuelve a querer mostrar. */}
            {/* <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal Servicios:</Text>
              <Text style={styles.totalValue}>{formatCurrencyWithCode(quotation?.subtotal || 0)}</Text>
            </View> */}

            {/* Descuento global */}
            {quotation?.global_discount_value > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#dc2626' }]}>
                  Descuento Global ({quotation?.global_discount_type === 'percentage'
                    ? `${quotation?.global_discount_value}%`
                    : formatCurrencyWithCode(quotation?.global_discount_value)}):
                </Text>
                <Text style={[styles.totalValue, { color: '#dc2626' }]}>
                  -{formatCurrencyWithCode(quotation?.discount_amount || 0)}
                </Text>
              </View>
            )}

            {/* Servicios adicionales */}
            {quotation?.quotation_additionals?.length > 0 && (
              <View style={styles.additionalsSection}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: '#7c3aed', fontWeight: 'bold' }]}>
                    Servicios Adicionales ({quotation.quotation_additionals.length}):
                  </Text>
                  <Text style={[styles.totalValue, { color: '#7c3aed' }]}>
                    +{formatCurrencyWithCode(quotation?.additional_amount || 0)}
                  </Text>
                </View>
                {quotation.quotation_additionals.map((add: any, idx: number) => {
                  const breakdown = add.rate && add.quantity && add.quantity > 1
                    ? ` (${add.quantity} x ${formatCurrencyWithCode(add.rate)})`
                    : '';
                  return (
                    <View key={idx} style={styles.additionalItem}>
                      <Text style={styles.additionalLabel}>• {add.service_name}{breakdown}</Text>
                      <Text style={styles.additionalValue}>{formatCurrencyWithCode(add.amount)}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Total final — mismo motivo que el Subtotal de arriba: comentado, no
                borrado, para poder reactivarlo fácil si se decide mostrarlo de nuevo. */}
            {/* <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL FINAL:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrencyWithCode(quotation?.amount || 0)}</Text>
            </View> */}
          </View>
        )}

        {/* Comentarios / Observaciones */}
        {quotation?.description && (
          <View style={styles.commentsSection} wrap={false}>
            <Text style={styles.commentsTitle}>Comentarios / Observaciones</Text>
            <Text style={styles.commentsText}>{quotation.description}</Text>
          </View>
        )}

        {/* Bloques DESPUÉS de la base */}
        {resolvedBlocks.length > 0 && (
          <View style={{ marginTop: 15 }}>
            {renderTemplateBlocks(resolvedBlocks, 'after')}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Documento generado el {formatEmissionDate()} • {companyInfo.legal_name} • {companyInfo.company_website}
        </Text>
      </Page>
    </Document >
  );
};

export default QuotationPDF;
