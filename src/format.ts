export type SceneFormat = "ply" | "splat";
export function detectFormat(name: string): SceneFormat {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "ply" || extension === "splat") return extension;
  throw new Error("Please select a .ply or .splat file");
}
export function isGaussianPlyHeader(header: string): boolean {
  return /^ply\s/m.test(header) && /element vertex \d+/i.test(header) &&
    (/property \w+ f_dc_0/i.test(header) || /property \w+ opacity/i.test(header));
}
