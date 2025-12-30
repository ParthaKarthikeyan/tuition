# WSGI entry point for PythonAnywhere
# This file is required for PythonAnywhere to run FastAPI

import sys
import os

# Add the backend directory to the path
path = os.path.dirname(os.path.abspath(__file__))
if path not in sys.path:
    sys.path.insert(0, path)

# Import the FastAPI app
from main import app

# PythonAnywhere uses WSGI, so we need to wrap FastAPI with an ASGI-to-WSGI adapter
# However, PythonAnywhere now supports ASGI natively for FastAPI
# Just export the app for the ASGI configuration

application = app

