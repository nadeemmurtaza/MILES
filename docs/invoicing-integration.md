# Invoicing and tax-authority integration

The invoice pages are a **demo**. Sample invoices live in `public/invoicing/data.js`; "Send", "Connect" and "Test" are simulated in the browser (`public/invoicing/ui.js`). Nothing is sent to ZATCA or FBR.

## Pages

| Page | Who | What |
|---|---|---|
| `G24-Invoices` / `GL24` | Customer | My invoices: open, download XML, print, CSV |
| `G77-Invoice` / `GL77` | Customer & studio | The invoice document (QR, print, PDF via the browser print dialog, XML). `?id=INV-…` selects one, `&role=studio` shows the authority panel, `&print=1` opens the print dialog |
| `G76-Invoices` / `GL76` | Studio | All invoices, filters, bulk CSV, send to authority |
| `G78-TaxIntegrations` / `GL78` | Studio | ZATCA and FBR connection panels, API reference, retry queue |

Print styling is global (`public/css/print.css`) plus `public/css/invoicing.css` (A4).

## What the demo already does for real

- ZATCA phase-1 QR: TLV tags 1–5 (seller, VAT number, timestamp, total, VAT), base64, drawn with the vendored `qrcode.js` (MIT).
- UBL 2.1 XML download (unsigned) and FBR-shaped JSON (`MilesInvoices.fbrJson`).
- Totals with 15 % VAT (KSA) and 18 % sales tax (PK).

## What a live integration needs

Both authorities need secrets and signing that must never be in browser code. Build a small server (for example a Cloudflare Worker + Durable Object or a separate API) that holds the credentials and calls the authority.

### Saudi Arabia, ZATCA Fatoora (phase 2)

1. Register on the Fatoora portal and get a one-time OTP per device or branch.
2. Generate a key pair and CSR (VAT number, branch, invoice type), then `POST /compliance` to get the compliance CSID.
3. Send sample invoices to `/compliance/invoices` until they pass.
4. `POST /production/csids` for the production CSID.
5. Every invoice: UBL 2.1 XML, XAdES signature, SHA-256 hash, ICV counter, previous invoice hash (PIH), phase-2 QR (TLV tags 1–9 including signature and key).
6. Simplified (B2C): `POST /invoices/reporting/single` within 24 h. Standard (B2B): `POST /invoices/clearance/single` before delivery.

Environments: developer portal, simulation, core (production).

### Pakistan, FBR Digital Invoicing

1. Register with your NTN, get the security token from the portal.
2. Sandbox: validate (`…/di/validateinvoicedata_sb`) and post (`…/di/postinvoicedata_sb`) each scenario FBR asks for.
3. Production: `…/di/postinvoicedata`. FBR returns the IRN and the QR to print.
4. Failed validations return an error code; correct and resend.

> Endpoint paths and payload fields above come from public technical documents at the time of writing. Check the current ZATCA and FBR documentation before building the live connection.
