param(
    [string]$Php = 'php',
    [string]$Composer = 'composer'
)

$ErrorActionPreference = 'Stop'
$app = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$configuracionPath = Join-Path $app 'resources/datos/retiro.json'
if (-not (Test-Path -LiteralPath $configuracionPath -PathType Leaf)) {
    throw 'Falta resources/datos/retiro.json. Crea ese archivo desde resources/datos/retiro.example.json y completa los datos reales antes de preparar la publicación.'
}

try {
    $configuracion = Get-Content -LiteralPath $configuracionPath -Raw -Encoding utf8 | ConvertFrom-Json -ErrorAction Stop
} catch {
    throw 'resources/datos/retiro.json no contiene JSON válido. Revisa el archivo antes de preparar la publicación.'
}

if ($null -eq $configuracion -or $configuracion -is [System.Array]) {
    throw 'resources/datos/retiro.json debe contener un objeto JSON. Cópiala desde resources/datos/retiro.example.json y complétala.'
}

$camposObligatorios = @('edicion', 'email', 'coordinadoresJovenes', 'coordinadoresAdultos', 'caminantes', 'servidores')
$camposFaltantes = @($camposObligatorios | Where-Object { $null -eq $configuracion.PSObject.Properties[$_] })
if ($camposFaltantes.Count -gt 0) {
    throw 'resources/datos/retiro.json no tiene la estructura esperada. Cópiala desde resources/datos/retiro.example.json y complétala.'
}
if ([string]::IsNullOrWhiteSpace([string] $configuracion.edicion) -or $configuracion.email -isnot [string]) {
    throw 'La edición y el correo de resources/datos/retiro.json deben tener el formato esperado. Revisa la configuración antes de preparar la publicación.'
}

foreach ($tipo in @('coordinadoresJovenes', 'coordinadoresAdultos')) {
    if ($configuracion.$tipo -isnot [System.Array]) {
        throw "La sección '$tipo' de resources/datos/retiro.json debe ser una lista. Revisa el formato antes de preparar la publicación."
    }

    foreach ($contacto in $configuracion.$tipo) {
        if ([string]::IsNullOrWhiteSpace([string] $contacto.nombre) -or [string]::IsNullOrWhiteSpace([string] $contacto.tel)) {
            throw "Hay un contacto incompleto en '$tipo' de resources/datos/retiro.json. Revisa el archivo antes de preparar la publicación."
        }
    }
}

$camposEvento = @{
    caminantes = @('titulo', 'fechas', 'horarioComienzo', 'horarioClausura', 'lugar', 'direccion', 'precio', 'formaPago', 'fechaLimite')
    servidores = @('titulo', 'fechas', 'horarioComienzo', 'horarioClausura', 'lugar', 'direccion', 'precioPago', 'fechaLimite')
}
foreach ($tipo in $camposEvento.Keys) {
    $evento = $configuracion.$tipo
    $camposEventoFaltantes = @($camposEvento[$tipo] | Where-Object {
        $propiedad = if ($null -ne $evento) { $evento.PSObject.Properties[$_] } else { $null }
        $null -eq $propiedad -or [string]::IsNullOrWhiteSpace([string] $propiedad.Value)
    })
    if ($camposEventoFaltantes.Count -gt 0) {
        throw "Faltan datos obligatorios en la sección '$tipo' de resources/datos/retiro.json. Complétalos antes de preparar la publicación."
    }
}

$salida = Join-Path $app ('storage/app/private/sftp-' + [Guid]::NewGuid().ToString('N').Substring(0, 8))
$privado = Join-Path $salida 'bartimeo-app'
$publico = Join-Path $salida 'httpdocs'
New-Item -ItemType Directory -Path $privado,$publico | Out-Null

Push-Location $app
try {
    npm.cmd ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Falló npm ci.' }
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación.' }

    foreach ($name in @('app','bootstrap','config','database','routes','artisan','composer.json','composer.lock','.env.sftp.example')) {
        Copy-Item -LiteralPath (Join-Path $app $name) -Destination $privado -Recurse
    }
    $resources = New-Item -ItemType Directory -Path (Join-Path $privado 'resources')
    foreach ($name in @('datos','views')) {
        Copy-Item -LiteralPath (Join-Path $app ('resources/' + $name)) -Destination $resources.FullName -Recurse
    }
    foreach ($name in @('storage/app/private','storage/app/public','storage/framework/cache/data','storage/framework/sessions','storage/framework/views','storage/logs')) {
        $folder = New-Item -ItemType Directory -Path (Join-Path $privado $name) -Force
        New-Item -ItemType File -Path (Join-Path $folder.FullName '.gitkeep') | Out-Null
    }
    Get-ChildItem -LiteralPath (Join-Path $privado 'bootstrap/cache') -File -Filter '*.php' | Remove-Item
    Get-ChildItem -LiteralPath (Join-Path $app 'public') -Force |
        Where-Object Name -NotIn @('hot','storage') | Copy-Item -Destination $publico -Recurse

    Push-Location $privado
    try {
        $argumentos = @('install','--no-dev','--prefer-dist','--optimize-autoloader','--no-interaction','--no-scripts')
        if ($Composer.EndsWith('.phar')) { & $Php $Composer @argumentos } else { & $Composer @argumentos }
        if ($LASTEXITCODE -ne 0) { throw 'Falló Composer.' }
    } finally {
        Pop-Location
    }

    Write-Output $salida
} finally {
    Pop-Location
}
