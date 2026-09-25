# Website Reputation Checker

A small Chrome extension that checks the reputation signals of the website in the active tab.

## What it checks

- Domain name
- Registrar
- Registrant country, when available
- Domain creation date and estimated age
- SSL Labs certificate grade

The popup uses WhoisXML for domain registration data and SSL Labs for certificate analysis.

## Install locally

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository folder containing `manifest.json`.

## Use

1. Open a website in a regular browser tab.
2. Select the extension icon.
3. Wait for the domain and SSL results to load.
4. Select **Refresh** to run the checks again.

Browser-internal pages such as `chrome://` pages do not expose a normal website URL and cannot be analyzed.

## Project structure

```text
manifest.json  Chrome extension metadata and permissions
popup.html     Popup markup
popup.js       Active-domain detection and API requests
styles.css     Popup styling and status states
codes/ss/      Reserved for additional source files
```

## Permissions and services

The extension requests `activeTab` and `scripting` permissions and network access to:

- `whoisxmlapi.com`
- `api.ssllabs.com`

Results depend on the availability and response quality of those services. SSL Labs may return a pending or unknown grade when an analysis is not ready.

## Security note

The current implementation includes the WhoisXML API key in `popup.js`, which means it is visible to anyone who can inspect the extension. For production use, move API requests behind a server-side proxy and rotate the exposed key before publishing the extension broadly.