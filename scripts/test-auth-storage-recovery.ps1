param([Parameter(Mandatory=$true)][string]$BackupDirectory)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
function ReadBytes($name) { return ,[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes((Join-Path $BackupDirectory $name)),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser) }
function ReadJson($name) { return [Text.Encoding]::UTF8.GetString((ReadBytes $name)) | ConvertFrom-Json -AsHashtable }
$complete=ReadJson 'complete.dpapi'
$auth=ReadJson 'auth.dpapi'
$manifest=ReadJson 'storage-manifest.dpapi'
if(!$complete.complete -or $auth.project -ne 'comunica-salvador' -or $manifest.bucket -ne 'comunica-salvador.firebasestorage.app'){throw 'Backup inesperado'}
if($auth.users.Count -ne $complete.authCount -or $manifest.objects.Count -ne $complete.storageCount){throw 'Contagem invalida'}
$authUrl='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-comunica-recovery/accounts'
$headers=@{Authorization='Bearer owner'} # Credencial reservada ao emulador, nao e token de producao.
$existing=Invoke-RestMethod -TimeoutSec 20 -Headers $headers -Uri ($authUrl+':batchGet?maxResults=1000')
if(@($existing.users).Where({$null -ne $_}).Count -eq 0){
$body=@{users=$auth.users} | ConvertTo-Json -Depth 100 -Compress
$imported=Invoke-RestMethod -TimeoutSec 30 -Headers $headers -Method Post -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($body)) -Uri ($authUrl+':batchCreate')
if($imported.error){throw 'Importacao de contas incompleta'}
}
$restored=Invoke-RestMethod -TimeoutSec 20 -Headers $headers -Uri ($authUrl+':batchGet?maxResults=1000')
if(@($restored.users).Count -ne $auth.users.Count){throw 'Contagem de contas divergente'}
foreach($user in $auth.users){
  $copy=@($restored.users | Where-Object localId -eq $user.localId)
  if($copy.Count -ne 1 -or [bool]$copy[0].disabled -ne [bool]$user.disabled -or [string]$copy[0].customAttributes -cne [string]$user.customAttributes){throw 'Identidade ou permissoes divergentes'}
}
'IDENTIDADES_RESTAURADAS_VERIFICADAS='+$auth.users.Count
$bucket='demo-comunica-recovery.appspot.com'
$storageUrl='http://127.0.0.1:9199'
$client=[Net.Http.HttpClient]::new()
$client.DefaultRequestHeaders.Authorization=[Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer','owner')
$sha=[Security.Cryptography.SHA256]::Create()
try {
  for($i=0;$i -lt $manifest.objects.Count;$i++) {
    $item=$manifest.objects[$i]
    $bytes=ReadBytes ('object-'+$i+'.dpapi')
    $name=[uri]::EscapeDataString($item.name)
    $uri=$storageUrl+'/upload/storage/v1/b/'+$bucket+'/o?uploadType=multipart&name='+$name
    $type=if($item.contentType){$item.contentType}else{'application/octet-stream'}
    $objectUrl=$storageUrl+'/storage/v1/b/'+$bucket+'/o/'+$name
    # Restaura metadados customizados, incluindo identificadores usados pelos links.
    $meta=@{name=$item.name;contentType=$type}
    foreach($key in @('metadata','cacheControl','contentDisposition','contentEncoding','contentLanguage')){if($item.ContainsKey($key)){$meta[$key]=$item[$key]}}
    $multipart=[Net.Http.MultipartContent]::new('related')
    try {
      $multipart.Add([Net.Http.StringContent]::new(($meta | ConvertTo-Json -Depth 30 -Compress),[Text.Encoding]::UTF8,'application/json'))
      $content=[Net.Http.ByteArrayContent]::new($bytes)
      $content.Headers.ContentType=[Net.Http.Headers.MediaTypeHeaderValue]::Parse($type)
      $multipart.Add($content)
      $response=$client.PostAsync($uri,$multipart).GetAwaiter().GetResult()
      try { $null=$response.EnsureSuccessStatusCode() } finally { $response.Dispose() }
    } finally { $multipart.Dispose() }
    $copy=$client.GetByteArrayAsync($objectUrl+'?alt=media').GetAwaiter().GetResult()
    if($copy.Length -ne [long]$item.size -or [Convert]::ToBase64String($sha.ComputeHash($copy)) -ne [Convert]::ToBase64String($sha.ComputeHash($bytes))){throw 'Conteudo restaurado divergente'}
  }
}finally{$sha.Dispose();$client.Dispose()}
'ANEXOS_RESTAURADOS_VERIFICADOS='+$manifest.objects.Count
