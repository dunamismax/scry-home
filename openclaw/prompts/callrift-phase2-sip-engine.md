# CallRift Phase 2: Real SIP Engine Integration

## Context

You are working on **CallRift** (`~/github/CallRift`), an open-source, self-hostable VoIP softphone built with React Native + Expo. Read the repo's `CLAUDE.md` first, then `README.md`, then explore the codebase.

### Current State (Phase 1 — Complete)

The app has a polished UI layer with all major screens built:

- **5 tabs:** Dialer (T9 keypad), Call History, Contacts, Messages, Settings
- **Detail screens:** Active call (mute/hold/speaker/record/transfer/keypad), conversation thread, contact detail
- **State management:** 6 Zustand stores (`useAuthStore`, `useCallStore`, `useContactStore`, `useMessageStore`, `useSettingsStore`, `useThemeStore`)
- **Theme system:** Dark/light with semantic color tokens, typography scale, spacing/radii
- **UI components:** Full component library in `components/` (Button, Card, Input, Modal, Toggle, Avatar, Badge, SearchBar, ErrorBoundary, etc.)

**However, everything runs on mock data and stub services.** The SIP service (`services/sip/index.ts`) returns no-ops. The audio service (`services/audio.ts`) is empty. The stores use `data/mock/` fixtures. The client and server are completely disconnected.

### Server (Exists but Disconnected)

A Fastify API server lives in `server/` with:
- SQLite (better-sqlite3) + Drizzle ORM with full schema (users, SIP accounts, contacts, call history, conversations, messages, recordings, dial lists, settings, devices, sync log)
- JWT auth, rate limiting, CORS
- Full CRUD routes for all entities
- FreeSWITCH ESL integration (`server/src/sip/freeswitch.ts`) — connection management, event handling, call origination, transfer, hangup, SIP MESSAGE
- Event handler (`server/src/sip/events.ts`) — maps FreeSWITCH channel events to call records
- Account provisioning (`server/src/sip/provisioning.ts`) — register/unregister accounts on FreeSWITCH
- Uses `modesl` (FreeSWITCH ESL client for Node.js)

### What Needs to Happen

The app needs to go from "pretty UI with fake data" to "functional SIP softphone that can make and receive real calls." This is the hardest and most important phase.

---

## Architecture Decision: WebRTC via FreeSWITCH

The architecture is: **Client (sip.js/WebRTC) → FreeSWITCH (WebSocket + RTP) → SIP Trunk → PSTN**

