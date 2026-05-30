# Command Reference

Run commands from the repository root unless a command explicitly says otherwise.

## Setup

Install root build and automation dependencies:

```bash
npm install
```

Install companion app dependencies:

```bash
npm run companion:install
```

Install Playwright Chromium:

```bash
npm run playwright:install
```

## Companion App

Start the local WebSocket bridge:

```bash
npm run companion:start
```

Start with Node watch mode:

```bash
npm run companion:dev
```

Check the companion health endpoint while it is running:

```bash
npm run companion:health
```

The health response includes `ffmpeg.available`, `ffmpeg.path`, and either a version line or an error.

Direct companion commands are also available from `companion-app/`:

```bash
cd companion-app
npm start
npm run dev
```

## Extension Builds

Build the development extension:

```bash
npm run build:dev
```

Build the production extension and zip:

```bash
npm run build:prod
```

Build both outputs:

```bash
npm run build
```

Build both outputs through the single build script:

```bash
npm run build:all
```

Create only the publish artifact:

```bash
npm run publish:zip
```

Build GitHub release assets:

```bash
npm run release:assets
```

Run full verification and then build GitHub release assets:

```bash
npm run release:verify
```

Outputs:

- `dist_dev/`
- `dist_prod/`
- `dist_prod/tabtotube-extension-v0.1.0.zip`
- `release_assets/`

## Validation

Run JavaScript syntax checks:

```bash
npm run check:js
```

Generate the automation coverage report:

```bash
npm run test:coverage
```

Run all Playwright projects in one process:

```bash
npm run test:automation
```

Run one Playwright project:

```bash
npm run test:automation:build
npm run test:automation:popup
npm run test:automation:companion
```

Run Playwright projects as separate parallel processes:

```bash
npm run test:automation:parallel
```

Run the complete verification pipeline:

```bash
npm run test:all
```

Alias for the complete verification pipeline:

```bash
npm run verify
```

## Cleanup

Remove generated build and test artifacts:

```bash
npm run clean
```
