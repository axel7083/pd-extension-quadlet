/**
 * @author axel7083
 */

import type { Port } from '@podman-desktop/api';
/**
 * When we register a command for a dashboard view, we receive a ContainerInfoUI object
 * This is a copy from {@link https://github.com/podman-desktop/podman-desktop/blob/5f1d688b9451128234d5133abb0450367b2ad888/packages/renderer/src/lib/container/ContainerInfoUI.ts}
 */

// type of groups
export enum ContainerGroupInfoTypeUI {
  STANDALONE = 'standalone',
  COMPOSE = 'compose',
  POD = 'pod',
  DOCKER = 'docker',
  PODMAN = 'podman',
}

export interface ContainerGroupPartInfoUI {
  // The name and type of each group
  name: string;
  type: ContainerGroupInfoTypeUI;

  // Information regarding the entire group (ex. name of the pod)
  // as well as the "engine" running the group (ex. podman or docker)
  id?: string;
  engineId?: string;
  engineName?: string;
  engineType?: 'podman' | 'docker';
  shortId?: string;
  status?: string;
  humanCreationDate?: string;
  created?: string;
}

export interface ContainerInfoUI {
  id: string;
  shortId: string;
  name: string;
  image: string;
  shortImage: string;
  engineId: string;
  engineName: string;
  engineType: 'podman' | 'docker';
  state: string;
  uptime: string;
  startedAt: string;
  ports: Port[];
  portsAsString: string;
  displayPort: string;
  command?: string;
  hasPublicPort: boolean;
  openingUrl?: string;
  groupInfo: ContainerGroupPartInfoUI;
  selected: boolean;
  created: number;
  actionInProgress?: boolean;
  actionError?: string;
  labels: { [label: string]: string };
  imageBase64RepoTag: string;
  imageHref?: string;
}
