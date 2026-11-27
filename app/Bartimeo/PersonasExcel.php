<?php

namespace App\Bartimeo;

use DOMDocument;
use DOMXPath;
use RuntimeException;
use ZipArchive;

final class PersonasExcel
{
    /** @return list<array{name: string, tipo: string, foraneo: bool}> */
    public function leer(string $ruta): array
    {
        $zip = $this->abrir($ruta);
        $personas = [];
        try {
            $shared = $this->cadenas($zip);
            for ($indice = 0; $indice < $zip->numFiles; $indice++) {
                $hoja = $zip->getNameIndex($indice);
                if (is_string($hoja) && preg_match('#^xl/worksheets/sheet[0-9]+\.xml$#D', $hoja)) {
                    $xml = $zip->getFromIndex($indice);
                    if (! is_string($xml)) {
                        throw new RuntimeException('Una de las hojas del libro no se pudo leer.');
                    }
                    $personas = array_merge($personas, $this->personasDeHoja($this->filas($xml, $shared)));
                    if (count($personas) > 500) {
                        throw new RuntimeException('El archivo supera el límite de 500 participantes.');
                    }
                }
            }
        } finally {
            $zip->close();
        }

        if (! $personas) {
            throw new RuntimeException('Incluye al menos un participante con Nombre y Tipo, o usa el libro histórico de Bartimeo.');
        }

        return $personas;
    }

    private function personasDeHoja(array $filas): array
    {
        if (! $filas) {
            return [];
        }
        $encabezados = array_map(fn ($valor) => $this->normalizar((string) $valor), array_shift($filas));
        $columnas = [];
        foreach ($encabezados as $indice => $encabezado) {
            $columnas[$encabezado] = $indice;
        }
        $nombreColumna = $columnas['nombre'] ?? $columnas['participante'] ?? $columnas['aaa nombre y apellidos'] ?? null;
        if ($nombreColumna === null) {
            return [];
        }
        $tipoHistorico = match (true) {
            isset($columnas['aaa nombre y apellidos'], $columnas['a total'], $columnas['a obliga']) => 'caminante',
            isset($columnas['aaa nombre y apellidos'], $columnas['reuni'], $columnas['obli']) => 'servidor',
            default => null,
        };

        $personas = [];
        foreach ($filas as $numero => $fila) {
            $nombre = trim((string) ($fila[$nombreColumna] ?? ''));
            if ($nombre === '' || ($tipoHistorico !== null && (is_numeric($nombre) || preg_match('/^totales?$/iD', $nombre)))) {
                continue;
            }
            $tipoValor = $this->normalizar((string) ($fila[$columnas['tipo'] ?? -1] ?? $tipoHistorico ?? ''));
            $tipo = match ($tipoValor) {
                'caminante', 'caminantes' => 'caminante',
                'servidor', 'servidores', 'asistente', 'asistentes' => 'servidor',
                default => null,
            };
            if ($tipo === null) {
                throw new RuntimeException('Fila '.($numero + 2).': indica Caminante o Servidor en Tipo.');
            }
            $foraneoValor = $this->normalizar((string) ($fila[$columnas['otra ciudad'] ?? -1] ?? 'no'));
            if (! in_array($foraneoValor, ['', 'si', 'no', '1', '0'], true)) {
                throw new RuntimeException('Fila '.($numero + 2).': Otra ciudad debe ser Sí o No.');
            }
            $personas[] = ['name' => $nombre, 'tipo' => $tipo, 'foraneo' => in_array($foraneoValor, ['si', '1'], true)];
        }

        return $personas;
    }

