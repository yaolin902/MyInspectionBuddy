FROM python:3.9

RUN apt-get update && apt-get install ffmpeg libsm6 libxext6  -y

WORKDIR /app

COPY requirements.txt /app

RUN mkdir /uploads

RUN pip3 install --no-cache-dir --upgrade -r requirements.txt

COPY . /app

ENTRYPOINT ["python3"]
CMD ["main.py"]
