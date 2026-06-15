#!/usr/bin/env python3
"""
scaffold_be.py — 后端项目脚手架

根据语言/框架/数据库快速创建后端项目结构，包含测试配置、API模板、领域层模板。

用法:
  python3 scaffold_be.py --language typescript --framework fastify --database postgresql --project-name order-service
  python3 scaffold_be.py --language python --framework fastapi --database postgresql --project-name order-service
  python3 scaffold_be.py --help
"""

import argparse
import json
from pathlib import Path


FRAMEWORKS = {
    "typescript": {
        "fastify": {
            "init": "npm init -y && npm install fastify && npm install -D typescript @types/node vitest tsx",
            "deps_extra": "npm install @prisma/client && npm install -D prisma",
            "config_file": "tsconfig.json",
            "config": {
                "compilerOptions": {
                    "target": "ES2022",
                    "module": "NodeNext",
                    "moduleResolution": "NodeNext",
                    "strict": True,
                    "strictNullChecks": True,
                    "esModuleInterop": True,
                    "skipLibCheck": True,
                    "forceConsistentCasingInFileNames": True,
                    "resolveJsonModule": True,
                    "outDir": "./dist",
                    "rootDir": "./src",
                },
                "include": ["src"],
            },
            "vitest_config": """import {{ defineConfig }} from 'vitest/config';

export default defineConfig({{
  test: {{
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  }},
}});
""",
            "entry": """import Fastify from 'fastify';
import { registerRoutes } from './interfaces/http/routes';
import { errorHandler } from './interfaces/http/middleware/error-handler';

const app = Fastify({ logger: true });

app.setErrorHandler(errorHandler);
registerRoutes(app);

const start = async () => {
  try {
    const port = parseInt(process.env.PORT ?? '3000', 10);
    await app.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
""",
            "handler": """import type {{ FastifyRequest, FastifyReply }} from 'fastify';
import {{ OrderService }} from '@/application/order/order-service';
import {{ CreateOrderCommand }} from '@/application/order/commands/create-order';

interface CreateOrderBody {{
  items: Array<{{
    productId: string;
    quantity: number;
  }}>;
}}

export async function createOrder(
  req: FastifyRequest<{{
    Body: CreateOrderBody;
  }}>,
  reply: FastifyReply
) {{
  const command = new CreateOrderCommand(req.body);
  const order = await req.di.resolve(OrderService).createOrder(command);
  reply.status(201).json({{ data: order }});
}}
""",
            "test": """import {{ describe, test, expect, beforeAll, afterAll }} from 'vitest';
import {{ buildApp }} from '@/app';

describe('POST /orders', () => {{
  test('创建订单返回 201', async () => {{
    const app = await buildApp();
    const response = await app.inject({{
      method: 'POST',
      url: '/orders',
      payload: {{ items: [{{ productId: 'p-1', quantity: 2 }}] }},
    }});
    expect(response.statusCode).toBe(201);
    expect(response.json().data.id).toBeDefined();
    await app.close();
  }});
}});
""",
            "ext": ".ts",
        },
    },
    "python": {
        "fastapi": {
            "init": "pip install fastapi uvicorn sqlalchemy alembic pydantic",
            "deps_extra": "pip install pytest pytest-asyncio httpx",
            "config_file": "pyproject.toml",
            "config": """[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"

[tool.ruff]
line-length = 120
target-version = "py311"
""",
            "entry": """from fastapi import FastAPI
from src.interfaces.http.routes import register_routes
from src.interfaces.http.middleware.error_handler import add_error_handler

app = FastAPI(title="Order Service", version="1.0.0")
add_error_handler(app)
register_routes(app)


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
""",
            "handler": """from fastapi import APIRouter, Depends, Request
from src.application.order.order_service import OrderService
from src.application.order.commands.create_order import CreateOrderCommand

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", status_code=201)
async def create_order(
    body: CreateOrderCommand,
    request: Request,
    service: OrderService = Depends(),
):
    order = await service.create_order(body)
    return {"data": order}
""",
            "test": """import pytest
from httpx import AsyncClient, ASGITransport
from src.app import app


@pytest.mark.asyncio
async def test_create_order_returns_201():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/orders",
            json={"items": [{"product_id": "p-1", "quantity": 2}]},
        )
    assert response.status_code == 201
    assert "data" in response.json()
""",
            "ext": ".py",
        },
    },
}

