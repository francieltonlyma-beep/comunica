import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { parseSupplierCsv, SUPPLIER_COLUMNS, SUPPLIER_FIELDS, supplierDocumentId } from './supplierImport.js';

const EMPTY = Object.fromEntries(SUPPLIER_FIELDS.map(field => [field, '']));
const supplierPath = (db, appId, companyId) => collection(db, 'artifacts', appId, 'public', 'data', 'companies', companyId, 'purchaseSuppliers');

export default function SupplierRegistry({ db, appId, companyId, companyCode, companyName, user, online, onSuppliers }) {
  const [records, setRecords] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const manager = Boolean(user?.isAdmin || user?.isDeveloper);

  useEffect(() => {
    if (!db || !companyId || !user?.id) return undefined;
    return onSnapshot(supplierPath(db, appId, companyId), snapshot => {
      const entries = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      setRecords(entries); onSuppliers(entries); setLoaded(true); setError('');
    }, () => { setLoaded(false); setError('Não foi possível carregar os fornecedores desta empresa.'); });
  }, [appId, companyId, db, onSuppliers, user?.id]);

  const existingIds = useMemo(() => new Set(records.map(item => item.id)), [records]);
  const pending = useMemo(() => {
    if (!preview) return null;
    const seen = new Set(existingIds);
    const add = [], repeated = [];
    for (const record of preview) {
      const id = supplierDocumentId(record);
      if (seen.has(id)) repeated.push(record);
      else { seen.add(id); add.push({ id, ...record }); }
    }
    return { add, repeated };
  }, [existingIds, preview]);
  const visible = records.filter(item => `${item.name} ${item.legalName} ${item.taxId}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).slice(0, 100);

  async function selectFile(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setPreview(null); setError(''); setNotice('');
    if (!file.name.toLowerCase().endsWith('.csv')) return setError('Selecione o arquivo CSV preparado para importação.');
    try { setPreview(parseSupplierCsv(await file.text())); }
    catch (problem) { setError(problem.message || 'Não foi possível ler o arquivo.'); }
  }

  async function importRecords() {
    if (!manager || !loaded || !online || !pending?.add.length || busy || !companyCode || confirmCode.trim() !== companyCode) return;
    setBusy(true); setError(''); setNotice('');
    let saved = 0;
    try {
      const root = supplierPath(db, appId, companyId);
      for (let offset = 0; offset < pending.add.length; offset += 300) {
        const batch = writeBatch(db);
        for (const { id, ...fields } of pending.add.slice(offset, offset + 300)) {
          batch.set(doc(root, id), { ...fields, createdAt: Date.now(), updatedAt: Date.now(), updatedBy: user.id });
        }
        await batch.commit();
        saved = Math.min(offset + 300, pending.add.length);
        setNotice(`${saved} de ${pending.add.length} fornecedores cadastrados.`);
      }
      setPreview(null);
      setNotice(`${saved} fornecedores cadastrados em ${companyName || 'esta empresa'}. ${pending.repeated.length} registros repetidos ou já existentes foram ignorados.`);
    } catch (problem) {
      setError(`A importação parou após ${saved} registros. Confira os cadastros antes de tentar novamente. ${problem?.message || ''}`);
    } finally { setBusy(false); }
  }

  async function saveRecord(event) {
    event.preventDefault();
    if (!manager || !loaded || !online || busy) return;
    const fields = Object.fromEntries(SUPPLIER_FIELDS.map(field => [field, draft[field].trim()]));
    if (!fields.name) return setError('Informe o nome do fornecedor.');
    const id = selectedId || supplierDocumentId(fields);
    if (!selectedId && existingIds.has(id)) return setError('Este fornecedor já está cadastrado. Selecione o registro para editar.');
    setBusy(true); setError('');
    try {
      await setDoc(doc(supplierPath(db, appId, companyId), id), {
        ...fields, ...(selectedId ? {} : { createdAt: Date.now() }), updatedAt: Date.now(), updatedBy: user.id,
      }, { merge: Boolean(selectedId) });
      setDraft(EMPTY); setSelectedId(''); setNotice('Fornecedor salvo.');
    } catch (problem) { setError(problem?.message || 'Não foi possível salvar o fornecedor.'); }
    finally { setBusy(false); }
  }

  return <section className="pm-suppliers" aria-label="Cadastro de fornecedores">
    <header><div><h3>Fornecedores</h3><p>Empresa: <strong>{companyName || 'Empresa selecionada'}</strong>{companyCode ? ` · código ${companyCode}` : ''}</p></div><strong>{loaded ? records.length : 'Carregando...'}</strong></header>
    {error && <p className="pm-error" role="alert">{error}</p>}
    {notice && <p className="pm-notice" role="status">{notice}</p>}
    {manager && <div className="pm-supplier-import">
      <h4>Importar fornecedores</h4><p>Use o CSV com as colunas: {SUPPLIER_COLUMNS.join(', ')}. A importação ignora documentos já cadastrados e documentos repetidos no arquivo.</p>
      <input aria-label="Arquivo CSV de fornecedores" type="file" accept=".csv,text/csv" disabled={busy || !online} onChange={selectFile} />
      {pending && <p>Arquivo: {preview.length} linhas · {pending.add.length} novos cadastros · {pending.repeated.length} repetidos ou existentes.</p>}
      {pending && <label>Confirme o código da empresa<input value={confirmCode} onChange={event => setConfirmCode(event.target.value)} placeholder={companyCode || 'Código da empresa'} /></label>}
      {pending && <button type="button" disabled={!pending.add.length || busy || !loaded || !online || !companyCode || confirmCode.trim() !== companyCode} onClick={importRecords}>{busy ? 'Importando...' : `Cadastrar ${pending.add.length} fornecedores`}</button>}
    </div>}
    <label className="pm-supplier-search">Buscar fornecedor<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome, razão social ou CNPJ/CPF" /></label>
    <div className="pm-supplier-list">{visible.map(item => <button type="button" key={item.id} onClick={() => { setSelectedId(item.id); setDraft(Object.fromEntries(SUPPLIER_FIELDS.map(field => [field, item[field] || '']))); }}><strong>{item.name}</strong><span>{item.taxId || 'Sem CNPJ/CPF'} · {item.city || 'Cidade não informada'}/{item.state || 'UF não informada'}</span></button>)}{loaded && !visible.length && <p>Nenhum fornecedor encontrado.</p>}</div>
    {manager && <form className="pm-supplier-form" onSubmit={saveRecord}><h4>{selectedId ? 'Editar fornecedor' : 'Novo fornecedor'}</h4><div className="pm-form-grid">{SUPPLIER_FIELDS.map((field, index) => <label key={field}><span>{SUPPLIER_COLUMNS[index]}</span><input value={draft[field]} maxLength={field === 'legalName' || field === 'address' ? 240 : 160} onChange={event => setDraft(previous => ({ ...previous, [field]: event.target.value }))} /></label>)}</div><div className="pm-supplier-actions"><button type="button" onClick={() => { setDraft(EMPTY); setSelectedId(''); }}>Limpar</button><button type="submit" disabled={busy || !online || !loaded}>Salvar fornecedor</button></div></form>}
  </section>;
}
