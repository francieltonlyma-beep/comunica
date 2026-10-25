import {useState} from 'react';
import {Archive, BarChart3, Briefcase, CalendarDays, CheckCircle2, FileText, Headphones, ListChecks, LockKeyhole, MessageSquare, Send, ShieldCheck, Users} from 'lucide-react';

const solutions = [
  {icon: MessageSquare, title: 'Comunicação interna', text: 'Centraliza avisos, políticas, canais e confirmações de leitura para reduzir a dependência de grupos dispersos.'},
  {icon: ListChecks, title: 'Demandas e serviços', text: 'Organiza solicitações, responsáveis, prazos, checklists e históricos para que nenhuma demanda fique sem acompanhamento.'},
  {icon: CalendarDays, title: 'Escalas e calendário', text: 'Planeja jornadas, folgas, férias e eventos com visão mensal da equipe, cobertura por horário e alertas de conflito.'},
  {icon: FileText, title: 'Documentos corporativos', text: 'Mantém procedimentos e formulários organizados por público, versão, revisão e leitura obrigatória.'},
  {icon: Users, title: 'Pessoas e clima', text: 'Reúne enquetes, pesquisas, presença e informações da equipe para apoiar decisões de gestão.'},
  {icon: BarChart3, title: 'Gestão e indicadores', text: 'Mostra demandas, atrasos, resoluções, adoção e pontos de atenção com acesso conforme a responsabilidade de cada perfil.'},
  {icon: Briefcase, title: 'Banco de talentos', text: 'Publica oportunidades, recebe currículos e estrutura a triagem e as etapas do recrutamento.'},
  {icon: ShieldCheck, title: 'Canal de denúncias', text: 'Oferece um canal confidencial com protocolo de acompanhamento e acesso restrito aos responsáveis.'},
];

const cnpjMask = value => String(value || '').replace(/\D/g, '').slice(0, 14)
  .replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
const phoneMask = value => {
  const number = String(value || '').replace(/\D/g, '').slice(0, 13);
  const local = number.startsWith('55') && number.length > 11 ? number.slice(2) : number;
  const formatted = local.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})$/, '$1-$2');
  return number.startsWith('55') && number.length > 11 ? `+55 ${formatted}` : formatted;
};

