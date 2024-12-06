// we cannot generate quadlet type for kube
export type QuadletTypeGenerate = Exclude<QuadletType, QuadletType.KUBE>;

export enum QuadletType {
  CONTAINER = 'container',
  IMAGE = 'image',
  POD = 'pod',
  VOLUME = 'volume',
  NETWORK = 'network',
  KUBE = 'kube',
}
