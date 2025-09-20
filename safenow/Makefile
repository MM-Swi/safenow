SHELL := /bin/bash
.PHONY: venv run migrate test

venv:
	python3 -m venv venv
	source venv/bin/activate && pip install -r requirements.txt

run:
	source venv/bin/activate && python manage.py runserver

migrate:
	source venv/bin/activate && python manage.py migrate

test:
	source venv/bin/activate && pytest