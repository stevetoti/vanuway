# VanuWay Launch Assets 2026

Approved direction: Connected Islands, refined.

This workspace produces launch materials for VanuWay:

- Flagship 90-120s landscape launch video
- 60s landscape cutdown
- 60s vertical Reel/Shorts cutdown
- 15s paid social cutdown
- 6s bumper
- A4 flyer, square feed ad, story cover, vendor flyer, service overview, and phone mockups
- Facebook, Instagram, YouTube, and vendor recruitment copy

## Commands

```bash
npm install
npm run capture:public
npm run capture:auth
npm run render:statics
npm run render:videos
```

`capture:auth` requires:

```bash
VANUWAY_TEST_EMAIL="temporary@example.com" VANUWAY_TEST_PASSWORD="temporary-password" npm run capture:auth
```

Generated files are written to `captures/` and `exports/`.
