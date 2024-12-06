/**
 * @author axel7083
 */
import type { ProviderContainerConnectionDetailedInfo } from '/@shared/src/models/provider-container-connection-detailed-info';
import { QuadletType, type QuadletTypeGenerate } from '/@shared/src/utils/quadlet-type';
import type { Component } from 'svelte';
import ContainerQuadletForm from '/@/lib/forms/quadlet/children/ContainerQuadletForm.svelte';
import PodQuadletForm from '/@/lib/forms/quadlet/children/PodQuadletForm.svelte';
import VolumeQuadletForm from '/@/lib/forms/quadlet/children/VolumeQuadletForm.svelte';
import NetworkQuadletForm from '/@/lib/forms/quadlet/children/NetworkQuadletForm.svelte';
import ImageQuadletForm from '/@/lib/forms/quadlet/children/ImageQuadletForm.svelte';

export interface QuadletChildrenFormProps {
  loading: boolean;
  resourceId?: string;
  provider?: ProviderContainerConnectionDetailedInfo;
  onError: (error: string) => void;
  onChange: () => void;
}

export const RESOURCE_ID_QUERY = 'resourceId';

export const QUADLET_GENERATE_FORMS: Record<QuadletTypeGenerate, Component<QuadletChildrenFormProps>> = {
  [QuadletType.CONTAINER]: ContainerQuadletForm,
  [QuadletType.POD]: PodQuadletForm,
  [QuadletType.VOLUME]: VolumeQuadletForm,
  [QuadletType.NETWORK]: NetworkQuadletForm,
  [QuadletType.IMAGE]: ImageQuadletForm,
};
