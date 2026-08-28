declare module "uzip" {
  const UZIP: {
    encode(files: Record<string, Uint8Array>, level?: number): ArrayBuffer;
  };

  export default UZIP;
}
