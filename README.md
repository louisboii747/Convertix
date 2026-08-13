# Convertix

**Convertix** is a modern, cross-platform file conversion platform designed to make converting media and documents fast, simple, and accessible from anywhere.

The goal is straightforward: upload a file, choose the format you want, and let Convertix handle the rest.

## What Convertix is

Convertix is being built as more than a single-purpose converter. The long-term aim is to provide one consistent conversion service across web, desktop, and mobile, backed by a scalable cloud platform.

Planned conversion categories include:

- Video
- Audio
- Images
- Documents
- Archives
- Other commonly used file formats

The platform is being designed with both everyday users and heavier workloads in mind, with room for accounts, conversion history, premium plans, larger files, faster processing, and additional tools over time.

## How it works

At a high level, Convertix separates the user-facing application from the services responsible for processing files.

A user submits a conversion through the frontend, the backend validates and tracks the job, and background workers perform the actual conversion. Redis is used for fast job coordination and temporary state, while PostgreSQL stores persistent application data.

This architecture lets conversion work happen independently from the web interface and gives the platform room to scale as usage grows.

## Technology

Convertix currently uses and is being built around:

- **Next.js** — web application and user interface
- **FastAPI** — backend API and application services
- **PostgreSQL** — persistent application data
- **Redis** — queues, caching, job state, and rate-limiting support
- **Docker** — consistent local development and service deployment
- **FFmpeg** — media processing and transcoding
- **AWS** — planned cloud computing infrastructure and production hosting
- **Cloudflare** — edge, networking, delivery, and platform services where appropriate

The repository is structured as a multi-service project so the frontend, APIs, workers, and infrastructure can evolve independently without becoming separate disconnected projects.

## Current status

Convertix is in early development.

The initial project structure is in place, the Next.js web application has been created, and local PostgreSQL and Redis services are running through Docker. The next backend milestone is connecting the API to those services and introducing the first real conversion-job workflow.

## Direction

Some of the major areas planned for Convertix include:

- User accounts and authentication
- Conversion history
- Real-time conversion progress
- Background job processing
- Secure file uploads and temporary storage
- Multiple conversion engines and format families
- Desktop and mobile applications
- API access
- Free and paid usage tiers
- Subscription and payment support
- Usage limits and rate limiting
- Monitoring, logging, and operational tooling
- Cloud deployment and horizontal scaling

The aim is to keep the product easy to use even as the infrastructure behind it becomes more capable.

## Development

Convertix is currently developed as a monorepo, with the main areas split into directories such as:

```text
apps/            User-facing applications
services/        Backend services and workers
infrastructure/  Local and cloud infrastructure
```

Development services such as PostgreSQL and Redis can be run locally with Docker Compose, keeping local development isolated and reproducible.

## Project philosophy

Convertix is intended to feel like a real product rather than a collection of conversion scripts. That means the project is being designed from the beginning around reliability, scalability, security, a clean user experience, and sustainable future monetisation.

The project is still young, so its architecture and feature set will continue to evolve as the first end-to-end conversion workflow is built.

---

**Convertix — Ease and speed.**
