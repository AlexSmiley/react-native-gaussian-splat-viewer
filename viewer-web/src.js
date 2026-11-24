import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import * as Splat3D from "@mkkellogg/gaussian-splats-3d";

const element = document.getElementById("app");
const input = document.getElementById("scene-file");
const status = document.getElementById("status");
const toolbar = document.getElementById("toolbar");
if (window.ReactNativeWebView) toolbar.hidden = true;
const post = (type, message) => {
  window.ReactNativeWebView?.postMessage(JSON.stringify({type,message}));
  status.textContent = message;
  status.setAttribute("role", type === "error" ? "alert" : "status");
};
let disposer = null;
const models = document.getElementById("models");
const resourceBase = new URL("./resources/", document.baseURI);
async function initLibrary() {
  try {
    const response = await fetch(new URL("manifest.json", resourceBase));
    if (!response.ok) throw new Error("Resource manifest unavailable");
    const entries = await response.json();
    if (!Array.isArray(entries)) throw new Error("Invalid resource manifest");
    for (const entry of entries) {
      const option = document.createElement("option");
      option.value = entry.name;
      option.textContent = entry.name + " (" + (entry.size / 1048576).toFixed(1) + " MiB)";
      models.append(option);
    }
    if (!entries.length) models.options[0].textContent = "No bundled models yet";
  } catch (error) { models.options[0].textContent = "Library unavailable"; }
}
models.addEventListener("change", async () => {
  const name = models.value;
  if (!name) return;
  models.disabled = input.disabled = true;
  try {
    post("status", "Loading " + name + "…");
    const response = await fetch(new URL(encodeURIComponent(name), resourceBase));
    if (!response.ok) throw new Error("Resource unavailable: " + name);
    const buffer = await response.arrayBuffer();
    await load({format: name.split(".").pop().toLowerCase(), buffer, name});
  } catch (error) { post("error", error.message); }
  finally { models.disabled = input.disabled = false; models.value = ""; }
});
if (!window.ReactNativeWebView) initLibrary();

function isGaussianPly(buffer) {
  const header = new TextDecoder().decode(new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 16384)));
  return /element vertex \d+/.test(header) && (/f_dc_0/.test(header) || /opacity/.test(header));
}
async function loadPointCloud(blob) {
  const buffer = await blob.arrayBuffer();
  const geometry = new PLYLoader().parse(buffer);
  geometry.computeBoundingSphere();
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  element.replaceChildren(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d18);
  const material = new THREE.PointsMaterial({size:0.025,vertexColors:geometry.hasAttribute("color"),color:0xffffff,sizeAttenuation:true});
  const cloud = new THREE.Points(geometry,material);
  scene.add(cloud);
  const center = geometry.boundingSphere?.center ?? new THREE.Vector3();
  const radius = Math.max(geometry.boundingSphere?.radius ?? 1,0.1);
  const camera = new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.01,Math.max(100,radius*30));
  camera.position.copy(center).add(new THREE.Vector3(radius*1.7,radius*1.2,radius*1.7));
  const controls = new OrbitControls(camera,renderer.domElement);
  controls.target.copy(center);
  controls.update();
  let active = true;
  const resize = () => {camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)};
  addEventListener("resize",resize);
  const draw=()=>{ if(!active)return; controls.update(); renderer.render(scene,camera);requestAnimationFrame(draw); };
  draw();
  disposer=()=>{ active=false;removeEventListener("resize",resize);controls.dispose();geometry.dispose();material.dispose();renderer.dispose();element.replaceChildren(); };
}
async function loadGaussian(url, format) {
  const viewer = new Splat3D.Viewer({
    rootElement:element,sharedMemoryForWorkers:false,gpuAcceleratedSort:false,
    cameraUp:[0,-1,0],initialCameraPosition:[0,0,5],initialCameraLookAt:[0,0,0]
  });
  await viewer.addSplatScene(url,{format: format === "ply" ? Splat3D.SceneFormat.Ply : Splat3D.SceneFormat.Splat,progressiveLoad:false,showLoadingUI:true});
  viewer.start();
  disposer=()=>{viewer.stop();viewer.dispose();};
}
async function load(data) {
  let url;
  try {
    post("status","Decoding scene…");
    if(disposer){disposer();disposer=null;}
    let buffer = data.buffer;
    if (!buffer) {
      const raw=atob(data.base64), bytes=new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      buffer=bytes.buffer;
    }
    if (!buffer.byteLength) throw new Error("The selected file is empty.");
    if (data.format === "ply" && !/^ply\r?\n/.test(new TextDecoder().decode(new Uint8Array(buffer, 0, Math.min(128, buffer.byteLength))))) throw new Error("Invalid PLY file or missing Git LFS content.");
    if (data.format === "splat" && buffer.byteLength % 32 !== 0) throw new Error("Invalid SPLAT record length.");
    const gaussian=data.format === "splat" || isGaussianPly(buffer);
    if(gaussian){
      const blob=new Blob([buffer],{type:"application/octet-stream"});
      url=URL.createObjectURL(blob);
      post("status","Rendering Gaussian splats…");
      await loadGaussian(url,data.format);
    }else{
      post("status","Rendering point cloud…");
      await loadPointCloud(new Blob([buffer]));
    }
    post("ready", data.name ? "Loaded " + data.name : "Ready");
  }catch(error){post("error",error?.message ?? String(error));}
  finally{if(url)URL.revokeObjectURL(url);}
}
window.addEventListener("message",event=>{
  try{const data=JSON.parse(event.data);if(data.type==="load")load(data);}catch{}
});
input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (!file) return;
  input.disabled = models.disabled = true;
  try {
    const format = file.name.split(".").pop()?.toLowerCase();
    if (format !== "ply" && format !== "splat") throw new Error("Choose a .ply or .splat file.");
    post("status", "Reading " + file.name + "…");
    await load({format, buffer: await file.arrayBuffer()});
  } catch (error) {
    post("error", error?.message ?? String(error));
  } finally {
    input.value = "";
    input.disabled = models.disabled = false;
  }
});
if (window.ReactNativeWebView) post("boot","ready");
