@extends('layouts.bartimeo')
@section('title', 'Editar inscripción')
@section('content')
<main class="container py-4"><a href="{{ route('bartimeo.panel',['parroquia'=>$parroquia,'edicion'=>$retiro->edicion,'tipo'=>$tipo]) }}">← Volver al panel</a><h1 class="h2 my-3">Editar inscripción</h1>
<form method="post" action="{{ route('bartimeo.panel.guardar',['parroquia'=>$parroquia,'edicion'=>$retiro->edicion]) }}" class="card card-body">@csrf<input type="hidden" name="accion" value="editar"><input type="hidden" name="id" value="{{ $ficha['id'] }}"><input type="hidden" name="tipo" value="{{ $tipo }}">
@foreach(['nombre'=>'Nombre','apellidos'=>'Apellidos','movil'=>'Teléfono','email'=>'Correo electrónico'] as $campo=>$label)<label class="form-label" for="{{ $campo }}">{{ $label }}</label><input class="form-control mb-3" id="{{ $campo }}" name="{{ $campo }}" value="{{ $ficha[$campo]??'' }}" maxlength="150">@endforeach
<label class="form-label" for="estado">Estado</label><select class="form-select mb-3" id="estado" name="estado">@foreach(['Confirmado','Cancelado'] as $estado)<option @selected(($ficha['estado']??'')===$estado)>{{ $estado }}</option>@endforeach</select>
@if($tipo==='caminante')<label class="form-label" for="genero">Grupo de aforo</label><select class="form-select mb-3" id="genero" name="genero"><option value="nino" @selected(($ficha['genero']??'')==='nino')>Niños</option><option value="nina" @selected(($ficha['genero']??'')==='nina')>Niñas</option></select>@endif
<button class="btn btn-primary">Guardar cambios</button></form></main>
@endsection