export default function LoginShowcase({onSubmit}) {
  const [form, setForm] = useState({companyName: '', contactName: '', cnpj: '', phone: '', email: '', interest: '', message: '', website: ''});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const update = (field, value) => setForm(previous => ({...previous, [field]: value}));
  const submit = async event => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError('');
    try {
      await onSubmit(form);
      setSent(true);
      setForm({companyName: '', contactName: '', cnpj: '', phone: '', email: '', interest: '', message: '', website: ''});
    } catch (submitError) {
      const code = String(submitError?.code || '');
      setError(code.includes('resource-exhausted') ? 'Recebemos seus dados recentemente. Aguarde um pouco antes de enviar novamente.' : code.includes('invalid-argument') ? 'Confira os dados informados, principalmente o CNPJ, telefone e e-mail.' : 'Não foi possível enviar agora. Verifique sua conexão e tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return <section className="pb-16 pt-4 text-white sm:pb-24" aria-labelledby="solutions-title">
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-slate-950/20 backdrop-blur sm:p-8">
      <div className="mx-auto max-w-3xl text-center"><span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-cyan-100"><Archive className="h-3.5 w-3.5" /> Uma plataforma, vários processos</span><h2 id="solutions-title" className="mt-4 text-2xl font-black sm:text-3xl">Soluções que organizam a rotina da empresa</h2><p className="mt-3 text-sm leading-6 text-blue-100/70">O Comunica reúne comunicação, pessoas e processos em um ambiente seguro, com permissões por perfil e histórico das ações.</p></div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{solutions.map(item => { const Icon = item.icon; return <article key={item.title} className="group rounded-2xl border border-white/10 bg-[#0b2547]/70 p-4 transition hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-[#10325c]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300/20 to-emerald-300/15 text-cyan-100"><Icon className="h-4.5 w-4.5" /></span><h3 className="mt-4 text-sm font-extrabold">{item.title}</h3><p className="mt-2 text-[11px] leading-5 text-blue-100/65">{item.text}</p></article>; })}</div>
    </div>

    <div id="fale-conosco" className="mt-8 grid overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#102e55] via-[#0b2547] to-[#071b36] shadow-2xl shadow-slate-950/30 lg:grid-cols-[.8fr_1.2fr]">
      <div className="relative overflow-hidden border-b border-white/10 p-6 lg:border-b-0 lg:border-r sm:p-8"><div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" /><div className="relative"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-[#082344]"><Headphones className="h-5 w-5" /></span><h2 className="mt-5 text-2xl font-black">Vamos conversar?</h2><p className="mt-3 text-sm leading-6 text-blue-100/70">Conte um pouco sobre sua empresa. A mensagem chegará diretamente à Central de Suporte do Comunica para que Elton possa entrar em contato.</p><div className="mt-6 space-y-3 text-xs text-blue-100/75"><p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> Entendimento das necessidades da empresa</p><p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> Apresentação dos módulos mais adequados</p><p className="flex items-start gap-2"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" /> Dados usados somente para este contato comercial</p></div></div></div>
      <form onSubmit={submit} className="grid gap-3 p-5 sm:grid-cols-2 sm:p-8" aria-label="Fale conosco">
        <label className="text-[10px] font-bold uppercase tracking-wide text-blue-100/70 sm:col-span-2">Nome da empresa<input required minLength="2" maxLength="160" value={form.companyName} onChange={event => update('companyName', event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none placeholder:text-blue-100/30 focus:border-cyan-300" placeholder="Razão social ou nome fantasia" /></label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-blue-100/70">CNPJ<input required inputMode="numeric" value={form.cnpj} onChange={event => update('cnpj', cnpjMask(event.target.value))} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none placeholder:text-blue-100/30 focus:border-cyan-300" placeholder="00.000.000/0000-00" /></label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-blue-100/70">Pessoa para contato <span className="font-medium normal-case text-blue-100/40">(opcional)</span><input maxLength="120" value={form.contactName} onChange={event => update('contactName', event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none placeholder:text-blue-100/30 focus:border-cyan-300" placeholder="Nome do responsável" /></label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-blue-100/70">Telefone ou WhatsApp<input required inputMode="tel" value={form.phone} onChange={event => update('phone', phoneMask(event.target.value))} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none placeholder:text-blue-100/30 focus:border-cyan-300" placeholder="(27) 99999-9999" /></label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-blue-100/70">E-mail para contato<input required type="email" maxLength="200" value={form.email} onChange={event => update('email', event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none placeholder:text-blue-100/30 focus:border-cyan-300" placeholder="contato@empresa.com.br" /></label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-blue-100/70 sm:col-span-2">Principal interesse<select value={form.interest} onChange={event => update('interest', event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#102e55] px-3.5 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-300"><option value="">Quero conhecer a plataforma completa</option>{solutions.map(item => <option key={item.title} value={item.title}>{item.title}</option>)}</select></label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-blue-100/70 sm:col-span-2">Como podemos ajudar? <span className="font-medium normal-case text-blue-100/40">(opcional)</span><textarea rows="3" maxLength="1200" value={form.message} onChange={event => update('message', event.target.value)} className="mt-1.5 w-full resize-y rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-3 text-sm font-medium normal-case tracking-normal text-white outline-none placeholder:text-blue-100/30 focus:border-cyan-300" placeholder="Conte brevemente o que sua empresa precisa organizar." /></label>
        <label className="absolute -left-[10000px]" aria-hidden="true">Website<input tabIndex="-1" autoComplete="off" value={form.website} onChange={event => update('website', event.target.value)} /></label>
        {error && <p role="alert" className="rounded-xl border border-rose-200/25 bg-rose-300/10 p-3 text-xs font-semibold text-rose-100 sm:col-span-2">{error}</p>}
        {sent && <p role="status" className="rounded-xl border border-emerald-200/25 bg-emerald-300/10 p-3 text-xs font-semibold text-emerald-100 sm:col-span-2">Mensagem enviada. Seus dados já chegaram à Central de Suporte do Comunica.</p>}
        <button type="submit" disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-3.5 text-sm font-extrabold text-[#082344] shadow-lg transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 sm:col-span-2"><Send className="h-4 w-4" /> {sending ? 'Enviando contato…' : 'Solicitar contato'}</button>
      </form>
    </div>
  </section>;
}
