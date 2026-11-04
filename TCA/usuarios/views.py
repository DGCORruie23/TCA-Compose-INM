from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Max, Count
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from rest_framework.parsers import JSONParser
from django.http import JsonResponse, HttpResponseRedirect, HttpResponse
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.views import LoginView

from datetime import datetime, date, timedelta
import math
import random
import secrets
import time

from .serializers import UserGetSerializer, UserGetSerializerC
from .models import UsuarioP


MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 60
CAPTCHA_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
CAPTCHA_LENGTH = 5


def _generate_captcha_code():
    return "".join(secrets.choice(CAPTCHA_CHARS) for _ in range(CAPTCHA_LENGTH))


def _build_captcha_svg(code):
    width, height = 190, 56
    bg_colors = ["#f3f4f6", "#e5e7eb", "#f8fafc"]
    text_colors = ["#13322B", "#611232", "#9D2449", "#1f2937", "#285C4D"]
    line_colors = ["#9ca3af", "#6b7280", "#9D2449", "#285C4D", "#B38E5D"]

    bg = random.choice(bg_colors)
    svg_parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        f'<rect width="100%" height="100%" rx="6" ry="6" fill="{bg}"/>',
    ]

    # Líneas curvas de ruido
    for _ in range(6):
        x1 = random.randint(0, width // 3)
        y1 = random.randint(4, height - 4)
        cx = random.randint(width // 3, 2 * width // 3)
        cy = random.randint(0, height)
        x2 = random.randint(2 * width // 3, width)
        y2 = random.randint(4, height - 4)
        color = random.choice(line_colors)
        stroke_w = random.uniform(1.0, 2.0)
        svg_parts.append(
            f'<path d="M {x1} {y1} Q {cx} {cy} {x2} {y2}" stroke="{color}" stroke-width="{stroke_w:.1f}" fill="none" opacity="0.55"/>'
        )

    # Puntos de ruido
    for _ in range(30):
        cx = random.randint(4, width - 4)
        cy = random.randint(4, height - 4)
        r = random.uniform(0.8, 2.0)
        color = random.choice(line_colors)
        svg_parts.append(
            f'<circle cx="{cx}" cy="{cy}" r="{r:.1f}" fill="{color}" opacity="0.45"/>'
        )

    # Caracteres del código con rotación y desplazamiento aleatorio
    spacing = (width - 30) // len(code)
    for i, char in enumerate(code):
        x = 20 + i * spacing + random.randint(-3, 3)
        y = random.randint(34, 42)
        angle = random.randint(-22, 22)
        font_size = random.randint(24, 29)
        color = random.choice(text_colors)
        svg_parts.append(
            f'<text x="{x}" y="{y}" fill="{color}" font-family="monospace, sans-serif" '
            f'font-size="{font_size}" font-weight="bold" '
            f'transform="rotate({angle} {x} {y})">{char}</text>'
        )

    svg_parts.append("</svg>")
    return "".join(svg_parts)


@never_cache
def captcha_image(request):
    code = _generate_captcha_code()
    request.session["captcha_code"] = code
    request.session.modified = True
    svg_content = _build_captcha_svg(code)
    response = HttpResponse(svg_content, content_type="image/svg+xml")
    response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response["Pragma"] = "no-cache"
    response["Expires"] = "0"
    return response


class CustomLoginView(LoginView):
    template_name = "base/log_in.html"

    def _get_lockout_remaining(self, request):
        lockout_until = request.session.get("login_lockout_until", 0)
        now = time.time()
        if lockout_until > now:
            return int(math.ceil(lockout_until - now))
        if lockout_until != 0 and lockout_until <= now:
            request.session["login_lockout_until"] = 0
            request.session["login_failed_attempts"] = 0
            request.session.modified = True
        return 0

    def _register_failed_attempt(self, request):
        attempts = request.session.get("login_failed_attempts", 0) + 1
        request.session["login_failed_attempts"] = attempts
        if attempts >= MAX_LOGIN_ATTEMPTS:
            request.session["login_lockout_until"] = time.time() + LOCKOUT_DURATION_SECONDS
        request.session.modified = True
        return attempts

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        remaining = self._get_lockout_remaining(self.request)
        attempts = self.request.session.get("login_failed_attempts", 0)
        context["lockout_remaining"] = remaining
        context["is_locked_out"] = remaining > 0
        context["failed_attempts"] = attempts
        context["max_attempts"] = MAX_LOGIN_ATTEMPTS
        context["remaining_attempts"] = max(0, MAX_LOGIN_ATTEMPTS - attempts)
        return context

    def post(self, request, *args, **kwargs):
        remaining = self._get_lockout_remaining(request)
        if remaining > 0:
            form = self.get_form()
            context = self.get_context_data(
                form=form,
                login_error=f"Demasiados intentos fallidos ({MAX_LOGIN_ATTEMPTS}). Por favor espera {remaining} segundos antes de volver a intentarlo.",
            )
            return self.render_to_response(context)

        captcha_input = request.POST.get("captcha", "").strip().upper()
        expected_captcha = request.session.pop("captcha_code", None)

        if not expected_captcha or captcha_input != expected_captcha.upper():
            attempts = self._register_failed_attempt(request)
            remaining = self._get_lockout_remaining(request)
            form = self.get_form()
            if remaining > 0:
                error_msg = f"Has alcanzado {MAX_LOGIN_ATTEMPTS} errores consecutivos. Debes esperar 1 minuto ({remaining}s) para volver a intentarlo."
            else:
                error_msg = f"El código CAPTCHA ingresado es incorrecto. Intentos fallidos: {attempts} de {MAX_LOGIN_ATTEMPTS}."
            context = self.get_context_data(form=form, login_error=error_msg)
            return self.render_to_response(context)

        return super().post(request, *args, **kwargs)

    def form_valid(self, form):
        self.request.session["login_failed_attempts"] = 0
        self.request.session["login_lockout_until"] = 0
        self.request.session.modified = True
        return super().form_valid(form)

    def form_invalid(self, form):
        attempts = self._register_failed_attempt(self.request)
        remaining = self._get_lockout_remaining(self.request)
        if remaining > 0:
            error_msg = f"Has alcanzado {MAX_LOGIN_ATTEMPTS} errores consecutivos. Debes esperar 1 minuto ({remaining}s) para volver a intentarlo."
        else:
            error_msg = f"Nombre de usuario o contraseña incorrectos. Intentos fallidos: {attempts} de {MAX_LOGIN_ATTEMPTS}."
        context = self.get_context_data(form=form, login_error=error_msg)
        return self.render_to_response(context)


# Create your views here.
def index(request):

    return render(request, 'base/index.html',)


def login_user(request):

    if request.method == 'POST':
        datos_recibidos = JSONParser().parse(request)
        datos_serializados = UserGetSerializer(data=datos_recibidos)
        print(datos_serializados)
        if datos_serializados.is_valid():
            datos = datos_serializados.data
            usuario_info = datos.get('nickname')
            pass_info = datos.get('password')

            print(f" nickname: {usuario_info}, pass: {pass_info}")

            if(UsuarioP.objects.filter(nickname = usuario_info).exists()):

                datos_usuario = UsuarioP.objects.get(nickname = usuario_info)

                if(check_password(pass_info, datos_usuario.password)):
                    nuevo_serializer = {'nickname': datos_usuario.nickname,
                                        'nombre': datos_usuario.nombre,
                                        'apellido': datos_usuario.apellido,
                                        'password': 'ok',
                                        'estado': datos_usuario.estado,
                                        'tipo': datos_usuario.tipo}
                    
                    print(f" ${datos_usuario.nickname} ${datos_usuario.nombre} ${datos_usuario.apellido} ${datos_usuario.estado}")
                    serializer_datos = UserGetSerializerC(nuevo_serializer)
                    return JsonResponse(serializer_datos.data, status = 200)

                else:
                    nuevo_serializer = {'nickname': 'error',
                                        'nombre': '',
                                        'apellido': '',
                                         'password': 'error',
                                         'estado': '',
                                         'tipo': ''}
                    serializer_datos = UserGetSerializerC(nuevo_serializer)
                    return JsonResponse(serializer_datos.data, status = 200)

            else:

                nuevo_serializer = {'nickname': 'error',
                                        'nombre': '',
                                        'apellido': '',
                                         'password': 'error',
                                         'estado': '',
                                         'tipo': ''}
                serializer_datos = UserGetSerializerC(nuevo_serializer)
                return JsonResponse(serializer_datos.data, status = 200)
        else:
            nuevo_serializer = {'nickname': 'error',
                                        'nombre': '',
                                        'apellido': '',
                                         'password': 'error',
                                         'estado': '',
                                         'tipo': ''}
            serializer_datos = UserGetSerializerC(nuevo_serializer)
            return JsonResponse(serializer_datos.data, status = 200)


def pagina404(request, exception):
    return render(request, 'base/error404.html')
