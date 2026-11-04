import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Linking, Platform,
  Pressable, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const STORAGE_KEY = 'qjsc_mobile_server_url';
function normalizeHost(value) {
  let raw = String(value || '').trim();
  if (!raw) throw new Error('Enter the hospital PC address.');
  if (!/^https?:\/\//i.test(raw)) raw = `http://${raw}`;
  const u = new URL(raw);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Use the hospital PC IP address, for example 192.168.1.20.');
  if (['localhost', '127.0.0.1', '::1'].includes(u.hostname)) throw new Error('Enter the Windows hospital PC LAN IPv4 address, not localhost.');
  const hostname = u.hostname;
  return `http://${hostname}:8000`;
}
function getWebUrl(apiRoot) {
  const u = new URL(apiRoot);
  return `http://${u.hostname}:3000`;
}

export default function App() {
  const [serverDraft, setServerDraft] = useState('');
  const [apiRoot, setApiRoot] = useState('');
  const [webRoot, setWebRoot] = useState('');
  const [checking, setChecking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [webError, setWebError] = useState('');
  const [webKey, setWebKey] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const webRef = React.useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setServerDraft(saved);
          const api = normalizeHost(saved);
          setApiRoot(api);
          setWebRoot(getWebUrl(api));
          setConnected(true);
        }
      } catch (_e) {}
      finally { setLoading(false); }
    })();
  }, []);

  const testAndConnect = useCallback(async () => {
    let api;
    try { api = normalizeHost(serverDraft); }
    catch (e) { Alert.alert('Hospital PC address', e.message); return; }
    setChecking(true);
    setConnected(false);
    try {
      const response = await fetch(`${api}/api/`, { method: 'GET' });
      if (!response.ok) throw new Error(`Hospital API responded with HTTP ${response.status}.`);
      const result = await response.json();
      if (result?.status !== 'ok') throw new Error('This address did not respond as the QJSC hospital server.');
      const web = getWebUrl(api);
      // Check that the web app is reachable too, not merely the API.
      const page = await fetch(web, { method: 'GET' });
      if (!page.ok) throw new Error(`QJSC web app returned HTTP ${page.status}. Start the frontend on the PC.`);
      await AsyncStorage.setItem(STORAGE_KEY, api);
      setApiRoot(api); setWebRoot(web); setConnected(true); setWebError(''); setWebKey(x => x + 1);
    } catch (e) {
      Alert.alert('Cannot connect to QJSC', `${e.message || 'Connection failed'}\n\nCheck that the phone and PC use the same Wi-Fi, and that the QJSC backend and frontend are running.`);
    } finally { setChecking(false); }
  }, [serverDraft]);

  useEffect(() => {
    if (!connected || !webRoot) return undefined;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webRef.current) { webRef.current.goBack(); return true; }
      return false;
    });
    return () => back.remove();
  }, [connected, canGoBack, webRoot]);

  const allowedHost = useMemo(() => { try { return new URL(webRoot).hostname; } catch { return ''; } }, [webRoot]);
  if (loading) return <SafeAreaView style={s.center}><ActivityIndicator size="large" color="#0A4936"/><Text style={s.muted}>Opening QJSC…</Text></SafeAreaView>;

  if (!connected || !webRoot) return <SafeAreaView style={s.safe}>
    <StatusBar barStyle="dark-content" backgroundColor="#F4F7F5" />
    <KeyboardAvoidingView style={s.login} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.logo}><Text style={s.logoText}>QJSC</Text></View>
      <Text style={s.title}>Qurban Jhatiyal Surgical Complex</Text>
      <Text style={s.subtitle}>Mobile staff application » Full hospital software</Text>
      <View style={s.card}>
        <Text style={s.heading}>Connect to hospital PC</Text>
        <Text style={s.help}>Connect this phone to the same Wi-Fi as the hospital Windows PC. Internet is not required.</Text>
        <Text style={s.label}>Hospital PC IPv4 address</Text>
        <TextInput value={serverDraft} onChangeText={setServerDraft} placeholder="192.168.1.20" placeholderTextColor="#89968F" autoCapitalize="none" autoCorrect={false} keyboardType="url" style={s.input}/>
        <Text style={s.help}>Find the address on the PC by opening Command Prompt and running ipconfig. Enter only the IPv4 address, or the address with :8000.</Text>
        <Pressable onPress={testAndConnect} disabled={checking || !serverDraft.trim()} style={[s.button, (checking || !serverDraft.trim()) && s.disabled]}>
          {checking ? <ActivityIndicator color="#fff"/> : <Text style={s.buttonText}>Test connection & open QJSC</Text>}
        </Pressable>
      </View>
      <Text style={s.footer}>Patient information remains in the hospital PC database. Mobile registration sends the token to the PC's receipt print queue.</Text>
    </KeyboardAvoidingView>
  </SafeAreaView>;

  return <SafeAreaView style={s.webSafe}>
    <StatusBar barStyle="dark-content" backgroundColor="#F4F7F5" />
    <View style={s.toolbar}>
      <View style={{flex:1}}><Text style={s.toolbarBrand}>QJSC</Text><Text style={s.toolbarSub}>Hospital local network</Text></View>
      <View style={s.toolbarStatus}><View style={s.dot}/><Text style={s.toolbarStatusText}>Connected</Text></View>
      <Pressable onPress={() => { Alert.alert('Change hospital server', 'Disconnect this device from the current QJSC server?', [{text:'Cancel',style:'cancel'},{text:'Change',style:'destructive',onPress:async()=>{await AsyncStorage.removeItem(STORAGE_KEY);setConnected(false);setApiRoot('');setWebRoot('');}}]); }} style={s.changeButton}><Text style={s.changeText}>Change</Text></Pressable>
    </View>
    {webError ? <View style={s.errorBox}><Text style={s.errorText}>{webError}</Text><Pressable onPress={()=>setWebKey(x=>x+1)}><Text style={s.retry}>Retry</Text></Pressable></View> : null}
    <WebView
      key={webKey}
      ref={webRef}
      source={{ uri: webRoot }}
      originWhitelist={['http://*','https://*']}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      cacheEnabled
      allowsBackForwardNavigationGestures
      setSupportMultipleWindows={false}
      mixedContentMode="compatibility"
      javaScriptCanOpenWindowsAutomatically
      startInLoadingState
      renderLoading={()=><View style={s.webLoading}><ActivityIndicator size="large" color="#0A4936"/><Text style={s.muted}>Loading QJSC…</Text></View>}
      onNavigationStateChange={state=>setCanGoBack(Boolean(state.canGoBack))}
      onError={event=>setWebError(event.nativeEvent?.description || 'Could not load QJSC. Check that the PC frontend is running.')}
      onHttpError={event=>{if(event.nativeEvent?.statusCode>=500)setWebError(`QJSC returned HTTP ${event.nativeEvent.statusCode}.`);}}
      onShouldStartLoadWithRequest={request=>{
        const url=request.url || '';
        if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) return true;
        try {
          const u=new URL(url);
          if (u.hostname===allowedHost && ['http:','https:'].includes(u.protocol)) return true;
          if (u.protocol==='mailto:' || u.protocol==='tel:') { Linking.openURL(url).catch(()=>{}); return false; }
          if (u.protocol==='https:') { Linking.openURL(url).catch(()=>{}); return false; }
          return false;
        } catch { return false; }
      }}
    />
  </SafeAreaView>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F4F7F5'}, webSafe:{flex:1,backgroundColor:'#fff'}, center:{flex:1,justifyContent:'center',alignItems:'center',gap:12,backgroundColor:'#F4F7F5'},
  login:{flex:1,justifyContent:'center',padding:22,gap:16},logo:{width:72,height:72,borderRadius:20,alignSelf:'center',backgroundColor:'#0A3B2E',justifyContent:'center',alignItems:'center'},logoText:{color:'#fff',fontSize:22,fontWeight:'900',letterSpacing:1.5},
  title:{textAlign:'center',color:'#0A3B2E',fontSize:22,fontWeight:'900'},subtitle:{textAlign:'center',color:'#64736B',fontSize:12,marginTop:-12},card:{backgroundColor:'#fff',borderRadius:16,borderWidth:1,borderColor:'#DDE6E0',padding:18,gap:12},heading:{fontSize:18,fontWeight:'900',color:'#17231E'},help:{fontSize:12,lineHeight:18,color:'#64736B'},label:{fontSize:12,fontWeight:'800',color:'#17231E'},input:{height:50,borderRadius:10,borderWidth:1,borderColor:'#CFDCD3',paddingHorizontal:13,fontSize:16,color:'#17231E'},button:{minHeight:48,backgroundColor:'#0A4936',borderRadius:10,justifyContent:'center',alignItems:'center',padding:12},disabled:{opacity:.5},buttonText:{color:'#fff',fontSize:14,fontWeight:'900'},footer:{fontSize:10,lineHeight:16,textAlign:'center',color:'#8A9791'},muted:{fontSize:12,color:'#64736B'},
  toolbar:{height:54,flexDirection:'row',alignItems:'center',paddingHorizontal:12,gap:12,backgroundColor:'#F4F7F5',borderBottomWidth:1,borderBottomColor:'#DDE6E0'},toolbarBrand:{fontSize:17,fontWeight:'900',color:'#0A3B2E'},toolbarSub:{fontSize:9,color:'#64736B'},toolbarStatus:{flexDirection:'row',alignItems:'center',gap:5},dot:{width:7,height:7,borderRadius:8,backgroundColor:'#239B67'},toolbarStatusText:{fontSize:10,color:'#0A4936',fontWeight:'800'},changeButton:{paddingHorizontal:10,paddingVertical:7,borderRadius:7,backgroundColor:'#EAF2ED'},changeText:{fontSize:10,color:'#0A4936',fontWeight:'900'},webLoading:{...StyleSheet.absoluteFillObject,backgroundColor:'#fff',justifyContent:'center',alignItems:'center',gap:10,zIndex:2},errorBox:{padding:10,backgroundColor:'#FCECEC',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},errorText:{fontSize:11,color:'#9A3030',flex:1},retry:{fontSize:12,color:'#0A4936',fontWeight:'900'},
});
