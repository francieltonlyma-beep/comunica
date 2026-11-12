import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, query, runTransaction, setDoc, where, writeBatch } from 'firebase/firestore';
import { ArrowRight, Box, CheckCircle2, ClipboardList, Download, FileText, MapPin, PackageCheck, Plus, Search, Truck, X } from 'lucide-react';
import { PURCHASE_CATEGORIES, PURCHASE_FILTERS, filterPurchases, pendingPurchaseRole, purchaseOverdue, purchaseSaveError, purchaseDataPatch, purchaseTransitionPatch, purchaseInvoiceMatch, purchaseInsights, purchasePendingDays, PURCHASE_NEXT, PURCHASE_STAGES, expectedApprover, purchaseFields, purchaseQuoteNumber, purchaseQuoteTotal, validatePurchase } from './purchaseFlow.js';
import './PurchaseManagement.css';
import PurchaseSelect from './PurchaseSelect.jsx';
import SupplierRegistry from './SupplierRegistry.jsx';

const INITIAL = { category: 'Outros', item: '', specification: '', quantity: 1, unit: 'un', department: '', destination: '', neededBy: '', reason: '', priority: 'normal' };
const dateBR = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const stageColor = status => ['exception','finance_dispute','rejected'].includes(status) ? 'pm-danger' : status === 'closed' ? 'pm-done' : ['received', 'stored', 'delivered'].includes(status) ? 'pm-success' : 'pm-neutral';
const PRIORITIES = { normal: 'Normal', high: 'Alta', urgent: 'Urgente' };
const TRACK_STAGES = ['requested','quotation','approved','ordered','in_transit','received','stored','delivered','closed'];
const stagePosition = status => status === 'exception' ? TRACK_STAGES.indexOf('received') : status === 'finance_dispute' ? TRACK_STAGES.indexOf('delivered') : TRACK_STAGES.indexOf(status);
const currentTimestamp = () => Date.now();

