// Support remains available for authentication and conversations, never as staff.
export const isCompanyEmployee = user => Boolean(user)
  && user.id !== 'platform-support-francielton'
  && user.uid !== 'platform-support-francielton'
  && !user.isDeveloper
  && user.isEmployee !== false;
