export function collectionRecordTime(item) {
  const value = item?.createdAt || item?.timestamp || item?.date;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value?.seconds) return value.seconds * 1000;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (value.includes('/')) {
      const [date, time = '00:00:00'] = value.split(' ');
      const [day, month, year] = date.split('/');
      const timestamp = new Date(`${year}-${month}-${day}T${time}`).getTime();
      if (!Number.isNaN(timestamp)) return timestamp;
    }
    const timestamp = new Date(value).getTime();
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  const idTimestamp = Number.parseInt(String(item?.id || '').split('-')[1] || '0', 10);
  return idTimestamp > 1600000000000 ? idTimestamp : 0;
}

export function sortCollectionRecords(records) {
  return [...records].sort((first, second) => collectionRecordTime(second) - collectionRecordTime(first));
}

