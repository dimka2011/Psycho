import os  
from waitress import serve  
from backend.wsgi import application
# Import app  
# Run from the same directory as this script  
this_files_dir = os.path.dirname(os.path.abspath(__file__))  
os.chdir(this_files_dir)  
# `url_prefix` — необязательный параметр, полезен, если приложение обслуживается в подкаталоге (например, за обратным прокси)  
serve(application, host='127.0.0.1', port=8001)  