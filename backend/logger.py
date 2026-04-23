import logging
import os
import sys

def get_logger(name: str, runtime_dir: str = None) -> logging.Logger:
    logger = logging.getLogger(name)
    
    # If logger already has handlers, return it
    if logger.handlers:
        return logger
        
    logger.setLevel(logging.INFO)
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    
    # File handler
    if runtime_dir:
        logs_dir = os.path.join(runtime_dir, "logs")
        os.makedirs(logs_dir, exist_ok=True)
        log_file = os.path.join(logs_dir, "vault.log")
        
        # Rotating file handler would be better, but basic FileHandler is fine for now
        fh = logging.FileHandler(log_file)
        fh.setLevel(logging.INFO)
        fh.setFormatter(formatter)
        logger.addHandler(fh)
        
    return logger
