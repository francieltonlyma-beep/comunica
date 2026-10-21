import React, { useEffect, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut, reload } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Briefcase, FileText, LogOut, MapPin, Search, Upload } from 'lucide-react';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const careerApp = initializeApp(config, 'career-candidates');
const careerAuth = getAuth(careerApp);
const careerFunctions = getFunctions(careerApp, 'us-central1');
const call = name => httpsCallable(careerFunctions, name);
const initialProfile = { name: '', phone: '', city: '', skills: '', resumeText: '' };
const allowedExtensions = /\.(pdf|docx)$/i;

function readableError(error) {
  const code = String(error?.code || '');
  if (code.includes('email-already-in-use')) return 'Este e-mail já tem cadastro. Use a opção Entrar.';
  if (code.includes('invalid-email')) return 'Confira o endereço de e-mail.';
  if (code.includes('weak-password')) return 'Escolha uma senha mais forte, com pelo menos 6 caracteres.';
  if (code.includes('invalid-credential')) return 'E-mail ou senha incorretos.';
  if (code.includes('operation-not-allowed')) return 'O cadastro de candidatos por e-mail ainda não está habilitado. Avise a empresa.';
  return error?.message || 'Não foi possível concluir a operação. Tente novamente.';
}

async function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export default function Careers() {
  const [companyId, setCompanyId] = useState(() => new URLSearchParams(window.location.search).get('empresa') || '');
  const [careerData, setCareerData] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [authMode, setAuthMode] = useState('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState(initialProfile);
  const [profileSaved, setProfileSaved] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [editingApplication, setEditingApplication] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [jobMode, setJobMode] = useState('all');
  const applicationSectionRef = useRef(null);

  const inform = (message, isError = false) => { setNotice(message); setNoticeError(isError); };

  useEffect(() => {
    let previousUid = null;
    return onAuthStateChanged(careerAuth, user => {
      if (previousUid !== (user?.uid || null)) {
        setProfile(initialProfile);
        setProfileSaved(false);
        setResumeFile(null);
        setQuizAnswers([]);
        setSubmitted(false);
        setApplicationStatus(null);
        setEditingApplication(false);
      }
      previousUid = user?.uid || null;
      setCandidate(user);
    });
  }, []);
  useEffect(() => {
    if (!candidate?.emailVerified) return;
    let active = true;
    call('getCareerProfile')().then(result => {
      if (!active || !result.data.profile) return;
      setProfile({ ...result.data.profile, skills: (result.data.profile.skills || []).join(', ') });
      setProfileSaved(true);
    }).catch(() => {});
    return () => { active = false; };
  }, [candidate?.uid, candidate?.emailVerified]);
  useEffect(() => { if (companyId.trim()) loadJobs(companyId); }, []);
  useEffect(() => {
    if (!candidate?.emailVerified || !careerData?.companyId || !selectedJob?.id) return;
    let active = true;
    call('getCareerApplication')({ companyId: careerData.companyId, vacancyId: selectedJob.id }).then(result => {
      if (!active) return;
      setApplicationStatus(result.data.application);
      setSubmitted(Boolean(result.data.application));
      setQuizAnswers(result.data.application?.quizAnswers || []);
    }).catch(() => {});
    return () => { active = false; };
  }, [candidate?.uid, candidate?.emailVerified, careerData?.companyId, selectedJob?.id]);
  useEffect(() => {
    if (!selectedJob?.id) return;
    const frame = window.requestAnimationFrame(() => {
      applicationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedJob?.id]);

  async function loadJobs(id) {
    setBusy(true);
    try {
      const result = await call('listCareerVacancies')({ companyId: id.trim() });
      setCareerData(result.data);
      setSelectedJob(null);
      inform('');
      const url = new URL(window.location.href);
      url.searchParams.set('empresa', id.trim());
      window.history.replaceState({}, '', url);
    } catch (error) { inform(readableError(error), true); }
    finally { setBusy(false); }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (authMode === 'register') {
        const result = await createUserWithEmailAndPassword(careerAuth, email.trim(), password);
        await sendEmailVerification(result.user);
        inform('Cadastro criado. Enviamos um link para confirmar seu e-mail; verifique também a caixa de spam.');
      } else {
        await signInWithEmailAndPassword(careerAuth, email.trim(), password);
        inform('Acesso realizado.');
      }
      setPassword('');
    } catch (error) { inform(readableError(error), true); }
    finally { setBusy(false); }
  }

  async function recoverPassword() {
    if (!email.trim()) return inform('Informe seu e-mail para receber a recuperação de senha.', true);
    setBusy(true);
    try {
      await sendPasswordResetEmail(careerAuth, email.trim());
      inform('Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação. Verifique também a caixa de spam.');
    } catch (error) { inform(readableError(error), true); }
    finally { setBusy(false); }
  }

  async function checkVerification() {
    setBusy(true);
    try {
      await reload(careerAuth.currentUser);
      await careerAuth.currentUser.getIdToken(true);
      setCandidate({ uid: careerAuth.currentUser.uid, email: careerAuth.currentUser.email, emailVerified: careerAuth.currentUser.emailVerified });
      inform(careerAuth.currentUser.emailVerified ? 'E-mail confirmado. Complete seu cadastro.' : 'O e-mail ainda não foi confirmado. Abra o link enviado para sua caixa de entrada.');
    } catch (error) { inform(readableError(error), true); }
    finally { setBusy(false); }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await call('saveCareerProfile')({ ...profile, skills: profile.skills.split(',').map(skill => skill.trim()).filter(Boolean) });
      setProfileSaved(true);
      inform('Dados básicos salvos. Agora escolha uma vaga e anexe o currículo.');
    } catch (error) { inform(readableError(error), true); }
    finally { setBusy(false); }
  }

  async function apply(event) {
    event.preventDefault();
    if (!selectedJob || !careerData || !profileSaved || !resumeFile || !consent) return;
    if (resumeFile.size > 4 * 1024 * 1024 || !allowedExtensions.test(resumeFile.name)) {
      inform('Envie um currículo em PDF ou Word (.docx) com até 4 MB.', true);
      return;
    }
    setBusy(true);
    try {
      await call('uploadCareerResume')({ companyId: careerData.companyId, vacancyId: selectedJob.id, fileName: resumeFile.name, base64: await fileBase64(resumeFile) });
      await call('submitCareerApplication')({ companyId: careerData.companyId, vacancyId: selectedJob.id, answers: quizAnswers, consent: true });
      setSubmitted(true);
      setEditingApplication(false);
      setApplicationStatus(previous => ({ ...(previous || {}), status: previous?.status || 'received', createdAt: previous?.createdAt || Date.now(), retentionUntil: previous?.retentionUntil || Date.now() + 90 * 24 * 60 * 60 * 1000, candidateUpdatedAt: Date.now() }));
      inform(submitted || editingApplication
        ? 'Atualização enviada. A equipe de RH foi avisada para revisar seu cadastro.'
        : selectedJob.source === 'talent_pool'
          ? 'Currículo cadastrado para futuras oportunidades. A empresa poderá considerar seu perfil quando surgir uma vaga compatível.'
          : 'Candidatura recebida. A empresa fará a avaliação humana do seu perfil.');
    } catch (error) { inform(readableError(error), true); }
    finally { setBusy(false); }
  }

  async function withdrawApplication() {
    if (!selectedJob || !careerData || !window.confirm('Deseja retirar esta candidatura? O currículo anexado e os dados enviados para esta vaga serão removidos.')) return;
    setBusy(true);
    try {
      await call('withdrawCareerApplication')({ companyId: careerData.companyId, vacancyId: selectedJob.id });
      setSubmitted(false);
      setApplicationStatus(null);
      setResumeFile(null);
      setQuizAnswers([]);
      setConsent(false);
      setEditingApplication(false);
      inform('Candidatura retirada e currículo removido desta vaga.');
    } catch (error) { inform(readableError(error), true); }
    finally { setBusy(false); }
  }

  async function deleteCandidateProfile() {
    if (!window.confirm('Excluir definitivamente seu cadastro de candidato? Todas as suas candidaturas, currículos e dados básicos serão removidos e esta ação não poderá ser desfeita.')) return;
    setBusy(true);
    try {
      await call('deleteCareerCandidateAccount')();
      setCandidate(null);
      setProfile(initialProfile);
      setProfileSaved(false);
      setSubmitted(false);
      setApplicationStatus(null);
      inform('Seu cadastro de candidato e os dados vinculados foram excluídos.');
    } catch (error) { inform(readableError(error), true); }
    finally { setBusy(false); }
  }

  const updateProfile = (field, value) => { setProfile(previous => ({ ...previous, [field]: value })); setProfileSaved(false); };
  const verified = Boolean(candidate?.emailVerified);
  const questions = selectedJob?.quiz || [];
  const talentPoolJobs = (careerData?.talentPoolRoles || []).map(role => ({
    id: `talent-pool--${role.id}`,
    roleId: role.id,
    title: role.name,
    description: role.description || `Cadastre seu currículo no Banco de Talentos para futuras oportunidades de ${role.name}.`,
    location: 'Banco de Talentos',
    mode: 'Cadastro permanente',
    skills: [],
    quiz: [],
    source: 'talent_pool',
  }));
  const allOpportunities = [...(careerData?.jobs || []), ...talentPoolJobs];
  const visibleJobs = allOpportunities.filter(job => {
    const search = jobSearch.trim().toLocaleLowerCase('pt-BR');
    const matchesSearch = !search || `${job.title} ${job.location} ${job.description} ${(job.skills || []).join(' ')}`.toLocaleLowerCase('pt-BR').includes(search);
    const matchesMode = jobMode === 'all' || job.mode === jobMode || (jobMode === 'talent_pool' && job.source === 'talent_pool');
    return matchesSearch && matchesMode;
  });

  return <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0b2345] to-slate-100 text-slate-900"><main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-7"><header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8"><div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" /><div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl" /><div className="relative flex flex-wrap items-start justify-between gap-5"><div><span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Oportunidades</span><h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Construa seu próximo passo.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100/75">Conheça as vagas, encontre uma oportunidade alinhada ao seu perfil e acompanhe sua candidatura em um ambiente seguro.</p>{careerData && <div className="mt-5 flex flex-wrap items-center gap-3 text-xs"><span className="rounded-xl bg-white/10 px-3 py-2 font-bold text-white">{careerData.companyName}</span><span className="text-blue-100/60">{careerData.jobs.length} vaga(s) aberta(s)</span></div>}</div><div className="flex items-center gap-2"><a href="/" className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur hover:bg-white/15">Acessar Comunica</a></div></div></header>
    {notice && <div role="status" className={`rounded-xl border p-3 text-sm ${noticeError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>{notice}</div>}
    {!careerData && <section className="rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-slate-950/10 backdrop-blur"><form onSubmit={event => { event.preventDefault(); loadJobs(companyId); }} className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-xs font-bold text-slate-700">Identificador do link de carreiras<input required value={companyId} onChange={event => setCompanyId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500" placeholder="Abra o link divulgado pela empresa" /></label><button disabled={busy} type="submit" className="rounded-xl bg-blue-700 px-5 py-3 text-xs font-extrabold text-white shadow-sm disabled:opacity-50">{busy ? 'Carregando...' : 'Ver oportunidades'}</button></form></section>}
    {careerData && <><section className="rounded-[1.5rem] border border-white/60 bg-white/95 p-4 shadow-xl shadow-slate-950/10 backdrop-blur"><div className="mb-4 rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-600 p-4 text-white"><span className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-100">Trabalhe conosco</span><h2 className="mt-1 text-lg font-black">Não encontrou uma vaga aberta?</h2><p className="mt-1 text-xs leading-5 text-blue-50/85">Escolha um dos cargos da empresa e envie seu currículo ao Banco de Talentos para futuras oportunidades. Este cadastro não representa uma vaga aberta e permanece disponível por 90 dias.</p></div><div className="grid gap-2 md:grid-cols-[1fr_190px]"><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={jobSearch} onChange={event => setJobSearch(event.target.value)} aria-label="Buscar vagas" placeholder="Buscar por cargo, local ou competência" className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-3 text-xs outline-none focus:border-blue-500" /></label><select value={jobMode} onChange={event => setJobMode(event.target.value)} aria-label="Filtrar modalidade" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold"><option value="all">Todas as oportunidades</option><option value="talent_pool">Futuras oportunidades</option><option>Presencial</option><option>Híbrido</option><option>Remoto</option></select></div></section><section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleJobs.map(job => <button key={job.id} type="button" onClick={() => { setSelectedJob(job); setQuizAnswers([]); setResumeFile(null); setSubmitted(false); setApplicationStatus(null); setEditingApplication(false); }} className={`group relative overflow-hidden rounded-[1.5rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${selectedJob?.id === job.id ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200 hover:border-blue-200'}`}><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${job.source === 'talent_pool' ? 'from-violet-600 via-fuchsia-400 to-cyan-400 opacity-100' : 'from-blue-600 via-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100'} transition`} /><div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${job.source === 'talent_pool' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'}`}><Briefcase className="h-4.5 w-4.5" /></span><span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${job.source === 'talent_pool' ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'}`}>{job.source === 'talent_pool' ? 'Futuras oportunidades' : 'Vaga aberta'}</span></div><h3 className="mt-4 text-base font-extrabold text-slate-950">{job.title}</h3><p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-slate-500"><MapPin className="h-3.5 w-3.5" /> {job.location} · {job.mode}</p><p className="mt-4 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{job.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{(job.skills || []).slice(0, 3).map(skill => <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">{skill}</span>)}</div><span className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-extrabold text-blue-700"><span>{job.source === 'talent_pool' ? 'Cadastrar currículo' : 'Ver detalhes'}</span><span aria-hidden="true">→</span></span></button>)}{visibleJobs.length === 0 && <div className="col-span-full rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Nenhuma oportunidade corresponde à sua busca.</div>}</section></>}
    {selectedJob && <section ref={applicationSectionRef} className="scroll-mt-5 rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-lg font-extrabold">{selectedJob.title}</h2><p className="mt-1 text-xs text-slate-500">{selectedJob.location} · {selectedJob.mode}{selectedJob.closesAt ? ` · Candidaturas até ${selectedJob.closesAt}` : ''}</p>{selectedJob.source === 'talent_pool' && <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs leading-5 text-violet-950"><strong className="block">Cadastro para futuras oportunidades</strong>Este cargo não representa uma vaga aberta neste momento. Seu currículo ficará no Banco de Talentos por até 90 dias e poderá ser considerado quando surgir uma oportunidade compatível.</div>}<p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selectedJob.description}</p><p className="mt-3 text-xs text-slate-600"><strong>Competências desejadas:</strong> {(selectedJob.skills || []).join(', ') || 'Não especificadas'}</p></section>}
    {selectedJob && !candidate && <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-sm font-extrabold">{authMode === 'register' ? 'Crie seu acesso de candidato' : 'Entre no seu acesso de candidato'}</h2><p className="mt-1 text-xs text-slate-500">Este cadastro é separado do acesso de colaboradores da empresa.</p><form onSubmit={handleAuth} className="mt-4 grid gap-3 sm:grid-cols-2"><input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Seu e-mail" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input required type="password" minLength={6} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Senha" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><button disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{authMode === 'register' ? 'Cadastrar' : 'Entrar'}</button><button type="button" onClick={() => setAuthMode(value => value === 'register' ? 'login' : 'register')} className="text-xs font-bold text-blue-700">{authMode === 'register' ? 'Já tenho cadastro' : 'Criar cadastro'}</button>{authMode === 'login' && <button type="button" disabled={busy} onClick={recoverPassword} className="text-left text-xs font-bold text-slate-600">Esqueci minha senha</button>}</form></section>}
    {selectedJob && candidate && !verified && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><strong>Confirme seu e-mail para continuar.</strong><p className="mt-1 text-xs">Enviamos um link para {candidate.email}.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={checkVerification} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white">Já confirmei</button><button type="button" disabled={busy} onClick={() => sendEmailVerification(careerAuth.currentUser).then(() => inform('Novo e-mail enviado.')).catch(error => inform(readableError(error), true))} className="text-xs font-bold">Reenviar e-mail</button><button type="button" onClick={() => signOut(careerAuth)} className="text-xs">Sair</button></div></section>}
    {selectedJob && candidate && verified && <><section className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-extrabold">Seus dados básicos</h2><button type="button" onClick={() => signOut(careerAuth)} className="flex items-center gap-1 text-xs text-slate-500"><LogOut className="h-3.5 w-3.5" /> Sair</button></div><p className="mt-1 text-xs text-slate-500">{candidate.email} · {profileSaved ? 'Cadastro salvo' : 'Salve as alterações antes de se candidatar'}</p><form onSubmit={saveProfile} className="mt-4 grid gap-3 sm:grid-cols-2"><input required maxLength={120} value={profile.name} onChange={event => updateProfile('name', event.target.value)} placeholder="Nome completo" aria-label="Nome completo" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input required maxLength={30} value={profile.phone} onChange={event => updateProfile('phone', event.target.value)} placeholder="Telefone" aria-label="Telefone" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input required maxLength={120} value={profile.city} onChange={event => updateProfile('city', event.target.value)} placeholder="Cidade e estado" aria-label="Cidade e estado" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={profile.skills} onChange={event => updateProfile('skills', event.target.value)} placeholder="Competências separadas por vírgula" aria-label="Competências" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><label className="sm:col-span-2 text-xs font-bold">Resumo do currículo<textarea required minLength={50} maxLength={12000} rows={5} value={profile.resumeText} onChange={event => updateProfile('resumeText', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Descreva experiências, formação e qualificações. O arquivo completo será anexado abaixo." /></label><div className="flex flex-wrap items-center gap-3"><button disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Salvar cadastro</button><button type="button" disabled={busy} onClick={deleteCandidateProfile} className="text-xs font-bold text-rose-700 disabled:opacity-50">Excluir meu cadastro</button></div></form></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-sm font-extrabold">Candidatura: {selectedJob.title}</h2>{submitted && !editingApplication ? <div className="mt-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Candidatura enviada com sucesso.</strong><p className="mt-1 text-xs">Situação: {applicationStatus?.status === 'interview' ? 'Entrevista' : applicationStatus?.status === 'preselected' ? 'Pré-selecionada' : applicationStatus?.status === 'rejected' ? 'Processo finalizado' : applicationStatus?.status === 'reviewing' ? 'Em análise' : applicationStatus?.status === 'closed' ? 'Concluída' : 'Recebida'}.</p>{applicationStatus?.recruitmentUpdate && <div className="mt-3 rounded-xl border border-blue-200 bg-white p-3 text-xs text-slate-700"><strong className="text-blue-900">{applicationStatus.recruitmentUpdate.title || 'Atualização do processo'}</strong><p className="mt-1 whitespace-pre-wrap">{applicationStatus.recruitmentUpdate.message}</p>{applicationStatus?.interview && <p className="mt-2 font-semibold text-slate-900">Entrevista: {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(`${applicationStatus.interview.date}T12:00:00`))} às {applicationStatus.interview.time} · {applicationStatus.interview.format}{applicationStatus.interview.location ? ` — ${applicationStatus.interview.location}` : ''}<br />Contato: {applicationStatus.interview.contact}</p>}</div>}{applicationStatus?.retentionUntil && <p className="mt-1 text-xs">Currículo disponível até {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(applicationStatus.retentionUntil))}.</p>}<div className="mt-3 flex flex-wrap gap-3">{!['closed', 'rejected'].includes(applicationStatus?.status) && <button type="button" disabled={busy} onClick={() => { setEditingApplication(true); setResumeFile(null); setConsent(true); }} className="text-xs font-bold text-blue-700 disabled:opacity-50">Atualizar candidatura</button>}<button type="button" disabled={busy} onClick={withdrawApplication} className="text-xs font-bold text-rose-700 disabled:opacity-50">Retirar candidatura e remover currículo</button></div></div> : <form onSubmit={apply} className="mt-4 space-y-4"><div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900"><strong>{editingApplication ? 'Atualize sua candidatura' : 'Envie sua candidatura'}</strong><p className="mt-1">Para manter a análise correta, anexe a versão atual do currículo. O RH será avisado sobre a atualização.</p></div><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 p-4 text-xs font-bold text-slate-700"><Upload className="h-4 w-4" /> {resumeFile ? `${resumeFile.name} (${Math.round(resumeFile.size / 1024)} KB)` : 'Anexar currículo em PDF ou Word (.docx), até 4 MB'}<input required type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => setResumeFile(event.target.files?.[0] || null)} className="sr-only" /></label>{questions.map((question, index) => <fieldset key={index} className="rounded-xl border border-slate-200 p-4"><legend className="px-1 text-xs font-bold">{question.question}</legend><div className="mt-2 flex flex-col gap-2">{question.options.map((option, optionIndex) => <label key={optionIndex} className="flex items-center gap-2 text-xs"><input type="radio" name={`quiz-${index}`} required checked={quizAnswers[index] === optionIndex} onChange={() => setQuizAnswers(previous => { const next = [...previous]; next[index] = optionIndex; return next; })} />{option}</label>)}</div></fieldset>)}<details className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><summary className="cursor-pointer font-bold text-slate-800">Como seus dados serão usados</summary><p className="mt-2 leading-relaxed">Seus dados básicos, currículo e respostas serão compartilhados com a empresa responsável por esta vaga para análise do processo seletivo. O currículo será mantido por 90 dias. Perto do vencimento, a empresa poderá prorrogar uma única vez por mais 90 dias para continuidade do processo. O indicador automático é apenas um apoio e não toma a decisão de contratação. Você poderá retirar a candidatura a qualquer momento.</p></details><label className="flex items-start gap-2 text-xs leading-relaxed text-slate-600"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-0.5" />Li as informações acima e autorizo o uso dos meus dados, currículo e respostas pela empresa para analisar esta candidatura.</label><div className="flex flex-wrap gap-3"><button disabled={busy || !profileSaved || !resumeFile} type="submit" className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-xs font-bold text-white disabled:opacity-50"><FileText className="h-4 w-4" /> {busy ? 'Enviando...' : editingApplication ? 'Enviar atualização' : 'Enviar candidatura'}</button>{editingApplication && <button type="button" onClick={() => setEditingApplication(false)} className="text-xs font-bold text-slate-500">Cancelar</button>}</div></form>}</section></>}
    <footer className="pb-4 text-center text-xs text-slate-500"><a href="/privacidade" className="font-bold text-blue-700 underline">Política de Privacidade</a><span className="mx-2">·</span>Comunica</footer>
  </main></div>;
}