export default function PurchaseManagement({ db, appId, companyId, companyCode, companyName, user, departments = [], users = [], online = true, initialPurchaseId, uploadAttachment, downloadAttachment, approveQuote }) {
  const manager = Boolean(user?.isAdmin || user?.isDeveloper);
  const scope = JSON.stringify([appId, companyId, user?.id, manager]);
  const [snapshotState, setSnapshotState] = useState({ scope: '', records: [] });
  const records = snapshotState.scope === scope ? snapshotState.records : [];
  const loading = Boolean(db && companyId && user?.id) && snapshotState.scope !== scope;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [extraItems, setExtraItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(null);
  const [quoteDraft, setQuoteDraft] = useState(null);
  const sending = useRef(false);
  const [notice, setNotice] = useState('');
  const [filters, setFilters] = useState(PURCHASE_FILTERS);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [policy, setPolicy] = useState(null);
  const [policyDraft, setPolicyDraft] = useState({ enabled: false, threshold: 1000, lowerApproverId: '', upperApproverId: '', preventSelfApproval: false, requesterIds: [], buyerIds: [] });
  const [policyOpen, setPolicyOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const navigationHandled = useRef('');

  useEffect(() => {
    if (!db || !companyId || !user?.id) return undefined;
    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseRequests');
    const publish = (items) => {
      setSnapshotState({ scope, records: items.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)) });
      if (initialPurchaseId && navigationHandled.current !== initialPurchaseId && items.some(item => item.id === initialPurchaseId)) {
        navigationHandled.current = initialPurchaseId;
        setSelectedId(initialPurchaseId);
      }
    };
    if (manager) return onSnapshot(ref, snapshot => { publish(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))); setError(''); },
      () => { publish([]); setError('Não foi possível carregar as compras.'); });
    const sources = { own: [], assigned: [] };
    const refresh = () => publish([...new Map([...sources.own, ...sources.assigned].map(item => [item.id, item])).values()]);
    const onError = () => { setSnapshotState({ scope, records: [] }); setError('Não foi possível carregar as compras. Verifique as permissões.'); };
    const stopOwn = onSnapshot(query(ref, where('requesterId', '==', user.id)), snapshot => {
      sources.own = snapshot.docs.map(item => ({ id: item.id, ...item.data() })); refresh(); setError('');
    }, onError);
    const stopAssigned = onSnapshot(query(ref, where('participantIds', 'array-contains', user.id)), snapshot => {
      sources.assigned = snapshot.docs.map(item => ({ id: item.id, ...item.data() })); refresh(); setError('');
    }, onError);
    return () => { stopOwn(); stopAssigned(); };
  }, [appId, companyId, db, manager, scope, user?.id, initialPurchaseId]);

  useEffect(() => {
    if (!db || !companyId || !user?.id) return undefined;
    return onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'settings', 'purchase-approval'), snapshot => {
      const config = snapshot.exists() ? snapshot.data() : null;
      setPolicy(config);
      setPolicyDraft(config || { enabled: false, threshold: 1000, lowerApproverId: '', upperApproverId: '', preventSelfApproval: false, requesterIds: [], buyerIds: [] });
    }, () => setError('Não foi possível consultar as alçadas de aprovação.'));
  }, [appId, companyId, db, user?.id]);

  useEffect(() => {
    if (!db || !companyId || !selectedId) return undefined;
    return onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseRequests', selectedId, 'files'),
      snapshot => setFiles(snapshot.docs.map(item => ({id:item.id,...item.data()})).sort((a,b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))),
      () => setError('Não foi possível carregar os anexos desta compra.'));
  }, [appId,companyId,db,selectedId]);

  const selected = records.find(item => item.id === selectedId);
  const quoteItems = selected?.bundleId ? records.filter(item => item.bundleId === selected.bundleId).sort((a,b) => a.bundleIndex - b.bundleIndex) : [];
  const quoteValues = quoteDraft || Object.fromEntries(quoteItems.map(item => [item.id, { included: item.quotedPrice > 0, supplier: item.supplier || '', quotedPrice: item.quotedPrice || '', expectedDate: item.expectedDate || '' }]));
  const groupQuoteTotal = purchaseQuoteTotal(quoteItems.filter(item => quoteValues[item.id]?.included).map(item => ({ ...item, quotedPrice: quoteValues[item.id]?.quotedPrice })));
  const latestRejection = (selected?.history || []).filter(entry => entry.stage === 'rejected').at(-1);
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  const visible = filterPurchases(records, filters, search, stageFilter, users, user?.id, today);
  const visibleGroupMap = new Map();
  for (const item of visible) if (!visibleGroupMap.has(item.bundleId || item.id)) visibleGroupMap.set(item.bundleId || item.id, item);
  const visibleGroups = [...visibleGroupMap.values()];
  const categories = [...new Set([...PURCHASE_CATEGORIES, ...records.map(item => item.category || 'Sem categoria')])].sort();
  const requesters = [...new Map(records.map(item => [item.requesterId, item.requesterName])).entries()];
  const responsibleIds = new Set(records.flatMap(item => [item.buyerId, item.approverId, item.receiverId, item.recipientId, item.financeId]).filter(Boolean));
  const resetFilters = () => { setFilters(PURCHASE_FILTERS); setSearch(''); setStageFilter('all'); };
  const metrics = { active: records.filter(item => !['closed', 'rejected', 'cancelled'].includes(item.status)).length,
    transit: records.filter(item => item.status === 'in_transit').length,
    exceptions: records.filter(item => ['exception','finance_dispute'].includes(item.status)).length,
    closed: records.filter(item => item.status === 'closed').length };
  const insights = purchaseInsights(visible,today);
  const setField = (setter, name, value) => setter(previous => ({ ...previous, [name]: value }));
  const setQuoteLine = (id, field, value) => setQuoteDraft(previous => ({ ...(previous || quoteValues), [id]: { ...((previous || quoteValues)[id] || {}), [field]: value } }));
  const beginDetail = item => { setSelectedId(item.id); setDraft(purchaseFields(item)); setQuoteDraft(null); setAcknowledged(false); setError(''); };
  const displayUser = id => users.find(person => person.id === id)?.name || (id ? 'Usuário não encontrado' : 'Pendente');
  const adminId = users.find(person => person.isAdmin)?.id || (user?.isAdmin ? user.id : '');
  const expectedId = selected ? expectedApprover(policy, Number(draft?.quotedPrice || selected.quotedPrice) * Number(selected.quantity), adminId) : '';
  const roleFor = item => { const role = pendingPurchaseRole(item); return item?.[role] === user?.id ? ({buyerId:'comprador',approverId:'aprovador',receiverId:'recebimento e NF',recipientId:'destinatário',financeId:'financeiro'}[role] || '') : ''; };
  const editBuyer = manager || selected?.buyerId === user?.id;
  const canQuote = !policy?.buyerIds?.length || policy.buyerIds.includes(user?.id);
  const canRequest = !policy?.requesterIds?.length || policy.requesterIds.includes(user?.id);
  const buyerOptions = users.filter(person => !policy?.buyerIds?.length || policy.buyerIds.includes(person.id));
  const editReceiver = manager || selected?.receiverId === user?.id;

  async function attachFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selected || !uploadAttachment || uploading) return;
    if (file.size > 50 * 1024 * 1024) return setError('O anexo deve ter até 50 MB.');
    setUploading(true); setError('');
    try {
      const uploaded = await uploadAttachment(file,selected.id);
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseRequests', selected.id, 'files'), {
        name:file.name.slice(0,160),contentType:file.type || 'application/octet-stream',size:file.size,
        storagePath:uploaded.storagePath,stage:selected.status,createdAt:currentTimestamp(),createdBy:user.id,
      });
      setNotice('Documento anexado à compra.');
    } catch (problem) { setError(problem?.message || 'Não foi possível anexar o documento.'); }
    finally { setUploading(false); }
  }

  async function savePolicy() {
    if (!manager || !db || !companyId || busy) return;
    if (policyDraft.enabled && (!Number.isFinite(Number(policyDraft.threshold)) || Number(policyDraft.threshold) <= 0 || !policyDraft.lowerApproverId || !policyDraft.upperApproverId)) {
      return setError('Informe um limite válido e os dois aprovadores da alçada.');
    }
    setBusy(true); setError('');
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'settings', 'purchase-approval'), {
        enabled: Boolean(policyDraft.enabled), threshold: Number(policyDraft.threshold) || 1000,
        lowerApproverId: policyDraft.lowerApproverId, upperApproverId: policyDraft.upperApproverId,
        preventSelfApproval:Boolean(policyDraft.preventSelfApproval),
        requesterIds: policyDraft.requesterIds || [], buyerIds: policyDraft.buyerIds || [],
        updatedAt: Date.now(), updatedBy: user.id,
      });
      setPolicyOpen(false);
    } catch { setError('Não foi possível salvar as alçadas.'); }
    finally { setBusy(false); }
  }

  async function createRequest(event) {
    event.preventDefault();
    if (sending.current) return;
    const items = [form,...extraItems.map(item => ({...form,...item}))].map(purchaseFields);
    for (const [index,fields] of items.entries()) {
      const issue = validatePurchase(fields);
      if (issue) return setError(`Item ${index + 1}: ${issue}`);
    }
    if (policy?.requesterIds?.length && !policy.requesterIds.includes(user?.id)) return setError('Você não está autorizado a solicitar compras nesta empresa.');
    if (!online || !db || !companyId || !user?.id) return setError('Conecte-se à empresa para enviar a solicitação.');
    sending.current = true;
    setBusy(true); setError(''); setNotice('');
    try {
      const now = Date.now();
      const requests = collection(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseRequests');
      const references = items.map(() => doc(requests));
      const quoteNumber = purchaseQuoteNumber(now, references[0].id);
      const batch = writeBatch(db);
      items.forEach((fields,index) => batch.set(references[index],{
        ...fields,quoteNumber,...(items.length > 1 ? {bundleId:references[0].id,bundleSize:items.length,bundleIndex:index + 1} : {}),
        status:'requested',requesterId:user.id,requesterName:user.name || 'Solicitante',
        createdAt:now,updatedAt:now,updatedBy:user.id,workflowVersion:2,participantIds:[user.id],
        history:[{stage:'requested',by:user.id,byName:user.name || 'Solicitante',at:now}],
      }));
      await batch.commit();
      resetFilters(); setSelectedId('');
      setNotice(`${items.length} item(ns) enviado(s) com sucesso. Referência: ${references[0].id}`);
      setForm(INITIAL); setExtraItems([]); setFormOpen(false);
    } catch (problem) { setError(purchaseSaveError(problem)); }
    finally { sending.current = false; setBusy(false); }
  }

  async function saveGroupQuote() {
    if (!selected?.bundleId || !quoteItems.length || !canQuote || busy || !online) return;
    if (quoteItems.some(item => item.approvedAt || !['requested','quotation'].includes(item.status))) return setError('Esta cotação já avançou de etapa. Revise os itens individualmente.');
    const included = quoteItems.filter(item => quoteValues[item.id]?.included);
    if (!included.length) return setError('Selecione pelo menos um item cotado.');
    if (included.some(item => item.buyerId !== user?.id)) return setError('O comprador responsável deve ser você em todos os itens cotados.');
    if (included.some(item => !quoteValues[item.id].supplier.trim() || !(Number(quoteValues[item.id].quotedPrice) > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(quoteValues[item.id].expectedDate))) return setError('Informe fornecedor, preço unitário e previsão para cada item cotado.');
    setBusy(true); setError('');
    try {
      await runTransaction(db, async transaction => {
        const refs = quoteItems.map(item => doc(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseRequests', item.id));
        const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
        snapshots.forEach((snapshot, index) => {
          if (!snapshot.exists() || snapshot.data().updatedAt !== quoteItems[index].updatedAt) throw new Error('Os itens mudaram. Reabra a cotação e confira os valores.');
        });
        snapshots.forEach((snapshot, index) => {
          const current = snapshot.data();
          const value = quoteValues[quoteItems[index].id];
          const fields = purchaseFields({ ...current,
            supplier: value?.included ? value.supplier : '', quotedPrice: value?.included ? value.quotedPrice : 0,
            expectedDate: value?.included ? value.expectedDate : '', quoteTotal: value?.included ? groupQuoteTotal : 0,
          });
          const now = Math.max(Date.now(), current.updatedAt + 1);
          const patch = value?.included && current.status === 'requested'
            ? purchaseTransitionPatch(current, 'quotation', fields, user, now)
            : purchaseDataPatch(current, fields, manager, user, now);
          if (patch) transaction.update(refs[index], patch);
        });
      });
      setQuoteDraft(null);
      setNotice(`Cotação ${selected.quoteNumber || purchaseQuoteNumber(selected.createdAt, selected.bundleId)} salva. Total: ${groupQuoteTotal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}.`);
    } catch (problem) { setError(problem?.message || 'Não foi possível salvar a cotação conjunta.'); }
    finally { setBusy(false); }
  }

  async function approveGroupQuote() {
    if (!selected?.bundleId || busy || !online || !approveQuote) return;
    const quoted = quoteItems.filter(item => Number(item.quotedPrice) > 0);
    const total = purchaseQuoteTotal(quoted);
    if (!quoted.length || quoted.some(item => item.status !== 'quotation' || item.approverId !== user?.id || Number(item.quoteTotal) !== total)) return setError('Confira os valores e o aprovador de todos os itens cotados antes de aprovar.');
    if (policy?.enabled && expectedApprover(policy, total, adminId) !== user?.id) return setError('O total desta cotação exige outro aprovador pela alçada cadastrada.');
    if (policy?.preventSelfApproval && quoted.some(item => [item.requesterId, item.buyerId].includes(user?.id))) return setError('A política exige aprovador diferente do solicitante e comprador.');
    setBusy(true); setError('');
    try {
      await approveQuote(selected.bundleId);
      setNotice(`Cotação ${selected.quoteNumber || purchaseQuoteNumber(selected.createdAt, selected.bundleId)} aprovada integralmente.`);
    } catch (problem) { setError(problem?.message || 'Não foi possível aprovar a cotação conjunta.'); }
    finally { setBusy(false); }
  }

  async function applyRolesToGroup() {
    if (!manager || !selected?.bundleId || !draft || busy || !online) return;
    if (draft.buyerId && policy?.buyerIds?.length && !policy.buyerIds.includes(draft.buyerId)) return setError('O comprador escolhido não está autorizado nas configurações de compras.');
    setBusy(true); setError('');
    try {
      await runTransaction(db, async transaction => {
        const refs = quoteItems.map(item => doc(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseRequests', item.id));
        const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
        snapshots.forEach((snapshot, index) => {
          if (!snapshot.exists() || snapshot.data().updatedAt !== quoteItems[index].updatedAt) throw new Error('A solicitação mudou. Reabra os itens para conferir.');
        });
        snapshots.forEach((snapshot, index) => {
          const current = snapshot.data();
          const fields = purchaseFields({ ...current, buyerId: draft.buyerId, approverId: draft.approverId,
            receiverId: draft.receiverId, recipientId: draft.recipientId, financeId: draft.financeId });
          const patch = purchaseDataPatch(current, fields, true, user, Math.max(Date.now(), current.updatedAt + 1));
          if (patch) transaction.update(refs[index], patch);
        });
      });
      setNotice('Responsáveis aplicados a todos os itens desta cotação.');
    } catch (problem) { setError(problem?.message || 'Não foi possível aplicar os responsáveis.'); }
    finally { setBusy(false); }
  }

  async function commit(next = '') {
    if (!selected || !draft || busy) return;
    if (!manager && ![selected.buyerId, selected.receiverId, selected.recipientId, selected.financeId, selected.approverId].includes(user?.id)) return;
    if (['ordered', 'received', 'delivered', 'closed'].includes(next) && !acknowledged) return setError('Marque a confirmação desta etapa antes de continuar.');
    if (next === 'closed' && draft.financeIssue?.trim() && draft.financeIssue !== (selected.financeIssue || '')) return setError('Há uma não conformidade descrita. Devolva a NF para correção antes de concluir.');
    if (next === 'approved' && policy?.preventSelfApproval && [selected.requesterId,selected.buyerId].includes(user.id)) return setError('A separação de funções está ativa. Escolha um aprovador diferente do solicitante e comprador.');
    if (next === 'approved' && policy?.enabled && expectedId !== draft.approverId) return setError('O aprovador designado não corresponde à alçada vigente. Revise a cotação e a configuração.');
    if (next === 'closed') {
      const match = purchaseInvoiceMatch(draft);
      if (!match.matches || !match.quantityMatches) return setError('Valor ou quantidade da NF não confere com o pedido. Informe a divergência e devolva para correção.');
    }
    if (!online) return setError('Conecte-se para registrar esta etapa.');
    setBusy(true); setError('');
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseRequests', selected.id);
      const nextDraft = purchaseFields(draft);
      if (nextDraft.quotedPrice > 0 && !selected.bundleId) nextDraft.quoteTotal = nextDraft.quotedPrice * nextDraft.quantity;
      if (next === 'delivered' && selected.status !== 'finance_dispute') nextDraft.destinationRecipient = user.name || 'Destinatário';
      const saved = await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error('Esta solicitação não existe mais.');
        const current = snapshot.data();
        if (current.status !== selected.status || current.updatedAt !== selected.updatedAt) throw new Error('A solicitação mudou. Reabra o registro para ver os dados atuais.');
        const now = Math.max(Date.now(), Number(current.updatedAt || 0) + 1);
        const change = next ? purchaseTransitionPatch(current, next, nextDraft, user, now)
          : purchaseDataPatch(current, nextDraft, manager, user, now);
        if (!change) return false;
        transaction.update(ref, change);
        return true;
      });
      if (!saved) { setNotice('Nenhuma alteração para salvar.'); return; }
      setNotice(next ? 'Etapa registrada com sucesso.' : 'Dados atualizados com sucesso.');
      setSelectedId(''); setDraft(null); setAcknowledged(false);
    } catch (problem) { setError(problem?.code ? purchaseSaveError(problem, next ? 'a mudança de etapa' : 'a atualização dos dados') : problem.message || 'Não foi possível salvar. Tente novamente.'); }
    finally { setBusy(false); }
  }

  async function migrateLegacy() {
    if (!manager || !selected || selected.workflowVersion === 2 || busy) return;
    setBusy(true); setError('');
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseRequests', selected.id);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists() || snapshot.data().updatedAt !== selected.updatedAt) throw new Error('Reabra a solicitação para ver as alterações.');
        const current = snapshot.data();
        if (['closed','rejected','cancelled'].includes(current.status)) throw new Error('Um registro encerrado permanece no histórico anterior.');
        const now = Math.max(Date.now(), Number(current.updatedAt || 0) + 1);
        transaction.update(ref, { workflowVersion: 2, status: 'requested', participantIds: [current.requesterId],
          buyerId: '', approverId: '', receiverId: '', recipientId: '', financeId: '',
          updatedAt: now, updatedBy: user.id,
          history: [...(current.history || []), { stage: 'requested', by: user.id, byName: user.name || 'Administrador', at: now, detail: 'Fluxo anterior reaberto para definição dos responsáveis e novos atestes' }].slice(-50) });
      });
      setSelectedId(''); setDraft(null);
    } catch (problem) { setError(problem.message || 'Não foi possível atualizar o fluxo anterior.'); }
    finally { setBusy(false); }
  }

  const field = (name, label, options = {}) => <label className={`pm-field ${options.wide ? 'pm-wide' : ''}`} key={name}>
    <span>{label}</span>
    {options.type === 'select' ? <PurchaseSelect label={label} disabled={options.disabled} value={draft?.[name] ?? ''} options={options.options} sort={false} onChange={value => setField(setDraft, name, value)} /> : options.type === 'textarea' ? <textarea disabled={options.disabled} rows="3" maxLength={options.maxLength || 1000} value={draft?.[name] ?? ''} onChange={event => setField(setDraft, name, event.target.value)} />
      : <><input disabled={options.disabled} type={options.type || 'text'} list={name === 'supplier' ? 'pm-supplier-options' : undefined} min={options.min} step={options.step} maxLength={options.maxLength || 160} value={draft?.[name] ?? ''} onChange={event => setField(setDraft, name, event.target.value)} />{name === 'supplier' && <datalist id="pm-supplier-options">{suppliers.map(item => <option key={item.id} value={item.name} />)}</datalist>}</>}
  </label>;

  return <section className="pm" aria-label="Comunica Integra — gestão de compras">
    <header className="pm-hero"><div><span>COMUNICA INTEGRA · COMPRAS</span><h2>Gestão de compras</h2><p>Do pedido ao destino: acompanhe cada etapa, responsável, entrega e localização.</p></div><button type="button" disabled={!canRequest} onClick={() => { setFormOpen(true); setSelectedId(''); setError(''); }}><Plus size={18} /> Nova solicitação</button></header>
    {manager && <div className="pm-setup"><button type="button" className="pm-secondary" onClick={() => setPolicyOpen(value => !value)}>Configurações de compras · {policy?.enabled ? 'alçadas ativas' : 'alçada padrão'}</button>
      {policyOpen && <div className="pm-setup-fields"><p>Defina quem pode solicitar, cotar e aprovar compras. Sem seleção de solicitantes ou compradores, todos os colaboradores podem exercer o papel quando designados.</p>
        {[['requesterIds','Quem pode solicitar compras'],['buyerIds','Quem pode cotar compras']].map(([key,label]) => <fieldset className="pm-policy-people" key={key}><legend>{label}</legend><p>Ninguém selecionado: todos os colaboradores autorizados da empresa.</p><div>{users.map(person => <label key={person.id}><input type="checkbox" checked={(policyDraft[key] || []).includes(person.id)} onChange={event => setPolicyDraft(previous => ({ ...previous, [key]: event.target.checked ? [...(previous[key] || []), person.id] : (previous[key] || []).filter(id => id !== person.id) }))} /> {person.name}</label>)}</div></fieldset>)}
        <label><input type="checkbox" checked={Boolean(policyDraft.enabled)} onChange={event => setPolicyDraft(prev => ({ ...prev, enabled: event.target.checked }))} /> Usar alçada por valor</label>
        {policyDraft.enabled && <div className="pm-fields"><label className="pm-field"><span>Limite em R$ (valor total)</span><input type="number" min="0.01" step="0.01" value={policyDraft.threshold} onChange={event => setPolicyDraft(prev => ({ ...prev, threshold: event.target.value }))} /></label>
          {[['lowerApproverId','Aprovador até o limite'],['upperApproverId','Aprovador acima do limite']].map(([key,label]) => <label key={key} className="pm-field"><span>{label}</span><PurchaseSelect label={label} value={policyDraft[key] || ''} options={users.map(person => [person.id, person.name])} onChange={value => setPolicyDraft(prev => ({ ...prev, [key]: value }))} /></label>)}</div>}
        <label><input type="checkbox" checked={Boolean(policyDraft.preventSelfApproval)} onChange={event => setPolicyDraft(prev => ({...prev,preventSelfApproval:event.target.checked}))} /> Exigir aprovador diferente do solicitante e comprador</label>
        <button type="button" disabled={busy || !online} onClick={savePolicy}>Salvar alçadas</button></div>}</div>}
    <div className="pm-supplier-toggle"><button type="button" onClick={() => setSuppliersOpen(value => !value)} aria-expanded={suppliersOpen}>{suppliersOpen ? 'Fechar fornecedores' : 'Abrir cadastro de fornecedores'}</button></div>
    {suppliersOpen && <SupplierRegistry key={companyId} db={db} appId={appId} companyId={companyId} companyCode={companyCode} companyName={companyName} user={user} online={online} onSuppliers={setSuppliers} />}
    <div className="pm-metrics" aria-label="Resumo de compras">
      {[[ClipboardList,'Em andamento',metrics.active], [Truck,'Em transporte',metrics.transit], [Box,'Divergências',metrics.exceptions], [CheckCircle2,'Concluídas',metrics.closed]].map(([Icon,label,value]) => <div key={label}><Icon size={18}/><span>{label}</span><strong>{value}</strong></div>)}
    </div>
    {manager && <div className="pm-insights"><button type="button" onClick={() => setInsightsOpen(value => !value)} aria-expanded={insightsOpen}>Indicadores de compras {insightsOpen ? '−' : '+'}</button>{insightsOpen && <div className="pm-insights-content"><div className="pm-insights-stats"><span>Total cotado <strong>{insights.total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></span><span>Em aberto <strong>{insights.open}</strong></span><span>Atrasadas <strong>{insights.overdue}</strong></span><span>Divergências <strong>{insights.discrepancies}</strong></span><span>Aprovação média <strong>{insights.approvalDays.toFixed(1)} dia(s)</strong></span><span>Entrega média <strong>{insights.deliveryDays.toFixed(1)} dia(s)</strong></span></div><div className="pm-insights-groups">{[['Categorias',insights.byCategory],['Setores',insights.byDepartment],['Fornecedores',insights.bySupplier]].map(([title,rows]) => <div key={title}><h4>{title}</h4>{rows.map(([label,value]) => <p key={label}><span>{label}</span><strong>{value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></p>)}{!rows.length && <p>Sem cotações no período.</p>}</div>)}</div></div>}</div>}
    {notice && <p className="pm-notice" role="status">{notice}</p>}
    {error && <p className="pm-error" role="alert">{error}</p>}
    <div className="pm-workspace">
      <div className="pm-list"><div className="pm-list-header"><h3>{manager ? 'Todas as solicitações' : 'Minhas solicitações'}</h3><span>{visibleGroups.length} cotações</span></div>
        <div className="pm-filters"><label><Search size={16}/><input aria-label="Pesquisar compras" placeholder="Item, pessoa, pedido ou fornecedor" value={search} onChange={event => setSearch(event.target.value)} /></label><PurchaseSelect label="Etapa" value={stageFilter === 'all' ? '' : stageFilter} options={Object.entries(PURCHASE_STAGES)} placeholder="Todas as etapas" sort={false} onChange={value => setStageFilter(value || 'all')} />
          <div className="pm-quick-views" aria-label="Visualizar solicitações">{[['','Todas'],['mine','Minha ação'],['overdue','Atrasadas']].map(([value,label]) => <button key={value} type="button" aria-pressed={filters.view === value} onClick={() => setFilters(previous => ({...previous,view:value}))}>{label}</button>)}</div>
          <details className="pm-filter-more"><summary>Filtros avançados</summary><div className="pm-filter-grid">{[
            ['requester', 'Solicitante', requesters],
            ['responsible', 'Responsável', [...responsibleIds].map(id => [id, displayUser(id)])],
            ['category', 'Categoria', categories.map(value => [value, value])],
            ['department', 'Setor', [...new Set(records.map(item => item.department))].filter(Boolean).sort().map(value => [value, value])],
            ['priority', 'Prioridade', Object.entries(PRIORITIES)],
            ['view', 'Pendências', [['mine','Aguardando minha ação'],['overdue','Atrasadas'],['unassigned','Sem responsável pela próxima etapa']]],
            ['sort', 'Ordenar', [['recent','Mais recentes'],['deadline','Prazo mais próximo'],['value','Maior valor cotado']]],
          ].map(([key, label, options]) => <label className="pm-filter-field" key={key}><span>{label}</span><PurchaseSelect label={label} value={filters[key]} options={options} placeholder="Todos" sort={!['priority','sort'].includes(key)} required={key === 'sort'} onChange={value => setField(setFilters,key,value)} /></label>)}
          {['from','to'].map(key => <label className="pm-filter-field" key={key}><span>{key === 'from' ? 'Necessário de' : 'Necessário até'}</span><input aria-label={key === 'from' ? 'Necessário de' : 'Necessário até'} type="date" value={filters[key]} onChange={event => setField(setFilters,key,event.target.value)} /></label>)}
          <button type="button" className="pm-clear" onClick={resetFilters}>Limpar filtros</button></div></details>
        </div>
        <p className="pm-hint pm-list-summary">{visibleGroups.length} cotações · {visible.length} itens de {records.length} · Total cotado: {visible.reduce((sum,item) => sum + Number(item.quotedPrice || 0) * Number(item.quantity || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        {loading ? <p className="pm-empty">Carregando compras...</p> : visible.length === 0 ? <p className="pm-empty">Nenhuma solicitação com esses filtros.</p> : <div className="pm-cards">{visibleGroups.map(item => { const group = item.bundleId ? records.filter(entry => entry.bundleId === item.bundleId) : [item]; const cardStatus = group.find(entry => entry.status === 'quotation')?.status || item.status; const groupTotal = purchaseQuoteTotal(group); const responsible = pendingPurchaseRole(item) ? item[pendingPurchaseRole(item)] : ''; const progress = Math.max(0,stagePosition(item.status)); const attention = responsible === user?.id && !['closed','cancelled','rejected'].includes(item.status); return <button key={item.id} type="button" onClick={() => beginDetail(item)} aria-current={(selectedId === item.id || (item.bundleId && selected?.bundleId === item.bundleId)) ? 'true' : undefined} className={`pm-card ${(selectedId === item.id || (item.bundleId && selected?.bundleId === item.bundleId)) ? 'pm-selected' : ''} ${attention ? 'pm-attention' : ''}`}><div className="pm-card-top"><span className={`pm-chip ${stageColor(cardStatus)}`}>{PURCHASE_STAGES[cardStatus] || cardStatus}</span>{attention && <span className="pm-attention-label">Aguardando você</span>}</div><strong className="pm-card-title">{item.bundleId ? `Cotação ${item.quoteNumber || purchaseQuoteNumber(item.createdAt, item.bundleId)} · ${records.filter(entry => entry.bundleId === item.bundleId).length} itens` : item.item}</strong><span className="pm-card-requester">{item.requesterName} · {item.department}</span><div className="pm-card-meta"><span>{item.category || 'Sem categoria'}</span><span>{item.quantity} {item.unit}</span><span>{PRIORITIES[item.priority] || 'Normal'}</span>{item.bundleId && <span>{records.filter(entry => entry.bundleId === item.bundleId).map(entry => entry.item).join(', ')}</span>}</div><div className="pm-card-progress" aria-label={`Progresso: ${progress + 1} de ${TRACK_STAGES.length} etapas`}><span style={{width:`${((progress + 1) / TRACK_STAGES.length) * 100}%`}} /></div><div className="pm-card-bottom"><span>Necessário em <strong>{dateBR(item.neededBy)}</strong></span>{groupTotal > 0 && <span>{groupTotal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>}</div>{responsible && <p className="pm-next-action">Próxima ação <strong>{displayUser(responsible)}</strong></p>}{purchaseOverdue(item, today) && <b className="pm-flag">Prazo vencido</b>}{attention && purchasePendingDays(item) >= 2 && <b className="pm-flag">Parado há {purchasePendingDays(item)} dias</b>}{item.status === 'exception' && <b className="pm-flag">Conferir divergência</b>}{item.status === 'finance_dispute' && <b className="pm-flag">NF devolvida pelo Financeiro</b>}{item.status === 'rejected' && <b className="pm-flag">Pode ser reaberta para revisão</b>}</button>; })}</div>}
      </div>
      <div className="pm-detail">
        {!selected ? <div className="pm-prompt"><PackageCheck size={34}/><h3>Fluxo de ponta a ponta</h3><p>Selecione uma compra para acompanhar responsáveis, aprovação, recebimento, nota fiscal e aceite no destino. Cada pessoa confirma sua etapa; o Financeiro encerra após conferir os atestes.</p></div> : <>
          <div className="pm-detail-head"><div><span className={`pm-chip ${stageColor(selected.status)}`}>{PURCHASE_STAGES[selected.status]}</span><h3>{selected.item}</h3><p>Solicitado por {selected.requesterName} · {selected.department}</p>{selected.bundleId && <p>Solicitação conjunta · item {selected.bundleIndex} de {selected.bundleSize}</p>}{roleFor(selected) && <p>Sua responsabilidade: {roleFor(selected)}</p>}</div><button type="button" aria-label="Fechar detalhes" onClick={() => { setSelectedId(''); setDraft(null); setError(''); }}><X size={18}/></button></div>
          {selected.bundleId && <div className="pm-bundle"><strong>Itens desta solicitação</strong><div>{records.filter(item => item.bundleId === selected.bundleId).sort((a,b) => a.bundleIndex - b.bundleIndex).map(item => <button key={item.id} type="button" className={item.id === selected.id ? 'active' : ''} onClick={() => beginDetail(item)}>{item.bundleIndex}. {item.item} · {PURCHASE_STAGES[item.status]}</button>)}</div></div>}
          {selected.bundleId && <div className="pm-quote"><div className="pm-quote-head"><div><h4>Cotação {selected.quoteNumber || purchaseQuoteNumber(selected.createdAt, selected.bundleId)}</h4><p>Uma cotação para os itens da solicitação. O comprador informa os itens cotados, fornecedor, valor unitário e previsão.</p></div><strong>{groupQuoteTotal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div>
            <div className="pm-quote-lines">{quoteItems.map(item => { const value = quoteValues[item.id] || {}; const editable = canQuote && item.buyerId === user?.id && ['requested','quotation'].includes(item.status) && !item.approvedAt; return <div key={item.id} className="pm-quote-line"><label><input type="checkbox" checked={Boolean(value.included)} disabled={!editable} onChange={event => setQuoteLine(item.id, 'included', event.target.checked)} /> <strong>{item.bundleIndex}. {item.item}</strong> · {item.quantity} {item.unit}</label><span>{PURCHASE_STAGES[item.status]}</span><div className="pm-quote-fields"><label>Fornecedor<input value={value.supplier || ''} disabled={!editable || !value.included} onChange={event => setQuoteLine(item.id, 'supplier', event.target.value)} /></label><label>Valor unitário (R$)<input type="number" min="0.01" step="0.01" value={value.quotedPrice || ''} disabled={!editable || !value.included} onChange={event => setQuoteLine(item.id, 'quotedPrice', event.target.value)} /></label><label>Previsão<input type="date" value={value.expectedDate || ''} disabled={!editable || !value.included} onChange={event => setQuoteLine(item.id, 'expectedDate', event.target.value)} /></label></div></div>; })}</div>
            <div className="pm-quote-actions">{quoteItems.some(item => item.buyerId === user?.id && ['requested','quotation'].includes(item.status)) && canQuote && <button type="button" disabled={busy || !online} onClick={saveGroupQuote}>Salvar cotação conjunta</button>}{quoteItems.some(item => item.approverId === user?.id && item.status === 'quotation') && <button type="button" disabled={busy || !online} onClick={approveGroupQuote}>Aprovar cotação conjunta</button>}</div>
          </div>}
          <div className="pm-journey"><div className="pm-journey-head"><strong>Andamento da compra</strong><span>{['rejected','cancelled'].includes(selected.status) ? PURCHASE_STAGES[selected.status] : `Etapa ${Math.max(0,stagePosition(selected.status)) + 1} de ${TRACK_STAGES.length}`}</span></div><ol className="pm-progress">{TRACK_STAGES.map((id,index) => { const completed = (selected.history || []).some(entry => entry.stage === id) && id !== selected.status; const active = id === selected.status || (selected.status === 'exception' && id === 'received'); return <li key={id} className={active ? 'current' : completed ? 'visited' : ''}><span className="pm-step-index">{completed ? '✓' : index + 1}</span><span>{PURCHASE_STAGES[id]}</span></li>; })}</ol>{selected.status === 'exception' && <p className="pm-journey-alert">Divergência aberta: confira a mercadoria e a nota fiscal antes de seguir.</p>}{selected.status === 'finance_dispute' && <p className="pm-journey-alert">Nota fiscal devolvida para correção. O Financeiro fará uma nova conferência após a resposta do recebimento.</p>}</div>
          {pendingPurchaseRole(selected) && <div className="pm-next-step"><div><span>PRÓXIMA AÇÃO</span><strong>{displayUser(selected[pendingPurchaseRole(selected)])}</strong><p>{purchaseOverdue(selected,today) ? 'Prazo da solicitação vencido' : `Necessário em ${dateBR(selected.neededBy)}`}</p></div>{selected[pendingPurchaseRole(selected)] === user?.id && <button type="button" onClick={() => document.querySelector('.pm-actions')?.scrollIntoView({behavior:'smooth',block:'center'})}>Ir para minhas ações <ArrowRight size={15}/></button>}</div>}
          <div className="pm-section"><h4>Responsáveis e aprovações</h4><div className="pm-readonly">
            {[['Solicitante',selected.requesterId,selected.requesterName],['Comprador',selected.buyerId],['Aprovador da alçada',selected.approverId],['Recebimento e NF',selected.receiverId],['Destinatário',selected.recipientId],['Financeiro',selected.financeId]].map(([label,id,name]) => <div key={label}><span>{label}</span><p>{name || displayUser(id)}</p></div>)}
          </div>{manager && draft && selected.status !== 'finance_dispute' && <><div className="pm-fields pm-roles">
            {[['buyerId','Comprador'],['approverId','Aprovador'],['receiverId','Responsável pelo recebimento'],['recipientId','Destinatário'],['financeId','Responsável Financeiro']].map(([key,label]) => <label key={key} className="pm-field"><span>{label}</span><PurchaseSelect label={label} value={draft[key] || ''} options={(key === 'buyerId' ? buyerOptions : users).map(person => [person.id, person.name])} onChange={value => setField(setDraft,key,value)} /></label>)}</div>
            <p className="pm-hint">Aprovador previsto pela alçada: <strong>{policy?.enabled ? displayUser(selected.bundleId ? expectedApprover(policy, groupQuoteTotal, adminId) : expectedId) : 'qualquer administrador da empresa'}</strong>. Salve as atribuições antes de avançar a etapa. Os responsáveis confirmam usando suas próprias contas.</p>
            {selected.bundleId && <button type="button" className="pm-secondary" disabled={busy || !online} onClick={applyRolesToGroup}>Aplicar responsáveis a todos os itens</button>}
            {draft.approverId && [selected.requesterId,draft.buyerId].includes(draft.approverId) && <p className="pm-roles-alert">Solicitante ou comprador também aprova este item. {policy?.preventSelfApproval ? 'A política exige outra pessoa para a aprovação.' : 'Revise a separação de responsabilidades antes de continuar.'}</p>}
          </>}</div>
          <div className="pm-section"><h4>Solicitação e destino</h4><div className="pm-readonly"><div><span>Categoria</span><p>{selected.category || 'Sem categoria'}</p></div><div><span>Especificação</span><p>{selected.specification}</p></div><div><span>Justificativa</span><p>{selected.reason}</p></div><div><span>Quantidade e unidade</span><p>{selected.quantity} {selected.unit}</p></div><div><span>Destino solicitado</span><p>{selected.destination}</p></div><div><span>Data necessária</span><p>{dateBR(selected.neededBy)}</p></div><div><span>Prioridade</span><p>{PRIORITIES[selected.priority] || 'Normal'}</p></div></div></div>
          {editBuyer && draft && selected.status !== 'finance_dispute' && <div className="pm-section"><h4>Compra e rastreamento</h4><div className="pm-fields">{!selected.bundleId && <>{field('supplier','Fornecedor',{disabled:Boolean(selected.approvedAt) || !canQuote})}{field('quotedPrice','Preço unitário (R$)',{type:'number',min:'0',step:'0.01',disabled:Boolean(selected.approvedAt) || !canQuote})}{field('expectedDate','Previsão de entrega',{type:'date',disabled:Boolean(selected.approvedAt) || !canQuote})}</>}{field('orderNumber','Número do pedido',{disabled:Boolean(selected.buyerConfirmedAt)})}{field('carrier','Transportadora ou retirada')}{field('trackingCode','Código ou referência de rastreamento')}</div></div>}
          {editReceiver && draft && selected.status !== 'finance_dispute' && <div className="pm-section"><h4>Recebimento e armazenagem</h4><div className="pm-fields">{field('invoiceNumber','Número da nota fiscal',{disabled:Boolean(selected.invoiceReceivedAt)})}{field('invoiceTotal','Valor total da NF (R$)',{type:'number',min:'0',step:'0.01',disabled:Boolean(selected.invoiceReceivedAt)})}{field('receivedQuantity','Quantidade conferida',{type:'number',min:'0',step:'any'})}{field('condition','Condição',{type:'select',options:[['pending','Não conferida'],['ok','Conforme'],['damaged','Avaria ou não conforme']]})}{field('lot','Lote / identificação')}{field('expiresAt','Validade, se aplicável',{type:'date'})}{field('storageAddress','Endereço físico / posição',{wide:true})}{field('destinationRecipient','Recebido no destino por',{wide:true})}{field('note','Observações e divergências',{type:'textarea',wide:true})}</div><p className="pm-hint">Informe divergência de quantidade ou avaria antes de encaminhar ao estoque. A localização física é obrigatória para armazenar.</p></div>}
          {selected.status === 'rejected' && <div className="pm-review-panel"><strong>Solicitação recusada</strong><p>{(selected.history || []).filter(entry => entry.stage === 'rejected').at(-1)?.detail || selected.note || 'Consulte o aprovador para revisar a solicitação.'}</p><small>{selected.buyerId ? 'O comprador pode rever a cotação e reenviar para aprovação.' : 'A administração pode reabrir a solicitação e designar um comprador.'}</small></div>}
          {latestRejection && selected.status === 'quotation' && <div className="pm-review-panel"><strong>Revisão para nova aprovação</strong><p>Motivo: {latestRejection.detail || 'Não informado'}</p><small>{[['Fornecedor','supplier'],['Preço unitário','quotedPrice'],['Previsão','expectedDate']].filter(([,key]) => latestRejection[key] !== undefined && String(latestRejection[key]) !== String(selected[key] || '')).map(([label]) => label).join(', ') || 'Nenhum dado da cotação alterado'} desde a recusa.</small></div>}
          {selected.financeIssueAt > 0 && <div className="pm-review-panel"><strong>Conferência financeira da NF</strong><p><b>Não conformidade:</b> {selected.financeIssue}</p>{selected.financeResolutionAt > selected.financeIssueAt ? <p><b>Correção informada:</b> {selected.financeResolution}</p> : <small>Aguardando correção de {displayUser(selected.receiverId)}.</small>}</div>}
          {selected.status === 'delivered' && selected.financeId === user?.id && draft && <div className="pm-section pm-finance-check"><h4>Conferência da nota fiscal</h4><p>Confira a NF {selected.invoiceNumber}, os dados do pedido e os atestes. O valor cotado é {(Number(selected.quotedPrice || 0) * Number(selected.quantity || 0)).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}.</p>{field('invoiceTotal','Valor total informado na NF (R$)',{type:'number',min:'0.01',step:'0.01'})}{draft.invoiceTotal > 0 && <p className={purchaseInvoiceMatch(draft).matches ? 'pm-match-ok' : 'pm-roles-alert'}>{purchaseInvoiceMatch(draft).matches ? 'Valor da NF confere com a cotação.' : 'Valor divergente da cotação. Descreva a divergência e devolva para correção.'}</p>}{field('financeIssue','Motivo da não conformidade',{type:'textarea',wide:true,maxLength:1000})}</div>}
          {selected.status === 'finance_dispute' && selected.receiverId === user?.id && draft && <div className="pm-section pm-finance-check"><h4>Corrigir nota fiscal</h4><p>Descreva a correção e atualize o número e valor da NF, se necessário. A conferência e o ateste serão renovados.</p>{field('invoiceNumber','Número da NF corrigida',{maxLength:80})}{field('invoiceTotal','Valor total da NF corrigida (R$)',{type:'number',min:'0.01',step:'0.01'})}{field('financeResolution','Correção realizada',{type:'textarea',wide:true,maxLength:1000})}</div>}
          {selected.invoiceTotal > 0 && selected.status !== 'delivered' && <div className="pm-invoice-summary">NF {selected.invoiceNumber}: {Number(selected.invoiceTotal).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} · {purchaseInvoiceMatch(selected).matches ? 'valor confere' : 'valor divergente'}</div>}
          <div className="pm-section"><h4>Documentos da compra</h4><p className="pm-hint">Cotação, pedido, nota fiscal e comprovantes ficam vinculados a este item e à etapa do envio.</p>{uploadAttachment && selected.status !== 'closed' && <label className="pm-upload"><FileText size={16}/>{uploading ? 'Enviando arquivo...' : 'Adicionar documento'}<input type="file" disabled={uploading || !online} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={attachFile} /></label>}<div className="pm-file-list">{files.map(file => <button type="button" key={file.id} onClick={async () => {try {setError('');await downloadAttachment?.(file,selected.id);} catch (problem) {setError(problem?.message || 'Não foi possível baixar o documento.');}}}><Download size={15}/><span>{file.name}<small>{PURCHASE_STAGES[file.stage] || file.stage} · {displayUser(file.createdBy)} · {new Date(file.createdAt).toLocaleDateString('pt-BR')}</small></span></button>)}{files.length === 0 && <span>Nenhum documento anexado.</span>}</div></div>
          <div className="pm-section"><h4>Atestes do processo</h4><div className="pm-readonly">
            {[['Aprovação da alçada','approvedBy','approvedAt'],['Comprador confirmou o pedido','buyerConfirmedBy','buyerConfirmedAt'],['Mercadoria conferida','receiverConfirmedBy','receiverConfirmedAt'],['Nota fiscal recebida','invoiceReceivedBy','invoiceReceivedAt'],['Destinatário deu o aceite','recipientConfirmedBy','recipientConfirmedAt'],['Financeiro conferiu','financeConfirmedBy','financeConfirmedAt']].map(([label,by,at]) => <div key={label}><span>{label}</span><p>{selected[at] ? `${displayUser(selected[by])} · ${new Date(selected[at]).toLocaleString('pt-BR')}` : 'Pendente'}</p></div>)}
          </div></div>
          {selected.workflowVersion !== 2 && <div className="pm-legacy">Registro feito antes dos atestes por responsável. {manager && !['closed','rejected','cancelled'].includes(selected.status) && <button type="button" disabled={busy || !online} onClick={migrateLegacy}>Reabrir no novo fluxo</button>}</div>}
          {draft && selected.workflowVersion === 2 && <div className="pm-actions">
            {(manager || editBuyer || editReceiver) && selected.status !== 'finance_dispute' && <button type="button" disabled={busy || !online} onClick={() => commit()} className="pm-secondary">Salvar dados</button>}
            {(PURCHASE_NEXT[selected.status] || []).filter(stage => (stage !== 'quotation' || canQuote) && !(selected.bundleId && (stage === 'approved' || (stage === 'quotation' && selected.status === 'requested'))) && (['rejected','cancelled'].includes(stage) ? manager :
              ({ requested: manager ? user?.id : '', quotation: selected.buyerId, approved: selected.approverId, ordered: selected.buyerId,
                in_transit: selected.buyerId, received: selected.receiverId, exception: selected.receiverId,
                stored: selected.receiverId, delivered: selected.status === 'finance_dispute' ? selected.receiverId : selected.recipientId,
                finance_dispute: selected.financeId, closed: selected.financeId })[stage] === user?.id)
            ).map(stage => <button key={stage} type="button" disabled={busy || !online} onClick={() => commit(stage)} className={['rejected','cancelled','finance_dispute'].includes(stage) ? 'pm-secondary' : 'pm-primary'}>{stage === 'closed' ? 'NF conforme · concluir' : stage === 'rejected' ? 'Recusar com motivo' : stage === 'finance_dispute' ? 'NF não conforme · devolver' : stage === 'delivered' && selected.status === 'finance_dispute' ? 'Reenviar ao Financeiro' : stage === 'quotation' && selected.status === 'rejected' ? 'Rever cotação' : stage === 'requested' ? 'Reabrir solicitação' : PURCHASE_STAGES[stage]} <ArrowRight size={15}/></button>)}
            {(['approved','ordered','received','delivered','closed'].includes(selected.status) || (PURCHASE_NEXT[selected.status] || []).some(stage => ['ordered','received','delivered','closed'].includes(stage))) && <label className="pm-ack"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} /> {(PURCHASE_NEXT[selected.status] || []).includes('closed') && selected.financeId === user?.id ? `Conferi a nota fiscal ${selected.invoiceNumber || 'pendente'}, a confirmação do comprador, o recebimento da mercadoria e o aceite do destinatário.` : 'Confirmo pessoalmente as informações e documentos desta etapa.'}</label>}
          </div>}
          <div className="pm-section"><h4>Linha do tempo</h4><ol className="pm-history">{[...(selected.history || [])].reverse().map((entry,index) => <li key={`${entry.at}-${index}`}><span className={`pm-chip ${stageColor(entry.stage)}`}>{PURCHASE_STAGES[entry.stage] || entry.stage}</span><strong>{entry.byName || 'Responsável'}</strong><small>{new Date(entry.at).toLocaleString('pt-BR')}</small>{entry.detail && <p>{entry.detail}</p>}</li>)}</ol></div>
        </>}
      </div>
    </div>
    {formOpen && <div className="pm-overlay" role="presentation"><form className="pm-modal" onSubmit={createRequest} aria-label="Nova solicitação de compra"><header><div><span>COMUNICA INTEGRA</span><h3>Nova solicitação</h3><p>Um item por solicitação. Preencha o destino para acompanhar até a entrega.</p></div><button type="button" aria-label="Fechar formulário" disabled={busy} onClick={() => setFormOpen(false)}><X size={20}/></button></header><div className="pm-form-grid">
      {[['category','Categoria','category'],['item','Item / produto','text'],['specification','Especificação','textarea'],['quantity','Quantidade','number'],['unit','Unidade','text'],['department','Setor solicitante','select'],['destination','Destino / local de uso','text'],['neededBy','Data necessária','date'],['reason','Justificativa','textarea'],['priority','Prioridade','priority']].map(([name,label,type]) => <label key={name} className={type === 'textarea' ? 'pm-wide' : ''}><span>{label}</span>{type === 'textarea' ? <textarea required rows="3" maxLength="1000" value={form[name]} onChange={event => setField(setForm,name,event.target.value)} /> : ['select','category','priority'].includes(type) ? <PurchaseSelect label={label} required value={form[name]} options={type === 'select' ? [...departments.map(dept => [dept.name,dept.name]), ['Outro setor','Outro setor']] : type === 'category' ? PURCHASE_CATEGORIES.map(value => [value,value]) : Object.entries(PRIORITIES)} sort={type !== 'priority'} onChange={value => setField(setForm,name,value)} /> : <input required type={type} min={type === 'number' ? '0.01' : undefined} step={type === 'number' ? 'any' : undefined} maxLength={type === 'text' ? 160 : undefined} value={form[name]} onChange={event => setField(setForm,name,event.target.value)} />}</label>)}
    </div><div className="pm-extra-items"><strong>Itens desta solicitação</strong><p>Setor, destino, prazo e justificativa acima valem para todos. Cada item seguirá a própria cotação e conferência.</p>{extraItems.map((item,index) => <div className="pm-extra-item" key={index}><div><strong>Item {index + 2}</strong><button type="button" onClick={() => setExtraItems(previous => previous.filter((_,position) => position !== index))}>Remover</button></div><div className="pm-form-grid"><label><span>Categoria</span><PurchaseSelect label={`Categoria do item ${index + 2}`} value={item.category} options={PURCHASE_CATEGORIES.map(value => [value,value])} onChange={value => setExtraItems(previous => previous.map((entry,position) => position === index ? {...entry,category:value} : entry))} /></label>{[['item','Produto'],['specification','Especificação'],['quantity','Quantidade'],['unit','Unidade']].map(([name,label]) => <label key={name}><span>{label}</span><input required value={item[name]} type={name === 'quantity' ? 'number' : 'text'} min={name === 'quantity' ? '0.01' : undefined} step={name === 'quantity' ? 'any' : undefined} onChange={event => setExtraItems(previous => previous.map((entry,position) => position === index ? {...entry,[name]:event.target.value} : entry))} /></label>)}</div></div>)}<button type="button" disabled={extraItems.length >= 9} onClick={() => setExtraItems(previous => [...previous,{category:'Outros',item:'',specification:'',quantity:1,unit:'un'}])}><Plus size={15}/> Adicionar item</button></div>{error && <p className="pm-error" role="alert">{error}</p>}<footer><span><MapPin size={15}/> Destino e solicitante ficam vinculados ao pedido.</span><button type="submit" disabled={busy || !online}>{busy ? 'Salvando...' : `Enviar ${extraItems.length + 1} item(ns)`}</button></footer></form></div>}
  </section>;
}
