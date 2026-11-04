# Qurban Jhatiyal Surgical Complex (QJSC)

This repository contains the QJSC Android/iOS LAN client in `mobile/`. The client connects to the existing QJSC backend and web frontend running on the hospital Windows PC. It uses the same staff accounts, roles, database and workflows; internet access is not required for on-site use over a trusted private Wi-Fi network.

**Windows PC integration:** The complete PC-side integration (LAN listener/firewall setup, idempotent mobile consultation registration, MongoDB print queue, Edge silent-print station and Mobile Print Queue screen) is included in the companion source update ZIP delivered with this change. Apply that update to the PC installation while preserving the existing `.env` files and MongoDB data. See `mobile/README.md` for setup, limitations and build instructions.

**Printing:** Mobile consultation registrations queue one token receipt for the Windows PC print station. Keep `scripts/open-hospital-silent-print.bat` running on the PC, signed in as admin/receptionist. `sent_to_printer` confirms the browser invoked the OS print path, not that paper physically emerged.

**LAN-only:** Do not expose ports 3000/8000 to the public internet. Use trusted Wi-Fi with client isolation disabled, and a Private Windows network profile.
