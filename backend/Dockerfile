# syntax=docker/dockerfile:1.7-labs
# ^ BuildKit syntax (enables mount caching & parallel layer builds)

# ------------------------------------------------------------
# Stage 1: Base configuration and dependency install
# ------------------------------------------------------------
ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim AS base

# System settings
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /

# Install system deps for building common Python packages faster
# (includes build-essential and git for shared dev environments)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create a non-privileged user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# ------------------------------------------------------------
# Stage 2: Install dependencies with caching
# ------------------------------------------------------------
FROM base AS deps

# Use BuildKit mounts for caching and bind-mounting runtime requirements
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.5.1

RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=bind,source=requirements.runtime.txt,target=requirements.txt \
    pip install -r requirements.txt

# ------------------------------------------------------------
# Stage 3: Final runtime image
# ------------------------------------------------------------
FROM base AS final

WORKDIR /app

# Copy installed site-packages from deps layer for speed
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Ensure appuser owns the application files and instance directory
RUN mkdir -p /app/instance && chown -R appuser:appuser /app

# Switch to non-root user for safety
USER appuser

# Copy app code
COPY . .

# Expose port 8000 for app access
EXPOSE 8000

# --- For Gunicorn (production-style dev) ---
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:create_app()"]