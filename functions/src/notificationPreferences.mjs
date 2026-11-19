export const NOTIFICATION_TABS = {
  inbox: 'Caixa de entrada',
  announcements: 'Avisos e políticas',
  sectors: 'Canais de setores',
  polls: 'Enquetes e clima',
  services: 'Central de serviços',
  careers: 'Banco de talentos',
  integra: 'Comunica Integra',
  updates: 'Novidades do Comunica',
};

export function notificationTab(type, threadId = '') {
  switch (type) {
    case 'announcement': return 'announcements';
    case 'sector_post':
    case 'post': return 'sectors';
    case 'poll': return 'polls';
    case 'message':
    case 'message_deadline': return 'inbox';
    case 'activity_assignment':
    case 'activity_update':
    case 'activity_deadline': return threadId ? 'inbox' : 'services';
    case 'career_application': return 'careers';
    case 'purchase': return 'integra';
    default: return '';
  }
}

export function notificationEnabled(preferences, tab) {
  return !tab || preferences?.[tab] !== false;
}
