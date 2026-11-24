import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import * as Splat3D from "@mkkellogg/gaussian-splats-3d";

const element = document.getElementById("app");
const post = (type, message) => window.ReactNativeWebView?.postMessage(JSON.stringify({type,message}));
let disposer = null;

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
    const raw=atob(data.base64), bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    const buffer=bytes.buffer;
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
    post("ready","Ready");
  }catch(error){post("error",error?.message ?? String(error));}
  finally{if(url)URL.revokeObjectURL(url);}
}
window.addEventListener("message",event=>{
  try{const data=JSON.parse(event.data);if(data.type==="load")load(data);}catch{}
});
post("boot","ready");
