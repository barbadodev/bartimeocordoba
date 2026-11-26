param(
    [string]$Php = 'php',
    [string]$Composer = 'composer'
)

$ErrorActionPreference = 'Stop'
$app = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
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
