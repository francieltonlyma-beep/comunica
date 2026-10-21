import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repository = 'https://github.com/francieltonlyma-beep/comunica.git';
const verifyOnly = process.argv.includes('--verify');
const gitCandidates = [
  process.env.GIT_EXECUTABLE,
  'git',
  ...(process.platform === 'win32' ? [
    join(process.env.ProgramFiles || 'C:\\Program Files', 'Git', 'cmd', 'git.exe'),
    join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Git', 'cmd', 'git.exe'),
    ...(process.env.LOCALAPPDATA ? [join(process.env.LOCALAPPDATA, 'Programs', 'Git', 'cmd', 'git.exe')] : []),
    ...(process.env.USERPROFILE ? [join(process.env.USERPROFILE, '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'native', 'git', 'cmd', 'git.exe')] : []),
  ] : []),
].filter(Boolean);
const gitExecutable = gitCandidates.find(candidate => spawnSync(candidate, ['--version'], {
  stdio: 'ignore', windowsHide: true,
}).status === 0);
function git(args, { optional = false, interactive = false } = {}) {
  if (!gitExecutable) throw new Error('Git nao encontrado. Instale o Git para Windows e abra um novo terminal.');
  // This exact workspace was initialized by Codex's Windows sandbox account.
  // Trust only this path for this process; do not modify global safe.directory.
  const result = spawnSync(gitExecutable, ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, ...args], {
    cwd: root, encoding: 'utf8', stdio: interactive ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !optional) throw new Error(result.stderr?.trim() || `Git falhou: ${args.join(' ')}`);
  return { status: result.status, text: result.stdout?.trim() || '' };
}

try {
  if (!existsSync(resolve(root, '.git'))) throw new Error('Repositorio Git local nao encontrado.');
  const files = git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']).text.split('\0').filter(Boolean);
  for (const file of files) {
    if (file !== '.env.example' && /(^|\/)(\.env($|\.)|backups\/|\.tools\/|\.firebase\/)/.test(file)) {
      throw new Error(`Arquivo local que nao deve ser enviado: ${file}`);
    }
    const path = resolve(root, file);
    if (!existsSync(path) || /\.(png|jpg|jpeg|gif|webp|ico|jar)$/i.test(extname(file))) continue;
    const content = readFileSync(path, 'utf8');
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|"private_key"\s*:/.test(content)) {
      throw new Error(`Possivel credencial em ${file}. Envio interrompido antes de publicar.`);
    }
  }
  console.log(`Pasta: ${root}\nArquivos conferidos: ${files.length}\nDestino: ${repository}`);
  if (verifyOnly) {
    console.log('Conferencia concluida. Nenhum commit ou envio foi realizado.');
    process.exit(0);
  }

  const remotes = git(['remote']).text.split(/\r?\n/);
  if (remotes.includes('origin')) {
    const origin = git(['remote', 'get-url', 'origin']).text;
    if (![repository, repository.replace(/\.git$/, ''), 'git@github.com:francieltonlyma-beep/comunica.git'].includes(origin)) {
      throw new Error('O origin aponta para outro repositorio. Confira antes de continuar.');
    }
  } else git(['remote', 'add', 'origin', repository]);

  git(['fetch', 'origin', 'main'], { interactive: true });
  const head = git(['rev-parse', '--verify', '--quiet', 'HEAD'], { optional: true });
  if (head.status !== 0) {
    const remoteFiles = git(['ls-tree', '-r', '--name-only', 'origin/main']).text.split(/\r?\n/).filter(Boolean);
    if (remoteFiles.some(file => file !== 'README.md')) throw new Error('O GitHub ja tem outros arquivos. Confira as diferencas antes da primeira sincronizacao.');
    console.log('Vinculando ao commit inicial do GitHub e preservando os arquivos de trabalho.');
    // Only the index and branch are initialized; working files are not reset.
    git(['reset', '--mixed', 'origin/main']);
  } else if (git(['merge-base', '--is-ancestor', 'origin/main', 'HEAD'], { optional: true }).status !== 0) {
    throw new Error('Ha alteracoes remotas que precisam ser integradas. Nenhum envio foi feito.');
  }
  const branch = git(['symbolic-ref', '--short', 'HEAD']).text;
  if (branch !== 'main') throw new Error(`A pasta esta na branch ${branch}. Selecione main antes de sincronizar.`);
  git(['add', '--all']);
  const diff = git(['diff', '--cached', '--quiet'], { optional: true });
  if (diff.status === 1) {
    git(['-c', 'user.name=Francielton Lima Nunes', '-c', 'user.email=290133676+francieltonlyma-beep@users.noreply.github.com', 'commit', '-m', 'Sincroniza Comunica com escala inteligente e preparacao para nuvem'], { interactive: true });
  } else if (diff.status !== 0) throw new Error('Nao foi possivel conferir o commit preparado.');
  git(['push', '--set-upstream', 'origin', 'main'], { interactive: true });
  console.log('\nProjeto sincronizado: https://github.com/francieltonlyma-beep/comunica');
  console.log('Configuracao da nuvem e do Firebase: docs/CLOUD_SETUP.md');
} catch (error) {
  console.error(`\nNao foi possivel concluir: ${error.message}`);
  process.exitCode = 1;
}
