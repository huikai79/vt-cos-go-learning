FROM debian:bookworm-slim AS katago-build
ARG KATAGO_VERSION=1.17.1
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates cmake g++ git make libeigen3-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch "v${KATAGO_VERSION}" https://github.com/lightvector/KataGo.git /src/katago
WORKDIR /src/katago/cpp
RUN cmake . -DUSE_BACKEND=EIGEN -DNO_GIT_REVISION=1 -DNO_LIBZIP=1 -DCMAKE_BUILD_TYPE=Release \
    && make -j2

FROM node:22-bookworm-slim
ARG KATAGO_MODEL_URL=https://github.com/lightvector/KataGo/releases/download/v1.17.1/b10c384h6nbttflrs.bin.gz
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=katago-build /src/katago/cpp/katago /opt/katago/katago
COPY --from=katago-build /src/katago/cpp/configs/gtp_example.cfg /opt/katago/gtp.cfg
RUN curl --fail --location --retry 3 "${KATAGO_MODEL_URL}" -o /opt/katago/model.bin.gz \
    && test -s /opt/katago/model.bin.gz
COPY katago-bridge.cjs /app/katago-bridge.cjs
COPY docker/start-katago.sh /app/start-katago.sh
RUN chmod +x /app/start-katago.sh /opt/katago/katago
ENV VTCOS_KATAGO_EXE=/opt/katago/katago \
    VTCOS_KATAGO_CONFIG=/opt/katago/gtp.cfg \
    VTCOS_KATAGO_MODEL=/opt/katago/model.bin.gz \
    VTCOS_KATAGO_ALLOW_REMOTE=1 \
    VTCOS_KATAGO_MAX_CONCURRENT=1
EXPOSE 10000
CMD ["/app/start-katago.sh"]
