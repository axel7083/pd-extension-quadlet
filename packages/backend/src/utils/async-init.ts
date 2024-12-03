/**
 * @author axel7083
 */
export interface AsyncInit<T = void> {
  init(): Promise<T>;
}
