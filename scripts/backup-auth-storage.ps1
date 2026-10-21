$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
Add-Type -AssemblyName System.Net.Http
$cfg=Get-Content -Raw -LiteralPath (Join-Path $env:USERPROFILE '.config/configstore/firebase-tools.json') | ConvertFrom-Json
$headers=@{Authorization='Bearer '+$cfg.tokens.access_token}
$directory=Join-Path $PSScriptRoot ('../backups/auth-storage-'+[DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss'))
$null=New-Item -ItemType Directory -Path $directory
function SaveEncrypted($name,[byte[]]$bytes) {
  $encrypted=[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
  $path=Join-Path $directory $name
  [IO.File]::WriteAllBytes($path,$encrypted)
  $decoded=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($path),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
  $sha=[Security.Cryptography.SHA256]::Create()
  try { if([Convert]::ToBase64String($sha.ComputeHash($bytes)) -ne [Convert]::ToBase64String($sha.ComputeHash($decoded))){throw 'Falha de integridade do backup'} } finally {$sha.Dispose()}
}
function SaveJson($name,$value) { SaveEncrypted $name ([Text.Encoding]::UTF8.GetBytes(($value | ConvertTo-Json -Depth 100 -Compress))) }
$users=[Collections.Generic.List[object]]::new()
$token=''
do {
  $url='https://identitytoolkit.googleapis.com/v1/projects/comunica-salvador/accounts:batchGet?maxResults=1000'
  if($token){$url+='&nextPageToken='+[uri]::EscapeDataString($token)}
  $page=Invoke-RestMethod -TimeoutSec 30 -Headers $headers -Uri $url
  foreach($user in $page.users){$users.Add($user)}
  if($users.Count -gt 3000){throw 'Limite de contas excedido'}
  $token=$page.nextPageToken
}while($token)
SaveJson 'auth.dpapi' @{project='comunica-salvador';users=@($users.ToArray());capturedAt=[DateTime]::UtcNow.ToString('o')}
$bucket='comunica-salvador.firebasestorage.app'
$objects=[Collections.Generic.List[object]]::new()
$token=''
do {
  $url='https://storage.googleapis.com/storage/v1/b/'+$bucket+'/o?maxResults=1000'
  if($token){$url+='&pageToken='+[uri]::EscapeDataString($token)}
  $page=Invoke-RestMethod -TimeoutSec 30 -Headers $headers -Uri $url
  foreach($item in $page.items){$objects.Add($item)}
  if($objects.Count -gt 1000){throw 'Limite de objetos excedido'}
  $token=$page.nextPageToken
}while($token)
$total=($objects | Measure-Object -Property size -Sum).Sum
if($total -gt 100MB){throw 'Volume excede limite de 100 MiB'}
$client=[Net.Http.HttpClient]::new()
$client.Timeout=[TimeSpan]::FromSeconds(60)
$client.DefaultRequestHeaders.Authorization=[Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer',$cfg.tokens.access_token)
$index=0
try {
  foreach($item in $objects) {
    $url='https://storage.googleapis.com/storage/v1/b/'+$bucket+'/o/'+[uri]::EscapeDataString($item.name)+'?alt=media&generation='+$item.generation
    $bytes=$client.GetByteArrayAsync($url).GetAwaiter().GetResult()
    if($bytes.Length -ne [long]$item.size){throw 'Tamanho do anexo divergente'}
    if($item.md5Hash){$md5=[Security.Cryptography.MD5]::Create(); try{if([Convert]::ToBase64String($md5.ComputeHash($bytes)) -ne $item.md5Hash){throw 'Integridade do anexo divergente'}}finally{$md5.Dispose()}}
    SaveEncrypted ('object-'+$index+'.dpapi') $bytes
    $index++
  }
}finally{$client.Dispose()}
SaveJson 'storage-manifest.dpapi' @{bucket=$bucket;objects=@($objects.ToArray());capturedAt=[DateTime]::UtcNow.ToString('o');orderedObjectFiles=$true}
SaveJson 'complete.dpapi' @{complete=$true;authCount=$users.Count;storageCount=$index;storageBytes=$total;consistentSnapshot=$false}
'AUTH_COPIADO_E_CONFERIDO='+$users.Count
'ANEXOS_COPIADOS_E_CONFERIDOS='+$index
'BYTES='+$total
'DIRETORIO='+[IO.Path]::GetFullPath($directory)
