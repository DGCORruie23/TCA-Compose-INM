from django import forms
from usuarios.models import Registro, Acciones, Area, Mensaje, Periodo, Rubro, TipoVisita
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError
import re
from datetime import datetime

class RegistroConAccionesYPruebasForm(forms.ModelForm):
    class Meta:
        model = Registro
        fields = ['claveAcuerdo','fecha_inicio', 'fecha_termino', 'rubro', 'periodo', 'tipo_visita']
        widgets = {
            'periodo': forms.HiddenInput(),
            'tipo_visita': forms.Select(attrs={'class': 'w-full p-2 border rounded-md'}),
        }

    accion1_area2 = forms.ModelMultipleChoiceField(queryset=Area.objects.all(), label="Áreas Responsables")
    accion1_descripcion = forms.CharField(widget=forms.Textarea, label="Descripción")
    accion1_antecedente = forms.CharField(widget=forms.Textarea, label="Antecedente")
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from django.db.models.functions import Lower
        self.fields['rubro'].queryset = Rubro.objects.all().order_by(Lower('tipo'))
        self.fields['tipo_visita'].queryset = TipoVisita.objects.all()
        self.fields['tipo_visita'].empty_label = "Seleccione Tipo de Visita"
        if not self.instance.pk and 'tipo_visita' in self.fields:
            self.fields['tipo_visita'].initial = 1
        newest_period = Periodo.objects.order_by('-id').first()
        if newest_period and not self.instance.pk:
            self.fields['periodo'].initial = newest_period

class RegistroConAccionesFORM(forms.ModelForm):
    class Meta:
        model = Registro
        fields = ['claveAcuerdo', 'fecha_inicio', 'fecha_termino', 'rubro', 'estado', 'porcentaje_avance', 'periodo', 'tipo_visita']
        widgets = {
            'periodo': forms.HiddenInput(),
            'estado': forms.HiddenInput(),
            'porcentaje_avance': forms.NumberInput(attrs={'min': 0, 'max': 100}),
            'rubro': forms.SelectMultiple(attrs={'size': 8}),
            'tipo_visita': forms.Select(attrs={'class': 'w-full p-2 border rounded-md'}),
        }
        labels = {
            'claveAcuerdo': 'Clave de Acuerdo',
            'estado': 'Estatus',
            'porcentaje_avance': 'Porcentaje de Avance',
            'tipo_visita': 'Tipo de Visita',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from django.db.models.functions import Lower
        self.fields['rubro'].queryset = Rubro.objects.all().order_by(Lower('tipo'))
        self.fields['tipo_visita'].queryset = TipoVisita.objects.all()
        self.fields['tipo_visita'].empty_label = "Seleccione Tipo de Visita"
        if not self.instance.pk and 'tipo_visita' in self.fields:
            self.fields['tipo_visita'].initial = 1
        newest_period = Periodo.objects.order_by('-id').first()
        if newest_period and not self.instance.pk:
            self.fields['periodo'].initial = newest_period
        self.fields['porcentaje_avance'].validators.extend([MaxValueValidator(100), MinValueValidator(0)])

    def clean_claveAcuerdo(self):
        claveAcuerdo = self.cleaned_data.get('claveAcuerdo')
        print(claveAcuerdo)
        pattern = r'^\d{3}/[A-Z]{1,6}/\d{2}/\d{4}$'

        if not re.match(pattern, claveAcuerdo):
            raise ValidationError("La clave del acuerdo debe tener el formato 00/AREA/MES/AÑO.")

        instance_id = self.instance.idRegistro
        if Registro.objects.exclude(idRegistro=instance_id).filter(claveAcuerdo=claveAcuerdo).exists():
            raise forms.ValidationError("Esta clave de acuerdo ya existe.")


        return claveAcuerdo



    def clean_fecha_inicio(self):
        fecha_inicio = self.cleaned_data.get('fecha_inicio')
        if not fecha_inicio:
            raise ValidationError("La fecha de inicio es obligatoria.")
        
        fecha_inicio_str = fecha_inicio.strftime('%d/%m/%Y')

        if not re.match(r'^\d{2}/\d{2}/\d{4}$', fecha_inicio_str):
            raise ValidationError("La fecha debe tener el formato dd/mm/yyyy.")

        year = int(fecha_inicio_str.split('/')[-1])
        if year < 1000 or year > 9999:
            raise ValidationError("El año debe tener 4 dígitos.")
        
        return fecha_inicio

    def clean_fecha_termino(self):
        fecha_termino = self.cleaned_data.get('fecha_termino')
        if not fecha_termino:
            raise ValidationError("La fecha de término es obligatoria.")
        
        fecha_termino_str = fecha_termino.strftime('%d/%m/%Y')
        
        if not re.match(r'^\d{2}/\d{2}/\d{4}$', fecha_termino_str):
            raise ValidationError("La fecha debe tener el formato dd/mm/yyyy.")

        year = int(fecha_termino_str.split('/')[-1])
        if year < 1000 or year > 9999:
            raise ValidationError("El año debe tener 4 dígitos.")
        
        return fecha_termino


    
class AccionesForm(forms.ModelForm):
    class Meta:
        model = Acciones
        fields = ['area2', 'antecedente','descripcion']
        labels = {
            'area2': 'Áreas Responsables',
        }
        widgets = {
            'area2': forms.SelectMultiple(attrs={'size': 8}),
            'antecedente': forms.Textarea(attrs={
                'cols': 30,
                'rows': 7,
            }),
            'descripcion': forms.Textarea(attrs={
                'cols': 30,
                'rows': 7,
            }),
        }

class MensajeForm(forms.ModelForm):
    class Meta:
        model = Mensaje
        fields = ['texto', 'archivo']
        widgets = {
            'texto': forms.Textarea(attrs={'placeholder': 'Escribe tu mensaje aquí...'}),
        }


class CargarArchivoForm(forms.Form):
    archivo = forms.FileField()