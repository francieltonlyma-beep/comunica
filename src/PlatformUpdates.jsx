import { useState } from 'react';
import { ArrowUpRight, BellRing, Check, CircleHelp, Megaphone, Send, Sparkles, Trash2 } from 'lucide-react';

const destinations = [
  ['dashboard', 'Visão geral'], ['announcements', 'Avisos e políticas'], ['sectors', 'Canais de setores'],
  ['polls', 'Enquetes e clima'], ['documents', 'Documentos'], ['scale', 'Escalas e calendário'],
  ['productivity', 'Produtividade'], ['careers', 'Banco de talentos'], ['whistleblowing', 'Central de Denúncias'],
];

const dateLabel = value => {
  const date = new Date(Number(value) || value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
};

export default function PlatformUpdates({ updates, readIds, onRead, onPublish, onArchive, onImprove, canOpenModule, isDeveloper }) {
  const [draft, setDraft] = useState({ title: '', summary: '', content: '', targetTab: 'dashboard' });
  const [saving, setSaving] = useState(false);
  const [improving, setImproving] = useState(false);
  const [tone, setTone] = useState('profissional e acolhedor');
  const [error, setError] = useState('');
  const activeUpdates = updates.filter(item => item.published !== false).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  const publish = async event => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.summary.trim() || !draft.content.trim()) return;
    setSaving(true); setError('');
    try {
      await onPublish({ ...draft, title: draft.title.trim(), summary: draft.summary.trim(), content: draft.content.trim() });
      setDraft({ title: '', summary: '', content: '', targetTab: 'dashboard' });
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível publicar a novidade.');
    } finally { setSaving(false); }
  };

  const improve = async () => {
    if (!draft.title.trim() && !draft.summary.trim() && !draft.content.trim()) {
      setError('Escreva ao menos um rascunho para a IA aprimorar.');
      return;
    }
    setImproving(true); setError('');
    try {
      const result = await onImprove(draft, tone);
      setDraft(previous => ({ ...previous, ...result }));
    } catch (improveError) {
      setError(improveError.message || 'Não foi possível aprimorar o texto. Tente novamente.');
    } finally { setImproving(false); }
  };

  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 animate-in fade-in duration-300">
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-800 p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="relative flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-cyan-200"><Sparkles className="h-6 w-6" /></span><div><span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-cyan-200">Evolução contínua</span><h2 className="mt-1 text-2xl font-black tracking-tight">Novidades do Comunica</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/80">Conheça os recursos novos, veja como eles ajudam no dia a dia e acesse cada ferramenta diretamente por aqui.</p></div></div>
    </section>

    {isDeveloper && <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Megaphone className="h-5 w-5" /></span><div><h3 className="text-sm font-black text-slate-900">Publicar uma novidade</h3><p className="text-xs text-slate-500">O aviso será disponibilizado para todas as empresas.</p></div></div>
      <form onSubmit={publish} className="grid gap-3 md:grid-cols-2">
        <label className="md:col-span-2"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Título do lançamento</span><input required maxLength={100} value={draft.title} onChange={e => setDraft(v => ({ ...v, title: e.target.value }))} placeholder="Ex.: Agora você pode organizar as conversas por prazo" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" /></label>
        <label><span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Resumo rápido</span><input required maxLength={180} value={draft.summary} onChange={e => setDraft(v => ({ ...v, summary: e.target.value }))} placeholder="Qual benefício essa novidade traz?" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" /></label>
        <label><span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Ferramenta relacionada</span><select value={draft.targetTab} onChange={e => setDraft(v => ({ ...v, targetTab: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">{destinations.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label className="md:col-span-2"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Como funciona / o que mudou</span><textarea required rows={4} maxLength={2000} value={draft.content} onChange={e => setDraft(v => ({ ...v, content: e.target.value }))} placeholder="Explique em linguagem simples como encontrar ou usar o recurso." className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" /></label>
        {error && <p role="alert" className="text-xs font-semibold text-rose-700 md:col-span-2">{error}</p>}
        <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="platform-update-tone">Tom da escrita</label><select id="platform-update-tone" value={tone} onChange={event => setTone(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600"><option value="profissional e acolhedor">Profissional e acolhedor</option><option value="direto e objetivo">Direto e objetivo</option><option value="leve e motivador">Leve e motivador</option></select><button type="button" onClick={improve} disabled={improving || saving} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[10px] font-extrabold text-violet-800 transition hover:bg-violet-100 disabled:opacity-50"><Sparkles className={`h-3.5 w-3.5 ${improving ? 'animate-pulse' : ''}`} />{improving ? 'Aprimorando…' : 'Aprimorar texto com IA'}</button></div><div className="flex items-center justify-between gap-3 sm:justify-end"><p className="hidden items-center gap-1.5 text-[10px] text-slate-400 lg:flex"><CircleHelp className="h-3.5 w-3.5" /> Visível para toda a plataforma.</p><button disabled={saving || improving} className="inline-flex items-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-900 disabled:opacity-50"><Send className="h-4 w-4" />{saving ? 'Publicando…' : 'Publicar novidade'}</button></div></div>
      </form>
    </section>}

    <div className="flex items-center justify-between"><div><h3 className="text-sm font-black text-slate-900">Atualizações recentes</h3><p className="mt-0.5 text-xs text-slate-500">As mais recentes aparecem primeiro.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-blue-800">{activeUpdates.length} novidade(s)</span></div>
    {activeUpdates.length ? <div className="grid gap-4">{activeUpdates.map(update => {
      const unread = !readIds.has(update.id);
      const canNavigate = update.targetTab && canOpenModule(update.targetTab);
      return <article key={update.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${unread ? 'border-cyan-200 ring-1 ring-cyan-100' : 'border-slate-200'}`}>
        <div className="flex gap-4 p-5 sm:p-6"><span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${unread ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-500'}`}><BellRing className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-700">Novidade da plataforma</span>{unread && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[9px] font-black text-cyan-900">NOVA</span>}<time className="ml-auto text-[10px] font-semibold text-slate-400">{dateLabel(update.createdAt)}</time></div><h4 className="mt-2 text-base font-black text-slate-900">{update.title}</h4><p className="mt-1 text-sm font-semibold leading-6 text-blue-900">{update.summary}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{update.content}</p><div className="mt-4 flex flex-wrap items-center gap-2"><button type="button" onClick={() => canNavigate && onRead(update.id, update.targetTab)} disabled={!canNavigate} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-45">{canNavigate ? <>Abrir {destinations.find(([id]) => id === update.targetTab)?.[1] || 'ferramenta'} <ArrowUpRight className="h-4 w-4" /></> : 'Sem acesso a essa ferramenta'}</button>{unread && <button type="button" onClick={() => onRead(update.id)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><Check className="h-4 w-4" /> Marcar como lida</button>}{isDeveloper && <button type="button" onClick={() => onArchive(update.id)} className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /> Arquivar</button>}</div></div></div>
      </article>;
    })}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Sparkles className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">Ainda não há novidades publicadas.</p><p className="mt-1 text-xs text-slate-500">Quando novos recursos forem lançados, você encontrará as orientações aqui.</p></div>}
  </div>;
}
