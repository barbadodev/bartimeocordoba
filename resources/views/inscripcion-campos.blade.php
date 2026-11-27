@php
    $campos = $tipo === 'caminante'
        ? ['familiar1Nombre'=>'Nombre del tutor','familiar1Dni'=>'DNI del tutor','familiar1Telefono'=>'Teléfono del tutor','familiar1Email'=>'Email del tutor','nombre'=>'Nombre','apellidos'=>'Apellidos','movil'=>'Móvil','email'=>'Email','colegio'=>'Colegio o centro educativo','anioNacimiento'=>'Año de nacimiento','genero'=>'Grupo','inscripcionesPrevias'=>'Inscripciones previas','primeraVezCristoRey'=>'¿Primera vez en Cristo Rey?','direccion'=>'Dirección','codigoPostal'=>'Código postal','localidad'=>'Localidad','sacramentos'=>'Sacramentos','quienInvita'=>'Quién invita','quienInvitaTelefono'=>'Teléfono de quien invita','vieneConAlguien'=>'¿Vienes con alguien?','alergiaDetalle'=>'Detalle de alergias','trastornoSalud'=>'Trastorno de salud','medicacion'=>'Medicación','familiar2Nombre'=>'Familiar de contacto','familiar2Telefono'=>'Teléfono familiar','familiar2Email'=>'Email familiar']
        : ['nombre'=>'Nombre','apellidos'=>'Apellidos','movil'=>'Móvil','email'=>'Email','fechaNacimiento'=>'Fecha de nacimiento','direccion'=>'Dirección','codigoPostal'=>'Código postal','localidad'=>'Localidad','bartimeoOrigen'=>'Parroquia de procedencia','haServido'=>'¿Has servido antes?','cuantasVeces'=>'¿Cuántas veces?','montajeJueves'=>'¿Puedes ayudar en el montaje del jueves?','alergias'=>'Alergias','emergenciaNombre'=>'Nombre de contacto de emergencia','emergenciaTelefono'=>'Teléfono de emergencia','emergenciaRelacion'=>'Relación con el contacto','emergenciaEmail'=>'Email de emergencia'];
@endphp
<div class="row g-3">
@foreach ($campos as $campo => $etiqueta)
    <div class="col-md-6">
        <label class="form-label" for="{{ $campo }}">{{ $etiqueta }}</label>
        @if ($campo === 'genero')
            <select class="form-select" id="{{ $campo }}" name="{{ $campo }}" required><option value="">Selecciona</option><option value="nino">Niño</option><option value="nina">Niña</option></select>
        @elseif (in_array($campo, ['haServido','montajeJueves','primeraVezCristoRey']))
            <select class="form-select" id="{{ $campo }}" name="{{ $campo }}" required><option value="">Selecciona</option><option value="No">No</option><option value="Sí">Sí</option></select>
        @elseif ($campo === 'bartimeoOrigen')
            <select class="form-select" id="{{ $campo }}" name="{{ $campo }}" required><option value="">Selecciona</option>@foreach ($parroquias as $parroquiaActiva)<option value="{{ $parroquiaActiva->nombre }}">{{ $parroquiaActiva->nombre }}</option>@endforeach</select>
        @elseif ($campo === 'alergias' && $tipo === 'servidor')
            <textarea class="form-control" id="{{ $campo }}" name="{{ $campo }}" rows="2" required></textarea>
        @else
            @php
                $tipoCampo = match ($campo) {
                    'anioNacimiento', 'inscripcionesPrevias', 'cuantasVeces' => 'number',
                    'fechaNacimiento' => 'date',
                    default => str_contains(strtolower($campo), 'email') ? 'email' : 'text',
                };
                $obligatorio = in_array($campo, $tipo === 'caminante'
                    ? ['nombre', 'apellidos', 'colegio', 'anioNacimiento', 'inscripcionesPrevias', 'familiar1Nombre', 'familiar1Dni', 'familiar1Telefono', 'familiar1Email']
                    : ['nombre', 'apellidos', 'email', 'movil', 'fechaNacimiento', 'direccion', 'localidad', 'emergenciaNombre', 'emergenciaTelefono', 'emergenciaRelacion'], true);
            @endphp
            <input class="form-control" id="{{ $campo }}" name="{{ $campo }}" type="{{ $tipoCampo }}" @required($obligatorio)
                @if ($campo === 'anioNacimiento') min="1900" max="{{ now()->year }}" @elseif ($tipoCampo === 'number') min="0" @endif>
        @endif
    </div>
