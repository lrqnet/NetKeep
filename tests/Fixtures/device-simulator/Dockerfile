FROM golang:1.26.5-alpine@sha256:0178a641fbb4858c5f1b48e34bdaabe0350a330a1b1149aabd498d0699ff5fb2 AS build

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
