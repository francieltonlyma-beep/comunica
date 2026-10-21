param([switch]$WhatIf)
$ErrorActionPreference = 'Stop'
$project = 'comunica-salvador'
$bucket = 'comunica-salvador.firebasestorage.app'
$configPath = Join-Path $env:USERPROFILE '.config/configstore/firebase-tools.json'
$config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
$headers = @{ Authorization = 'Bearer ' + $config.tokens.access_token }
$firestoreBase = 'https://firestore.googleapis.com/v1/projects/' + $project + '/databases/(default)/documents/'
$storageBase = 'https://storage.googleapis.com/storage/v1/b/' + $bucket + '/o/'

function Read-StringField($fields, $name) {
  if ($null -eq $fields -or $null -eq $fields.$name) { return '' }
  return [string]$fields.$name.stringValue
}

function Read-ObjectPath($downloadUrl) {
  if (!$downloadUrl) { return '' }
  $match = [regex]::Match([string]$downloadUrl, '/o/([^?]+)')
  if (!$match.Success) { return '' }
  try { return [uri]::UnescapeDataString($match.Groups[1].Value) } catch { return '' }
}

function Read-Collection($path) {
  $items = [Collections.Generic.List[object]]::new()
  $token = ''
  do {
    $url = $firestoreBase + $path + '?pageSize=300'
    if ($token) { $url += '&pageToken=' + [uri]::EscapeDataString($token) }
    try { $page = Invoke-RestMethod -TimeoutSec 45 -Headers $headers -Uri $url }
    catch {
      if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 404) { return @() }
      throw
    }
    foreach ($document in @($page.documents)) { if ($document) { $items.Add($document) } }
    $token = [string]$page.nextPageToken
  } while ($token)
  return @($items.ToArray())
}

function Set-AccessMetadata($objectPath, $metadata) {
  if (!$objectPath.StartsWith('companies/')) { return $false }
  $encoded = [uri]::EscapeDataString($objectPath)
  $object = Invoke-RestMethod -TimeoutSec 45 -Headers $headers -Uri ($storageBase + $encoded)
  $merged = @{}
  if ($object.metadata) {
    foreach ($property in $object.metadata.PSObject.Properties) { $merged[$property.Name] = [string]$property.Value }
  }
  foreach ($key in $metadata.Keys) { $merged[$key] = [string]$metadata[$key] }
  if ($WhatIf) { Write-Output ('SIMULAR ' + $objectPath); return $true }
  $body = @{ metadata = $merged } | ConvertTo-Json -Depth 10 -Compress
  $url = $storageBase + $encoded + '?ifGenerationMatch=' + [uri]::EscapeDataString([string]$object.generation)
  $null = Invoke-RestMethod -TimeoutSec 45 -Headers $headers -Method Patch -ContentType 'application/json' -Body $body -Uri $url
  return $true
}

$companies = Read-Collection 'artifacts/comunica-salvador/public/data/companies'
$seen = [Collections.Generic.HashSet[string]]::new()
$updated = 0
$skipped = 0
foreach ($company in $companies) {
  $companyId = ($company.name -split '/')[-1]
  foreach ($document in (Read-Collection ('artifacts/comunica-salvador/public/data/companies/' + [uri]::EscapeDataString($companyId) + '/documents'))) {
    $id = ($document.name -split '/')[-1]
    $file = $document.fields.file.mapValue.fields
    $path = Read-ObjectPath (Read-StringField $file 'data')
    $owner = Read-StringField $document.fields 'authorId'
    if ($path -and $path.StartsWith('companies/' + $companyId + '/') -and $seen.Add($path)) {
      if (Set-AccessMetadata $path @{ownerUid=$owner;documentId=$id}) { $updated++ }
    } else { $skipped++ }
  }
  foreach ($message in (Read-Collection ('artifacts/comunica-salvador/public/data/companies/' + [uri]::EscapeDataString($companyId) + '/messages'))) {
    $id = ($message.name -split '/')[-1]
    $attachment = $message.fields.attachment.mapValue.fields
    $path = Read-ObjectPath (Read-StringField $attachment 'data')
    $owner = Read-StringField $message.fields 'senderId'
    if ($path -and $path.StartsWith('companies/' + $companyId + '/') -and $seen.Add($path)) {
      if (Set-AccessMetadata $path @{ownerUid=$owner;messageId=$id}) { $updated++ }
    } elseif ($path) { $skipped++ }
  }
}
Write-Output ('METADADOS_ATUALIZADOS=' + $updated)
Write-Output ('IGNORADOS=' + $skipped)
Write-Output ('MODO=' + $(if ($WhatIf) { 'SIMULACAO' } else { 'APLICADO' }))
