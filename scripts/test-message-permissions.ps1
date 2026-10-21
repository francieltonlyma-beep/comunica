$ErrorActionPreference='Stop'
. "$PSScriptRoot/test-user-permissions.ps1"
$messagePath='artifacts/comunica-salvador/public/data/companies/a/messages/'
function Seed-Message($id,$sender,$receiver,$participants) {
  $fields=@{senderId=@{stringValue=$sender};receiverId=@{stringValue=$receiver};content=@{stringValue='Fixture'}}
  if($participants){$fields.participants=@{arrayValue=@{values=@($participants | ForEach-Object {@{stringValue=$_}})}}}
  $null=Invoke-RestMethod -Method Patch -Uri ($base+'/'+$messagePath+$id) -Headers @{Authorization='Bearer owner'} -ContentType 'application/json' -Body (@{fields=$fields}|ConvertTo-Json -Depth 12)
}
Seed-Message 'modern' 'other' 'worker' @('worker','other')
Seed-Message 'legacy' 'other' 'worker' $null
Seed-Message 'private' 'third' 'fourth' @('third','fourth')
Invoke-PrivateAccess Get ($messagePath+'modern') $null $worker 200 'ler conversa participante atual'
Invoke-PrivateAccess Get ($messagePath+'legacy') $null $worker 200 'ler conversa participante antiga'
Invoke-PrivateAccess Get ($messagePath+'private') $null $worker 403 'bloquear conversa de terceiros'
Invoke-PrivateAccess Get ($messagePath+'private') $null $admin 403 'administrador nao le conversa privada de terceiros'
$filters=@(
 @{fieldFilter=@{field=@{fieldPath='participants'};op='ARRAY_CONTAINS';value=@{stringValue='worker'}}},
 @{fieldFilter=@{field=@{fieldPath='senderId'};op='EQUAL';value=@{stringValue='worker'}}},
 @{fieldFilter=@{field=@{fieldPath='receiverId'};op='EQUAL';value=@{stringValue='worker'}}}
)
$body=@{structuredQuery=@{from=@(@{collectionId='messages'});where=@{compositeFilter=@{op='OR';filters=$filters}}}}|ConvertTo-Json -Depth 15
$result=Invoke-RestMethod -Method Post -Uri ($base+'/artifacts/comunica-salvador/public/data/companies/a:runQuery') -Headers @{Authorization='Bearer '+$worker} -ContentType 'application/json' -Body $body
$ids=@($result|Where-Object {$_.document}|ForEach-Object {$_.document.name.Split('/')[-1]})
if($ids.Count -ne 2 -or $ids -notcontains 'modern' -or $ids -notcontains 'legacy'){throw 'Consulta privada incorreta'}
'PASS consulta OR retorna apenas mensagens permitidas'
$prodPath='artifacts/comunica-salvador/public/data/companies/a/productivity/'
Invoke-PrivateAccess Patch ($prodPath+'existing') @{authorId='worker';group='A'} 'owner' 200 'preparar producao ficticia'
Invoke-PrivateAccess Get ($prodPath+'existing') $null $worker 403 'bloquear leitura de producao sem grupo'
Invoke-PermissionWrite 'a' 'worker' ($user+@{prodGroup='A'}) 'owner' 200 'vincular grupo ficticio'
Invoke-PrivateAccess Get ($prodPath+'existing') $null $worker 200 'permitir leitura para producao'
Invoke-PrivateAccess Patch ($prodPath+'new') @{authorId='worker';group='A'} $worker 200 'permitir producao no proprio grupo'
Invoke-PrivateAccess Patch ($prodPath+'wrong-group') @{authorId='worker';group='B'} $worker 403 'bloquear producao em outro grupo'
Invoke-PrivateAccess Patch ($prodPath+'wrong-author') @{authorId='other';group='A'} $worker 403 'bloquear autoria falsa'
Invoke-PrivateAccess Patch ($prodPath+'existing') @{authorId='worker';group='A';quantity='10'} $worker 403 'bloquear edicao sem gerencia'
Invoke-PrivateAccess Patch ($prodPath+'existing') @{authorId='worker';group='A';quantity='10'} $admin 200 'permitir edicao administrativa de producao'
$absencePath='artifacts/comunica-salvador/public/data/companies/a/absences/test-absence'
$postPath='artifacts/comunica-salvador/public/data/companies/a/posts/post-abs-test-absence'
Invoke-PrivateAccess Patch $absencePath @{userId='worker'} $worker 200 'criar ausencia propria'
Invoke-PrivateAccess Patch $postPath @{authorId='system'} $worker 200 'criar aviso associado a ausencia propria'
$atomicAbsencePath='artifacts/comunica-salvador/public/data/companies/a/absences/test-atomic-absence'
$atomicPostPath='artifacts/comunica-salvador/public/data/companies/a/posts/post-abs-test-atomic-absence'
$documentPrefix=$base.Replace('http://127.0.0.1:8080/v1/','')+'/'
$atomicWrites=@(
  @{update=@{name=$documentPrefix+$atomicAbsencePath;fields=(Fields @{userId='worker'})}},
  @{update=@{name=$documentPrefix+$atomicPostPath;fields=(Fields @{authorId='system'})}}
)
$atomicCommit=@{writes=$atomicWrites}|ConvertTo-Json -Depth 12
$null=Invoke-RestMethod -Method Post -Uri ($base+':commit') -Headers @{Authorization='Bearer '+$worker} -ContentType 'application/json' -Body $atomicCommit
Invoke-PrivateAccess Get $atomicAbsencePath $null $worker 200 'ausencia criada em lote unico'
Invoke-PrivateAccess Get $atomicPostPath $null $worker 200 'aviso criado no mesmo lote'
$unlinkedPostPath='artifacts/comunica-salvador/public/data/companies/a/posts/post-abs-no-such-absence'
Invoke-PrivateAccess Patch $unlinkedPostPath @{authorId='system'} $worker 403 'bloquear aviso sem ausencia vinculada'
$rollbackAbsencePath='artifacts/comunica-salvador/public/data/companies/a/absences/test-rollback-absence'
$rejectedWrites=@(
  @{update=@{name=$documentPrefix+$rollbackAbsencePath;fields=(Fields @{userId='worker'})}},
  @{update=@{name=$documentPrefix+$unlinkedPostPath;fields=(Fields @{authorId='system'})}}
)
$status=200
try { $null=Invoke-RestMethod -Method Post -Uri ($base+':commit') -Headers @{Authorization='Bearer '+$worker} -ContentType 'application/json' -Body (@{writes=$rejectedWrites}|ConvertTo-Json -Depth 12) }
catch { if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode}else{throw} }
if($status -ne 403){throw ('Lote sem vinculo retornou HTTP '+$status+'; esperado 403')}
Invoke-PrivateAccess Get $rollbackAbsencePath $null 'owner' 404 'lote rejeitado nao deixou ausencia parcial'
$commit=@{writes=@(@{delete=($base.Replace('http://127.0.0.1:8080/v1/','')+'/'+$absencePath)},@{delete=($base.Replace('http://127.0.0.1:8080/v1/','')+'/'+$postPath)})}|ConvertTo-Json -Depth 10
$null=Invoke-RestMethod -Method Post -Uri ($base+':commit') -Headers @{Authorization='Bearer '+$worker} -ContentType 'application/json' -Body $commit
'PASS exclusao atomica de ausencia e aviso'
$eventPath='artifacts/comunica-salvador/public/data/companies/a/events/test-linked-event'
$announcementPath='artifacts/comunica-salvador/public/data/companies/a/announcements/test-linked-announcement'
$eventWrites=@(
  @{update=@{name=$documentPrefix+$eventPath;fields=(Fields @{title='Evento teste';announcementId='test-linked-announcement'})}},
  @{update=@{name=$documentPrefix+$announcementPath;fields=(Fields @{title='Aviso teste';sourceEventId='test-linked-event'})}}
)
$null=Invoke-RestMethod -Method Post -Uri ($base+':commit') -Headers @{Authorization='Bearer '+$admin} -ContentType 'application/json' -Body (@{writes=$eventWrites}|ConvertTo-Json -Depth 12)
$deleteEventAndAnnouncement=@{writes=@(
  @{delete=$documentPrefix+$eventPath},
  @{delete=$documentPrefix+$announcementPath}
)}|ConvertTo-Json -Depth 10
$null=Invoke-RestMethod -Method Post -Uri ($base+':commit') -Headers @{Authorization='Bearer '+$admin} -ContentType 'application/json' -Body $deleteEventAndAnnouncement
Invoke-PrivateAccess Get $eventPath $null 'owner' 404 'evento removido no lote'
Invoke-PrivateAccess Get $announcementPath $null 'owner' 404 'comunicado removido no mesmo lote'
$vacationPresencePath='artifacts/comunica-salvador/public/data/companies/a/presence/test-vacation-presence'
$vacationAbsencePath='artifacts/comunica-salvador/public/data/companies/a/absences/test-vacation-absence'
$vacationPostPath='artifacts/comunica-salvador/public/data/companies/a/posts/post-abs-test-vacation-absence'
Invoke-PrivateAccess Patch $vacationPresencePath @{name='Usuario teste';status='Presencial'} 'owner' 200 'preparar presenca para ferias'
$vacationWrites=@(
  @{update=@{name=$documentPrefix+$vacationPresencePath;fields=(Fields @{name='Usuario teste';status='Ferias'})};currentDocument=@{exists=$true}},
  @{update=@{name=$documentPrefix+$vacationAbsencePath;fields=(Fields @{userId='worker';reason='Ferias'})}},
  @{update=@{name=$documentPrefix+$vacationPostPath;fields=(Fields @{authorId='system';title='Ferias teste'})}}
)
$null=Invoke-RestMethod -Method Post -Uri ($base+':commit') -Headers @{Authorization='Bearer '+$admin} -ContentType 'application/json' -Body (@{writes=$vacationWrites}|ConvertTo-Json -Depth 12)
Invoke-PrivateAccess Get $vacationAbsencePath $null $worker 200 'ausencia de ferias criada com presenca'
Invoke-PrivateAccess Get $vacationPostPath $null $worker 200 'aviso de ferias criado no mesmo lote'
$deniedAbsencePath='artifacts/comunica-salvador/public/data/companies/a/absences/test-denied-vacation'
$deniedPostPath='artifacts/comunica-salvador/public/data/companies/a/posts/post-abs-test-denied-vacation'
$deniedWrites=@(
  @{update=@{name=$documentPrefix+$vacationPresencePath;fields=(Fields @{name='Usuario teste';status='Ausente'})};currentDocument=@{exists=$true}},
  @{update=@{name=$documentPrefix+$deniedAbsencePath;fields=(Fields @{userId='worker';reason='Ferias'})}},
  @{update=@{name=$documentPrefix+$deniedPostPath;fields=(Fields @{authorId='system';title='Ferias negadas'})}}
)
$status=200
try { $null=Invoke-RestMethod -Method Post -Uri ($base+':commit') -Headers @{Authorization='Bearer '+$worker} -ContentType 'application/json' -Body (@{writes=$deniedWrites}|ConvertTo-Json -Depth 12) }
catch { if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode}else{throw} }
if($status -ne 403){throw ('Ferias sem permissao retornaram HTTP '+$status+'; esperado 403')}
Invoke-PrivateAccess Get $deniedAbsencePath $null 'owner' 404 'falha de presenca nao deixou ferias parciais'
Invoke-PrivateAccess Get $deniedPostPath $null 'owner' 404 'falha de presenca nao deixou aviso parcial'
$rolePath='artifacts/comunica-salvador/public/data/companies/a/roles/test-cascade-role'
Invoke-PrivateAccess Patch $rolePath @{name='Cargo antigo';dept='a'} $admin 200 'preparar cargo para alteracao em lote'
$roleWrites=@(
  @{update=@{name=$documentPrefix+$rolePath;fields=(Fields @{name='Cargo novo'})};updateMask=@{fieldPaths=@('name')};currentDocument=@{exists=$true}},
  @{update=@{name=$documentPrefix+$path.TrimStart('/')+'a/users/worker';fields=(Fields @{role='Cargo novo'})};updateMask=@{fieldPaths=@('role')};currentDocument=@{exists=$true}}
)
$null=Invoke-RestMethod -Method Post -Uri ($base+':commit') -Headers @{Authorization='Bearer '+$admin} -ContentType 'application/json' -Body (@{writes=$roleWrites}|ConvertTo-Json -Depth 12)
$savedRole=Invoke-RestMethod -Method Get -Uri ($base+'/'+$rolePath) -Headers @{Authorization='Bearer owner'}
$savedUser=Invoke-RestMethod -Method Get -Uri ($base+$path+'a/users/worker') -Headers @{Authorization='Bearer owner'}
if($savedRole.fields.name.stringValue -ne 'Cargo novo' -or $savedUser.fields.role.stringValue -ne 'Cargo novo'){throw 'Cargo e colaborador nao foram alterados juntos'}
'PASS cargo e colaborador alterados no mesmo lote'

