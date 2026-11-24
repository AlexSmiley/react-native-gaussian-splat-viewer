import { detectFormat, isGaussianPlyHeader } from "../src/format";
test("recognizes supported extensions",()=>{expect(detectFormat("SCENE.PLY")).toBe("ply");expect(detectFormat("scene.splat")).toBe("splat");});
test("rejects unsupported formats",()=>expect(()=>detectFormat("scene.obj")).toThrow());
test("recognizes Gaussian properties",()=>expect(isGaussianPlyHeader("ply\nelement vertex 1\nproperty float f_dc_0\n")).toBe(true));
test("does not mistake ordinary PLY for Gaussian",()=>expect(isGaussianPlyHeader("ply\nelement vertex 1\nproperty float x\n")).toBe(false));
