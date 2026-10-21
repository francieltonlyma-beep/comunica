$ErrorActionPreference='Stop'
Remove-Item Alias:Write -ErrorAction SilentlyContinue
$project='demo-comunica-security'
$base='http://127.0.0.1:8080/v1/projects/'+$project+'/databases/(default)/documents'
$path='/artifacts/comunica-salvador/public/data/companies/'
function Token($uid,$company,$admin=$false,$support=$false){
  function B64($s){return [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($s)).TrimEnd('=').Replace('+','-').Replace('/','_')}
  $now=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $payload=@{sub=$uid;user_id=$uid;aud=$project;iss='https://securetoken.google.com/'+$project;iat=$now;exp=$now+3600;auth_time=$now;companyId=$company;isAdmin=$admin;isDeveloper=$support;firebase=@{sign_in_provider='custom'}} | ConvertTo-Json -Depth 8 -Compress
  return (B64 '{"alg":"none","typ":"JWT"}')+'.'+(B64 $payload)+'.'
}
function Fields($values){$f=@{};foreach($key in $values.Keys){$v=$values[$key];$f[$key]=if($v -is [bool]){@{booleanValue=$v}}else{@{stringValue=[string]$v}}};return $f}
function Invoke-PermissionWrite($company,$uid,$data,$token,$expected,$label){
  $body=@{fields=(Fields $data)} | ConvertTo-Json -Depth 10 -Compress
  $status=200
  try{$null=Invoke-RestMethod -TimeoutSec 60 -Method Patch -Headers @{Authorization='Bearer '+$token} -ContentType 'application/json' -Body $body -Uri ($base+$path+$company+'/users/'+$uid)}catch{if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode}else{throw}}
  if($status -ne $expected){throw ('Falhou '+$label+': HTTP '+$status+' esperado '+$expected)}
  'PASS '+$label
}
$user=@{id='worker';name='Usuario teste';companyId='a';isAdmin=$false;isDeveloper=$false;pin='0000';role='Colaborador'}
Invoke-PermissionWrite 'a' 'worker' $user 'owner' 200 'preparar colaborador ficticio'
Invoke-PermissionWrite 'a' 'other' @{id='other';name='Outro teste';companyId='a';isAdmin=$false;pin='0000'} 'owner' 200 'preparar segundo colaborador'
Invoke-PermissionWrite 'a' 'platform-support-francielton' @{id='platform-support-francielton';isDeveloper=$true;pin='0000'} 'owner' 200 'preparar suporte ficticio'
$worker=Token 'worker' 'a'
$admin=Token 'admin' 'a' $true
$support=Token 'support' 'a' $true $true
Invoke-PermissionWrite 'a' 'admin' @{id='admin';isAdmin=$true;companyId='a'} 'owner' 200 'preparar administrador atual'
Invoke-PermissionWrite 'a' 'other' @{id='other';name='Editado';companyId='a';isAdmin=$false;pin='0000'} $admin 200 'permitir edicao administrativa'
Invoke-PermissionWrite 'a' 'admin' @{id='admin';isAdmin=$false;companyId='a'} 'owner' 200 'revogar administrador'
Invoke-PermissionWrite 'a' 'other' @{id='other';name='Revogado';companyId='a';isAdmin=$false;pin='0000'} $admin 403 'bloquear token administrativo desatualizado'
Invoke-PermissionWrite 'a' 'admin' @{id='admin';isAdmin=$true;companyId='a'} 'owner' 200 'restaurar administrador ficticio'
Invoke-PermissionWrite 'a' 'worker' ($user+@{emergencyName='Contato teste'}) $worker 200 'editar proprio contato'
Invoke-PermissionWrite 'a' 'worker' ($user+@{pushTokens='token-ficticio'}) $worker 200 'registrar dispositivo proprio'
$escalated=$user.Clone();$escalated.isAdmin=$true
Invoke-PermissionWrite 'a' 'worker' $escalated $worker 403 'bloquear autopromocao'
$escalated=$user.Clone();$escalated.isDeveloper=$true
Invoke-PermissionWrite 'a' 'worker' $escalated $worker 403 'bloquear elevacao a suporte'
Invoke-PermissionWrite 'a' 'other' @{pin='9999'} $worker 403 'bloquear PIN de terceiro'
Invoke-PermissionWrite 'b' 'outsider' @{name='Teste'} $worker 403 'bloquear outra empresa'
Invoke-PermissionWrite 'a' 'new' @{id='new';name='Novo teste';isDeveloper=$false} $worker 403 'bloquear cadastro por colaborador'
Invoke-PermissionWrite 'a' 'new' @{id='new';name='Novo teste';isDeveloper=$false} $admin 403 'exigir cadastro pelo servidor'
Invoke-PermissionWrite 'a' 'rogue' @{name='Teste';isDeveloper=$true} $admin 403 'bloquear suporte criado por administrador'
Invoke-PermissionWrite 'a' 'platform-support-francielton' @{pin='9999';isDeveloper=$false} $admin 403 'proteger conta de suporte'
Invoke-PermissionWrite 'b' 'support-test' @{name='Teste suporte'} $support 403 'exigir cadastro pelo servidor para suporte'
$changedPin=$user.Clone();$changedPin.pin='9999'
Invoke-PermissionWrite 'a' 'worker' $changedPin $worker 403 'bloquear PIN direto proprio'
Invoke-PermissionWrite 'a' 'worker' $changedPin $admin 403 'bloquear PIN direto pelo administrador'
Invoke-PermissionWrite 'a' 'worker' $changedPin $support 403 'bloquear PIN direto pelo suporte'
function Invoke-PrivateAccess($method,$document,$data,$token,$expected,$label) {
  $status=200
  $parameters=@{Method=$method;Uri=($base+'/'+$document);Headers=@{Authorization='Bearer '+$token};TimeoutSec=20}
  if($method -eq 'Patch'){$parameters.ContentType='application/json';$parameters.Body=(@{fields=(Fields $data)} | ConvertTo-Json -Depth 10 -Compress)}
  try{$null=Invoke-RestMethod @parameters}catch{if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode}else{throw}}
  if($status -ne $expected){throw ('Falhou '+$label+': HTTP '+$status+' esperado '+$expected)}
  'PASS '+$label
}
$realSupport=Token 'platform-support-francielton' 'a' $true $true
$supportConfig='_platformSupport/platform-support-francielton'
Invoke-PermissionWrite 'b' 'target' @{name='Original'} 'owner' 200 'preparar destino de suporte'
Invoke-PrivateAccess Patch $supportConfig @{enabled=$false;appId='comunica-salvador';companyId='a'} 'owner' 200 'preparar autorizacao privada desativada'
Invoke-PermissionWrite 'b' 'target' @{name='Bloqueado'} $realSupport 403 'bloquear suporte desativado'
Invoke-PrivateAccess Patch $supportConfig @{enabled=$true;appId='comunica-salvador';companyId='a'} $realSupport 403 'bloquear autoautorizacao de suporte'
Invoke-PrivateAccess Patch $supportConfig @{enabled=$true;appId='comunica-salvador';companyId='a'} 'owner' 200 'ativar suporte ficticio'
Invoke-PermissionWrite 'b' 'target' @{name='Permitido'} $realSupport 200 'permitir suporte autorizado entre empresas'
Invoke-PermissionWrite 'b' 'target' @{name='Impostor'} $support 403 'bloquear claim de suporte com outro UID'
Invoke-PermissionWrite 'a' 'worker' $changedPin $realSupport 403 'bloquear PIN direto pelo suporte autorizado'
Invoke-PrivateAccess Get $supportConfig $null $realSupport 403 'impedir leitura cliente da autorizacao privada'
Invoke-PrivateAccess Patch '_privateCredentials/fixture' @{digest='fixture'} 'owner' 200 'preparar segredo ficticio'
Invoke-PrivateAccess Get '_privateCredentials/fixture' $null $realSupport 403 'impedir leitura cliente de credenciais'
Invoke-PrivateAccess Patch $supportConfig @{enabled=$false;appId='comunica-salvador';companyId='a'} 'owner' 200 'revogar suporte ficticio'
Invoke-PermissionWrite 'b' 'target' @{name='Sessao antiga'} $realSupport 403 'bloquear sessao de suporte apos revogacao'
Invoke-PrivateAccess Get 'artifacts/comunica-salvador/public/data/companies/a/users/worker' $null $realSupport 403 'bloquear fallback de suporte revogado na empresa de origem'
'MATRIZ_DE_ESCRITA_VALIDADA'
