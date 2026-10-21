param([Parameter(Mandatory=$true)][string]$BackupPath)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
# Destino fixo: apenas emulador local e projeto de demonstracao.
$endpoint='http://127.0.0.1:8080/v1/projects/demo-comunica-recovery/databases/(default)/documents'
$targetRoot='projects/demo-comunica-recovery/databases/(default)/documents'
$bytes=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $BackupPath)),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
$backup=[Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json -AsHashtable
if ($backup.format -ne 1 -or $backup.project -ne 'comunica-salvador') { throw 'Formato ou projeto inesperado.' }
$documents=@($backup.documents)
if (!$documents.Count) { throw 'Backup vazio.' }
$sourceRoot='projects/comunica-salvador/databases/(default)/documents/'
$names=[Collections.Generic.HashSet[string]]::new()
foreach($document in $documents) {
  if (!$document.name.StartsWith($sourceRoot+'artifacts/comunica-salvador/')) { throw 'Caminho fora do escopo.' }
  if (!$names.Add($document.name)) { throw 'Documento duplicado.' }
}
# Nao apaga documentos, nao usa credenciais e nunca aceita URL de producao.
for($offset=0;$offset -lt $documents.Count;$offset+=100) {
  $batch=@($documents | Select-Object -Skip $offset -First 100)
  $writes=@(foreach($document in $batch) {
    $relative=$document.name.Substring($sourceRoot.Length)
    $fields=if($document.fields){$document.fields}else{@{}}
    @{update=@{name=$targetRoot+'/'+$relative;fields=$fields};currentDocument=@{exists=$false}}
  })
  $body=@{writes=$writes} | ConvertTo-Json -Depth 100 -Compress
  $null=Invoke-RestMethod -TimeoutSec 30 -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body)) -Uri ($endpoint+':commit')
}
function Canonical($value) {
  if ($value -is [Collections.IDictionary]) {
    $ordered=[ordered]@{}
    foreach($key in @($value.Keys | Sort-Object)) { $ordered[$key]=Canonical $value[$key] }
    return $ordered
  }
  if ($value -is [array]) { return ,@($value | ForEach-Object { Canonical $_ }) }
  return $value
}
foreach($document in $documents) {
  $relative=$document.name.Substring($sourceRoot.Length)
  $url=$endpoint+'/'+(($relative -split '/' | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/')
  $restored=(Invoke-WebRequest -TimeoutSec 30 -Uri $url).Content | ConvertFrom-Json -AsHashtable
  $expectedFields=if($document.fields){$document.fields}else{@{}}
  $actualFields=if($restored.fields){$restored.fields}else{@{}}
  $expected=Canonical $expectedFields | ConvertTo-Json -Depth 100 -Compress
  $actual=Canonical $actualFields | ConvertTo-Json -Depth 100 -Compress
  if($expected -cne $actual){throw 'Diferenca de campos no ensaio. Nao considerar recuperacao validada.'}
}
'RESTAURACAO_EMULADOR_VERIFICADA='+$documents.Count
