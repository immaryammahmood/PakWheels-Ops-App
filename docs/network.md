# Network

## Confirmed values

These values were supplied and confirmed by the project owner. Phase 1A does not inspect or modify the server's network configuration.

| Setting | Value |
| --- | --- |
| Network | 192.168.96.0/20 |
| Subnet mask | 255.255.240.0 |
| Server | 192.168.110.15 |
| Server hostname | tasktrack-server |
| Gateway | 192.168.100.10 |
| Timezone | Asia/Karachi |
| Server IP assignment | DHCP reservation / MAC binding |

The final application must operate only through the PakWheels internal LAN. Core application operation must not require public internet access. No ports are exposed or services started by this foundation.

## Future decisions

| Decision | Status |
| --- | --- |
| Internal DNS hostname | FUTURE — pending |
| Internal TLS certificate authority | FUTURE — pending |
| Firewall rules | FUTURE — pending |
| Remote branch connectivity | FUTURE — pending |
| Site-to-site VPN design | FUTURE — pending |

No DNS, TLS, firewall, pfSense, routing, VPN, or other network configuration is implemented in this phase. The confirmed server hostname does not finalize the application's internal DNS hostname.
