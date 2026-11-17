import { useState } from 'react';
import PurchaseSelect from './PurchaseSelect.jsx';
import { filterPurchaseOrders, purchaseOrderHTML } from './purchaseOrderExport.js';
export default function PurchaseOrderExport({records,companyName,onError}) {
  const [filters,setFilters] = useState({supplier:'',product:'',from:'',to:'',quote:''});
  const orders = filterPurchaseOrders(records);
  const shown = filterPurchaseOrders(records,filters);
  const change = (key,value) => setFilters(previous => ({...previous,[key]:value}));
  function generate(print) {
    try {
      if (filters.from && filters.to && filters.from > filters.to) throw new Error('A data inicial deve ser anterior à final.');
      const html = purchaseOrderHTML(records,companyName,filters);
      onError('');
      const url = URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
      if (print) {
        const frame = document.createElement('iframe');
        frame.title = 'Impressão do pedido de compra';
        frame.style.cssText = 'position:fixed;width:1px;height:1px;bottom:0;left:0;border:0';
        frame.onload = () => {frame.contentWindow.focus(); frame.contentWindow.print();};
        frame.src = url; document.body.append(frame);
        setTimeout(() => {frame.remove(); URL.revokeObjectURL(url);},300000);
      } else {
        const a = document.createElement('a'); a.href = url;
        a.download = `pedido-${filters.quote || 'compras'}.html`.replace(/[^a-zA-Z0-9_.-]/g,'_');
        a.click(); setTimeout(() => URL.revokeObjectURL(url),10000);
      }
    } catch (problem) {onError(problem.message);}
  }
  return <details className="pm-section pm-order-export"><summary>Gerar arquivo do pedido de compra</summary><p className="pm-hint">Pedidos emitidos, com a mesma numeração da cotação. Filtre pela data de emissão do pedido. Cada fornecedor aparece em uma página separada.</p><div className="pm-form-grid">
    <label>Fornecedor<PurchaseSelect label="Fornecedor do arquivo" value={filters.supplier} options={[...new Set(orders.map(p => p.supplier))].map(s => [s,s])} placeholder="Todos os fornecedores" onChange={v => change('supplier',v)} /></label>
    <label>Cotação<PurchaseSelect label="Cotação do arquivo" value={filters.quote} options={[...new Map(orders.map(p => [p.quoteNumber || p.bundleId || p.id,[p.quoteNumber || p.bundleId || p.id,p.quoteNumber || p.id]])).values()]} placeholder="Todas as cotações" onChange={v => change('quote',v)} /></label>
    <label>Produto<input value={filters.product} onChange={e => change('product',e.target.value)} placeholder="Nome ou especificação" /></label>
    <label>Emissão a partir de<input type="date" value={filters.from} onChange={e => change('from',e.target.value)} /></label><label>Emissão até<input type="date" value={filters.to} onChange={e => change('to',e.target.value)} /></label>
  </div><p>{shown.length} item(ns) de pedido encontrado(s).</p><div className="pm-supplier-actions"><button type="button" disabled={!shown.length} onClick={() => generate(false)}>Baixar pedido (HTML)</button><button type="button" disabled={!shown.length} onClick={() => generate(true)}>Salvar PDF / imprimir</button></div>{!orders.length && <p className="pm-hint">Os arquivos ficam disponíveis depois da etapa “Pedido emitido”.</p>}</details>;
}
