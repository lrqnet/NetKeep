FROM golang:1.27.3-alpine@sha256:d200d2dd76b03a99b52651fd1325aff7dcd35422c35c01bac56571b0507f3deb AS build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /device-simulator .

FROM scratch

COPY --from=build /device-simulator /usr/local/bin/device-simulator

USER 30001:30001

EXPOSE 2222

HEALTHCHECK --interval=5s --timeout=3s --retries=20 CMD ["/usr/local/bin/device-simulator", "healthcheck"]

ENTRYPOINT ["/usr/local/bin/device-simulator"]
