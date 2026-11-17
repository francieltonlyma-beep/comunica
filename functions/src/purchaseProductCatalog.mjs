import { normalizeSearch } from './procurement.mjs';
const clean = (value, limit) => String(value ?? '').trim().slice(0,limit);
export function catalogProductFields(data) {
  const record = {code:clean(data.code,80),name:clean(data.name,160),unit:clean(data.unit,30) || (/\bkg\s*$/i.test(data.name || '') ? 'kg' : 'un'),category:clean(data.category,80) || 'Outros',specification:clean(data.specification,1000)};
  if (!record.name) throw new Error('Informe o nome do produto.');
  if (data.brand !== undefined) record.brand=clean(data.brand,160);
  if (data.suggestedSupplierIds !== undefined) {
    if (!Array.isArray(data.suggestedSupplierIds) || data.suggestedSupplierIds.length>30 || data.suggestedSupplierIds.some(id=>typeof id!=='string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id))) throw new Error('Selecione até 30 fornecedores cadastrados.');
    record.suggestedSupplierIds=[...new Set(data.suggestedSupplierIds)];
  }
  return record;
}
export function findCatalogProduct(products, value) {
  const exact=products.find(p=>p.id===value || p.code && normalizeSearch(p.code)===normalizeSearch(value));
  if (exact) return exact;
  const named=products.filter(p=>normalizeSearch(p.name)===normalizeSearch(value));
  return named.length===1 ? named[0] : undefined;
}
export function catalogProductSelection(product) {
  return {item:product.name,unit:product.unit || 'un',category:product.category || 'Outros',specification:[product.specification || product.name,product.code && `Código: ${product.code}`,product.brand && `Marca: ${product.brand}`].filter(Boolean).join(' · ').slice(0,1000)};
}
export function catalogProductForRequest(products, request) {
  const code=String(request.specification || '').match(/(?:^| · )Código: ([^·]+)/)?.[1]?.trim();
  return code ? products.find(p=>p.code===code) : findCatalogProduct(products,request.item);
}
