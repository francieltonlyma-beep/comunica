import {useEffect,useState} from 'react';
import {collection,onSnapshot} from 'firebase/firestore';
import {purchaseComparison} from './purchaseComparison.js';
const money = cents => (cents / 100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export default function PurchaseBundleComparison({db,appId,companyId,items,onError}) {
  const [offers,setOffers] = useState({});
  const ids = JSON.stringify(items.map(p => p.id).sort());
  useEffect(() => {
    const stops = JSON.parse(ids).map(id => onSnapshot(collection(db,'artifacts',appId,'public','data','companies',companyId,'purchaseRequests',id,'offers'), snapshot => setOffers(previous => ({...previous,[id]:snapshot.docs.map(d => ({id:d.id,...d.data()}))})),() => {setOffers(previous => ({...previous,[id]:[]})); onError('Não foi possível carregar o comparativo da cotação.');}));
    return () => stops.forEach(stop => stop());
  },[db,appId,companyId,ids,onError]);
  const columns = purchaseComparison(items,offers);
  const best = Math.min(...columns.filter(c => c.complete).map(c => c.totalCents));
  return <details className="pm-bundle-comparison" open><summary>Comparativo de todos os itens da cotação</summary><p className="pm-hint">O total só compara fornecedores que cotaram todos os itens, com quantidade suficiente e sem substituições. A escolha continua individual por item.</p>{!columns.length ? <p>Aguardando propostas para esta cotação.</p> : <div className="pm-offer-scroll"><table className="pm-offer-table"><thead><tr><th>Produto</th>{columns.map(c => <th key={c.id}>{c.name}</th>)}</tr></thead><tbody>{items.map((item,index) => <tr key={item.id}><th>{item.item}<small>{item.quantity} {item.unit}</small></th>{columns.map(c => {const line=c.lines[index];return <td key={c.id}>{!line.offer ? 'Não cotado' : !line.offer.available ? 'Indisponível' : <>{money(line.offer.totalCents)}{!line.complete && <small>Quantidade insuficiente ou alternativa</small>}</>}</td>;})}</tr>)}<tr><th>Total da cotação</th>{columns.map(c => <td key={c.id}>{c.complete ? <strong>{money(c.totalCents)}{c.totalCents === best && <small>Menor custo total</small>}</strong> : 'Cotação incompleta'}</td>)}</tr></tbody></table></div>}</details>;
}
