/**
 * @author axel7083
 */
import { Open } from 'unzipper';
import fs from 'node:fs';
import * as tarFs from 'tar-fs';
import type { Readable } from 'node:stream';
import { pipeline } from 'stream/promises';
import { XzReadableStream } from 'xz-decompress';

/**
 *
 * @param options
 */
export async function unZip(options: {
  source: string,
  destination: string,
}): Promise<void> {
  const directory = await Open.file(options.source);
  await directory.extract({ path: options.destination });
}

// Helper function to convert a Node.js ReadStream to a web-compatible ReadableStream
function nodeToWebReadable(nodeStream: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on('data', chunk => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', error => controller.error(error));
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}

/**
 * This is a nightmare.
 * @param options
 */
export async function unTarXZ(options: {
  source: string,
  destination: string,
}): Promise<void> {
  const readStream = fs.createReadStream(options.source);
  const webReadableStream = nodeToWebReadable(readStream);
  const xzStream = new XzReadableStream(webReadableStream);

  const extract = tarFs.extract(options.destination);

  return pipeline(xzStream as unknown as Readable, extract);
}
