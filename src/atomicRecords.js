export async function commitAtomicRecords(records, createBatch, resolveDocument) {
  if (!records.length || records.length > 450) throw new Error('Quantidade de registros inválida.');
  const references = records.map(record => resolveDocument(record.collection, record.id));
  const batch = createBatch();
  records.forEach((record, index) => {
    if (record.operation === 'update') batch.update(references[index], record.data);
    else if (record.operation === 'delete') batch.delete(references[index]);
    else batch.set(references[index], record.data, { merge: true });
  });
  await batch.commit();
}
