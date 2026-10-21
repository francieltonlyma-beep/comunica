export const PLATFORM_SUPPORT = Object.freeze({
  id: 'platform-support-francielton', name: 'FRANCIELTON LIMA NUNES',
  role: 'Suporte da Plataforma', isDeveloper: true, isEmployee: false, depts: [], avatar: '',
});
export const withPlatformSupport = users => [
  ...users.filter(user => user.id !== PLATFORM_SUPPORT.id), PLATFORM_SUPPORT,
];
