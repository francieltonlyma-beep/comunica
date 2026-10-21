import { useEffect, useMemo, useRef, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import QRCode from 'qrcode';
import { AlertTriangle, Clipboard, ExternalLink, ImagePlus, LockKeyhole, Printer, RefreshCw, Save, ShieldCheck, Trash2, Upload } from 'lucide-react';

const STATUS = [
  ['received', 'Recebida'], ['under_review', 'Em apuração'],
  ['awaiting_information', 'Aguardando informações'], ['resolved', 'Apurada'], ['closed', 'Encerrada'],
];
const dateLabel = value => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(Number(value))) : '—';

const defaultPoster = companyName => ({
  logoUrl: '',
  headline: 'Sua voz merece ser ouvida.',
  message: 'Aponte a câmera do celular para o QR Code e registre um relato com segurança.',
  footer: 'Canal confidencial da empresa',
  companyName: companyName || '',
});

export default function WhistleblowingAdmin({ functionsClient, company, onNotice, loadPosterSettings, savePosterSettings, uploadPosterLogo }) {
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('under_review');
  const [publicReply, setPublicReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [poster, setPoster] = useState(() => defaultPoster(company?.name));
  const [posterLoading, setPosterLoading] = useState(true);
  const [posterSaving, setPosterSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [qrImage, setQrImage] = useState('');
  const loadPosterSettingsRef = useRef(loadPosterSettings);
  const onNoticeRef = useRef(onNotice);
  const companyNameRef = useRef(company?.name);
  const report = reports.find(item => item.id === selectedId);
  const visibleReports = useMemo(() => reports.filter(item => filter === 'all' || item.status === filter), [reports, filter]);
  const publicUrl = `${window.location.origin}/denuncias?empresa=${encodeURIComponent(company?.id || '')}`;

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => loadPosterSettingsRef.current?.())
      .then(saved => {
        if (!cancelled && saved) setPoster({...defaultPoster(companyNameRef.current), ...saved, companyName: saved.companyName || companyNameRef.current || ''});
      })
      .catch(() => { if (!cancelled) onNoticeRef.current?.('Não foi possível carregar a arte salva. Você ainda pode editar e salvar novamente.', 'error'); })
      .finally(() => { if (!cancelled) setPosterLoading(false); });
    return () => { cancelled = true; };
  }, [company?.id]);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(publicUrl, { width: 420, margin: 2, errorCorrectionLevel: 'Q', color: { dark: '#0f172a', light: '#ffffff' } })
      .then(image => { if (!cancelled) setQrImage(image); })
      .catch(() => { if (!cancelled) setQrImage(''); });
    return () => { cancelled = true; };
  }, [publicUrl]);

  const loadReports = async () => {
    if (!functionsClient || !company?.id) return;
    setLoading(true);
    try {
      const result = await httpsCallable(functionsClient, 'listWhistleblowingReports')({ companyId: company.id });
      const items = result.data?.reports || [];
      setReports(items);
      const selected = items.find(item => item.id === selectedId) || items[0];
      setSelectedId(selected?.id || '');
      if (selected) {
        setStatus(selected.status || 'received');
        setPublicReply(selected.publicReply || '');
      }
    } catch (error) {
      onNotice(error?.message || 'Não foi possível carregar os relatos autorizados.', 'error');
    } finally { setLoading(false); }
  };
  // Carrega novamente somente quando a empresa mudar; refresh manual reutiliza a mesma rotina.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { Promise.resolve().then(loadReports); }, [company?.id]);
  const selectReport = item => {
    setSelectedId(item.id);
    setStatus(item.status || 'received');
    setPublicReply(item.publicReply || '');
  };

  const save = async () => {
    if (!report || !functionsClient) return;
    setSaving(true);
    try {
      await httpsCallable(functionsClient, 'updateWhistleblowingReport')({ companyId: company.id, reportId: report.id, status, publicReply });
      onNotice('A atualização do relato foi registrada.');
      await loadReports();
    } catch (error) { onNotice(error?.message || 'Não foi possível atualizar este relato.', 'error'); }
    finally { setSaving(false); }
  };

  const removeReport = async () => {
    if (!report || !functionsClient) return;
    const confirmed = window.confirm(`Excluir permanentemente o relato ${report.protocol}? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    setDeleting(true);
    try {
      await httpsCallable(functionsClient, 'deleteWhistleblowingReport')({ companyId: company.id, reportId: report.id, protocol: report.protocol });
      setReports(previous => previous.filter(item => item.id !== report.id));
      setSelectedId('');
      setPublicReply('');
      onNotice(`Relato ${report.protocol} excluído permanentemente.`);
    } catch (error) { onNotice(error?.message || 'Não foi possível excluir este relato.', 'error'); }
    finally { setDeleting(false); }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(publicUrl); onNotice('Link público copiado.'); }
    catch { onNotice('Não foi possível copiar o link neste dispositivo.', 'error'); }
  };

  const savePoster = async () => {
    if (!savePosterSettings) return;
    setPosterSaving(true);
    try {
      const saved = await savePosterSettings({...poster, companyName: poster.companyName.trim() || company?.name || '', updatedAt: Date.now()});
      if (saved) onNotice('Arte do cartaz salva para esta empresa.');
    } catch (error) { onNotice(error?.message || 'Não foi possível salvar a arte do cartaz.', 'error'); }
    finally { setPosterSaving(false); }
  };

  const uploadLogo = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { onNotice('Selecione um arquivo de imagem para a marca.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { onNotice('A imagem da marca deve ter até 5 MB.', 'error'); return; }
    setLogoUploading(true);
    try {
      const logoUrl = await uploadPosterLogo(file);
      if (!logoUrl) throw new Error('O envio não foi confirmado.');
      setPoster(previous => ({...previous, logoUrl}));
      onNotice('Marca enviada. Salve a arte para manter a alteração.');
    } catch (error) { onNotice(error?.message || 'Não foi possível enviar a imagem da marca.', 'error'); }
    finally { setLogoUploading(false); }
  };

  return <div className="space-y-5 animate-in fade-in duration-300">
    <section className="relative overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-slate-950 via-rose-950 to-red-800 p-6 text-white shadow-xl">
      <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-rose-400/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-rose-100/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-rose-100"><ShieldCheck className="h-3.5 w-3.5" /> Canal confidencial</span><h2 className="mt-3 text-2xl font-black">Central de Denúncias</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-rose-100/80">Relatos ficam em armazenamento privado. Somente administradores e pessoas de RH autorizadas podem consultar e tratar os casos.</p></div>
        <button onClick={copyLink} type="button" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-rose-950 shadow-lg hover:bg-rose-50"><Clipboard className="h-4 w-4" /> Copiar link para divulgar <ExternalLink className="h-3.5 w-3.5" /></button>
      </div>
      <div className="relative mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/10 p-3 text-[10px] leading-5 text-rose-50"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><span>Envios anônimos não mostram o nome à empresa, mas a infraestrutura do serviço pode processar dados técnicos de conexão. Não prometa anonimato técnico absoluto.</span></div>
    </section>

    <section className="grid gap-4 xl:grid-cols-[minmax(280px,.85fr)_minmax(0,1.15fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4"><span className="text-[9px] font-black uppercase tracking-[.16em] text-rose-700">Material de divulgação</span><h3 className="mt-1 text-base font-black text-slate-900">Cartaz com QR Code</h3><p className="mt-1 text-xs leading-5 text-slate-500">Personalize a arte e imprima ou salve como PDF para distribuir na empresa.</p></div>
        {posterLoading ? <div className="mb-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Carregando arte salva…</div> : null}
        <div className="space-y-3">
          <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-600">Marca da empresa</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 transition hover:border-rose-300 hover:bg-rose-50/40">
            {poster.logoUrl ? <img src={poster.logoUrl} alt="Prévia da marca da empresa" className="h-14 w-14 rounded-lg bg-white object-contain p-1 shadow-sm" /> : <span className="grid h-14 w-14 place-items-center rounded-lg bg-white text-slate-400 shadow-sm"><ImagePlus className="h-6 w-6" /></span>}
            <span className="min-w-0 flex-1"><strong className="block text-xs text-slate-800">{logoUploading ? 'Enviando marca…' : poster.logoUrl ? 'Trocar imagem da marca' : 'Inserir logo ou marca'}</strong><span className="mt-1 block text-[10px] text-slate-500">PNG, JPG ou WebP · até 5 MB</span></span>
            <Upload className="h-4 w-4 shrink-0 text-rose-700" /><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadLogo} disabled={logoUploading} className="sr-only" />
          </label>
          {poster.logoUrl && <button type="button" onClick={() => setPoster(previous => ({...previous, logoUrl: ''}))} className="text-[10px] font-semibold text-rose-700 hover:underline">Remover imagem</button>}
          <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-600">Nome da empresa<input value={poster.companyName} onChange={event => setPoster(previous => ({...previous, companyName: event.target.value}))} maxLength={90} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium normal-case text-slate-800 outline-none focus:border-rose-400" placeholder={company?.name || 'Nome da empresa'} /></label>
          <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-600">Chamada principal<input value={poster.headline} onChange={event => setPoster(previous => ({...previous, headline: event.target.value}))} maxLength={100} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium normal-case text-slate-800 outline-none focus:border-rose-400" /></label>
          <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-600">Texto de orientação<textarea value={poster.message} onChange={event => setPoster(previous => ({...previous, message: event.target.value}))} maxLength={240} rows={3} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium normal-case leading-5 text-slate-800 outline-none focus:border-rose-400" /></label>
          <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-600">Rodapé / informação complementar<input value={poster.footer} onChange={event => setPoster(previous => ({...previous, footer: event.target.value}))} maxLength={100} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium normal-case text-slate-800 outline-none focus:border-rose-400" placeholder="Ex.: Aponte a câmera e conte o que aconteceu" /></label>
          <div className="flex flex-wrap gap-2 pt-1"><button type="button" onClick={savePoster} disabled={posterSaving || posterLoading} className="inline-flex items-center gap-2 rounded-xl bg-rose-800 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-rose-900 disabled:opacity-50"><Save className="h-4 w-4" />{posterSaving ? 'Salvando…' : 'Salvar arte'}</button><button type="button" onClick={() => window.print()} disabled={!qrImage} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Printer className="h-4 w-4" />Imprimir / salvar PDF</button></div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2"><div><h3 className="text-sm font-extrabold text-slate-900">Prévia do cartaz</h3><p className="mt-1 text-[10px] text-slate-500">O QR Code abre o formulário público desta empresa.</p></div><button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700"><Clipboard className="h-3.5 w-3.5" />Copiar link</button></div>
        <div className="mx-auto flex min-h-[500px] w-full max-w-[410px] flex-col items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-slate-950 via-rose-950 to-red-800 p-6 text-center text-white shadow-xl sm:p-8">
          {poster.logoUrl ? <img src={poster.logoUrl} alt="Marca da empresa" className="mb-4 h-20 max-w-48 rounded-xl bg-white object-contain p-2 shadow-lg" /> : <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/20 bg-white/10"><ShieldCheck className="h-8 w-8 text-rose-100" /></div>}
          <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-rose-200">{poster.companyName || company?.name || 'Sua empresa'}</span>
          <h4 className="mt-3 text-2xl font-black leading-tight">{poster.headline || 'Sua voz merece ser ouvida.'}</h4>
          <p className="mt-2 max-w-xs text-sm leading-6 text-rose-100">{poster.message || 'Aponte a câmera do celular para o QR Code e registre um relato com segurança.'}</p>
          <div className="mt-5 rounded-2xl bg-white p-3 shadow-xl">{qrImage ? <img src={qrImage} alt="QR Code para acessar a Central de Denúncias" className="h-44 w-44" /> : <div className="grid h-44 w-44 place-items-center text-xs text-slate-500">Gerando QR Code…</div>}</div>
          <p className="mt-4 max-w-xs text-xs font-bold leading-5 text-white">{poster.footer || 'Canal confidencial da empresa'}</p>
          <p className="mt-3 text-[9px] text-rose-200/80">Relate com responsabilidade · Canal externo e confidencial</p>
        </div>
        <p className="mx-auto mt-3 max-w-md break-all text-center text-[9px] leading-4 text-slate-400">{publicUrl}</p>
      </div>
    </section>

    <div className="grid gap-4 xl:grid-cols-[minmax(280px,.8fr)_minmax(0,1.5fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4"><div><h3 className="text-sm font-extrabold text-slate-900">Relatos recebidos</h3><p className="mt-1 text-[10px] text-slate-500">{reports.length} caso(s) · acesso restrito</p></div><button onClick={loadReports} type="button" disabled={loading} aria-label="Atualizar relatos" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div>
        <div className="border-b border-slate-100 p-3"><select value={filter} onChange={event => setFilter(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><option value="all">Todos os status</option>{STATUS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto p-3">{visibleReports.map(item => <button type="button" key={item.id} onClick={() => selectReport(item)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === item.id ? 'border-rose-300 bg-rose-50 ring-1 ring-rose-100' : 'border-slate-200 hover:border-slate-300'}`}><div className="flex items-start justify-between gap-2"><strong className="text-xs font-black text-slate-900">{item.protocol}</strong><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-600">{STATUS.find(([value]) => value === item.status)?.[1] || item.status}</span></div><span className="mt-2 block text-[10px] font-bold text-rose-800">{item.category}</span><span className="mt-1 block text-[10px] text-slate-500">{dateLabel(item.createdAt)} · {item.identified ? item.reporterName : 'Relato sem identificação'}</span></button>)}{!loading && visibleReports.length === 0 && <p className="p-6 text-center text-xs text-slate-500">Nenhum relato nesta seleção.</p>}</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {!report ? <div className="grid min-h-60 place-items-center text-center text-sm text-slate-500"><div><AlertTriangle className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3">Selecione um relato para consultar os detalhes.</p></div></div> : <>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4"><div><span className="text-[9px] font-black uppercase tracking-widest text-rose-700">{report.category}</span><h3 className="mt-1 text-lg font-black text-slate-950">Protocolo {report.protocol}</h3><p className="mt-1 text-[10px] text-slate-500">Recebido em {dateLabel(report.createdAt)} · {report.identified ? `${report.reporterName} · ${report.reporterEmail}` : 'Sem identificação informada'}</p></div><span className="rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-extrabold text-rose-800">{STATUS.find(([value]) => value === report.status)?.[1] || report.status}</span></div>
          <div className="mt-4 rounded-xl bg-slate-50 p-4"><h4 className="text-[10px] font-black uppercase tracking-wide text-slate-500">Relato</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{report.description}</p></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-bold uppercase text-slate-500">Atualizar status<select value={status} onChange={event => setStatus(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-800">{STATUS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[10px] leading-5 text-blue-900">A resposta pública aparece somente para quem possui o protocolo e a chave secreta entregue no envio.</p></div>
          <label className="mt-4 block text-[10px] font-bold uppercase text-slate-500">Resposta para acompanhamento (opcional)<textarea value={publicReply} onChange={event => setPublicReply(event.target.value)} maxLength={1500} rows={4} placeholder="Escreva uma atualização que o autor possa consultar com o protocolo." className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm font-normal normal-case leading-6 text-slate-800 outline-none focus:border-rose-400" /></label>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="text-[10px] text-slate-400">Última atualização: {dateLabel(report.updatedAt)}</span><div className="flex items-center gap-2"><button onClick={removeReport} type="button" disabled={deleting || saving} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" />{deleting ? 'Excluindo…' : 'Excluir relato'}</button><button onClick={save} type="button" disabled={saving || deleting} className="rounded-xl bg-rose-800 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-rose-900 disabled:opacity-50">{saving ? 'Salvando…' : 'Salvar atualização'}</button></div></div>
        </>}
      </section>
    </div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[10px] leading-5 text-amber-950"><strong className="block">Proteção do processo</strong>Não registre aqui situações de risco imediato. Preserve o sigilo, compartilhe informações apenas com responsáveis autorizados e siga os procedimentos internos e legais da empresa.</div>
    <div className="whistleblowing-print-root">
      <style>{`@media print { @page { size: A5 portrait; margin: 8mm; } body * { visibility: hidden !important; } .whistleblowing-print-root, .whistleblowing-print-root * { visibility: visible !important; } .whistleblowing-print-root { display: flex !important; position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; align-items: center !important; justify-content: center !important; } }`}</style>
      <div className="whistleblowing-print-card">
        {poster.logoUrl ? <img src={poster.logoUrl} alt="Marca da empresa" /> : <div className="whistleblowing-print-icon">◈</div>}
        <span>{poster.companyName || company?.name || 'Sua empresa'}</span><h1>{poster.headline || 'Sua voz merece ser ouvida.'}</h1><p>{poster.message || 'Aponte a câmera do celular para o QR Code e registre um relato com segurança.'}</p>
        {qrImage && <img className="whistleblowing-print-qr" src={qrImage} alt="QR Code para acessar a Central de Denúncias" />}
        <strong>{poster.footer || 'Canal confidencial da empresa'}</strong><small>Relate com responsabilidade · Canal externo e confidencial</small>
      </div>
      <style>{`.whistleblowing-print-root{display:none}.whistleblowing-print-card{box-sizing:border-box;width:100%;height:100%;padding:12mm 10mm;border-radius:8mm;background:linear-gradient(145deg,#020617,#4c0519 58%,#991b1b);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:Arial,sans-serif}.whistleblowing-print-card>img:not(.whistleblowing-print-qr){width:auto;height:23mm;max-width:65mm;object-fit:contain;background:#fff;border-radius:4mm;padding:2mm;margin-bottom:7mm}.whistleblowing-print-icon{height:20mm;width:20mm;border-radius:5mm;background:#ffffff22;display:grid;place-items:center;font-size:30pt;margin-bottom:7mm}.whistleblowing-print-card>span{font-size:10pt;letter-spacing:2pt;text-transform:uppercase;color:#fecdd3;font-weight:700}.whistleblowing-print-card h1{font-size:25pt;line-height:1.1;margin:5mm 0 2mm}.whistleblowing-print-card p{font-size:12pt;line-height:1.45;max-width:125mm;color:#ffe4e6;margin:0}.whistleblowing-print-qr{width:58mm;height:58mm;background:#fff;border:3mm solid #fff;border-radius:4mm;margin:7mm 0}.whistleblowing-print-card strong{font-size:11pt;max-width:125mm}.whistleblowing-print-card small{font-size:8pt;color:#fecdd3;margin-top:4mm}`}</style>
    </div>
  </div>;
}