    /** @param list<string> $encabezados @param list<list<string|int>> $filas */
    public function crear(array $encabezados, array $filas, string $hoja = 'Asistencias'): string
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('La extensión ZIP no está disponible.');
        }
        $tmp = tempnam(sys_get_temp_dir(), 'bartimeo-xlsx-');
        if ($tmp === false) {
            throw new RuntimeException('No se pudo preparar el archivo XLSX.');
        }
        $zip = new ZipArchive;
        try {
            if ($zip->open($tmp, ZipArchive::OVERWRITE) !== true) {
                throw new RuntimeException('No se pudo crear el archivo XLSX.');
            }
            foreach ([
                '[Content_Types].xml' => '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
                '_rels/.rels' => '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
                'xl/workbook.xml' => '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'.htmlspecialchars($hoja, ENT_XML1).'" sheetId="1" r:id="rId1"/></sheets></workbook>',
                'xl/_rels/workbook.xml.rels' => '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
            ] as $ruta => $contenido) {
                $zip->addFromString($ruta, $contenido);
            }
            $xml = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
            foreach (array_merge([$encabezados], $filas) as $numero => $fila) {
                $xml .= '<row r="'.($numero + 1).'">';
                foreach (array_values($fila) as $columna => $valor) {
                    $xml .= '<c r="'.$this->letraColumna($columna).($numero + 1).'" t="inlineStr"><is><t xml:space="preserve">'.htmlspecialchars((string) $valor, ENT_XML1 | ENT_COMPAT, 'UTF-8').'</t></is></c>';
                }
                $xml .= '</row>';
            }
            $zip->addFromString('xl/worksheets/sheet1.xml', $xml.'</sheetData></worksheet>');
            $zip->close();
            $contenido = file_get_contents($tmp);
            if (! is_string($contenido)) {
                throw new RuntimeException('No se pudo leer el archivo XLSX generado.');
            }

            return $contenido;
        } finally {
            @unlink($tmp);
        }
    }

    private function abrir(string $ruta): ZipArchive
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('La extensión ZIP no está disponible para leer archivos XLSX.');
        }
        $zip = new ZipArchive;
        if ($zip->open($ruta) !== true || $zip->numFiles > 100 || $zip->statIndex(0)['size'] > 5_000_000) {
            throw new RuntimeException('El archivo XLSX no es válido o supera el tamaño permitido.');
        }
        $total = 0;
        for ($indice = 0; $indice < $zip->numFiles; $indice++) {
            $metadatos = $zip->statIndex($indice);
            $total += $metadatos['size'] ?? 0;
            if ($total > 20_000_000) {
                $zip->close();
                throw new RuntimeException('El contenido descomprimido del XLSX supera el límite permitido.');
            }
        }
        if (! str_contains((string) $zip->getNameIndex(0), '[Content_Types].xml') && $zip->locateName('[Content_Types].xml') === false) {
            $zip->close();
            throw new RuntimeException('El archivo no tiene el formato XLSX esperado.');
        }

        return $zip;
    }

    /** @return list<string> */
    private function cadenas(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');
        if (! is_string($xml)) {
            return [];
        }
        $dom = $this->documento($xml);
        $xpath = new DOMXPath($dom);
        $xpath->registerNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');

        return array_map(fn ($item) => $item->textContent, iterator_to_array($xpath->query('//x:si') ?? []));
    }

    /** @param list<string> $shared @return list<list<string>> */
    private function filas(string $xml, array $shared): array
    {
        $dom = $this->documento($xml);
        $xpath = new DOMXPath($dom);
        $xpath->registerNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $resultado = [];
        foreach ($xpath->query('//x:sheetData/x:row') ?? [] as $fila) {
            $valores = [];
            foreach ($xpath->query('./x:c', $fila) ?? [] as $celda) {
                preg_match('/([A-Z]+)\d+/', $celda->getAttribute('r'), $coincidencia);
                $columna = $this->indiceColumna($coincidencia[1] ?? 'A');
                $tipo = $celda->getAttribute('t');
                $valor = $xpath->query('./x:is|./x:v', $celda)?->item(0)?->textContent ?? '';
                $valores[$columna] = $tipo === 's' ? ($shared[(int) $valor] ?? '') : $valor;
            }
            if ($valores) {
                ksort($valores);
                $resultado[] = $valores;
            }
        }

        return $resultado;
    }

    private function documento(string $xml): DOMDocument
    {
        $dom = new DOMDocument;
        if (! $dom->loadXML($xml, LIBXML_NONET | LIBXML_NOBLANKS | LIBXML_NOERROR | LIBXML_NOWARNING) || $dom->doctype !== null) {
            throw new RuntimeException('El libro contiene XML no válido.');
        }

        return $dom;
    }

    private function normalizar(string $valor): string
    {
        $valor = mb_strtolower(trim($valor));

        return strtr($valor, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']);
    }

    private function indiceColumna(string $letras): int
    {
        $indice = 0;
        foreach (str_split($letras) as $letra) {
            $indice = $indice * 26 + ord($letra) - 64;
        }

        return $indice - 1;
    }

    private function letraColumna(int $indice): string
    {
        $letras = '';
        do {
            $letras = chr($indice % 26 + 65).$letras;
            $indice = intdiv($indice, 26) - 1;
        } while ($indice >= 0);

        return $letras;
    }
}
