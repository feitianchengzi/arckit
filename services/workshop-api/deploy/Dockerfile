# syntax=docker/dockerfile:1

# 在 Mac 上使用本机 builder 架构交叉编译目标二进制，避免为整个 Go 构建阶段启用 QEMU。
FROM --platform=$BUILDPLATFORM golang:1.24-alpine AS builder

ARG TARGETOS=linux
ARG TARGETARCH=amd64
ARG GO_BUILD_GOMAXPROCS=2
ARG GO_BUILD_PARALLELISM=2
ARG GO_BUILD_MEMORY_LIMIT=768MiB
ARG SOURCE_COMMIT=unknown
ARG SOURCE_DIRTY=true

WORKDIR /app

# 复制go mod文件
COPY go.mod ./
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 \
    GOOS=$TARGETOS \
    GOARCH=$TARGETARCH \
    GOMAXPROCS=$GO_BUILD_GOMAXPROCS \
    GOMEMLIMIT=$GO_BUILD_MEMORY_LIMIT \
    go build -p "$GO_BUILD_PARALLELISM" -a -installsuffix cgo -o todo .

# 运行阶段
FROM alpine:3.22

ARG SOURCE_COMMIT=unknown
ARG SOURCE_DIRTY=true
LABEL org.opencontainers.image.revision=$SOURCE_COMMIT \
      org.opencontainers.image.source-dirty=$SOURCE_DIRTY

RUN apk --no-cache add ca-certificates ffmpeg git openssh-client postgresql17-client tzdata \
    && addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /home/appuser/

# 从构建阶段复制二进制文件
COPY --from=builder /app/todo .

# 只有数据库 schema、实时 Broker 和 HTTP 都就绪时才会通过。
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=12 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-8081}/${SERVICE_NAME:-workshop}/v1/public/health" || exit 1

USER appuser

# 运行应用
# 注意：端口配置通过环境变量 PORT 在运行时确定，实际端口映射由 docker-compose.yml 处理
CMD ["./todo"]