@endforeach
@if ($tipo === 'caminante')
    <div class="col-md-6"><label class="form-label" for="tallaCamiseta">Talla de camiseta</label><select class="form-select" id="tallaCamiseta" name="tallaCamiseta" required><option value="">Selecciona</option>@foreach ($catalogos['talla_caminante'] as $valor)<option>{{ $valor }}</option>@endforeach</select></div>
    @foreach (['bautismoRecibido'=>'Bautismo','primeraComunionRecibida'=>'Primera comunión'] as $campo=>$etiqueta)<div class="col-md-6 form-check ms-2"><input class="form-check-input" type="checkbox" name="{{ $campo }}" value="1" id="{{ $campo }}"><label class="form-check-label" for="{{ $campo }}">{{ $etiqueta }}</label></div>@endforeach
    @foreach (['listaEsperaPrevia' => '¿Estuviste en lista de espera?', 'tieneAlergia' => '¿Tienes alguna alergia?'] as $campo => $etiqueta)
        <div class="col-md-6">
            <label class="form-label" for="{{ $campo }}">{{ $etiqueta }}</label>
            <select class="form-select" id="{{ $campo }}" name="{{ $campo }}">
                <option value="No">No</option><option value="Sí">Sí</option>
            </select>
        </div>
    @endforeach
    @for ($i = 0; $i < 2; $i++)
        <fieldset class="col-12">
            <legend class="h6">Familiar adicional {{ $i + 1 }} (opcional)</legend>
            <div class="row g-3">
                @foreach (['nombre' => 'Nombre', 'telefono' => 'Teléfono', 'parentesco' => 'Parentesco'] as $campo => $etiqueta)
                    <div class="col-md-4">
                        <label class="form-label" for="familiar-{{ $i }}-{{ $campo }}">{{ $etiqueta }}</label>
                        <input class="form-control" name="familiaresAdicionales[{{ $i }}][{{ $campo }}]" id="familiar-{{ $i }}-{{ $campo }}" type="{{ $campo === 'telefono' ? 'tel' : 'text' }}">
                    </div>
                @endforeach
            </div>
        </fieldset>
    @endfor
@else
    <div class="col-md-6">
        <label class="form-label" for="manejaExcel">¿Manejas Excel?</label>
        <select class="form-select" name="manejaExcel" id="manejaExcel"><option value="Sí">Sí</option><option value="No">No</option></select>
    </div>
    @foreach (['tallaCamisetaBlanca'=>'Camiseta blanca','tallaCamisetaGris'=>'Camiseta gris','tallaSudadera'=>'Sudadera'] as $campo=>$etiqueta)<div class="col-md-4"><label class="form-label" for="{{ $campo }}">{{ $etiqueta }}</label><select class="form-select" name="{{ $campo }}" id="{{ $campo }}"><option value="">No necesito</option>@foreach($catalogos['talla_ropa'] as $valor)<option>{{ $valor }}</option>@endforeach</select></div>@endforeach
    <div class="col-12"><label class="form-label" for="serviciosHechos">Servicios en los que has participado</label><select class="form-select" id="serviciosHechos" name="serviciosHechos[]" multiple>@foreach($catalogos['servicio'] as $valor)<option>{{ $valor }}</option>@endforeach</select></div>
@endif
</div>
