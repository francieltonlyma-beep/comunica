export function eventAnnouncementTitle(event) {
  return `📅 Novo Evento na Agenda: ${event.title}`;
}

export function eventAnnouncementContent(event) {
  const [year, month, day] = String(event.date || '').split('-');
  const formattedDate = `${day}/${month}/${year}`;
  return `Um novo evento oficial foi agendado para o dia ${formattedDate}.\n\nTipo: ${event.type}\nLocal: ${event.location || 'Escritório'}\n\nDetalhes:\n${event.description}`;
}

export function linkedEventAnnouncementIds(event, announcements) {
  if (!event?.id) return [];

  const explicit = announcements.filter(announcement =>
    announcement.sourceEventId === event.id || announcement.id === event.announcementId
  );
  if (explicit.length) return [...new Set(explicit.map(announcement => announcement.id))];

  // Registros antigos não guardavam o vínculo. Eles foram criados no mesmo instante
  // e só são associados quando título e conteúdo originais ainda coincidem.
  const eventTime = Number(/^ev-(\d+)$/.exec(event.id)?.[1]);
  if (!Number.isFinite(eventTime)) return [];
  const legacyMatches = announcements
    .filter(announcement => {
      const announcementTime = Number(/^ann-(\d+)$/.exec(announcement.id)?.[1]);
      return !announcement.sourceEventId
        && announcement.author === 'Agenda Oficial (Sistema)'
        && announcement.title === eventAnnouncementTitle(event)
        && announcement.content === eventAnnouncementContent(event)
        && Number.isFinite(announcementTime)
        && Math.abs(announcementTime - eventTime) <= 60000;
    })
    .sort((a, b) => Math.abs(Number(a.id.slice(4)) - eventTime) - Math.abs(Number(b.id.slice(4)) - eventTime));
  return legacyMatches.length ? [legacyMatches[0].id] : [];
}
