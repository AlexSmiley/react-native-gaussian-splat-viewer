import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";
import { File } from "expo-file-system";
import { SceneFile } from "./files";

const MAX_BYTES = 48 * 1024 * 1024;
export default function Viewer({ scene }: { scene: SceneFile }) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState("Initializing viewer");
  useEffect(() => {
    let active = true;
    async function load() {
      if (!ready) return;
      try {
        if (scene.size > MAX_BYTES) throw new Error("File exceeds the 48 MB WebView transfer limit");
        setState("Reading 3D file");
        const data = await new File(scene.uri).base64();
        if (!active) return;
        const message = JSON.stringify({ type: "load", name: scene.name, format: scene.format, base64: data });
        ref.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent("message",{data:${JSON.stringify(message)}}));true;`);
      } catch(e) { if(active) setState(e instanceof Error ? e.message : String(e)); }
    }
    load();
    return () => { active = false; };
  }, [ready, scene]);
  return <View style={styles.root}>
    <WebView ref={ref}
      source={require("../viewer-web/dist/index.html")}
      originWhitelist={["*"]}
      javaScriptEnabled
      allowFileAccess
      allowingReadAccessToURL="*"
      onMessage={e => {
        try {
          const message = JSON.parse(e.nativeEvent.data);
          if(message.type === "boot") setReady(true);
          if(message.type === "status" || message.type === "error") setState(message.message);
          if(message.type === "ready") setState("Scene loaded — drag to orbit, pinch to zoom");
        } catch {}
      }}
      style={{backgroundColor:"#080d18"}} />
    <View pointerEvents="none" style={styles.overlay}>
      {state !== "Scene loaded — drag to orbit, pinch to zoom" && <ActivityIndicator color="#79d9fa" />}
      <Text style={styles.label}>{state}</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:"#080d18"},
  overlay:{position:"absolute",top:12,alignSelf:"center",backgroundColor:"#18283ddd",borderRadius:12,padding:10,flexDirection:"row",gap:8,alignItems:"center"},
  label:{color:"#dceaff",fontSize:12}
});
