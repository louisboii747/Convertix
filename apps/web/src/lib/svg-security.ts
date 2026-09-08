import createDOMPurify from "dompurify";

export function sanitizeSvgDownload(source: string): string {
  const purify = createDOMPurify(window);
  if (!purify.isSupported)
    throw new Error("SVG sanitization is unavailable in this browser.");
  purify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (["href", "xlink:href"].includes(data.attrName)) {
      // Allow this document's definitions and embedded raster images only.
      data.keepAttr =
        /^(?:#[^\s]+|data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/\s]+=*)$/i.test(
          data.attrValue,
        );
    }
    if (
      [
        "fill",
        "stroke",
        "filter",
        "clip-path",
        "mask",
        "cursor",
        "marker-start",
        "marker-mid",
        "marker-end",
      ].includes(data.attrName)
    ) {
      if (
        data.attrValue.includes("\\") ||
        (/url\s*\(/i.test(data.attrValue) &&
          !/^\s*url\(\s*(['"]?)#[\w:.-]+\1\s*\)\s*$/i.test(data.attrValue))
      )
        data.keepAttr = false;
    }
  });
  return purify.sanitize(source, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: [
      "style",
      "foreignObject",
      "animate",
      "animateMotion",
      "animateTransform",
      "set",
    ],
    FORBID_ATTR: ["style"],
  });
}
