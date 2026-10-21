Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot 'public\assets\comunica-logo-transparent.png'
$outputDirectory = Join-Path $projectRoot 'public\pwa'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$source = [System.Drawing.Image]::FromFile($sourcePath)
$sourceRectangle = [System.Drawing.Rectangle]::new(418, 0, 700, 700)

function Write-CommunicaIcon {
  param(
    [int]$Size,
    [string]$FileName,
    [double]$PaddingRatio
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#071a36'))
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $padding = [int][Math]::Round($Size * $PaddingRatio)
  $destination = [System.Drawing.Rectangle]::new($padding, $padding, $Size - (2 * $padding), $Size - (2 * $padding))
  $graphics.DrawImage($source, $destination, $sourceRectangle, [System.Drawing.GraphicsUnit]::Pixel)
  $bitmap.Save((Join-Path $outputDirectory $FileName), [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

Write-CommunicaIcon -Size 192 -FileName 'icon-192.png' -PaddingRatio 0.06
Write-CommunicaIcon -Size 512 -FileName 'icon-512.png' -PaddingRatio 0.06
Write-CommunicaIcon -Size 512 -FileName 'icon-maskable-512.png' -PaddingRatio 0.16
Write-CommunicaIcon -Size 180 -FileName 'apple-touch-icon.png' -PaddingRatio 0.08

$source.Dispose()
