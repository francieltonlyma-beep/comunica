import { useEffect, useState } from 'react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clipboard, LockKeyhole, ShieldCheck } from 'lucide-react';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
const functions = getFunctions(getApps().length ? getApp() : initializeApp(config), 'us-central1');
const categories = ['Assédio moral', 'Assédio sexual', 'Discriminação', 'Fraude ou irregularidade', 'Segurança e saúde', 'Violação de políticas', 'Outro'];
const statuses = {received: 'Recebida', under_review: 'Em apuração', awaiting_information: 'Aguardando informações', resolved: 'Apurada', closed: 'Encerrada'};
const companyId = new URLSearchParams(window.location.search).get('empresa') || '';

export default function PublicWhistleblowing() {
  const [company, setCompany] = useState(null);
  const [busy, setBusy] = useState(true);
  const [mode, setMode] = useState('report');
  const [identified, setIdentified] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [protocol, setProtocol] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [statusResult, setStatusResult] = useState(null);

  useEffect(() => {
    if (!companyId) { setError('Este link não identifica a empresa. Solicite o endereço correto ao RH.'); setBusy(false); return; }
    httpsCallable(functions, 'getWhistleblowingCompany')({companyId})
      .then(response => setCompany(response.data))
      .catch(() => setError('Não foi possível localizar a empresa deste canal.'))
      .finally(() => setBusy(false));
  }, []);

  const submit = async event => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const response = await httpsCallable(functions, 'submitWhistleblowingReport')({companyId, category, description, identified, reporterName: name, reporterEmail: email, website});
      setResult(response.data);
      setDescription(''); setName(''); setEmail(''); setCategory('');
    } catch (failure) { setError(failure?.message || 'Não foi possível enviar o relato. Revise os dados e tente novamente.'); }
    finally { setBusy(false); }
  };

  const checkStatus = async event => {
    event.preventDefault(); setError(''); setBusy(true); setStatusResult(null);
    try {
      const response = await httpsCallable(functions, 'getWhistleblowingStatus')({companyId, protocol, accessKey});
      setStatusResult(response.data);
    } catch (failure) { setError(failure?.message || 'Não foi possível consultar o protocolo.'); }
    finally { setBusy(false); }
  };
  const copyCredentials = async () => {
    try { await navigator.clipboard.writeText(`Protocolo: ${result.protocol}\nChave de acesso: ${result.accessKey}`); }
    catch { /* O protocolo e a chave continuam visíveis para cópia manual. */ }
  };

  return <main id="main-content" tabIndex="-1" className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ffe4e6_0%,_#f8fafc_48%,_#e0f2fe_100%)] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-rose-700 to-red-900 text-white shadow-lg"><ShieldCheck className="h-6 w-6" /></div><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-800">Comunica · Canal protegido</p><h1 className="text-lg font-black">Central de Denúncias</h1></div></header>
      <section className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="bg-gradient-to-r from-slate-950 via-rose-950 to-red-800 px-6 py-7 text-white sm:px-8"><span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-rose-200">{company?.companyName || (busy ? 'Carregando canal…' : 'Canal da empresa')}</span><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Sua voz merece ser ouvida.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-rose-100/80">Registre uma situação com segurança ou acompanhe um relato já enviado usando seu protocolo.</p></div>
        <div className="p-5 sm:p-8">
          {error && <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
          {result ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6"><CheckCircle2 className="h-8 w-8 text-emerald-700" /><h3 className="mt-3 text-lg font-black text-emerald-950">Relato recebido com segurança</h3><p className="mt-1 text-sm leading-6 text-emerald-900">Guarde os dados abaixo. A chave é exibida uma única vez e será necessária para acompanhar o protocolo.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-emerald-200 bg-white p-4"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Protocolo</span><strong className="mt-1 block font-mono text-lg text-slate-950">{result.protocol}</strong></div><div className="rounded-xl border border-emerald-200 bg-white p-4"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Chave secreta</span><strong className="mt-1 block break-all font-mono text-sm text-slate-950">{result.accessKey}</strong></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={copyCredentials} type="button" className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white"><Clipboard className="h-4 w-4" /> Copiar protocolo e chave</button><button onClick={() => { setResult(null); setMode('status'); }} type="button" className="rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-bold text-emerald-900">Acompanhar relato</button></div></div> : <>
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1"><button onClick={() => { setMode('report'); setError(''); }} type="button" className={`rounded-lg px-3 py-2.5 text-xs font-extrabold ${mode === 'report' ? 'bg-white text-rose-900 shadow-sm' : 'text-slate-500'}`}>Fazer um relato</button><button onClick={() => { setMode('status'); setError(''); }} type="button" className={`rounded-lg px-3 py-2.5 text-xs font-extrabold ${mode === 'status' ? 'bg-white text-rose-900 shadow-sm' : 'text-slate-500'}`}>Acompanhar protocolo</button></div>
            {mode === 'report' ? <form onSubmit={submit} className="space-y-4">
              <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-600">Categoria<select required value={category} onChange={event => setCategory(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium normal-case text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"><option value="">Selecione a categoria</option>{categories.map(item => <option key={item}>{item}</option>)}</select></label>
              <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-600">O que aconteceu?<textarea required minLength={30} maxLength={8000} value={description} onChange={event => setDescription(event.target.value)} rows={7} placeholder="Descreva os fatos, datas aproximadas, local e outras informações que ajudem a apuração. Evite incluir dados desnecessários." className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 p-3.5 text-sm font-normal normal-case leading-6 text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" /><span className="mt-1 block text-right text-[10px] font-normal normal-case text-slate-400">{description.length}/8.000 · mínimo 30 caracteres</span></label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" checked={identified} onChange={event => setIdentified(event.target.checked)} className="mt-0.5 accent-rose-700" /><span><strong className="block text-xs text-slate-800">Quero me identificar</strong><span className="mt-1 block text-[10px] leading-5 text-slate-500">Se não marcar, seu nome e e-mail não serão solicitados nem exibidos à empresa.</span></span></label>
              {identified && <div className="grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-extrabold uppercase text-slate-600">Nome<input required maxLength={120} value={name} onChange={event => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium normal-case text-slate-900 outline-none focus:border-rose-400" /></label><label className="text-[10px] font-extrabold uppercase text-slate-600">E-mail<input required type="email" maxLength={200} value={email} onChange={event => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium normal-case text-slate-900 outline-none focus:border-rose-400" /></label></div>}
              <label aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label>
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-950"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><span>O relato e sua identificação (se informada) ficam restritos à equipe autorizada. A opção sem identificação oculta seus dados da empresa, mas não representa anonimato técnico absoluto: provedores podem processar dados de conexão.</span></div>
              <button disabled={busy || !company} type="submit" className="w-full rounded-xl bg-gradient-to-r from-rose-800 to-red-700 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-rose-900/15 transition hover:brightness-110 disabled:opacity-50">{busy ? 'Enviando com segurança…' : 'Enviar relato confidencial'}</button>
            </form> : <form onSubmit={checkStatus} className="space-y-4"><p className="text-xs leading-5 text-slate-600">Informe o protocolo e a chave secreta recebidos após o envio. Sem os dois dados, ninguém consegue consultar este relato.</p><label className="block text-[10px] font-extrabold uppercase text-slate-600">Protocolo<input required value={protocol} onChange={event => setProtocol(event.target.value.toUpperCase())} placeholder="DEN-2026-000001" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-mono text-sm normal-case text-slate-900 outline-none focus:border-rose-400" /></label><label className="block text-[10px] font-extrabold uppercase text-slate-600">Chave secreta<input required value={accessKey} onChange={event => setAccessKey(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-mono text-sm normal-case text-slate-900 outline-none focus:border-rose-400" /></label><button disabled={busy || !company} type="submit" className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white disabled:opacity-50">{busy ? 'Consultando…' : 'Consultar andamento'}</button>{statusResult && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><span className="text-[9px] font-bold uppercase tracking-wide text-blue-700">{statusResult.protocol}</span><strong className="mt-1 block text-base text-blue-950">{statuses[statusResult.status] || statusResult.status}</strong>{statusResult.publicReply && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">{statusResult.publicReply}</p>}<p className="mt-2 text-[10px] text-slate-500">Atualizado em {new Intl.DateTimeFormat('pt-BR', {dateStyle: 'medium', timeStyle: 'short'}).format(new Date(statusResult.updatedAt))}</p></div>}</form>}
          </>}
        </div>
      </section>
      <footer className="mt-5 flex items-center justify-between gap-3 text-[10px] text-slate-500"><span>Comunica · Canal confidencial da empresa</span><a href="/" className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-rose-800"><ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Comunica</a></footer>
    </div>
  </main>;
}
