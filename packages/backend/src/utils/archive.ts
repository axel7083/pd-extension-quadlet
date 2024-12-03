/**
 * @author axel7083
 */
import unzipper from 'unzipper';
import fs from 'node:fs';
import * as tarFs from 'tar-fs';
import type { Readable } from 'node:stream';
import { pipeline } from 'stream/promises';
import { XzReadableStream } from 'xz-decompress';

export async function unZip(options: {
  source: string,
  destination: string,
}): Promise<void> {
  const directory = await unzipper.Open.file(options.source);
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
 * @param tarFilePath
 * @param destFolder
 */
export async function unTarXZ(tarFilePath: string, destFolder: string): Promise<void> {
  const readStream = fs.createReadStream(tarFilePath);
  const webReadableStream = nodeToWebReadable(readStream);
  const xzStream = new XzReadableStream(webReadableStream);

  const extract = tarFs.extract(destFolder);

  return pipeline(xzStream as unknown as Readable, extract);
}
