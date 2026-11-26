export function canEditServiceActivity(user, activity, message, canManageActivities) {
  if (!user?.id || !canManageActivities) return false;
  if (user.isAdmin || user.isDeveloper) return true;
  if (!activity) return message?.senderId === user.id;
  const owner = activity.createdBy || message?.senderId;
  return owner === user.id || activity.assigneeIds?.includes(user.id) ||
    (!message && activity.collaborators?.[user.id]?.status === 'accepted');
}
