import React, { useState } from "react";
import { SafeAreaView, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { importScene, SceneFile } from "./src/files";
import Viewer from "./src/Viewer";

export default function App() {
  const [scene, setScene] = useState<SceneFile|null>(null);
  const [busy, setBusy] = useState(false);
  async function open() {
    setBusy(true);
    try { const file = await importScene(); if (file) setScene(file); }
    catch (e) { Alert.alert("Unable to open file", e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  return <SafeAreaView style={s.root}>
    <StatusBar style="light" />
    <View style={s.header}><Text style={s.title}>Gaussian Splat Viewer</Text></View>
    {scene ? <>
      <View style={s.toolbar}>
        <TouchableOpacity onPress={() => setScene(null)}><Text style={s.action}>← Back</Text></TouchableOpacity>
        <Text style={s.name} numberOfLines={1}>{scene.name}</Text>
        <TouchableOpacity disabled={busy} onPress={open}><Text style={s.action}>Browse</Text></TouchableOpacity>
      </View>
      <Viewer key={scene.uri} scene={scene}/>
    </> : <View style={s.home}>
      <Text style={s.symbol}>◈</Text>
      <Text style={s.headline}>Explore your 3D captures</Text>
      <Text style={s.subtitle}>Gaussian PLY · Point cloud PLY · SPLAT</Text>
      <TouchableOpacity style={s.button} disabled={busy} onPress={open}>
        <Text style={s.buttonLabel}>{busy ? "Importing…" : "Browse 3D file"}</Text>
      </TouchableOpacity>
      <Text style={s.hint}>Drag to rotate · Pinch to zoom · Two fingers to pan</Text>
    </View>}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  root:{flex:1,backgroundColor:"#080d18"},
  header:{padding:18,backgroundColor:"#121b2c"},
  title:{fontWeight:"800",color:"#eef6ff",fontSize:19},
  toolbar:{padding:12,flexDirection:"row",alignItems:"center",gap:12},
  action:{color:"#82dbff",fontWeight:"700"},
  name:{color:"#eef6ff",flex:1},
  home:{flex:1,justifyContent:"center",alignItems:"center",padding:24},
  symbol:{fontSize:68,color:"#79d9fa",marginBottom:20},
  headline:{fontSize:25,fontWeight:"800",color:"#eef6ff",textAlign:"center"},
  subtitle:{color:"#9caecb",marginTop:12,marginBottom:32},
  button:{backgroundColor:"#80dfff",paddingHorizontal:32,paddingVertical:16,borderRadius:14},
  buttonLabel:{color:"#07121e",fontWeight:"800",fontSize:17},
  hint:{color:"#94a4ba",textAlign:"center",marginTop:28}
});
