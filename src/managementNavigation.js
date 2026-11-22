import {
  Activity, Briefcase, Building, Calendar, CheckCircle2, ClipboardCheck, FileText, Fuel, Gauge, KeyRound, MapPin,
  Layers, Lock, Megaphone, MessageSquare, Package, Sparkles, TrendingUp, Truck, Users, Wrench,
} from 'lucide-react';

export function buildManagementNavigation({unreadCount, unreadUpdates, pendingPollResponses,
  activeServices, pendingDocumentReads, canAccessProductivity, canManageCareers,
  careerPendingCandidateUpdates, canManageWhistleblowing, canUsePersonnel, isAdmin, isDeveloper,
  openPlatformSupport}) {
  return [
    {label:'Comunicação',items:[
      {id:'dashboard',label:'Central de gestão',description:'Prioridades e indicadores',icon:Layers,activeClass:'from-slate-950 to-blue-900',accent:'text-blue-600'},
      {id:'inbox',label:'Caixa de entrada',description:'Conversas, demandas e prazos',icon:MessageSquare,badge:unreadCount || null,activeClass:'from-blue-900 to-cyan-700',accent:'text-blue-600'},
      {id:'updates',label:'Novidades do Comunica',description:'Ferramentas e melhorias',icon:Sparkles,badge:unreadUpdates || null,activeClass:'from-cyan-700 to-blue-700',accent:'text-cyan-700'},
      {id:'announcements',label:'Avisos e políticas',description:'Comunicados oficiais',icon:Megaphone,activeClass:'from-blue-800 to-cyan-700',accent:'text-blue-600'},
      {id:'sectors',label:'Canais de setores',description:'Publicações da equipe',icon:Building,activeClass:'from-cyan-800 to-teal-700',accent:'text-cyan-700'},
      {id:'polls',label:'Enquetes e clima',description:'Escuta e participação',icon:Activity,badge:pendingPollResponses || null,activeClass:'from-violet-800 to-blue-700',accent:'text-violet-600'},
    ]},
    {label:'Trabalho',items:[
      {id:'services',label:'Central de serviços',description:'Solicitações, atividades e checklists',icon:CheckCircle2,badge:activeServices || null,activeClass:'from-blue-900 to-cyan-700',accent:'text-blue-600'},
      {id:'documents',label:'Documentos',description:'Arquivos e políticas',icon:FileText,badge:pendingDocumentReads || null,activeClass:'from-emerald-800 to-teal-700',accent:'text-emerald-600'},
      {id:'scale',label:'Escalas e calendário',description:'Agenda e disponibilidade',icon:Calendar,activeClass:'from-orange-700 to-amber-600',accent:'text-orange-600'},
      canAccessProductivity ? {id:'productivity',label:'Produtividade',description:'Registros de produção',icon:TrendingUp,activeClass:'from-indigo-800 to-violet-700',accent:'text-indigo-600'} : null,
    ].filter(Boolean)},
    {label:'Gestão e suporte',items:[
      canManageCareers ? {id:'careers',label:'Banco de talentos',description:'Vagas e candidaturas',icon:Briefcase,badge:careerPendingCandidateUpdates || null,activeClass:'from-fuchsia-800 to-violet-700',accent:'text-fuchsia-600'} : null,
      canManageWhistleblowing ? {id:'whistleblowing',label:'Central de Denúncias',description:'Relatos confidenciais',icon:Lock,activeClass:'from-rose-900 to-red-700',accent:'text-rose-600'} : null,
      (isAdmin || canUsePersonnel) ? {id:'management',label:'Gestão da equipe',description:'Pessoas e permissões',icon:Users,activeClass:'from-rose-800 to-orange-700',accent:'text-rose-600'} : null,
      isDeveloper ? {id:'support',label:'Central de suporte',description:'Demandas da plataforma',icon:KeyRound,activeClass:'from-slate-900 to-slate-700',accent:'text-slate-600'}
        : {id:'platform-support',label:'Suporte da plataforma',description:'Solicitar atendimento',icon:MessageSquare,action:openPlatformSupport,activeClass:'from-slate-900 to-blue-900',accent:'text-blue-600'},
    ].filter(Boolean)},
  ];
}

const fleetSections = [
  {label:'Operação da frota',items:[
    {id:'fleet',label:'Visão geral da frota',description:'Indicadores e pendências',icon:Gauge},
    {id:'fleet-trips',label:'Viagens e rotas',description:'Saídas, chegadas e GPS',icon:MapPin},
    {id:'fleet-checks',label:'Checklist diário',description:'Inspeções e irregularidades',icon:ClipboardCheck},
    {id:'fleet-fuel',label:'Abastecimentos',description:'Consumo e custo por quilômetro',icon:Fuel},
  ]},
  {label:'Gestão da frota',requiresManager:true,items:[
    {id:'fleet-maintenance',label:'Manutenção',description:'Serviços e vencimentos',icon:Wrench},
    {id:'fleet-vehicles',label:'Veículos',description:'Cadastro e disponibilidade',icon:Truck},
    {id:'fleet-drivers',label:'Motoristas',description:'Vínculos e validade da CNH',icon:Users},
  ]},
];

export function isFleetTab(tab) {
  return fleetSections.some(section => section.items.some(item => item.id === tab));
}

export function canOpenFleetTab(tab, manager) {
  return fleetSections.some(section => (!section.requiresManager || manager) && section.items.some(item => item.id === tab));
}

export function buildIntegraNavigation(manager) {
  return [
    {label:'Compras',items:[
      {id:'integra',label:'Compras',description:'Solicitações, cotações e recebimento',icon:Package},
    ]},
    ...fleetSections.filter(section => !section.requiresManager || manager),
  ].map(section => ({
    label:section.label,
    items:section.items.map(item => ({ ...item, activeClass:'from-teal-900 to-cyan-700', accent:'text-teal-700' })),
  }));
}
