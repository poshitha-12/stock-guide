import yaml

def read_configuration(file_path):
    with open(file_path, 'r') as file:
        return yaml.safe_load(file)
