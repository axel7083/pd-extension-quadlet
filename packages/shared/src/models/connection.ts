export enum VMType {
  WSL = 'wsl',
  LIBKRUN = 'libkrun',
  LIBKRUN_LABEL = 'GPU enabled (LibKrun)',
  QEMU = 'qemu',
  APPLEHV = 'applehv',
  APPLEHV_LABEL = 'default (Apple HyperVisor)',
  HYPERV = 'hyperv',
  UNKNOWN = 'unknown',
}

export interface Connection {
  name: string;
  providerId: string;
  vmType?: VMType;
}
