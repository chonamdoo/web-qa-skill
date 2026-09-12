# Mac localhost and mobile connections

Read this when connecting a local app to mobile browsers or diagnosing API, authentication, and HMR connectivity. Find ports in project configuration. The `3000` and `8080` values below are illustrative; replace them with actual settings. Follow the host's supervisor and workspace rules for starting and stopping services.

## Choose the connection

| Execution environment | Browser address | Preparation |
|---|---|---|
| Mac Chrome/Safari | App URL, such as `http://localhost:3000` | Host server readiness |
| iOS Simulator Safari on the same Mac | `http://localhost:3000` | Verify access in the Simulator browser. It shares the host network/ports. |
| Local Android Emulator Chrome | `http://localhost:3000` | Configure ADB reverse for that device. |
| Android Emulator alternative | `http://10.0.2.2:3000` | Host IPv4 loopback alias. Check differences in origin/Host policies. |
| USB-connected physical Android device | `http://localhost:3000` | Authorized USB debugging, ADB connection, and reverse |
| Physical iPhone/iPad | Mac LAN address or an approved development hostname | Device-accessible server bind, firewall, DNS, and required HTTPS trust |
| Remote device/cloud | Approved accessible URL | Its localhost is not the Mac. An approved private connection/tunnel may be needed. |

Local simulators/emulators do not inherently require exposing the default server externally. Configure only the necessary bind, firewall, and access scope when using physical-device LAN or remote routes. `0.0.0.0` is a server bind address, not a website address to enter on a device.

## ADB reverse procedure

1. Locate ADB through SDK configuration. If it is not on PATH, check project settings such as `ANDROID_HOME` and the SDK's `platform-tools/adb`.
2. Select this task's device from the connected device list and verify its state. Do not arbitrarily select the first device when several are connected.
3. Inspect existing mappings with `reverse --list`. Create only necessary port mappings and record ownership.
4. Verify the app, API, and required WebSocket connections in the device browser.
5. Recheck mappings and actual access after reboot/reconnection. Remove only mappings created by this task when finished.

Example command syntax — replace `DEVICE_SERIAL` with the observed dedicated test device ID, and use the actual ADB executable path and ports:

```sh
adb devices -l
adb -s DEVICE_SERIAL reverse --list
adb -s DEVICE_SERIAL reverse --no-rebind tcp:3000 tcp:3000
adb -s DEVICE_SERIAL reverse --no-rebind tcp:8080 tcp:8080
```

This connects a device TCP port to an **ADB host TCP port**. This description assumes the ADB server and app server run on the same Mac. If ADB runs on a remote host, establish the actual route first.

Reuse an identical existing mapping only if it belongs to this task and remains valid. Investigate conflicts first; do not ignore `--no-rebind` failures. Do not resolve them with `adb reverse --remove-all` or by stopping a shared ADB server. An example cleanup command is `adb -s DEVICE_SERIAL reverse --remove tcp:3000`; apply it only to an owned mapping.

## APIs, authentication, and WebSockets

- Connect frontend and API ports separately when they use different localhost ports. With an existing same-origin development proxy, maintain only the required connections.
- If HMR/WebSocket advertises another port or hostname, verify that address from the device too. Initial HTML loading alone is insufficient.
- Cookies, storage, and login sessions are separate for each browser even with the same URL. Prepare test accounts and sessions in each environment.
- Reverse provides a TCP route. It does not automatically solve CORS, CSP, Host allowlists, OAuth redirect URIs, Secure/SameSite cookies, or HTTPS certificate trust.
- Mixing `localhost`, `127.0.0.1`, `10.0.2.2`, and LAN addresses can change host/origin and secure-context conditions. Verify actual effects on login, APIs, service workers, and related behavior.
- `10.0.2.2` aliases the host IPv4 loopback. Diagnose IPv6-only server binds, VPNs, firewalls, proxies, and certificate issues against the actual configuration. Do not bypass connectivity problems by disabling security features wholesale.

## Connectivity evidence before execution

Check in order:

1. The server in the designated workspace is ready and serves the expected build.
2. The actual page and required assets load **in each device browser**.
3. APIs, authentication, required WebSockets, and test data work on that device.
4. Record the actual URL, origin, build, device/browser, connection method, and readiness results.
5. Then inventory the UI and execute scenarios.

A successful host `curl`, mapping command, or browser launch alone does not establish connectivity. Connection failures are environment `BLOCKED`, not product UI `FAIL` or `PASS`. Do not substitute another engine's success for an unexecuted required environment.

## Sources

- [Android Emulator network addresses](https://developer.android.com/studio/run/emulator-networking-address): distinguishes `10.0.2.2` from device loopback.
- [ADB manual](https://android.googlesource.com/platform/packages/modules/adb/+/refs/heads/main/docs/user/adb.1.md): reverse, serial, no-rebind, and removal commands. Cross-check installed `adb help` too.
- [XCUITest capabilities](https://appium.github.io/appium-xcuitest-driver/latest/reference/capabilities/): Simulator/host port sharing. Physical iOS devices are separate.
