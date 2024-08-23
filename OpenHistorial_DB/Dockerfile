FROM python:3.9

WORKDIR /app

COPY requirements.txt /app

RUN mkdir /uploads

RUN pip3 install --no-cache-dir --upgrade -r requirements.txt

COPY main.py /app

ENTRYPOINT ["python3"]
CMD ["main.py"]
