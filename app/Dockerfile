FROM debian:8
ENV DEBIAN_FRONTEND noninteractive

EXPOSE 8000

RUN apt-get -qq update && apt-get -qq -y --no-install-recommends install \
    build-essential \
    ca-certificates \
    gettext \
    git \
    libffi-dev \
    libpq-dev \
    python3 \
    python3-dev \
    python3-venv \
    rsync \
    ssh

COPY requirements.txt /venv/requirements.txt
RUN python3 -m venv /venv \
&& /venv/bin/pip install -r /venv/requirements.txt \
&& /venv/bin/pip freeze > /venv/requirements-freezed.txt

RUN git config --global push.default matching

COPY . /venv/app

ARG VERSION
ARG SETUP_MODE
RUN /venv/app/setup.sh $VERSION $SETUP_MODE
