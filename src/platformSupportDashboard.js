const normalize = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLocaleLowerCase('pt-BR');

export const supportMessageTimestamp = message => {
  if (Number.isFinite(Number(message?.timestamp)) && Number(message.timestamp) > 0) return Number(message.timestamp);
  const date = new Date(message?.date || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

export const buildSupportTickets = (companies = [], requestsByCompany = {}, viewerId = '', today = '') => {
  const currentDay = today || new Date().toISOString().slice(0, 10);
  return companies.flatMap(company => (requestsByCompany[company.id] || []).map(message => {
    const completed = Boolean(message.completedAt) || ['completed', 'closed', 'resolved', 'rejected'].includes(message.serviceStatus);
    const overdue = !completed && Boolean(message.dueDate) && String(message.dueDate) < currentDay;
    const unread = Boolean(viewerId) && !(message.readBy || []).includes(viewerId);
    return {
      id: `${company.id}:${message.threadId || message.id}`,
      company,
      message,
      companyId: company.id,
      companyName: company.name || 'Empresa sem nome',
      companyCode: company.code || '',
      threadId: message.threadId || '',
      subject: message.subject || 'Solicitação de suporte',
      requester: message.senderName || 'Colaborador',
      preview: message.content || 'Nova atualização registrada no chamado.',
      timestamp: supportMessageTimestamp(message),
      ticketNumber: Number(message.ticketNumber || 0),
      status: completed ? 'completed' : overdue ? 'overdue' : 'open',
      unread,
      dueDate: message.dueDate || '',
    };
  })).sort((a, b) => Number(b.unread) - Number(a.unread)
    || Number(b.status === 'overdue') - Number(a.status === 'overdue')
    || b.timestamp - a.timestamp);
};

export const filterSupportTickets = (tickets = [], search = '', status = 'all') => {
  const term = normalize(search);
  return tickets.filter(ticket => {
    const matchesStatus = status === 'all'
      || (status === 'unread' ? ticket.unread : ticket.status === status);
    const haystack = normalize(`${ticket.subject} ${ticket.requester} ${ticket.companyName} ${ticket.companyCode} ${ticket.preview} ${ticket.ticketNumber}`);
    return matchesStatus && (!term || haystack.includes(term));
  });
};

export const supportDashboardMetrics = (companies = [], tickets = []) => ({
  companies: companies.length,
  open: tickets.filter(ticket => ticket.status !== 'completed').length,
  unread: tickets.filter(ticket => ticket.unread).length,
  overdue: tickets.filter(ticket => ticket.status === 'overdue').length,
});
