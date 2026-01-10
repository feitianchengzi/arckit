# 构建阶段
FROM golang:1.24-alpine AS builder

WORKDIR /app

# 复制go mod文件
COPY go.mod ./
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o todo .

# 运行阶段
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

# 从构建阶段复制二进制文件
COPY --from=builder /app/todo .

# 运行应用
# 注意：端口配置通过环境变量 PORT 在运行时确定，实际端口映射由 docker-compose.yml 处理
CMD ["./todo"]
