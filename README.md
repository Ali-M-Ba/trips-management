# Trip Sheets

Staff desk for phone bookings: create a trip, open the 52-seat bus plan, enter names and payment notes, group seats, and keep a change history.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The first start downloads an embedded MongoDB into `.data/mongo` and keeps trip data there. To use your own database instead, set `MONGODB_URI` and `MONGODB_EMBEDDED=false` in `.env.local`.

Default login after first run: `staff` / `staff123`.
