export const SERVICE_CATALOG = [
  {
    id: 'people',
    label: 'Recursos Humanos',
    shortLabel: 'RH',
    description: 'Declarações, benefícios, dados cadastrais e orientações trabalhistas.',
    detailLabel: 'Documento, benefício ou orientação necessária',
    departmentTerms: ['rh', 'recursos humanos', 'departamento pessoal', 'dp'],
    slaDays: 3,
    requiresApproval: false,
    tone: 'blue',
  },
  {
    id: 'technology',
    label: 'Tecnologia e acessos',
    shortLabel: 'TI',
    description: 'Computadores, sistemas, senhas, equipamentos e problemas de acesso.',
    detailLabel: 'Equipamento, sistema ou acesso afetado',
    departmentTerms: ['ti', 'tecnologia', 'informatica', 'informática', 'sistemas'],
    slaDays: 2,
    requiresApproval: false,
    tone: 'cyan',
  },
  {
    id: 'maintenance',
    label: 'Manutenção e estrutura',
    shortLabel: 'Manutenção',
    description: 'Reparos, instalações, limpeza, segurança e estrutura física.',
    detailLabel: 'Local, equipamento ou estrutura que precisa de atendimento',
    departmentTerms: ['manutencao', 'manutenção', 'infraestrutura', 'administrativo', 'adm'],
    slaDays: 2,
    requiresApproval: false,
    tone: 'amber',
  },
  {
    id: 'uniforms',
    label: 'Uniformes e EPIs',
    shortLabel: 'EPI',
    description: 'Solicitação, troca ou reposição de uniformes e equipamentos de proteção.',
    detailLabel: 'Item, tamanho e quantidade necessária',
    departmentTerms: ['seguranca', 'segurança', 'rh', 'recursos humanos', 'producao', 'produção'],
    slaDays: 5,
    requiresApproval: true,
    tone: 'orange',
  },
  {
    id: 'schedule',
    label: 'Escala, folga e jornada',
    shortLabel: 'Escala',
    description: 'Trocas de turno, folgas, ajustes de jornada e disponibilidade.',
    detailLabel: 'Data, turno e alteração desejada',
    departmentTerms: ['rh', 'recursos humanos', 'gestao', 'gestão', 'administrativo', 'adm'],
    slaDays: 3,
    requiresApproval: true,
    tone: 'violet',
  },
  {
    id: 'documents',
    label: 'Documentos e declarações',
    shortLabel: 'Documentos',
    description: 'Segunda via, declarações, formulários e documentos corporativos.',
    detailLabel: 'Nome do documento e finalidade',
    departmentTerms: ['rh', 'recursos humanos', 'administrativo', 'adm'],
    slaDays: 3,
    requiresApproval: false,
    tone: 'emerald',
  },
  {
    id: 'purchases',
    label: 'Compras e reembolsos',
    shortLabel: 'Compras',
    description: 'Pedidos de compra, materiais, adiantamentos e reembolsos.',
    detailLabel: 'Item, justificativa e valor estimado',
    departmentTerms: ['compras', 'financeiro', 'administrativo', 'adm'],
    slaDays: 5,
    requiresApproval: true,
    tone: 'rose',
  },
  {
    id: 'improvement',
    label: 'Sugestões e melhorias',
    shortLabel: 'Melhoria',
    description: 'Ideias para melhorar processos, atendimento e ambiente de trabalho.',
    detailLabel: 'Área afetada e resultado esperado',
    departmentTerms: ['gestao', 'gestão', 'administrativo', 'adm', 'qualidade'],
    slaDays: 7,
    requiresApproval: false,
    tone: 'indigo',
  },
];

const serviceSettingItems = settings => Array.isArray(settings?.items) ? settings.items : [];

export const sanitizeServiceCatalogSettings = settings => ({
  items: SERVICE_CATALOG.map(category => {
    const override = serviceSettingItems(settings).find(item => item?.id === category.id) || {};
    const guides = (Array.isArray(override.guides) ? override.guides : [])
      .map((guide, index) => ({
        id: String(guide?.id || `${category.id}-guide-${index + 1}`).slice(0, 80),
        title: String(guide?.title || '').trim().slice(0, 120),
        content: String(guide?.content || '').trim().slice(0, 1200),
      }))
      .filter(guide => guide.title || guide.content)
      .slice(0, 8);
    return {
      id: category.id,
      active: override.active !== false,
      slaDays: Math.min(30, Math.max(1, Number(override.slaDays) || category.slaDays)),
      requiresApproval: typeof override.requiresApproval === 'boolean' ? override.requiresApproval : category.requiresApproval,
      defaultRecipientIds: [...new Set((Array.isArray(override.defaultRecipientIds) ? override.defaultRecipientIds : [])
        .map(String)
        .filter(Boolean))].slice(0, 12),
      guides,
    };
  }),
});

export const mergeServiceCatalogSettings = settings => {
  const normalized = sanitizeServiceCatalogSettings(settings);
  return SERVICE_CATALOG.map(category => ({
    ...category,
    ...normalized.items.find(item => item.id === category.id),
  }));
};

export const SERVICE_PRIORITIES = [
  { id: 'normal', label: 'Normal' },
  { id: 'important', label: 'Importante' },
  { id: 'urgent', label: 'Urgente' },
];

export const emptyServiceRequest = categoryId => ({
  categoryId: categoryId || '',
  subject: '',
  description: '',
  extraDetail: '',
  priority: 'normal',
  recipientIds: [],
});

const civilDateParts = value => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? [Number(match[1]), Number(match[2]) - 1, Number(match[3])] : null;
};

export const addBusinessDays = (startDate, businessDays) => {
  const parts = civilDateParts(startDate);
  if (!parts) return '';
  const date = new Date(Date.UTC(parts[0], parts[1], parts[2]));
  let remaining = Math.max(0, Number(businessDays) || 0);
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

export const serviceDueDate = (startDate, category, priority = 'normal') => {
  const baseDays = Math.max(1, Number(category?.slaDays) || 3);
  const days = priority === 'urgent' ? 1 : priority === 'important' ? Math.max(2, Math.ceil(baseDays / 2)) : baseDays;
  return addBusinessDays(startDate, days);
};

export const getServiceCategory = id => SERVICE_CATALOG.find(item => item.id === id) || null;

export const serviceRequestStatus = (metadata, today) => {
  if (metadata?.completedAt) return 'completed';
  if (metadata?.serviceDecision === 'rejected' || metadata?.serviceStatus === 'rejected') return 'rejected';
  if (metadata?.dueDate && today > metadata.dueDate) return 'overdue';
  if (metadata?.serviceStatus === 'waiting_requester') return 'waiting_requester';
  if (metadata?.serviceStatus === 'in_progress') return 'in_progress';
  if (metadata?.serviceRequiresApproval && !metadata?.serviceDecision) return 'approval';
  if (metadata?.serviceDecision === 'approved' || metadata?.serviceStatus === 'approved') return 'approved';
  return 'open';
};

export const serviceStatusLabel = {
  open: 'Nova solicitação',
  in_progress: 'Em atendimento',
  waiting_requester: 'Aguardando solicitante',
  approval: 'Aguardando aprovação',
  approved: 'Aprovada',
  rejected: 'Não aprovada',
  overdue: 'Em atraso',
  completed: 'Concluída',
};
