# syntax=docker/dockerfile:1
# Frontend pre-built locally. Server only builds Go (avoids npm network issues).
FROM golang:1.23-alpine AS backend
ENV CGO_ENABLED=0 GOPROXY=https://goproxy.cn,direct GOSUMDB=off
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -trimpath -ldflags="-s -w" -o /out/msm .
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata && adduser -D -u 10001 msm
WORKDIR /app
COPY --from=backend /out/msm /app/msm
USER msm
ENV PORT=27321 TZ=Asia/Shanghai
EXPOSE 27321
ENTRYPOINT ["/app/msm"]
