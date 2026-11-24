import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { detectFormat, SceneFormat } from "./format";

export type SceneFile = { name: string; uri: string; size: number; format: SceneFormat };
export async function importScene(): Promise<SceneFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const format = detectFormat(asset.name);
  const source = new File(asset.uri);
  const name = asset.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const target = new File(Paths.document, `${Date.now()}-${name}`);
  source.copy(target);
  return { name: asset.name, uri: target.uri, size: asset.size ?? target.size, format };
}
