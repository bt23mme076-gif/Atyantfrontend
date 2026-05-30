# TODO - Elite booking UI update

## Step 1: Dependency setup
- [ ] Add `framer-motion` to root `package.json`
- [ ] Add Razorpay SDK + any backend helpers to `server/package.json`
- [ ] Install deps (root and server)

## Step 2: Razorpay env scaffold
- [ ] Add `.env.example` describing `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
- [ ] Update `server/server.js` to read env vars safely

## Step 3: Mentor + new UI sections (Glassmorphism + Badges)
- [ ] Replace “AK” with real photo asset in `src/assets/`
- [ ] Add online badge + elite mentor card styling
- [ ] Add company logos row (Walmart, VNIT)
- [ ] Add skill tag chips
- [ ] Add video intro thumbnail section

## Step 4: Animated content
- [ ] Add animated stats counters
- [ ] Add testimonials slider
- [ ] Add Framer Motion animations across all sections

## Step 5: Real-time booking calendar
- [ ] Replace date/time inputs with interactive calendar + time slots
- [ ] Block already-booked slots using `/api/bookings`

## Step 6: Razorpay payment flow
- [ ] Add backend endpoint: create order
- [ ] Add backend endpoint: verify payment signature
- [ ] Update frontend to open Razorpay checkout and confirm booking after verification

## Step 7: Validate & run
- [ ] `npm run dev`
- [ ] Start backend
- [ ] Smoke test UI, slot booking, and payment flow

