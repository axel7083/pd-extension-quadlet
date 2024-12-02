/**
 * @author axel7083
 */

import { Parser } from './iparser';
import { QuadletUnitParser } from './quadlet-unit-parser';
import type { Quadlet } from '../../models/quadlet';

export class QuadletDryRunParser extends Parser<string, Quadlet[]> {
  // Stores the parsed services and their content
  private services: Record<string, Quadlet> = {};

  constructor(content: string) {
    super(content);
  }

  /**
   * Parses the CLI output to extract services and their content.
   * @returns {Promise<number>} Number of services found
   */
  override async parse(): Promise<Quadlet[]> {
    if (this.parsed) {
      throw new Error('Content has already been parsed.');
    }

    // Regular expression to match the structure of the content
    const serviceRegex = /---(.*?)---\n([\s\S]*?)(?=---|$)/g;
    let match;

    while ((match = serviceRegex.exec(this.content))) {
      const serviceName = match[1].trim();

      // parse the quadlet unit
      const quadletUnitParser = new QuadletUnitParser(serviceName, match[2].trim());
      this.services[serviceName] = await quadletUnitParser.parse();
    }

    this.parsed = true;
    return Object.values(this.services);
  }
}
