# syntax=docker/dockerfile:1.6
# =====================================================================
# DataPay Admin (Vue3 + Vite) - 静态资源 + nginx
# =====================================================================

FROM node:20-alpine AS builder
WORKDIR /build
ENV npm_config_registry=https://registry.npmmirror.com

COPY package.json package-lock.json* ./
# --mount=type=cache: 保留 npm 包缓存，--no-cache 构建时也不重新下载依赖
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY . .
# 生产构建后的 dist 里的 /api 路径会被 nginx 转发到 datapay_server
RUN --mount=type=cache,target=/root/.npm \
    npm run build

# ------------------------ runtime ------------------------
FROM nginx:1.27-alpine AS runtime
RUN alpine_version="$(cut -d. -f1,2 /etc/alpine-release)" && \
    printf '%s\n' \
      "https://mirrors.aliyun.com/alpine/v${alpine_version}/main" \
      "https://mirrors.aliyun.com/alpine/v${alpine_version}/community" \
      > /etc/apk/repositories && \
    apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
