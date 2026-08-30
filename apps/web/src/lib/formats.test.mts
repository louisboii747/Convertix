import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCEPTED_FILE_EXTENSIONS,
  getCanonicalFileName,
  getEnabledTargets,
  getFormatFromFile,
  getFormatFromFileName,
  getHeifFormatFromBytes,
} from "./formats.ts";

function makeFtyp(...brands: string[]): Uint8Array {
  const size = 16 + Math.max(0, brands.length - 1) * 4;
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, size);

  const writeAscii = (offset: number, value: string) => {
    for (let index = 0; index < 4; index += 1) {
      bytes[offset + index] = value.charCodeAt(index);
    }
  };

  writeAscii(4, "ftyp");
  writeAscii(8, brands[0]);
  brands.slice(1).forEach((brand, index) => writeAscii(16 + index * 4, brand));
  return bytes;
}

function withLeadingFreeBox(bytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(bytes.byteLength + 8);
  new DataView(result.buffer).setUint32(0, 8);
  result.set([0x66, 0x72, 0x65, 0x65], 4);
  result.set(bytes, 8);
  return result;
}

test("recognises HEIC and HEIF extensions case-insensitively", () => {
  assert.equal(getFormatFromFileName("IMG_0001.HEIC"), "heic");
  assert.equal(getFormatFromFileName("photo.HeIf"), "heif");
  assert.match(ACCEPTED_FILE_EXTENSIONS, /\.heic/);
  assert.match(ACCEPTED_FILE_EXTENSIONS, /\.heif/);
});

test("recognises HEIC and HEIF from ISO BMFF brands", () => {
  assert.equal(getHeifFormatFromBytes(makeFtyp("heic", "mif1")), "heic");
  assert.equal(
    getHeifFormatFromBytes(withLeadingFreeBox(makeFtyp("mif1", "hevm"))),
    "heic",
  );
  assert.equal(getHeifFormatFromBytes(makeFtyp("mif1")), "heif");
  assert.equal(getHeifFormatFromBytes(new Uint8Array(24)), null);
});

test("content detection overrides a misleading JPEG name and MIME type", async () => {
  const bytes = makeFtyp("heic", "mif1");
  const file = new File(
    [bytes.slice().buffer as ArrayBuffer],
    "iphone-photo.jpg",
    {
      type: "image/jpeg",
    },
  );

  assert.equal(await getFormatFromFile(file), "heic");
  assert.equal(getCanonicalFileName(file.name, "heic"), "iphone-photo.heic");
});

test("HEIC and HEIF expose the supported raster targets", () => {
  assert.deepEqual(getEnabledTargets("heic"), ["jpg", "png", "webp"]);
  assert.deepEqual(getEnabledTargets("heif"), ["jpg", "png", "webp"]);
});
