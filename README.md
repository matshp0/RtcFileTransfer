
# 📡 WebRTC File Sharing App

A peer-to-peer file sharing application built with:

- 🌐 **Fastify** – high-performance Node.js web framework
- 🧠 **Svelte** – reactive, fast frontend
- 🔗 **WebRTC** – real-time peer-to-peer file transfer
- 🧪 **Jest** – unit testing
- 🎭 **Playwright** – end-to-end browser testing
- 🐳 **Docker** – containerized for easy deployment

---

## 🚀 Features

- Secure, peer-to-peer file sharing via WebRTC
- Lightweight Fastify backend
- Fully tested with Jest and Playwright
- Dockerized for consistent environments

---

## 📦 Requirements

- [Node.js 20+](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (optional, for containerized usage)

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/matshp0/RtcFileTransfer.git
cd RtcFileTransfer
````

### 2. Install dependencies

```bash
npm install
```

### 3. Build and run server

```bash
npm run start
```

* Svelte frontend and Fastify backend are bundled via Rollup
* Access the app at `http://localhost:8000`

---

## 🧪 Running Tests

### Unit Tests (Jest)

```bash
npm run test
```

> Jest runs with `--experimental-vm-modules` enabled.

### End-to-End Tests (Playwright in Docker)

```bash
npm run e2e_test
```

This command builds and runs Playwright tests inside a Docker container.

---

## 🐳 Run with Docker

### Build Docker image

```bash
docker build -t webrtc-fileshare .
```

### Run container with port binding

```bash
docker run -p 8000:8000 webrtc-fileshare
```
### Alternatively, you can use docker compose
```bash
docker compose up --build -d
```
Access the app at `http://localhost:8000`

---
