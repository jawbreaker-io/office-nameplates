# Office Nameplate Generator

Browser-based tool for generating personalized 3D-printable office nameplates. Customize text and logos, preview in real time, then download as STL or multi-color 3MF — or share a link with someone who has a printer.

## Features

- **Live 3D preview** — see changes instantly as you type
- **Multi-line text** — first name, last name, and title/extra line
- **Logo upload** — SVG logos embossed onto the nameplate
- **Multi-color 3MF export** — separate baseplate and emboss materials for dual-extrusion printers
- **STL export** — single-material output for standard printers
- **Share links** — generate a URL that pre-fills the nameplate text for someone else to print

## Tech Stack

React 19, TypeScript, Three.js, three-bvh-csg (CSG boolean operations), Tailwind CSS v4, Vite

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Development

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Run Tests

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Docker

### Build the image

```bash
docker build -t office-nameplates .
```

### Run the container

```bash
docker run -d -p 8080:80 office-nameplates
```

Open http://localhost:8080 in your browser. The container serves the production build via nginx.
