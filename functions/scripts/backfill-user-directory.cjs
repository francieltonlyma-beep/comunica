// Execute uma vez antes de restringir a leitura dos perfis completos.
const {initializeApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const {publicDirectoryProfile} = require('../lib/userDirectory');

if (process.env.GCLOUD_PROJECT !== 'comunica-salvador' &&
    !String(process.env.GCLOUD_PROJECT || '').startsWith('demo-')) {
  throw new Error('Projeto Firebase explícito obrigatório.');
}
initializeApp({projectId:process.env.GCLOUD_PROJECT});
const db = getFirestore();

(async () => {
  const companies = await db.collection('artifacts/comunica-salvador/public/data/companies').listDocuments();
  let created = 0, alreadyPresent = 0;
  for (const company of companies) {
    const users = await company.collection('users').get();
    for (let start = 0; start < users.docs.length; start += 200) {
      const batch = db.batch();
      let pending = 0;
      const entries = users.docs.slice(start, start + 200);
      for (const user of entries) {
        if (user.id === 'platform-support-francielton' || user.data().isDeveloper === true) continue;
        const directory = company.collection('userDirectory').doc(user.id);
        const previous = await directory.get();
        if (previous.exists) { alreadyPresent++; continue; }
        batch.create(directory, publicDirectoryProfile({id:user.id,...user.data()}));
        pending++;
      }
      if (pending) { await batch.commit(); created += pending; }
    }
  }
  console.log(`Diretório: ${created} criados, ${alreadyPresent} já existentes, ${companies.length} empresas.`);
})().catch(error => {console.error('Falha na preparação do diretório:', error); process.exitCode = 1;})
  .finally(() => db.terminate());
