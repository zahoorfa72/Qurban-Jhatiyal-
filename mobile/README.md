# QJSC Hospital Mobile (native Android/iOS)

This folder contains a React Native / Expo application. The application UI is native React Native; it does not embed the PC website in a WebView. It connects to the existing QJSC API on the Windows hospital PC and uses the same server-side staff accounts and database.

## Connection setup

1. Keep the existing Windows PC backend, MongoDB database and backend `.env` configuration unchanged.
2. Start the QJSC backend on the Windows PC and make it listen on the hospital's trusted private LAN interface.
3. Allow the backend port through Windows Firewall for the **Private** network profile only. Do not expose the API to the public internet.
4. Connect the Android phone and Windows PC to the same hospital Wi-Fi.
5. Find the PC's IPv4 address with `ipconfig`, then enter it once in the app (example: `192.168.1.20`). The app stores the API address in AsyncStorage and keeps it after app restarts and staff sign-out. Changing the server address is available from Settings. Reinstalling the app or clearing its data removes this saved setting.
6. Sign in with an existing QJSC staff account. The app does not create a separate staff account database.

The connection test calls `/api/` and requires the QJSC service health response. The Android app uses the API at `http://PC-IP:8000/api` by default. If your server uses HTTPS or a different port, enter the complete base address including scheme and port.

## Current native screens

- Dashboard overview and server-backed counts
- Patient registration using the mobile registration endpoint and a unique request ID
- Patient list and local search over the loaded patient records
- Today's token list with Call and Done status actions
- Doctor list for patient registration
- Dressing charge entry and list
- Expense entry and list
- Native read views for doctors, prescriptions, inventory, finance summary, hospital finance, daily closing, low stock, reports, staff/users, audit logs and print queue (subject to the API endpoints and the signed-in account's permissions)
- Connection settings and sign-out

## Important feature-parity status

This is a native mobile client foundation, **not yet verified as full feature parity with every PC screen and workflow**. Several screens currently provide API-backed list views rather than complete PC-equivalent create/edit/delete workflows. Modules that require PC-specific forms, attachments, document previews, reports, printing, settings, approvals or role-specific actions still need to be mapped against the actual PC frontend and backend contracts and tested. Do not treat this build as a replacement for the PC software until that work and the device tests are complete.

The Android app does not replace the PC print station. Printing must be performed by a supported PC-side print worker or by a native Android printing implementation after the exact receipt format and printer requirements are verified. This version does not claim that a token was physically printed.

## Build

Requires Node.js compatible with the Expo SDK in `package.json`, Android build tools (for local builds) or an Expo EAS account.

```bash
npm install
npx expo config --type public
npx expo prebuild --platform android --non-interactive
```

For an APK using EAS:

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

The preview profile produces an installable APK. Production builds require valid signing configuration. The placeholder EAS project ID in `app.json` must be replaced with the ID of your Expo project before EAS builds.

## Network and privacy

- Local HTTP is intended only for a trusted hospital LAN. Never port-forward the API port to the internet.
- For remote access, use a properly secured VPN/HTTPS gateway and server-side authentication; do not expose the Windows PC API directly.
- Patient records remain on the QJSC server. The mobile app stores only the configured server address locally; authentication tokens remain in app memory and are cleared when signing out.
- Android/iOS device compatibility, permissions, API response contracts and all clinical/financial workflows must be tested before deployment.
