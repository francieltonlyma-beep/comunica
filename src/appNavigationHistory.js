export const APP_NAVIGATION_HISTORY_KEY = 'comunicaNavigation';

const APP_TABS = new Set([
  'dashboard', 'inbox', 'updates', 'announcements', 'sectors', 'polls',
  'services', 'documents', 'scale', 'productivity', 'careers',
  'whistleblowing', 'management', 'support',
]);
const SERVICE_WORKSPACES = new Set(['requests', 'activities', 'management']);
const DASHBOARD_DETAILS = new Set(['active', 'offDuty', 'vacation']);

const safeString = (value, maximum = 200) => typeof value === 'string' ? value.slice(0, maximum) : '';

export const normalizeAppNavigation = value => {
  const source = value && typeof value === 'object' ? value : {};
  const threadId = safeString(source.threadId);
  return {
    tab: APP_TABS.has(source.tab) ? source.tab : 'dashboard',
    threadId,
    composing: Boolean(source.composing),
    messagesModal: Boolean(source.messagesModal),
    serviceWorkspace: SERVICE_WORKSPACES.has(source.serviceWorkspace) ? source.serviceWorkspace : 'requests',
    managementTab: safeString(source.managementTab, 80) || 'employees',
    dashboardDetail: DASHBOARD_DETAILS.has(source.dashboardDetail) ? source.dashboardDetail : '',
    serviceActivityKey: safeString(source.serviceActivityKey),
    threadInfo: Boolean(threadId && source.threadInfo),
    addParticipant: Boolean(threadId && source.addParticipant),
  };
};

export const appNavigationKey = value => JSON.stringify(normalizeAppNavigation(value));

export const appHistoryState = (currentState, navigation) => ({
  ...(currentState && typeof currentState === 'object' ? currentState : {}),
  [APP_NAVIGATION_HISTORY_KEY]: normalizeAppNavigation(navigation),
});

export const readAppNavigation = state => {
  if (!state || typeof state !== 'object' || !state[APP_NAVIGATION_HISTORY_KEY]) return null;
  return normalizeAppNavigation(state[APP_NAVIGATION_HISTORY_KEY]);
};