DATABASE_CONFIGS = {
    "postgresql": {
        "typescript": {
            "setup": "npx prisma init",
            "schema": """generator client {{
  provider = "prisma-client-js"
}}

datasource db {{
  provider = "postgresql"
  url      = env("DATABASE_URL")
}}

model Order {{
  id        String   @id @default(cuid())
  status    String   @default("PENDING")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  items     OrderItem[]

  @@map("orders")
}}

model OrderItem {{
  id        String  @id @default(cuid())
  orderId   String  @map("order_id")
  productId String  @map("product_id")
  quantity  Int
  price     Decimal @db.Decimal(10, 2)
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_items")
}}
""",
        },
        "python": {
            "setup": "alembic init migrations",
            "schema": "# SQLAlchemy models defined in src/infrastructure/persistence/models.py",
        },
    },
    "mysql": {
        "typescript": {
            "setup": "npx prisma init",
            "schema": """generator client {{
  provider = "prisma-client-js"
}}

datasource db {{
  provider = "mysql"
  url      = env("DATABASE_URL")
}}
""",
        },
        "python": {
            "setup": "alembic init migrations",
            "schema": "# SQLAlchemy models defined in src/infrastructure/persistence/models.py",
        },
    },
    "sqlite": {
        "typescript": {
            "setup": "npx prisma init",
            "schema": """generator client {{
  provider = "prisma-client-js"
}}

datasource db {{
  provider = "sqlite"
  url      = env("DATABASE_URL")
}}
""",
        },
        "python": {
            "setup": "alembic init migrations",
            "schema": "# SQLAlchemy models defined in src/infrastructure/persistence/models.py",
        },
    },
}


