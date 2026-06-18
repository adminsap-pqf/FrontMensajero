# Revisa las coordenadas que el backend devuelve para los pendientes de un mensajero.
# Uso:  powershell -File scripts\revisar-coordenadas.ps1 -Usuario NOMBRE_DEL_MENSAJERO

param(
  [Parameter(Mandatory = $true)] [string] $Usuario,
  [string] $BaseUrl = "http://localhost:8081/ProquifaNet/",
  [string] $Estado  = "Colectado"
)

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$url  = "$BaseUrl" + "consultarPendientesDeMensajeroPL"
$body = @{ valor = $Usuario; estado = $Estado } | ConvertTo-Json

Write-Host "POST $url  (valor=$Usuario, estado=$Estado)" -ForegroundColor Cyan
try {
  $resp = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
} catch {
  Write-Host "FALLO HTTP: $($_.Exception.Message)" -ForegroundColor Red
  return
}

$items = $resp.current
if (-not $items) { Write-Host "Sin pendientes para '$Usuario' (revisa el usuario/estado)." -ForegroundColor Yellow; return }

# Rangos validos aproximados para Mexico
$LAT_MIN = 14; $LAT_MAX = 33
$LON_MIN = -118; $LON_MAX = -86

$reporte = foreach ($it in $items) {
  $lat = $it.latitud
  $lon = $it.longitud
  $latN = $null; $lonN = $null
  [double]::TryParse(("$lat" -replace ',', '.'), [ref]$latN) | Out-Null
  [double]::TryParse(("$lon" -replace ',', '.'), [ref]$lonN) | Out-Null

  $problemas = @()
  if ($null -eq $lat -or "$lat" -eq "")            { $problemas += "lat NULA" }
  if ($null -eq $lon -or "$lon" -eq "")            { $problemas += "lon NULA" }
  if ($latN -eq 0 -and $lonN -eq 0)                { $problemas += "0,0" }
  if ($latN -ne 0 -and ($latN -lt $LAT_MIN -or $latN -gt $LAT_MAX)) { $problemas += "lat fuera de MX" }
  if ($lonN -ne 0 -and ($lonN -lt $LON_MIN -or $lonN -gt $LON_MAX)) { $problemas += "lon fuera de MX" }
  # En Mexico |lon| (~86-118) > |lat| (~14-33). Si no, probablemente estan invertidas.
  if ($latN -ne 0 -and $lonN -ne 0 -and [math]::Abs($latN) -gt [math]::Abs($lonN)) { $problemas += "lat/lon INVERTIDAS?" }

  [pscustomobject]@{
    Empresa   = $it.empresa
    Direccion = $it.direccion
    Latitud   = $lat
    Longitud  = $lon
    Estado    = if ($problemas.Count) { ($problemas -join '; ') } else { "OK" }
  }
}

$reporte | Format-Table -AutoSize -Wrap
$malos = ($reporte | Where-Object Estado -ne "OK").Count
Write-Host ""
Write-Host "Total: $($reporte.Count)  |  Con problema de coordenadas: $malos" -ForegroundColor $(if ($malos) { "Red" } else { "Green" })
