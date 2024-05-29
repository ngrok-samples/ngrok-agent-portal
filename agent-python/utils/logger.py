import logging
import os
import sys

# Create a formatter
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

# Determine logging level based on environment
def get_log_level():
    env = os.getenv("ENV", "development")
    return logging.DEBUG if env == "development" else logging.WARNING

# Create a logger
logger = logging.getLogger(__name__)
logger.setLevel(get_log_level())

# Create a console handler with the appropriate format
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.DEBUG)
console_handler.setFormatter(formatter)

# Add the console handler to the logger
logger.addHandler(console_handler)

# Add file handlers if in production environment
if os.getenv("ENV") == "production":
    error_file_handler = logging.FileHandler("/tmp/ngrok-agent-python-error.log")
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(formatter)
    logger.addHandler(error_file_handler)

    combined_file_handler = logging.FileHandler("/tmp/ngrok-agent-python-combined.log")
    combined_file_handler.setLevel(logging.DEBUG)
    combined_file_handler.setFormatter(formatter)
    logger.addHandler(combined_file_handler)
