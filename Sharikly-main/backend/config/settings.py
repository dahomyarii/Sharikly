import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Load .env first
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Django settings
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-secret')
DEBUG = os.getenv('DJANGO_DEBUG', '1') == '1'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# Installed apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'storages',             # Added for R2 / S3
    'marketplace',
]

# Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.locale.LocaleMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database (SQLite default)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validators
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

LANGUAGES = [
    ('en', 'English'),
    ('ar', 'Arabic'),
    ('es', 'Spanish'),
]

LOCALE_PATHS = [ BASE_DIR / 'locale' ]

# CORS
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
CORS_ALLOW_ALL_ORIGINS = True

# Static / Media
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'marketplace.User'

# REST Framework & JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# ----------------------------
# Cloudflare R2 / S3 Storage
# ----------------------------
USE_CLOUDFLARE_R2 = os.getenv('USE_CLOUDFLARE_R2', 'True') == 'True'

if USE_CLOUDFLARE_R2:
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

    AWS_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('R2_BUCKET_NAME')
    AWS_S3_ENDPOINT_URL = os.getenv('R2_ENDPOINT')
    AWS_S3_REGION_NAME = 'auto'
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    AWS_S3_ADDRESSING_STYLE = 'virtual'
    AWS_DEFAULT_ACL = None
    AWS_QUERYSTRING_AUTH = True  # ensures signed URLs for security
