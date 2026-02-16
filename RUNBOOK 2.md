# Runbook: Local Development

## Setup
1. Ensure you have Node.js installed.
2. Clone the repository and navigate to the root folder.
3. Install dependencies:
   ```bash
   npm install
   ```

## Commands
### Development
Start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```

### Build
Create a production-ready bundle in the `dist/` directory:
```bash
npm run build
```

### Preview
Preview the production build locally:
```bash
npm run preview
```

## Configuration
The app runs in "demo mode" by default. Environment variables are not strictly required for the UI to function, but you can reference `.env.example` for customization.
