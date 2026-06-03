from django.http import JsonResponse
from django.db.models import Count, Avg, IntegerField, Q
from usuarios.models import Area, Registro
from datetime import datetime

def mapa_datos(request):
    """
    Endpoint público de API para compartir los datos del mapa de seguimiento
    con otros sistemas.
    Devuelve un JSON con la estructura de visitas, acuerdos y avances
    agrupados por cada Oficina de Representación (OR) del INM.
    """
    try:
        consultarAreas = Area.objects.all()
        registros = Registro.objects.all()
        
        registros_visitas = registros.values('area', 'fecha_inicio').annotate(
            total=Count('idRegistro'),
            pendiente=Count('idRegistro', filter=Q(estado="1")),
            atendido=Count('idRegistro', filter=Q(estado="2")),
            seguimiento=Avg('porcentaje_avance', output_field=IntegerField())
        ).order_by('area', 'fecha_inicio')

        ors_mapa = { area_.name.replace("OR ",""): [] for area_ in consultarAreas[:32]}

        for registro in registros_visitas:
            area_obj = consultarAreas.filter(idArea=registro['area']).first()
            if not area_obj:
                continue
            oficina_ = str(area_obj.name).replace("OR ","")
            or_map = str(area_obj.nickname).replace("OR ","")
            if oficina_ in ors_mapa:
                ors_mapa[oficina_].append({
                    'fecha': datetime.strftime(registro['fecha_inicio'], "%d/%m/%Y"),
                    'total': registro['total'],
                    'pendiente': registro['pendiente'],
                    'atendido': registro['atendido'],
                    'avance': registro['seguimiento'],
                    'or_map': or_map,
                })
                
        return JsonResponse(ors_mapa, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