$removedUserPath='artifacts/comunica-salvador/public/data/companies/a/users/removed-worker'
$removedPresencePath='artifacts/comunica-salvador/public/data/companies/a/presence/removed-worker-presence'
Invoke-PrivateAccess Patch $removedUserPath @{id='removed-worker';name='Colaborador para remover';companyId='a';isAdmin=$false} 'owner' 200 'preparar colaborador para exclusao conjunta'
Invoke-PrivateAccess Patch $removedPresencePath @{userId='removed-worker';name='Colaborador para remover';status='Presencial'} 'owner' 200 'preparar presenca vinculada'
$removeWorkerCommit=@{writes=@(
  @{delete=$documentPrefix+$removedUserPath},
  @{delete=$documentPrefix+$removedPresencePath}
)}|ConvertTo-Json -Depth 10
$status=200
try { $null=Invoke-RestMethod -Method Post -Uri ($base+':commit') -Headers @{Authorization='Bearer '+$worker} -ContentType 'application/json' -Body $removeWorkerCommit }
catch { if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode}else{throw} }
if($status -ne 403){throw ('Exclusao por colaborador comum retornou HTTP '+$status+'; esperado 403')}
Invoke-PrivateAccess Get $removedUserPath $null 'owner' 200 'lote negado preservou colaborador'
Invoke-PrivateAccess Get $removedPresencePath $null 'owner' 200 'lote negado preservou presenca'
$status=200
try { $null=Invoke-RestMethod -Method Post -Uri ($base+':commit') -Headers @{Authorization='Bearer '+$admin} -ContentType 'application/json' -Body $removeWorkerCommit }
catch { if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode}else{throw} }
if($status -ne 403){throw ('Exclusao direta por administrador retornou HTTP '+$status+'; esperado 403')}
Invoke-PrivateAccess Get $removedUserPath $null 'owner' 200 'lote administrativo direto negado preservou colaborador'
Invoke-PrivateAccess Get $removedPresencePath $null 'owner' 200 'lote administrativo direto negado preservou presenca'
