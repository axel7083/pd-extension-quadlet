/**
 * @author axel7083
 */

import { test, expect } from 'vitest';
import { QuadletDryRunParser } from './quadlet-dryrun-parser';

const MULTIPLE_QUADLETS_EXAMPLE = `
---nginx.service---
# demo-quadlet.container
[X-Container]
ContainerName=demo-quadlet
Image=nginx
PodmanArgs=--cgroups=enabled
PublishPort=8080:80

[Service]
Restart=always
Environment=PODMAN_SYSTEMD_UNIT=%n
KillMode=mixed
ExecStop=/usr/bin/podman rm -v -f -i --cidfile=%t/%N.cid
ExecStopPost=-/usr/bin/podman rm -v -f -i --cidfile=%t/%N.cid
Delegate=yes
Type=notify
NotifyAccess=all
SyslogIdentifier=%N
ExecStart=/usr/bin/podman run --name=demo-quadlet --cidfile=%t/%N.cid --replace --rm --cgroups=split --sdnotify=conmon -d --publish 8080:80 --cgroups=enabled nginx

[Install]
WantedBy=default.target

[Unit]
Wants=network-online.target
After=network-online.target
SourcePath=/home/user/.config/containers/systemd/nginx.container
RequiresMountsFor=%t/containers

---nginx2.service---
# demo-quadlet.container
[X-Container]
ContainerName=demo-quadlet-2
Image=nginx
PodmanArgs=--cgroups=enabled
PublishPort=8081:80

[Service]
Restart=always
Environment=PODMAN_SYSTEMD_UNIT=%n
KillMode=mixed
ExecStop=/usr/bin/podman rm -v -f -i --cidfile=%t/%N.cid
ExecStopPost=-/usr/bin/podman rm -v -f -i --cidfile=%t/%N.cid
Delegate=yes
Type=notify
NotifyAccess=all
SyslogIdentifier=%N
ExecStart=/usr/bin/podman run --name=demo-quadlet-2 --cidfile=%t/%N.cid --replace --rm --cgroups=split --sdnotify=conmon -d --publish 8081:80 --cgroups=enabled nginx

[Install]
WantedBy=default.target

[Unit]
Wants=network-online.target
After=network-online.target
SourcePath=/home/user/.config/containers/systemd/nginx2.container
RequiresMountsFor=%t/containers
`;

test('expect result to contain two quadlets', async () => {
  const parser = new QuadletDryRunParser(MULTIPLE_QUADLETS_EXAMPLE);
  const result = await parser.parse();
  expect(result).toHaveLength(2);
});

test('expect each path to be properly set', async () => {
  const parser = new QuadletDryRunParser(MULTIPLE_QUADLETS_EXAMPLE);
  const result = await parser.parse();
  expect(result[0].path).toBe('/home/user/.config/containers/systemd/nginx.container');
  expect(result[1].path).toBe('/home/user/.config/containers/systemd/nginx2.container');
});
