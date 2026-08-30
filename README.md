# Convertix

<a href="https://www.producthunt.com/products/convertix-2?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-convertix-4" target="_blank" rel="noopener noreferrer"><img alt="Convertix - Convert files quickly, simply, and securely without the fuss | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1226175&amp;theme=neutral&amp;t=1787081472877"></a>

<a href="https://buildlist.io" target="_blank" rel="noopener">
  <img src="https://buildlist.io/badge.svg" alt="Featured on Buildlist" style="height:40px;width:auto;" />
</a>






https://convertix.uk

**Convertix** is a cloud-backed file conversion platform focused on making file conversion fast, simple, and reliable without exposing users to the infrastructure doing the work.

The core experience is straightforward: upload a file, choose a supported target format, submit the conversion, and download the result when processing finishes.

## Current state

Convertix now has a working end-to-end conversion pipeline running on AWS in `eu-west-2`.

The current production path supports **DOCX → PDF** conversions through the web application. Files are uploaded directly to Amazon S3 using short-lived presigned URLs, conversion jobs are submitted through the API, queued in Amazon SQS, processed by an autoscaling ECS/Fargate worker, and returned through a temporary presigned download URL.

The full flow has been tested end to end:

1. The web app requests a secure upload URL.
2. The source file is uploaded directly to S3.
3. The API validates the conversion request and places a job onto SQS.
4. The worker service scales up when work is waiting.
5. The worker downloads the source file, performs the conversion, and uploads the result.
6. Conversion status is polled until completion.
7. The completed file is exposed through a temporary S3 download URL.
8. The worker can scale back down when the queue is empty.

Convertix is no longer only a frontend scaffold or local proof of concept: the first real cloud conversion workflow is operational.

## Architecture

Convertix is structured as a multi-service project so the frontend, API, worker, and infrastructure can evolve independently.

```text
Browser / Next.js
       |
       v
AWS HTTP API
       |
       +----> Amazon S3        uploads + converted files
       |
       +----> Amazon SQS       conversion job queue
                    |
                    v
              ECS / Fargate
              worker service
                    |
                    v
                Amazon S3
```

### Web application

The frontend is built with **Next.js 16**, **React 19**, and TypeScript and is deployed through **Vercel** at [convertix.uk](https://convertix.uk).

The interface includes a typed API client and explicit conversion state handling for stages such as:

- Ready
- Uploading
- Queued
- Starting
- Converting
- Completed
- Failed

The frontend deliberately does not fake successful conversions. Routes are only enabled when the required API configuration and backend support exist.

### API

The current serverless API runs on AWS Lambda behind an HTTP API.

Implemented routes include:

- `GET /health`
- `POST /uploads`
- `POST /conversions`
- `GET /conversions/{id}`

`POST /uploads` creates short-lived presigned S3 upload URLs.

`POST /conversions` validates the requested source and target formats, creates a conversion ID, and sends the job to Amazon SQS.

`GET /conversions/{id}` reports the current state and, once processing has completed, returns a temporary download URL for the converted file.

### Worker

The conversion worker is a Python service packaged as a Docker image and stored in **Amazon ECR**.

It runs on **Amazon ECS with AWS Fargate**, consumes conversion jobs from SQS using long polling, retrieves input files from S3, performs the conversion, uploads the output, and acknowledges the queue message when processing succeeds.

The worker service is designed to scale from **0 running tasks when idle** to active capacity when work enters the queue, keeping the development environment inexpensive while still allowing jobs to start automatically.

The queue also has a dead-letter queue configured for repeatedly failing jobs.

## Technology

Convertix currently uses:

- **Next.js 16** — web application and frontend
- **React 19** — user interface
- **TypeScript** — typed frontend and API integration
- **Python** — API and conversion worker logic
- **AWS Lambda** — serverless API execution
- **Amazon API Gateway / HTTP API** — public API entry point
- **Amazon S3** — temporary file storage and presigned uploads/downloads
- **Amazon SQS** — durable conversion-job queue
- **Amazon ECS / AWS Fargate** — conversion worker runtime
- **Amazon ECR** — worker container registry
- **Amazon CloudWatch** — logs, alarms, and operational visibility
- **Docker** — worker packaging and local development
- **Terraform** — AWS infrastructure management
- **Vercel** — frontend deployment

The repository still contains room for supporting services such as PostgreSQL and Redis as the product grows, but the live conversion path currently relies primarily on AWS-native storage, queueing, compute, and serverless services.

## Supported formats

Convertix already models several format families in the application, including:

### Documents

- PDF
- DOCX
- TXT

### Images

- JPG / JPEG
- PNG
- WebP
- HEIC / HEIF input to JPG, PNG, or WebP

### Audio

- MP3
- WAV

### Video

- MP4
- WebM

Not every possible pair is enabled yet. The currently verified live conversion route is:

- **DOCX → PDF**

Keeping the UI aware of backend capabilities means unsupported routes can remain disabled until the corresponding worker implementation is ready.

## Repository structure

```text
apps/
  web/             Next.js frontend

services/
  worker/          Python conversion worker

infrastructure/    Terraform and cloud infrastructure
```

The project is intentionally kept as a monorepo so application code and infrastructure changes can be developed together without splitting Convertix into disconnected repositories.

## Infrastructure behaviour

The current AWS development environment includes:

- Temporary S3 object lifecycle handling
- SQS conversion queue
- SQS dead-letter queue
- Lambda API
- ECR worker repository
- ECS/Fargate worker service
- CloudWatch logging and queue-based scaling alarms

A queued conversion can cause the worker service to scale from zero, process the job, upload the converted result, acknowledge the SQS message, and return to idle capacity afterward.

## What is next

The next major stage is expanding the working conversion engine rather than replacing the architecture.

Planned work includes:

- More document conversions
- Image conversion support
- Audio conversion support
- Video conversion support
- Faster worker startup and conversion times
- Richer progress reporting
- Improved failure states and retry handling
- Larger-file workflows
- User accounts and authentication
- Conversion history
- Usage limits and rate limiting
- Free and paid usage tiers
- Subscription and payment support
- API access for developers
- Desktop and mobile clients
- Additional monitoring and operational tooling
- Continued infrastructure optimisation as usage grows

## Product direction

Convertix is intended to feel like a polished consumer product rather than a collection of conversion scripts.

The frontend is being designed around a familiar, approachable file-handling experience while the backend remains asynchronous, scalable, and cost-conscious. The long-term goal is one consistent conversion service across web, desktop, mobile, and API clients.

The first cloud workflow is now proven. The focus from here is broader format coverage, faster processing, stronger product polish, and scaling the existing system cleanly as real usage grows.

---

**Convertix — Ease and speed.**
