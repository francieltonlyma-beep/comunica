import { useEffect, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, query, runTransaction, where } from 'firebase/firestore';
import { ArrowRight, Box, CheckCircle2, ClipboardList, MapPin, PackageCheck, Plus, Search, Truck, X } from 'lucide-react';
import { PURCHASE_NEXT, PURCHASE_STAGES, purchaseFields, purchaseTransition, validatePurchase } from './purchaseFlow.js';
import './PurchaseManagement.css';

const INITIAL = { item: '', specification: '', quantity: 1, unit: 'un', department: '', destination: '', neededBy: '', reason: '', priority: 'normal' };
const dateBR = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const stageColor = status => status === 'exception' || status === 'rejected' ? 'pm-danger' : status === 'closed' ? 'pm-done' : ['received', 'stored', 'delivered'].includes(status) ? 'pm-success' : 'pm-neutral';
const PRIORITIES = { normal: 'Normal', high: 'Alta', urgent: 'Urgente' };

export default function PurchaseManagement({ db, appId, companyId, user, departments = [], online = true }) {
  const manager = Boolean(user?.isAdmin || user?.isDeveloper);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    if (!db || !companyId || !user?.id) { setLoading(false); return undefined; }
    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseRequests');
    const source = manager ? ref : query(ref, where('requesterId', '==', user.id));
    setLoading(true);
    return onSnapshot(source, snapshot => {
      setRecords(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)));
      setLoading(false);
      setError('');
    }, () => { setLoading(false); setError('Não foi possível carregar as compras. Verifique sua conexão e permissões.'); });
  }, [appId, companyId, db, manager, user?.id]);

  const selected = records.find(item => item.id === selectedId);
  const visible = records.filter(item => (stageFilter === 'all' || item.status === stageFilter) &&
    `${item.item} ${item.requesterName} ${item.department} ${item.orderNumber} ${item.supplier}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const metrics = { active: records.filter(item => !['closed', 'rejected', 'cancelled'].includes(item.status)).length,
    transit: records.filter(item => item.status === 'in_transit').length,
    exceptions: records.filter(item => item.status === 'exception').length,
    closed: records.filter(item => item.status === 'closed').length };
  const setField = (setter, name, value) => setter(previous => ({ ...previous, [name]: value }));
  const beginDetail = item => { setSelectedId(item.id); setDraft(purchaseFields(item)); setError(''); };

  async function createRequest(event) {
    event.preventDefault();
    const fields = purchaseFields(form);
    const issue = validatePurchase(fields);
    if (issue) return setError(issue);
    if (!online || !db || !companyId || !user?.id) return setError('Conecte-se à empresa para enviar a solicitação.');
    setBusy(true); setError('');
    try {
      const now = Date.now();
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseRequests'), {
        ...fields, status: 'requested', requesterId: user.id, requesterName: user.name || 'Solicitante',
        createdAt: now, updatedAt: now, updatedBy: user.id,
        history: [{ stage: 'requested', by: user.id, byName: user.name || 'Solicitante', at: now }],
      });
      setForm(INITIAL); setFormOpen(false);
    } catch { setError('Não foi possível salvar a solicitação. Seus dados continuam no formulário.'); }
    finally { setBusy(false); }
  }

  async function commit(next = '') {
    if (!manager || !selected || !draft || busy) return;
    if (!online) return setError('Conecte-se para registrar esta etapa.');
    setBusy(true); setError('');
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseRequests', selected.id);
      const nextDraft = purchaseFields(draft);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error('Esta solicitação não existe mais.');
        const current = snapshot.data();
        if (current.status !== selected.status || current.updatedAt !== selected.updatedAt) throw new Error('A solicitação mudou. Reabra o registro para ver os dados atuais.');
        const change = next
          ? purchaseTransition(current, next, nextDraft, user)
          : { ...nextDraft, updatedAt: Date.now(), updatedBy: user.id,
            history: [...(current.history || []), { stage: current.status, by: user.id, byName: user.name || 'Gestor', at: Date.now(), detail: 'Dados atualizados' }].slice(-50) };
        transaction.update(ref, change);
      });
    } catch (problem) { setError(problem.message || 'Não foi possível salvar. Tente novamente.'); }
    finally { setBusy(false); }
  }

  const field = (name, label, options = {}) => <label className={`pm-field ${options.wide ? 'pm-wide' : ''}`} key={name}>
    <span>{label}</span>
    {options.type === 'select' ? <select value={draft?.[name] ?? ''} onChange={event => setField(setDraft, name, event.target.value)}>
      {options.options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
    </select> : options.type === 'textarea' ? <textarea rows="3" maxLength={options.maxLength || 1000} value={draft?.[name] ?? ''} onChange={event => setField(setDraft, name, event.target.value)} />
      : <input type={options.type || 'text'} min={options.min} step={options.step} maxLength={options.maxLength || 160} value={draft?.[name] ?? ''} onChange={event => setField(setDraft, name, event.target.value)} />}
  </label>;

  return <section className="pm" aria-label="Comunica Integra — gestão de compras">
    <header className="pm-hero"><div><span>COMUNICA INTEGRA · PRIMEIRA ÁREA</span><h2>Gestão de compras</h2><p>Do pedido ao destino: acompanhe cada etapa, responsável, entrega e localização.</p></div><button type="button" onClick={() => { setFormOpen(true); setSelectedId(''); setError(''); }}><Plus size={18} /> Nova solicitação</button></header>
    <div className="pm-metrics" aria-label="Resumo de compras">
      {[[ClipboardList,'Em andamento',metrics.active], [Truck,'Em transporte',metrics.transit], [Box,'Divergências',metrics.exceptions], [CheckCircle2,'Concluídas',metrics.closed]].map(([Icon,label,value]) => <div key={label}><Icon size={18}/><span>{label}</span><strong>{value}</strong></div>)}
    </div>
    {error && <p className="pm-error" role="alert">{error}</p>}
    <div className="pm-workspace">
      <div className="pm-list"><div className="pm-list-header"><h3>{manager ? 'Todas as solicitações' : 'Minhas solicitações'}</h3><span>{visible.length} registros</span></div>
        <div className="pm-filters"><label><Search size={16}/><input aria-label="Pesquisar compras" placeholder="Item, setor, pedido ou fornecedor" value={search} onChange={event => setSearch(event.target.value)} /></label><select aria-label="Filtrar etapa" value={stageFilter} onChange={event => setStageFilter(event.target.value)}><option value="all">Todas as etapas</option>{Object.entries(PURCHASE_STAGES).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></div>
        {loading ? <p className="pm-empty">Carregando compras...</p> : visible.length === 0 ? <p className="pm-empty">Nenhuma solicitação com esses filtros.</p> : <div className="pm-cards">{visible.map(item => <button key={item.id} type="button" onClick={() => beginDetail(item)} className={`pm-card ${selectedId === item.id ? 'pm-selected' : ''}`}><div><strong>{item.item}</strong><span className={`pm-chip ${stageColor(item.status)}`}>{PURCHASE_STAGES[item.status] || item.status}</span></div><small>{item.requesterName} · {item.department} · {item.quantity} {item.unit}</small><p>{item.destination} · Necessário em {dateBR(item.neededBy)}</p>{item.status === 'exception' && <b>Conferir divergência</b>}</button>)}</div>}
      </div>
      <div className="pm-detail">
        {!selected ? <div className="pm-prompt"><PackageCheck size={34}/><h3>Fluxo de ponta a ponta</h3><p>Selecione uma compra para acompanhar a linha do tempo, documentos de referência, recebimento e destino. Solicitantes acompanham seus pedidos; a gestão conduz as etapas.</p></div> : <>
          <div className="pm-detail-head"><div><span className={`pm-chip ${stageColor(selected.status)}`}>{PURCHASE_STAGES[selected.status]}</span><h3>{selected.item}</h3><p>Solicitado por {selected.requesterName} · {selected.department}</p></div><button type="button" aria-label="Fechar detalhes" onClick={() => { setSelectedId(''); setDraft(null); setError(''); }}><X size={18}/></button></div>
          <div className="pm-progress">{Object.entries(PURCHASE_STAGES).filter(([id]) => !['rejected','cancelled','exception'].includes(id)).map(([id,label]) => <span key={id} className={id === selected.status ? 'current' : (selected.history || []).some(entry => entry.stage === id) ? 'visited' : ''}>{label}</span>)}</div>
          <div className="pm-section"><h4>Solicitação e destino</h4><div className="pm-readonly"><div><span>Especificação</span><p>{selected.specification}</p></div><div><span>Justificativa</span><p>{selected.reason}</p></div><div><span>Quantidade e unidade</span><p>{selected.quantity} {selected.unit}</p></div><div><span>Destino solicitado</span><p>{selected.destination}</p></div><div><span>Data necessária</span><p>{dateBR(selected.neededBy)}</p></div><div><span>Prioridade</span><p>{PRIORITIES[selected.priority] || 'Normal'}</p></div></div></div>
          {manager && draft && <><div className="pm-section"><h4>Compra e rastreamento</h4><div className="pm-fields">{field('supplier','Fornecedor')}{field('quotedPrice','Preço unitário (R$)',{type:'number',min:'0',step:'0.01'})}{field('orderNumber','Número do pedido')}{field('expectedDate','Previsão de entrega',{type:'date'})}{field('carrier','Transportadora ou retirada')}{field('trackingCode','Código ou referência de rastreamento')}</div></div>
          <div className="pm-section"><h4>Recebimento e armazenagem</h4><div className="pm-fields">{field('invoiceNumber','Número da nota fiscal')}{field('receivedQuantity','Quantidade conferida',{type:'number',min:'0',step:'any'})}{field('condition','Condição',{type:'select',options:[['pending','Não conferida'],['ok','Conforme'],['damaged','Avaria ou não conforme']]})}{field('lot','Lote / identificação')}{field('expiresAt','Validade, se aplicável',{type:'date'})}{field('storageAddress','Endereço físico / posição',{wide:true})}{field('destinationRecipient','Recebido no destino por',{wide:true})}{field('note','Observações e divergências',{type:'textarea',wide:true})}</div><p className="pm-hint">Informe divergência de quantidade ou avaria antes de encaminhar ao estoque. A localização física é obrigatória para armazenar.</p></div>
          <div className="pm-actions"><button type="button" disabled={busy || !online} onClick={() => commit()} className="pm-secondary">Salvar dados</button>{(PURCHASE_NEXT[selected.status] || []).map(stage => <button key={stage} type="button" disabled={busy || !online} onClick={() => commit(stage)} className={stage === 'rejected' || stage === 'cancelled' ? 'pm-secondary' : 'pm-primary'}>{PURCHASE_STAGES[stage]} <ArrowRight size={15}/></button>)}</div></>}
          <div className="pm-section"><h4>Linha do tempo</h4><ol className="pm-history">{[...(selected.history || [])].reverse().map((entry,index) => <li key={`${entry.at}-${index}`}><span className={`pm-chip ${stageColor(entry.stage)}`}>{PURCHASE_STAGES[entry.stage] || entry.stage}</span><strong>{entry.byName || 'Responsável'}</strong><small>{new Date(entry.at).toLocaleString('pt-BR')}</small>{entry.detail && <p>{entry.detail}</p>}</li>)}</ol></div>
        </>}
      </div>
    </div>
    {formOpen && <div className="pm-overlay" role="presentation"><form className="pm-modal" onSubmit={createRequest} aria-label="Nova solicitação de compra"><header><div><span>COMUNICA INTEGRA</span><h3>Nova solicitação</h3><p>Um item por solicitação. Preencha o destino para acompanhar até a entrega.</p></div><button type="button" aria-label="Fechar formulário" onClick={() => setFormOpen(false)}><X size={20}/></button></header><div className="pm-form-grid">
      {[['item','Item / produto','text'],['specification','Especificação','textarea'],['quantity','Quantidade','number'],['unit','Unidade','text'],['department','Setor solicitante','select'],['destination','Destino / local de uso','text'],['neededBy','Data necessária','date'],['reason','Justificativa','textarea'],['priority','Prioridade','priority']].map(([name,label,type]) => <label key={name} className={type === 'textarea' ? 'pm-wide' : ''}><span>{label}</span>{type === 'textarea' ? <textarea required rows="3" maxLength="1000" value={form[name]} onChange={event => setField(setForm,name,event.target.value)} /> : type === 'select' ? <select required value={form[name]} onChange={event => setField(setForm,name,event.target.value)}><option value="">Selecione...</option>{departments.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}<option value="Outro setor">Outro setor</option></select> : type === 'priority' ? <select value={form[name]} onChange={event => setField(setForm,name,event.target.value)}>{Object.entries(PRIORITIES).map(([value,text]) => <option key={value} value={value}>{text}</option>)}</select> : <input required type={type} min={type === 'number' ? '0.01' : undefined} step={type === 'number' ? 'any' : undefined} maxLength={type === 'text' ? 160 : undefined} value={form[name]} onChange={event => setField(setForm,name,event.target.value)} />}</label>)}
    </div>{error && <p className="pm-error" role="alert">{error}</p>}<footer><span><MapPin size={15}/> Destino e solicitante ficam vinculados ao pedido.</span><button type="submit" disabled={busy || !online}>{busy ? 'Salvando...' : 'Enviar solicitação'}</button></footer></form></div>}
  </section>;
}