- **Client SIP stack:** Use [`sip.js`](https://github.com/onsip/sip.js) v0.21.x (the modern, maintained WebRTC SIP library). It works in React Native via `react-native-webrtc`.
- **Transport:** WSS (WebSocket Secure) from client to FreeSWITCH's `mod_verto` or `mod_sofia` WebSocket listener.
- **Audio:** `react-native-webrtc` provides the WebRTC peer connection + media streams. On web, native browser WebRTC.
- **FreeSWITCH:** Acts as the B2BUA/PBX. Handles registration, RTP media, codec transcoding, recording, and trunking to PSTN providers.

This gives us full PBX capability (recording, conferencing, IVR, transfer) while using standards-based WebRTC on the client.

---

## Task: Implement Phase 2

### Priority 1: Client SIP Engine (Most Critical)

Replace the stub `services/sip/index.ts` with a real implementation using `sip.js` + `react-native-webrtc`.

1. **Install dependencies:**
   - `sip.js` (SIP/WebRTC library)
   - `react-native-webrtc` (WebRTC for React Native — provides `RTCPeerConnection`, `mediaDevices`, etc.)
   - May need `@ofa/ofa-react-native-webrtc` or similar if the main package has Expo compatibility issues — research current Expo SDK 55 compatibility first

2. **Implement `services/sip/engine.ts`** — the real SIP engine:
   - Create a `SIPEngine` class that implements the existing `SIPService` interface from `services/sip/index.ts`
   - Use `sip.js` `UserAgent` for SIP registration and session management
   - Handle `UserAgent` transport (WebSocket to FreeSWITCH)
   - Implement `register()` — create UserAgent, connect transport, register with SIP credentials from `useAuthStore`
   - Implement `makeCall()` — create an `Inviter` session, attach local media stream, handle SDP negotiation
   - Implement `answerCall()` — accept incoming `Invitation` with local media
   - Implement `endCall()`, `rejectCall()` — session.bye() / invitation.reject()
   - Implement `toggleMute()` — enable/disable audio track on the local media stream
   - Implement `toggleHold()` — session.hold() / session.unhold() (re-INVITE with sendonly/recvonly SDP)
   - Implement `sendDTMF()` — session.info() with DTMF payload (respect the `dtmfMode` setting: RFC 2833 vs SIP INFO)
   - Implement `transferCall()` — blind transfer via session.refer()
   - Implement `sendMessage()` — SIP MESSAGE method via UserAgent
   - Wire up event callbacks: `onIncomingCall`, `onCallStateChange`, `onRegistrationStateChange`, `onMessageReceived`
   - Handle onerror/transport failures with exponential backoff reconnection
   - **Platform abstraction:** The engine needs to work on iOS, Android, AND web. `react-native-webrtc` provides the WebRTC APIs on native; on web, use native browser APIs. Use a `getMediaConstraints()` helper that returns the right audio constraints per platform.

3. **Create `services/sip/provider.tsx`** — React context that instantiates the SIP engine singleton and provides it to the app:
   - Initialize on app mount
   - Auto-register when credentials exist in secure storage
   - Expose via `useSIP()` hook
   - Handle app state changes (background/foreground) — unregister on background, re-register on foreground
   - Clean up on unmount

4. **Update `useAuthStore`:**
   - `connect()` should call the real SIP engine's `register()` method
   - `disconnect()` should call `unregister()`
   - Persist credentials in `expo-secure-store` (already imported, just not wired up)
   - Registration state should come from the engine's callbacks, not fake timers

5. **Update `useCallStore`:**
   - `makeCall()` should invoke the SIP engine, not create a fake SIPCall object
   - Wire up incoming call handling — when the engine fires `onIncomingCall`, update the store and navigate to the call screen
   - `endCall()`, `toggleMute()`, `toggleHold()`, `toggleSpeaker()` should delegate to the engine
   - Call duration timer should be driven by actual call connect time

6. **Update `services/audio.ts`:**
   - `setRoute()` — switch between earpiece/speaker using `react-native-webrtc`'s `InCallManager` or `expo-av`
   - `playRingtone()` / `stopRingtone()` — use `expo-av` to play a ringtone sound file for incoming calls
   - `playDTMF()` — short tone feedback using `expo-av` or Web Audio API

### Priority 2: Connect Client to Server API

Replace mock data stores with real API calls.

1. **Create `services/api/client.ts`** — API client:
   - Base URL configurable (server address in settings)
   - JWT token management (store in secure storage, refresh on 401)
   - Type-safe request/response using the existing types
   - Use `fetch` (built into React Native) — no axios needed

2. **Create API hooks with TanStack Query** (add `@tanstack/react-query` + `@tanstack/react-query-persist-client` if desired):
   - `useContacts()`, `useContact(id)`, `useCreateContact()`, `useUpdateContact()`, `useDeleteContact()`
   - `useCallHistory()`, `useCallRecord(id)`
   - `useConversations()`, `useConversation(id)`, `useSendMessage()`
   - `useRecordings()`, `useRecording(id)`
   - `useSettings()`, `useUpdateSetting()`
   - `useAccount()`, `useAccounts()`

3. **Update stores to use API:**
   - `useContactStore` — remove mock data, use TanStack Query for server state, keep Zustand only for UI state (search query, selection)
   - `useCallStore` — call history comes from server, active call stays local (real-time SIP state)
   - `useMessageStore` — conversations/messages from server, optimistic updates on send
   - `useSettingsStore` — sync settings to server, keep local cache for offline

4. **Add `QueryClientProvider`** in `app/_layout.tsx`

### Priority 3: Server Improvements

1. **Migrate server from npm to Bun:**
   - Delete `package-lock.json`, use `bun install`
   - Replace `tsx` dev command with `bun run` (Bun runs TypeScript natively)
   - Verify all deps work under Bun (Fastify, better-sqlite3, modesl should all be fine)

2. **Add WebSocket endpoint for real-time events:**
   - Client needs real-time updates for incoming calls, new messages, registration state changes
   - Use `@fastify/websocket` to add a `/ws` endpoint
   - Push events: `call:incoming`, `call:state`, `message:new`, `registration:state`
   - This is separate from the SIP WebSocket (which goes directly to FreeSWITCH)

3. **Docker Compose for FreeSWITCH:**
   - Create `docker-compose.yml` with FreeSWITCH container + the API server
   - FreeSWITCH config: enable `mod_sofia`, `mod_verto` (WebSocket), `mod_event_socket` (ESL)
   - WebSocket listener on port 7443 (WSS) for client SIP connections
   - ESL on port 8021 for server management
   - Include basic dialplan for internal calls + external gateway template
   - SIP profiles: internal (for registered clients), external (for PSTN trunking)

4. **Environment config:**
   - Create `.env.example` with all required vars
   - Document FreeSWITCH connection settings
   - Add SIP provider config (gateway, credentials, codec preferences)

### Priority 4: Call Quality & UX

1. **Incoming call UI:**
   - Full-screen incoming call overlay (even when app is in another tab)
   - Ringtone audio
   - Accept/Reject buttons
   - Caller ID lookup from contacts

2. **Call quality indicators:**
   - Show network quality/latency during active calls
   - Display codec being used
   - Warning on poor network conditions

3. **In-call DTMF keypad:**
   - The "Keypad" button on the active call screen currently does nothing
   - Show an overlay numeric keypad that sends DTMF tones via the SIP engine
   - Play local DTMF feedback sound

4. **Call transfer UI:**
   - The "Transfer" button currently does nothing
   - Show a modal with number input for blind transfer
   - (Attended transfer can come later)

5. **Push notifications (background calls):**
   - Use `expo-notifications` for local notification on incoming call
   - On iOS, investigate CallKit integration for native call UI (shows on lock screen)
   - On Android, use a foreground service notification during active calls

---

## Constraints

- **Stack:** React Native 0.83 + Expo SDK 55, TypeScript strict, Zustand for client state, Bun as package manager. See CLAUDE.md for full rules.
- **No new frameworks:** Don't add Next.js, Auth.js, ESLint/Prettier, or npm/pnpm/yarn. Use Bun and Biome.
- **Existing interfaces:** The `SIPService` interface in `services/sip/index.ts` is well-designed — implement it, don't replace it. Same for the type definitions in `types/`.
- **Server compatibility:** The server uses `npm` currently (has `package-lock.json`). Migrate to Bun as part of this work.
- **FreeSWITCH is the PBX:** Don't try to do direct SIP registration from the client to arbitrary SIP providers. The client connects to FreeSWITCH via WebSocket; FreeSWITCH handles the actual SIP trunking.
- **Git:** Commit as `dunamismax`. No AI attribution. Push to main. Dual remotes (GitHub + Codeberg).

## Suggested Execution Order

1. Research `sip.js` + `react-native-webrtc` Expo SDK 55 compatibility. Verify versions.
2. Install deps, get a minimal "register to FreeSWITCH and see registration succeed" proof of life.
3. Build out the full SIP engine implementing the `SIPService` interface.
4. Wire the engine into the React app via context provider.
5. Update stores to use the real engine instead of mocks.
6. Create Docker Compose for FreeSWITCH local dev.
7. Connect client to server API (TanStack Query).
8. In-call features (DTMF keypad, transfer, call quality).
9. Push notifications + background call handling.

Start with #1-3. Get real calls working. Everything else builds on that foundation.