def create_project(language: str, framework: str, database: str, project_name: str, output_dir: str) -> dict:
    """创建后端项目结构"""
    base = Path(output_dir) if output_dir else Path(project_name)
    fw = FRAMEWORKS[language][framework]
    db = DATABASE_CONFIGS[database][language]
    ext = fw["ext"]

    dirs = [
        "src/domain/order/events",
        "src/domain/order/errors",
        "src/domain/shared",
        "src/application/order/commands",
        "src/application/order/queries",
        "src/application/shared",
        "src/infrastructure/persistence/migrations",
        "src/infrastructure/cache",
        "src/infrastructure/messaging",
        "src/infrastructure/auth",
        "src/interfaces/http/middleware",
        "src/interfaces/contracts",
        "src/config",
        "src/__tests__/unit",
        "src/__tests__/integration",
        "src/__tests__/fixtures",
    ]

    created_dirs = []
    for d in dirs:
        p = base / d
        p.mkdir(parents=True, exist_ok=True)
        created_dirs.append(str(p))

    # 入口文件
    entry_path = base / f"src/app{ext}"
    entry_path.write_text(fw["entry"], encoding="utf-8")

    # 配置文件
    config_path = base / fw["config_file"]
    if isinstance(fw["config"], dict):
        config_path.write_text(json.dumps(fw["config"], indent=2, ensure_ascii=False), encoding="utf-8")
    else:
        config_path.write_text(fw["config"], encoding="utf-8")

    # Vitest 配置（TypeScript）
    if language == "typescript":
        vitest_path = base / "vitest.config.ts"
        vitest_path.write_text(fw["vitest_config"], encoding="utf-8")

    # 领域错误基类
    if language == "typescript":
        error_path = base / "src/domain/shared/domain-error.ts"
        error_path.write_text("""/**
 * DomainError — 领域错误基类
 *
 * 所有业务异常继承此类，精确到业务语义。
 * 全局错误处理中间件统一将 DomainError 映射为 HTTP 响应。
 */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number,
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'DomainError';
  }

  static businessRule(message: string): DomainError {
    return new DomainError('BUSINESS_RULE_VIOLATION', message, 422);
  }

  static notFound(resource: string, id: string): DomainError {
    return new DomainError('NOT_FOUND', `${resource}不存在: ${id}`, 404);
  }

  static invalidInput(message: string): DomainError {
    return new DomainError('INVALID_INPUT', message, 400);
  }

  static conflict(message: string): DomainError {
    return new DomainError('CONFLICT', message, 409);
  }

  static unauthorized(message: string): DomainError {
    return new DomainError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message: string): DomainError {
    return new DomainError('FORBIDDEN', message, 403);
  }
}
""", encoding="utf-8")
    else:
        error_path = base / "src/domain/shared/domain_error.py"
        error_path.write_text('''"""DomainError — 领域错误基类"""


class DomainError(Exception):
    """所有业务异常继承此类"""

    def __init__(
        self,
        code: str,
        message: str,
        http_status: int,
        details: dict[str, str] | None = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status
        self.details = details or {}

    @classmethod
    def business_rule(cls, message: str) -> "DomainError":
        return cls("BUSINESS_RULE_VIOLATION", message, 422)

    @classmethod
    def not_found(cls, resource: str, id: str) -> "DomainError":
        return cls("NOT_FOUND", f"{resource}不存在: {id}", 404)

    @classmethod
    def invalid_input(cls, message: str) -> "DomainError":
        return cls("INVALID_INPUT", message, 400)

    @classmethod
    def conflict(cls, message: str) -> "DomainError":
        return cls("CONFLICT", message, 409)

    @classmethod
    def unauthorized(cls, message: str) -> "DomainError":
        return cls("UNAUTHORIZED", message, 401)

    @classmethod
    def forbidden(cls, message: str) -> "DomainError":
        return cls("FORBIDDEN", message, 403)
''', encoding="utf-8")

    # 错误处理中间件
    if language == "typescript":
        eh_path = base / "src/interfaces/http/middleware/error-handler.ts"
        eh_path.write_text("""import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { DomainError } from '@/domain/shared/domain-error';

export function errorHandler(error: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  if (error instanceof DomainError) {
    reply.status(error.httpStatus).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        traceId: req.id,
      },
    });
    return;
  }

  // 未预期错误
  req.log.error({ error: { message: error.message, stack: error.stack } }, 'unexpected_error');
  reply.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务内部错误，请稍后重试',
      traceId: req.id,
    },
  });
}
""", encoding="utf-8")
    else:
        eh_path = base / "src/interfaces/http/middleware/error_handler.py"
        eh_path.write_text('''"""全局错误处理"""

from fastapi import Request
from fastapi.responses import JSONResponse
from src.domain.shared.domain_error import DomainError


def add_error_handler(app):
    @app.exception_handler(DomainError)
    async def domain_error_handler(request: Request, exc: DomainError):
        return JSONResponse(
            status_code=exc.http_status,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "服务内部错误，请稍后重试",
                }
            },
        )
''', encoding="utf-8")

    # 数据库 schema
    if db.get("schema"):
        if language == "typescript":
            schema_path = base / "prisma/schema.prisma"
            schema_path.parent.mkdir(parents=True, exist_ok=True)
            schema_path.write_text(db["schema"], encoding="utf-8")
        else:
            schema_path = base / "src/infrastructure/persistence/models.py"
            schema_path.write_text(db["schema"], encoding="utf-8")

    # 配置模板
    config_tpl = base / f"src/config/index{ext}"
    if language == "typescript":
        config_tpl.write_text("""/**
 * 应用配置
 *
 * 所有配置通过环境变量注入，不硬编码任何值。
 */
export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/dev',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  environment: process.env.NODE_ENV ?? 'development',
} as const;
""", encoding="utf-8")
    else:
        config_tpl.write_text('''"""应用配置"""

import os


def env(key: str, default: str | None = None) -> str:
    value = os.environ.get(key, default)
    if value is None:
        raise ValueError(f"环境变量 {key} 未设置且无默认值")
    return value


class Config:
    port: int = int(os.environ.get("PORT", "3000"))
    database_url: str = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/dev")
    jwt_secret: str = os.environ.get("JWT_SECRET", "dev-secret-change-in-prod")
    jwt_expires_in: str = os.environ.get("JWT_EXPIRES_IN", "24h")
    redis_url: str = os.environ.get("REDIS_URL", "redis://localhost:6379")
    log_level: str = os.environ.get("LOG_LEVEL", "info")
    environment: str = os.environ.get("NODE_ENV", "development")


config = Config()
''', encoding="utf-8")

    # .env.example
    env_path = base / ".env.example"
    env_path.write_text("""# 服务
PORT=3000
NODE_ENV=development

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/order_service

# 认证
JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=24h

# 缓存
REDIS_URL=redis://localhost:6379

# 日志
LOG_LEVEL=info
""", encoding="utf-8")

    # 测试模板
    test_path = base / f"src/__tests__/integration/order-api.test{ext}"
    test_path.write_text(fw["test"], encoding="utf-8")

    return {
        "project": project_name,
        "language": language,
        "framework": framework,
        "database": database,
        "base_dir": str(base),
        "init_command": fw["init"],
        "deps_extra": fw.get("deps_extra", ""),
        "db_setup": db.get("setup", ""),
        "test_command": "npx vitest" if language == "typescript" else "pytest",
        "directories_created": len(created_dirs),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="后端项目脚手架")
    parser.add_argument("--language", required=True, choices=list(FRAMEWORKS.keys()), help="编程语言")
    parser.add_argument("--framework", required=True, help="Web 框架")
    parser.add_argument("--database", default="postgresql", choices=list(DATABASE_CONFIGS.keys()), help="数据库")
    parser.add_argument("--project-name", required=True, help="项目名称")
    parser.add_argument("--output-dir", default="", help="输出目录（默认为项目名称）")
    args = parser.parse_args()

    # 校验 framework
    if args.language not in FRAMEWORKS or args.framework not in FRAMEWORKS[args.language]:
        available = ", ".join(FRAMEWORKS.get(args.language, {}).keys())
        print(f"错误：语言 {args.language} 不支持框架 {args.framework}。可用框架：{available}", file=__import__("sys").stderr)
        __import__("sys").exit(1)

    result = create_project(args.language, args.framework, args.database, args.project_name, args.output_dir)

    print(json.dumps(result, ensure_ascii=False, indent=2))
    print()
    print("📋 下一步：")
    print(f"   1. cd {result['base_dir']}")
    print(f"   2. {result['init_command']}")
    if result.get("deps_extra"):
        print(f"   3. {result['deps_extra']}")
    if result.get("db_setup"):
        print(f"   4. {result['db_setup']}")
    print(f"   N. {result['test_command']}")
    print()
    print("🔴 RED:  定义 API 契约 → 写失败测试")
    print("🟢 GREEN: 实现最小业务逻辑使测试通过")
    print("🔵 REFACTOR: 在测试保护下重构")
