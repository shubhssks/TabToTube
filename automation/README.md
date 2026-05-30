# Automation

Automation is split into three Playwright projects:

- `build`: validates `dist_dev`, `dist_prod`, manifest references, and production zip generation.
- `popup`: verifies the extension popup UI with a mocked Chrome extension API.
- `companion`: verifies the local bridge health endpoint, WebSocket origin policy, and invalid stream-key error handling.

Run all projects in one Playwright invocation:

```bash
npm run test:automation
```

Run each project in a separate process at the same time:

```bash
npm run test:automation:parallel
```

Run individual projects:

```bash
npm run test:automation:build
npm run test:automation:popup
npm run test:automation:companion
```

Generate the requirement coverage matrix:

```bash
npm run test:coverage
```

Run the full repository verification pipeline:

```bash
npm run verify
```
