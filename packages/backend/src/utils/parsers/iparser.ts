/**
 * @author axel7083
 */

export abstract class Parser<T, O> {
  protected parsed: boolean = false;
  protected constructor(protected content: T) {}
  abstract parse(): Promise<O>;
}
