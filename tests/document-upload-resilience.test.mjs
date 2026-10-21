import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('document upload is resumable and exposes real progress', () => {
  assert.match(appSource, /uploadBytesResumable\(fileRef, file/);
  assert.match(appSource, /uploadTask\.on\('state_changed'/);
  assert.match(appSource, /bytesTransferred \/ current\.totalBytes/);
  assert.match(appSource, /Enviando arquivo… \$\{documentUploadProgress\}%/);
});

test('document upload validates the same size limit enforced by storage rules', () => {
  assert.match(appSource, /DOCUMENT_FILE_MAX_BYTES = 50 \* 1024 \* 1024/);
  assert.match(appSource, /file\.size > DOCUMENT_FILE_MAX_BYTES/);
  assert.match(appSource, /Formato não aceito/);
});

test('document upload can be cancelled without leaving the modal blocked', () => {
  assert.match(appSource, /documentUploadTask\.current\?\.cancel\(\)/);
  assert.match(appSource, /documentUploadTask\.current = null/);
  assert.match(appSource, /setIsUploadingDocument\(false\)/);
});

test('every upload uses a short path-bound session without replacing the corporate session', () => {
  const uploadSection = appSource.match(/const uploadFileToStorage[\s\S]*?const deleteStoredFile/)?.[0] || '';
  assert.match(uploadSection, /httpsCallable\(functionsClient, 'refreshUploadSession'\)/);
  assert.match(uploadSection, /companyId: activeCompany\.id,[\s\S]{0,100}folder,[\s\S]{0,100}fileName: uniqueName/);
  assert.match(uploadSection, /authorization\.data\?\.token/);
  assert.match(uploadSection, /setPersistence\(uploadAuth, inMemoryPersistence\)/);
  assert.match(uploadSection, /signInWithCustomToken\(uploadAuth, uploadToken\)/);
  assert.match(uploadSection, /return await performUpload\(uploadCredential\.user, isolatedStorage\)/);
  assert.match(uploadSection, /deleteApp\(uploadApp\)/);
});

test('upload authorization never replaces the employee main session', () => {
  const uploadSection = appSource.match(/const uploadFileToStorage[\s\S]*?const deleteStoredFile/)?.[0] || '';
  assert.doesNotMatch(uploadSection, /signInWithCustomToken\(auth,/);
  assert.match(uploadSection, /initializeApp\(firebaseConfig, `upload-/);
});

test('image uploads recognize mobile extensions even when the browser omits MIME type', () => {
  assert.match(appSource, /file\.type !== 'application\/octet-stream'/);
  assert.match(appSource, /jpg: 'image\/jpeg'/);
  assert.match(appSource, /heic: 'image\/heic'/);
  assert.match(appSource, /avif: 'image\/avif'/);
  assert.match(appSource, /IMAGE_FILE_MAX_BYTES = 25 \* 1024 \* 1024/);
});
