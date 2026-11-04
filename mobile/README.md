# QJSC Hospital Mobile App (Android + iOS)

The Android/iOS client is a native Expo shell that opens the existing QJSC web frontend served by the hospital Windows PC. It reuses the same UI, accounts, role permissions, API and database rather than maintaining a second, incomplete hospital application.

## What "offline" means

The hospital workflow uses the private Wi-Fi/LAN only; internet access is not needed for normal on-site use after the mobile app is installed. The Windows PC, MongoDB, backend and frontend must be running and reachable. This is **not** an offline-first mobile database: when the PC or Wi-Fi is unavailable, live patient records and registration are unavailable until the connection returns. No patient is reported as saved unless the PC API confirms it.

## LAN connection

1. Keep the existing MongoDB database and the backend `.env` file. Back up the database before updating the Windows PC source.
2. Run `scripts/enable-mobile-lan.bat` on the Windows PC with **Run as administrator**. It configures the backend listener and restricts Windows Firewall rules for ports 8000 (API) and 3000 (web app) to the local subnet on the Private network profile.
3. Set the Windows Wi-Fi/Ethernet network profile to **Private**. Connect staff phones to the same trusted Wi-Fi (not a guest network with client isolation).
4. Restart the backend and frontend. Confirm from a phone browser that `http://<PC-IP>:8000/api/` returns the QJSC service status and `http://<PC-IP>:3000` opens the web app.
5. Run `ipconfig` on the PC and enter its Wi-Fi IPv4 address in the mobile app. Reserve that address in the router if possible so it does not change.
6. Sign in using existing QJSC credentials. The app does not create a separate staff database or separate permissions.

## Mobile consultation token printing

- A mobile consultation registration sends a stable idempotency key to `/api/mobile/patients`. The backend uses it to return the same registration/token after a retry instead of creating another token for the same request.
- The backend stores one mobile print job per token in MongoDB.
- On the Windows PC, run `scripts/open-hospital-silent-print.bat`, sign in as an admin/receptionist, and keep that dedicated Edge window open. It claims the print queue and prints using the existing receipt layout and the Windows default printer.
- The `Mobile Print Queue` screen shows queued, processing, sent-to-printer, uncertain and failed jobs. An admin should check the physical printer before retrying an uncertain job, because the browser cannot confirm paper feed and retrying can produce a duplicate.
- `sent_to_printer` means the browser invoked the Windows print path; it is not a hardware confirmation that paper came out.

## Build Android and iOS

Requirements: Node.js compatible with the Expo SDK in `package.json`, an Expo account, and EAS CLI. From this folder:

```bash
npm install
npx eas-cli login
npx eas-cli build:configure
```

`eas build:configure` must replace the placeholder EAS project ID in `app.json` with the ID for your Expo project. Then build:

```bash
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile production
```

The Android preview profile is configured for an APK. iOS device distribution requires Apple signing credentials; an Apple Developer account is generally needed for App Store/TestFlight distribution. These build files do not contain signing credentials or prebuilt APK/IPA files.

## Feature notes and limits

- The app loads the existing web modules from the PC, so changes to QJSC modules remain in one frontend codebase.
- Mobile browser/WebView support can differ for speech recognition, camera/document capture, file uploads/downloads and external payment/printing workflows. These capabilities must be tested on the actual Android and iOS devices; manual workflows remain available where a WebView API is unavailable.
- iOS asks the user to allow Local Network access. Choose **Allow** so the app can connect to the hospital PC.
- Local HTTP is limited to trusted private LAN use. Do not port-forward ports 3000 or 8000 to the public internet. Use HTTPS and a properly secured remote-access design for access outside the hospital Wi-Fi.
- WebView authentication uses the QJSC frontend's browser storage on that device. Do not share staff accounts; log out on shared devices and use strong staff passwords.
