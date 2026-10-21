param([int]$MaxDocuments = 3000, [int]$MaxRequests = 400)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$project = 'comunica-salvador'
$root = 'projects/' + $project + '/databases/(default)/documents'
$base = 'https://firestore.googleapis.com/v1/'
$config = Get-Content -Raw -LiteralPath (Join-Path $env:USERPROFILE '.config/configstore/firebase-tools.json') | ConvertFrom-Json
$headers = @{ Authorization = 'Bearer ' + $config.tokens.access_token }
$script:requests = 0
$documents = [System.Collections.Generic.List[object]]::new()
function Request($uri, $body) {
  $script:requests++
  if ($script:requests % 100 -eq 0) { Write-Host ('PROGRESSO consultas=' + $script:requests + ' documentos=' + $documents.Count) }
  if ($script:requests -gt $MaxRequests) { throw 'Limite de consultas atingido. Nenhum backup completo foi produzido.' }
  if ($null -ne $body) { return Invoke-RestMethod -TimeoutSec 30 -Headers $headers -Method Post -ContentType 'application/json' -Body ($body | ConvertTo-Json) -Uri $uri }
  return Invoke-RestMethod -TimeoutSec 30 -Headers $headers -Uri $uri
}
function Visit($parent) {
  $token = ''
  do {
    $body = @{pageSize=100}
    if ($token) { $body.pageToken=$token }
    $collections = Request ($base + $parent + ':listCollectionIds') $body
    foreach ($collection in $collections.collectionIds) {
      $page = ''
      do {
        $uri = $base + $parent + '/' + [uri]::EscapeDataString($collection) + '?pageSize=300&showMissing=true'
        if ($page) { $uri += '&pageToken=' + [uri]::EscapeDataString($page) }
        $result = Request $uri $null
        foreach ($document in $result.documents) {
          if ($document.createTime) {
            if ($documents.Count -ge $MaxDocuments) { throw 'Limite de documentos atingido. Nenhum backup completo foi produzido.' }
            $documents.Add($document)
          }
          Visit $document.name
        }
        $page=$result.nextPageToken
      } while ($page)
    }
    $token=$collections.nextPageToken
  } while ($token)
}
# Abrange os dados do aplicativo, incluindo subcolecoes de documentos ausentes.
# Nao inclui Firebase Auth, arquivos do Storage ou segredos do servidor.
Visit ($root + '/artifacts/comunica-salvador')
$payload = @{format=1;project=$project;capturedAt=[DateTime]::UtcNow.ToString('o');consistentSnapshot=$false;documents=@($documents.ToArray())} | ConvertTo-Json -Depth 100 -Compress
$bytes=[Text.Encoding]::UTF8.GetBytes($payload)
$encrypted=[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
$directory=Join-Path $PSScriptRoot '../backups'
$null=New-Item -ItemType Directory -Force -Path $directory
$path=Join-Path $directory ('firestore-'+[DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')+'.dpapi')
[IO.File]::WriteAllBytes($path,$encrypted)
$decoded=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($path),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
if ([Convert]::ToBase64String($bytes) -ne [Convert]::ToBase64String($decoded)) { throw 'Falha na verificacao da copia.' }
$verified=[Text.Encoding]::UTF8.GetString($decoded) | ConvertFrom-Json
if (@($verified.documents).Count -ne $documents.Count) { throw 'Contagem inconsistente.' }
Write-Output ('BACKUP_VERIFICADO_DOCUMENTOS='+$documents.Count)
Write-Output ('CONSULTAS='+$script:requests)
Write-Output ('ARQUIVO='+[IO.Path]::GetFullPath($path))
