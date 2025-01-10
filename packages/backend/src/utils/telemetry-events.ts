/**
 * @author axel7083
 */

export enum TelemetryEvents {
  // quadlet
  QUADLET_CREATE = 'quadlet-create',
  QUADLET_UPDATE = 'quadlet-update',
  QUADLET_REMOVE = 'quadlet-remove',
  // systemd
  SYSTEMD_START = 'systemd-start',
  SYSTEMD_STOP = 'systemd-stop',
  // podlet
  PODLET_INSTALL = 'podlet-install',
  PODLET_GENERATE = 'podlet-generate',
  PODLET_COMPOSE = 'podlet-compose',
  PODLET_VERSION = 'podlet-version',
}
