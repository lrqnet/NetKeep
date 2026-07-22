FROM golang:1.24.5-alpine@sha256:daae04ebad0c21149979cd8e9db38f565ecefd8547cf4a591240dc1972cf1399 AS build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /device-simulator .

FROM alpine:3.23.0@sha256:51183f2cfa6320055da30872f211093f9ff1d3cf06f39a0bdb212314c5dc7375

RUN addgroup -S -g 30001 netkeep \
    && adduser -S -D -H -u 30001 -G netkeep netkeep

COPY --from=build /device-simulator /usr/local/bin/device-simulator
COPY network-cli /usr/local/bin/network-cli

RUN chmod 0755 /usr/local/bin/device-simulator /usr/local/bin/network-cli

USER 30001:30001

EXPOSE 2222

HEALTHCHECK --interval=5s --timeout=3s --retries=20 CMD ["/usr/local/bin/device-simulator", "healthcheck"]

ENTRYPOINT ["/usr/local/bin/device-simulator"]
