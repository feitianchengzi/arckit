# 部署和网络诊断

## 部署形态门禁

线上配置生效前，先判断服务如何部署。

### 源码构建部署

特征：

- 服务器有完整仓库源码。
- `docker-compose.yml` 使用 `build:` 且 `context` 指向真实源码目录。
- 可以在服务器运行 `docker compose up -d --build`。

验证：

```bash
pwd
ls
test -f go.mod || test -f package.json
docker compose --env-file .env config
```

如果 `build.context` 被解析成 `/` 或不存在路径，不要继续 `--build`。

### 镜像包部署

特征：

- 服务器目录只有 `docker-compose.yml`、`.env`、`*.tar.gz`、备份文件等。
- 本地或 CI 构建镜像，上传后 `docker load`。
- compose 应使用 `image:`，或部署命令必须带 `--no-build`。

常见错误：

```text
resolve : lstat /core-service: no such file or directory
```

处理：

```bash
docker load -i core-service-images.tar.gz
docker compose --env-file .env up -d --no-build core-service
```

如果 compose 仍有 `build:`，服务器又没有源码，应改用 `image:` 或使用项目部署脚本重新上传正确 compose。

### 容器名冲突

错误：

```text
container name "... " is already in use
```

处理前先确认旧容器身份：

```bash
docker ps -a --filter name=anime-calendar-core-prod
docker inspect anime-calendar-core-prod --format '{{.Config.Image}}'
```

确认是旧服务后：

```bash
docker stop anime-calendar-core-prod
docker rm anime-calendar-core-prod
docker compose --env-file .env up -d core-service
```

## 入口拓扑门禁

公网域名验证前，必须画清链路：

```text
client -> public domain -> entry gateway -> core-service -> OSS
```

不要假设域名指向当前后端服务器。先查：

```bash
dig +short api.example.com
curl -i http://127.0.0.1:9000/anime-calendar/health
curl -i http://{core-service-ip}:9000/anime-calendar/health
curl -i https://api.example.com/anime-calendar/health
```

如果域名 IP 与后端服务器 IP 不同，必须去入口机或上游网关配置转发。

## 入口网关识别

在入口机上执行：

```bash
ss -lntp | grep -E ':80|:443'
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
ps -ef | grep -Ei 'nginx|openresty|caddy|traefik|apisix|kong|envoy' | grep -v grep
```

### nginx / OpenResty

```bash
nginx -T | grep -n "api.example.com\|anime-calendar\|proxy_pass" -C 5
grep -R "api.example.com\|anime-calendar\|proxy_pass" -n /etc/nginx /usr/local/nginx/conf /www/server/panel/vhost/nginx 2>/dev/null
```

转发规则示例：

```nginx
location /anime-calendar/ {
    proxy_pass http://{core-service-host}:9000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Caddy

先判断 Caddyfile 是容器内路径还是宿主机 bind mount：

```bash
docker inspect {caddy-container} --format '{{json .Mounts}}'
docker inspect {caddy-container} --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}'
docker exec {caddy-container} cat /etc/caddy/Caddyfile
```

文件级 bind mount 下，如果用编辑器替换了宿主机文件 inode，容器可能仍读旧文件。修改后如果 `caddy adapt` 看不到新内容，直接重启容器：

```bash
docker restart {caddy-container}
```

Caddy 转发规则示例：

```caddyfile
api.example.com {
    handle /anime-calendar/* {
        reverse_proxy {core-service-host}:9000
    }

    handle {
        respond 404
    }
}
```

使用 `handle`，不要用 `handle_path`，因为 core-service 通常需要收到完整 `/anime-calendar/...` 路径。

验证：

```bash
docker exec {caddy-container} caddy adapt --config /etc/caddy/Caddyfile --pretty | grep -n "api.example.com\|anime-calendar\|{core-service-host}" -C 5
docker exec {caddy-container} caddy validate --config /etc/caddy/Caddyfile
docker exec {caddy-container} caddy reload --config /etc/caddy/Caddyfile
```

### 应用 API Gateway

如果 443 由业务网关容器接管，例如 `api-gateway`、`nebula-api-gateway`，不要找 Caddy/nginx。先查：

```bash
docker inspect {gateway-container} --format '{{json .Mounts}}'
docker inspect {gateway-container} --format '{{range .Config.Env}}{{println .}}{{end}}'
grep -R "anime-calendar\|api.example.com\|proxy\|route\|upstream" -n /opt /etc /root 2>/dev/null
```

目标仍是添加：

```text
/anime-calendar/* -> http://{core-service-host}:9000
```

## 网络连通

两台 ECS 同在阿里云时，优先使用私网 IP：

```text
entry gateway -> core-service private-ip:9000
```

如果临时走公网 IP，安全组只放行入口机公网 IP `/32` 到 core-service 的 TCP 9000。

在入口机验证：

```bash
curl -i --max-time 5 http://{core-service-host}:9000/anime-calendar/health
```

如果返回 502 或超时，先查安全组、防火墙、后端容器端口映射和 `reverse_proxy` 目标，不要继续查 OSS。

## 验证矩阵

分层验证，按顺序推进：

1. 后端本机：

```bash
curl -i http://127.0.0.1:9000/anime-calendar/health
curl -i http://127.0.0.1:9000/anime-calendar/v1/public/assets/{objectKey}
```

2. 入口机到后端：

```bash
curl -i http://{core-service-host}:9000/anime-calendar/health
```

3. 入口机本机强制命中域名：

```bash
curl -k -i --resolve api.example.com:443:127.0.0.1 https://api.example.com/anime-calendar/health
```

4. 公网域名：

```bash
curl -i https://api.example.com/anime-calendar/health
curl -i https://api.example.com/anime-calendar/v1/public/assets/{objectKey}
```

5. 浏览器或客户端实际展示。

任何一层失败，只排查该层。

## curl 使用规则

`curl -I` 发送 HEAD 请求。很多 API 网关或后端没有为 HEAD 配路由，会返回 404；不能据此判断 GET 失败。

推荐：

```bash
# GET 并显示响应头和正文
curl -i "URL"

# GET，只看响应头
curl -sS -D - -o /dev/null "URL"

# 图片网关跟随 302，查看最终图片响应
curl -L -I "URL"

# 禁用本机代理排除代理影响
curl -x "" -i "URL"
```

看到 `HTTP/1.1 200 Connection established` 说明本机请求经过 HTTPS 代理。需要排除代理时使用 `-x ""`。

## 常见错误定位

- `404 page not found` 且后端本机正常：入口网关路由没命中、域名指错入口机、或使用了 HEAD。
- `502` 且 `server: Caddy/nginx`：入口网关命中了路由，但连不上后端。
- 后端本机 `302`，公网 `404`：域名入口未转发到新路由。
- 公网仍有旧 CORS 头：请求可能命中旧 API Gateway，不是新 Caddy/nginx 规则。
- `SignatureDoesNotMatch`：签名串、STS token、endpoint、bucket、object key 或签名方法错误，先读 `credential-modes.md`。
- `AccessDenied`：RAM 权限、Bucket ACL、Bucket Policy 或 object key 权限问题。
