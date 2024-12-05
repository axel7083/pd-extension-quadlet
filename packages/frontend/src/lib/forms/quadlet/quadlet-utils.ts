/**
 * @author axel7083
 */
import type { ProviderContainerConnectionDetailedInfo } from '/@shared/src/models/provider-container-connection-detailed-info';
import { QuadletType } from '/@shared/src/utils/quadlet-type';
import type { Component } from 'svelte';
import ContainerQuadletForm from '/@/lib/forms/quadlet/children/ContainerQuadletForm.svelte';
import PodQuadletForm from '/@/lib/forms/quadlet/children/PodQuadletForm.svelte';
import VolumeQuadletForm from '/@/lib/forms/quadlet/children/VolumeQuadletForm.svelte';
import NetworkQuadletForm from '/@/lib/forms/quadlet/children/NetworkQuadletForm.svelte';
import ImageQuadletForm from '/@/lib/forms/quadlet/children/ImageQuadletForm.svelte';
import KubeQuadletForm from '/@/lib/forms/quadlet/children/KubeQuadletForm.svelte';

export interface QuadletChildrenFormProps {
  loading: boolean;
  resourceId?: string;
  provider?: ProviderContainerConnectionDetailedInfo;
  onGenerate: (content: string) => void;
  onError: (error: Error) => void;
}

export const RESOURCE_ID_QUERY = 'resourceId';

export const QUADLET_FORMS: Record<QuadletType, Component<QuadletChildrenFormProps>> = {
  [QuadletType.CONTAINER]: ContainerQuadletForm,
  [QuadletType.POD]: PodQuadletForm,
  [QuadletType.VOLUME]: VolumeQuadletForm,
  [QuadletType.NETWORK]: NetworkQuadletForm,
  [QuadletType.IMAGE]: ImageQuadletForm,
  [QuadletType.KUBE]: KubeQuadletForm,
};
