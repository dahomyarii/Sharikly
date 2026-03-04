"""
SIGNUP FLOW EXAMPLE
This shows how to call send_verification_email during user registration.
"""

from django.contrib.auth import get_user_model
from accounts.views import send_verification_email

User = get_user_model()


def register_user(email, username, password):
    """
    Example signup function that creates a user and sends verification email.
    
    Usage in your views.py or API endpoint:
    """
    # Create user with is_email_verified=False
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        is_email_verified=False,
    )
    
    # Send verification email
    send_verification_email(user)
    
    return user


# Example REST API view integration:
"""
from rest_framework import generics, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from accounts.views import send_verification_email

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_email_verified=False,
        )
        
        # Send verification email
        send_verification_email(user)
        
        return Response({'message': 'User created. Please verify your email.'}, status=status.HTTP_201_CREATED)
"""

