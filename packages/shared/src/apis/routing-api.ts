/**
 * @author axel7083
 */
export abstract class RoutingApi {
  static readonly CHANNEL: string = 'routing-api';

  /**
   * This method is used by the frontend on reveal to get any potential navigation
   * route it should use. This method has a side effect of removing the pending route after calling.
   */
  abstract readRoute(): Promise<string | undefined>;
}
