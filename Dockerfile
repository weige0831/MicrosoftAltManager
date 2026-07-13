# syntax=docker/dockerfile:1

# ---- Stage 1: build frontend (lightweight, ~5s after cleanup) ----
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: build backend ----
FROM golang:1.23-alpine AS backend
ENV CGO_ENABLED=0 GOPROXY=https://goproxy.cn,direct GOSUMDB=off
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend /app/common/dist ./common/dist
RUN go build -trimpath -ldflags="-s -w" -o /out/msm .

# ---- Stage 3: runtime ----
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata && adduser -D -u 10001 msm
WORKDIR /app
COPY --from=backend /out/msm /app/msm
USER msm
ENV PORT=27321 TZ=Asia/Shanghai
EXPOSE 27321
ENTRYPOINT ["/app/msm"]
