# Q-Link Checklist Mock

Standalone frontend-only prototype. It does not connect to the Q-Link database, APIs, authentication, or production RFID records.

## Current mock flow

1. Open the root URL.
2. Select **Leading** or **Operator**.
3. Select a mock production line.
4. Scan an RFID reader value followed by Enter, or use **Simulate RFID scan**.
5. Select a checklist page range from 1–10.
6. Review the animated U-shaped line confirmation and lock the assignment.

The RFID number is never rendered.

## Run locally

```powershell
npm install
npm run dev
```

Default mock port: `8586`.
