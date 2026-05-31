import React, { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate, useParams, Routes, Route } from "react-router-dom";

const supabase = createClient(
  "https://vouirrtmhjnzrxxvzboj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdWlycnRtaGpuenJ4eHZ6Ym9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzQ2MTAsImV4cCI6MjA5NTgxMDYxMH0.ISsLMyd2L2gf3BmRyMHr-G0MNu2HoTvantNxpv2jD-E"
);

const CHANNELS = [
  { id: "general", label: "General", icon: "🏠", desc: "Introductions and general chat" },
  { id: "show", label: "Show Your Build", icon: "🚀", desc: "Share what you have built" },
  { id: "claude", label: "Claude Tips", icon: "🤖", desc: "Prompts, tricks and Claude workflows" },
  { id: "jobs", label: "Jobs & Hiring", icon: "💼", desc: "Find work or find talent" },
  { id: "tools", label: "Tools & Resources", icon: "🛠️", desc: "Make.com, n8n, Zapier and more" },
];

const COLORS = {
  A:"#c8692a",B:"#3a7ca5",C:"#3a6b45",D:"#7a5c9e",E:"#1a5c8a",F:"#b85555",
  G:"#5a7a3a",H:"#8a5a2a",I:"#2a6a8a",J:"#6a3a8a",K:"#3a8a6a",L:"#8a6a2a",
  M:"#c8692a",N:"#3a7ca5",O:"#3a6b45",P:"#7a5c9e",Q:"#1a5c8a",R:"#b85555",
  S:"#5a7a3a",T:"#8a5a2a",U:"#2a6a8a",V:"#6a3a8a",W:"#3a8a6a",X:"#8a6a2a",
  Y:"#c8692a",Z:"#3a7ca5",
};

function ac(l) { return COLORS[l?.toUpperCase()] || "#888"; }

function getAvatarUrl(username, seed) {
  const s = seed || username?.toLowerCase() || "default";
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s)}`;
}

function getPrefix(user) {
  return user?.is_admin === true ? "m" : "u";
}

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return Math.floor(d/60)+"m ago";
  if (d < 86400) return Math.floor(d/3600)+"h ago";
  return Math.floor(d/86400)+"d ago";
}

function Avatar({ letter, username, seed, size=32 }) {
  const [imgError, setImgError] = React.useState(false);
  if (username && !imgError) {
    return (
      <img
        src={getAvatarUrl(username, seed)}
        alt={username}
        width={size}
        height={size}
        style={{ width:size, height:size, borderRadius:"50%", flexShrink:0, background:"#f5f0e8", display:"block", objectFit:"cover" }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:ac(letter), color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:size*0.4, flexShrink:0, fontFamily:"Georgia,serif" }}>
      {letter?.toUpperCase()}
    </div>
  );
}

function VoteBtn({ count, voted, onUp, onDown }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, minWidth:36 }}>
      <button onClick={onUp} style={{ background:"none", border:"none", cursor:"pointer", color:voted===1?"#c8692a":"#aaa", fontSize:16, padding:"2px 6px", borderRadius:4, lineHeight:1 }}>▲</button>
      <span style={{ fontSize:13, fontWeight:600, color:voted?"#c8692a":"#555", minWidth:20, textAlign:"center" }}>{count}</span>
      <button onClick={onDown} style={{ background:"none", border:"none", cursor:"pointer", color:voted===-1?"#5a7ca5":"#aaa", fontSize:16, padding:"2px 6px", borderRadius:4, lineHeight:1 }}>▼</button>
    </div>
  );
}

function ReportModal({ postId, commentId, currentUser, onClose }) {
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await supabase.from("reports").insert({
      post_id: postId || null,
      comment_id: commentId || null,
      reported_by: currentUser?.id || null,
      reason: reason.trim(),
    });
    setSubmitted(true);
    setLoading(false);
    setTimeout(onClose, 2000);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,14,13,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:"white", borderRadius:8, padding:28, width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }} onClick={e=>e.stopPropagation()}>
        {submitted ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>✅</div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:16, fontWeight:700, marginBottom:8 }}>Report submitted</div>
            <div style={{ fontSize:13, color:"#7a7570" }}>Thank you. Our moderators will review this.</div>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700 }}>Report {commentId ? "Comment" : "Post"}</div>
              <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#aaa" }}>×</button>
            </div>
            <div style={{ fontSize:13, color:"#7a7570", marginBottom:16 }}>Tell us why this {commentId ? "comment" : "post"} should be reviewed by a moderator.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
              {["Spam or self-promotion", "Harmful or offensive content", "Misinformation", "Off-topic", "Other"].map(r => (
                <button key={r} onClick={() => setReason(r)} style={{ padding:"10px 14px", border:"1px solid", borderColor:reason===r?"#c8692a":"#e8e2d8", borderRadius:4, background:reason===r?"#fdf0e8":"white", color:reason===r?"#c8692a":"#3a3835", fontSize:13, cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>{r}</button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={onClose} style={{ background:"none", border:"1px solid #e8e2d8", borderRadius:3, padding:"8px 18px", fontSize:13, cursor:"pointer", color:"#7a7570" }}>Cancel</button>
              <button onClick={submit} disabled={!reason.trim()||loading} style={{ background:reason.trim()?"#c8692a":"#e8e2d8", color:reason.trim()?"white":"#aaa", border:"none", borderRadius:3, padding:"8px 20px", fontSize:13, fontWeight:500, cursor:reason.trim()?"pointer":"default" }}>{loading?"Submitting...":"Submit Report"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Sidebar({ onCreatePost, onChannelClick, activeChannel }) {
  return (
    <div>
      <div style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, overflow:"hidden", marginBottom:16 }}>
        <div style={{ padding:"10px 14px", borderBottom:"1px solid #e8e2d8", fontSize:10, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#aaa" }}>Channels</div>
        {[{id:null,label:"All Posts",icon:"🌐"},...CHANNELS].map(ch=>(
          <div key={ch.id??"all"} onClick={()=>onChannelClick(ch.id)} style={{ padding:"9px 14px", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:8, background:activeChannel===ch.id?"#fdf0e8":"white", color:activeChannel===ch.id?"#c8692a":"#3a3835", fontWeight:activeChannel===ch.id?500:400, borderLeft:activeChannel===ch.id?"2px solid #c8692a":"2px solid transparent", transition:"all 0.15s" }}
            onMouseEnter={e=>{if(activeChannel!==ch.id)e.currentTarget.style.background="#faf8f4";}}
            onMouseLeave={e=>{if(activeChannel!==ch.id)e.currentTarget.style.background="white";}}>
            <span>{ch.icon}</span><span>{ch.label}</span>
          </div>
        ))}
      </div>
      <div style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, padding:14 }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#0f0e0d", marginBottom:8, fontFamily:"Georgia,serif" }}>About</div>
        <div style={{ fontSize:13, fontWeight:600, color:"#c8692a", marginBottom:6, fontFamily:"Georgia,serif", fontStyle:"italic" }}>Learn it. Build it. Automate it.</div>
        <div style={{ fontSize:12, color:"#7a7570", lineHeight:1.7, marginBottom:12 }}>The home for developers, entrepreneurs and creators who want to do more with Claude and AI. Beginners and experts welcome.</div>
        <div style={{ fontSize:11, color:"#7a7570", display:"flex", flexDirection:"column", gap:4, marginBottom:12 }}>
          <div>✦ Prompts that actually work</div>
          <div>✦ Real workflows and automations</div>
          <div>✦ Tools, tips and AI news</div>
          <div>✦ Jobs and collaboration</div>
        </div>
        <div style={{ fontSize:11, color:"#aaa", display:"flex", flexDirection:"column", gap:4, paddingTop:8, borderTop:"1px solid #e8e2d8", marginBottom:14 }}>
          <div>🤖 All AI tools welcome</div>
          <div>🌍 Global community</div>
          <div>✓ Free to join</div>
        </div>
        <button style={{ display:"block", width:"100%", background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:8, fontSize:12, fontWeight:500, cursor:"pointer" }} onClick={onCreatePost}>Create Post</button>
      </div>
    </div>
  );
}

function NavBar({ currentUser, onAuth, onNewPost, onHome, onSignOut, showDropdown, setShowDropdown, setShowAvatarPicker, setAvatarSeedInput }) {
  return (
    <div style={{ background:"white", borderBottom:"1px solid #e8e2d8", padding:"0 20px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
      <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#0f0e0d", cursor:"pointer", letterSpacing:"-0.02em" }} onClick={onHome}>
        Claude AI<span style={{ color:"#c8692a" }}>Community</span>
        <span style={{ fontSize:12, fontWeight:400, color:"#aaa", marginLeft:6 }}>· AI Automation Community</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {currentUser ? (
          <>
            <button style={{ background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:"7px 16px", fontSize:13, fontWeight:500, cursor:"pointer" }} onClick={onNewPost}>+ Post</button>
            <div style={{ position:"relative" }}>
              <div onClick={()=>setShowDropdown(d=>!d)} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"4px 8px", borderRadius:4, border:"1px solid #e8e2d8", background:"white" }}>
                <Avatar username={currentUser.username} seed={currentUser.avatar_seed} letter={currentUser.avatar_letter||currentUser.username?.[0]} size={28} />
                <span style={{ fontSize:12, color:"#7a7570" }}>{getPrefix(currentUser)}/{currentUser.username}</span>
                <span style={{ fontSize:10, color:"#aaa" }}>▼</span>
              </div>
              {showDropdown && (
                <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, background:"white", border:"1px solid #e8e2d8", borderRadius:6, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", minWidth:180, zIndex:200 }}>
                  <div style={{ padding:"12px 14px", borderBottom:"1px solid #e8e2d8" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#0f0e0d" }}>{getPrefix(currentUser)}/{currentUser.username}</div>
                    <div style={{ fontSize:11, color:currentUser.is_admin?"#c8692a":"#aaa", marginTop:2, fontWeight:currentUser.is_admin?500:400 }}>{currentUser.is_admin?"⚡ Moderator":"Member"}</div>
                  </div>
                  <div onClick={()=>{onNewPost();setShowDropdown(false);}} style={{ padding:"10px 14px", fontSize:13, cursor:"pointer", color:"#0f0e0d", display:"flex", alignItems:"center", gap:8 }} onMouseEnter={e=>e.currentTarget.style.background="#faf8f4"} onMouseLeave={e=>e.currentTarget.style.background="white"}>✏️ Create Post</div>
                  <div onClick={()=>{setShowAvatarPicker(true);setShowDropdown(false);setAvatarSeedInput(currentUser.avatar_seed||currentUser.username);}} style={{ padding:"10px 14px", fontSize:13, cursor:"pointer", color:"#0f0e0d", display:"flex", alignItems:"center", gap:8 }} onMouseEnter={e=>e.currentTarget.style.background="#faf8f4"} onMouseLeave={e=>e.currentTarget.style.background="white"}>🤖 Change Avatar</div>
                  <div onClick={onHome} style={{ padding:"10px 14px", fontSize:13, cursor:"pointer", color:"#0f0e0d", display:"flex", alignItems:"center", gap:8 }} onMouseEnter={e=>e.currentTarget.style.background="#faf8f4"} onMouseLeave={e=>e.currentTarget.style.background="white"}>🏠 All Posts</div>
                  <div onClick={onSignOut} style={{ padding:"10px 14px", fontSize:13, cursor:"pointer", color:"#c0392b", display:"flex", alignItems:"center", gap:8, borderTop:"1px solid #e8e2d8" }} onMouseEnter={e=>e.currentTarget.style.background="#fdf0f0"} onMouseLeave={e=>e.currentTarget.style.background="white"}>🚪 Sign Out</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button style={{ background:"none", border:"1px solid #e8e2d8", borderRadius:3, padding:"6px 14px", fontSize:13, cursor:"pointer", color:"#7a7570" }} onClick={onAuth}>Sign In</button>
            <button style={{ background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:"7px 16px", fontSize:13, fontWeight:500, cursor:"pointer" }} onClick={onAuth}>Join Free</button>
          </>
        )}
      </div>
    </div>
  );
}

function AuthModal({ onClose, onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = { width:"100%", border:"1px solid #e8e2d8", borderRadius:4, padding:"10px 12px", fontFamily:"inherit", fontSize:13, color:"#0f0e0d", background:"#faf8f4", outline:"none", marginBottom:10, boxSizing:"border-box" };

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!username.trim()) { setError("Username required"); setLoading(false); return; }
        const cleanUsername = username.trim().toLowerCase();
        const { data, error: e } = await supabase.auth.signUp({ email, password });
        if (e) { setError(e.message); setLoading(false); return; }
        await supabase.from("users").insert({ id: data.user.id, email, username: cleanUsername, avatar_letter: cleanUsername[0].toUpperCase() });
        onLogin({ id: data.user.id, username: cleanUsername, avatar_letter: cleanUsername[0].toUpperCase() });
      } else {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) { setError(e.message); setLoading(false); return; }
        const { data: u } = await supabase.from("users").select("*").eq("id", data.user.id).single();
        onLogin(u);
      }
      onClose();
    } catch { setError("Something went wrong."); }
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,14,13,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:"white", borderRadius:8, padding:28, width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700 }}>Claude AI<span style={{ color:"#c8692a" }}>Community</span></div>
          <div style={{ fontSize:12, color:"#7a7570", marginTop:4 }}>AI Automation Community</div>
        </div>
        <div style={{ display:"flex", background:"#f5f0e8", borderRadius:4, padding:3, marginBottom:20 }}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{ flex:1, padding:8, border:"none", borderRadius:3, background:mode===m?"white":"transparent", color:mode===m?"#0f0e0d":"#7a7570", fontWeight:mode===m?500:400, fontSize:13, cursor:"pointer" }}>{m==="login"?"Sign In":"Join Free"}</button>
          ))}
        </div>
        {mode==="register" && (
          <div style={{ marginBottom:10 }}>
            <input value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} placeholder="Choose a username" style={inp} />
            <div style={{ fontSize:11, color:"#aaa", marginTop:-6, marginBottom:6 }}>Lowercase letters, numbers and underscores only</div>
          </div>
        )}
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" style={inp} />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" style={{...inp,marginBottom:0}} onKeyDown={e=>e.key==="Enter"&&submit()} />
        {error && <div style={{ fontSize:12, color:"#c0392b", background:"#fdf0f0", padding:"6px 10px", borderRadius:3, marginTop:8 }}>{error}</div>}
        <button onClick={submit} disabled={loading} style={{ display:"block", width:"100%", marginTop:14, background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:11, fontSize:14, fontWeight:500, cursor:"pointer", opacity:loading?0.7:1 }}>{loading?"Please wait...":mode==="login"?"Sign In":"Create Account"}</button>
        {mode==="register" && <div style={{ fontSize:11, color:"#aaa", textAlign:"center", marginTop:10 }}>No real name needed. Your username is how the community knows you.</div>}
      </div>
    </div>
  );
}

function AvatarPickerModal({ currentUser, onClose, onSave }) {
  const [seed, setSeed] = useState(currentUser.avatar_seed || currentUser.username);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const s = seed.trim() || currentUser.username;
    await supabase.from("users").update({ avatar_seed: s }).eq("id", currentUser.id);
    onSave(s);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,14,13,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:"white", borderRadius:8, padding:28, width:"100%", maxWidth:440, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700 }}>Change Your Avatar</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#aaa" }}>×</button>
        </div>
        <div style={{ fontSize:13, color:"#7a7570", marginBottom:16, lineHeight:1.6 }}>Type any word to generate a unique robot. Try a nickname, hobby, or anything you like.</div>
        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:20 }}>
          <img src={getAvatarUrl(null, seed||currentUser.username)} alt="preview" width={64} height={64} style={{ borderRadius:"50%", background:"#f5f0e8", flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:500, color:"#7a7570", marginBottom:6 }}>Seed word</div>
            <input value={seed} onChange={e=>setSeed(e.target.value.toLowerCase())} placeholder="e.g. starship, moonwalker, robot42" style={{ width:"100%", border:"1px solid #e8e2d8", borderRadius:4, padding:"10px 12px", fontFamily:"inherit", fontSize:13, color:"#0f0e0d", background:"#faf8f4", outline:"none", boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor="#c8692a"} onBlur={e=>e.target.style.borderColor="#e8e2d8"} />
            <div style={{ fontSize:11, color:"#aaa", marginTop:4 }}>Preview updates as you type</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #e8e2d8", borderRadius:3, padding:"8px 18px", fontSize:13, cursor:"pointer", color:"#7a7570" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:"8px 20px", fontSize:13, fontWeight:500, cursor:"pointer" }}>{saving?"Saving...":"Save Avatar"}</button>
        </div>
      </div>
    </div>
  );
}

function NewPostModal({ channels, currentUser, onSubmit, onClose }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState(channels[0].id);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setImageError("Image must be under 4MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError("File must be an image");
      return;
    }
    setImageError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    let image_url = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const fileName = `${currentUser.id}-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, imageFile, { contentType: imageFile.type });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }
    }
    await onSubmit({ title: title.trim(), body: body.trim(), channel, image_url });
    setLoading(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,14,13,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:"white", borderRadius:8, padding:28, width:"100%", maxWidth:580, boxShadow:"0 20px 60px rgba(0,0,0,0.15)", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700 }}>Create a Post</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#aaa" }}>×</button>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:500, color:"#7a7570", marginBottom:6 }}>Channel</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {channels.map(ch=>(
              <button key={ch.id} onClick={()=>setChannel(ch.id)} style={{ padding:"5px 12px", borderRadius:100, border:"1px solid", borderColor:channel===ch.id?"#c8692a":"#e8e2d8", background:channel===ch.id?"#fdf0e8":"white", color:channel===ch.id?"#c8692a":"#7a7570", fontSize:12, fontWeight:500, cursor:"pointer" }}>{ch.icon} {ch.label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:500, color:"#7a7570", marginBottom:6 }}>Title</div>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What is your post about?" maxLength={200} style={{ width:"100%", border:"1px solid #e8e2d8", borderRadius:4, padding:"10px 12px", fontFamily:"inherit", fontSize:14, color:"#0f0e0d", background:"#faf8f4", outline:"none", boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor="#c8692a"} onBlur={e=>e.target.style.borderColor="#e8e2d8"} />
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:500, color:"#7a7570", marginBottom:6 }}>Post</div>
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Share your knowledge, question, or build..." style={{ width:"100%", minHeight:120, border:"1px solid #e8e2d8", borderRadius:4, padding:"10px 12px", fontFamily:"inherit", fontSize:13, resize:"vertical", color:"#0f0e0d", background:"#faf8f4", outline:"none", boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor="#c8692a"} onBlur={e=>e.target.style.borderColor="#e8e2d8"} />
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:500, color:"#7a7570", marginBottom:6 }}>Image <span style={{ fontWeight:400, color:"#aaa" }}>(optional, max 4MB)</span></div>
          {imagePreview ? (
            <div style={{ position:"relative", display:"inline-block" }}>
              <img src={imagePreview} alt="preview" style={{ maxWidth:"100%", maxHeight:200, borderRadius:4, border:"1px solid #e8e2d8", display:"block" }} />
              <button onClick={removeImage} style={{ position:"absolute", top:6, right:6, background:"rgba(15,14,13,0.7)", color:"white", border:"none", borderRadius:"50%", width:24, height:24, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
            </div>
          ) : (
            <div onClick={()=>fileRef.current?.click()} style={{ border:"2px dashed #e8e2d8", borderRadius:4, padding:"20px", textAlign:"center", cursor:"pointer", transition:"border-color 0.15s" }} onMouseEnter={e=>e.currentTarget.style.borderColor="#c8692a"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e8e2d8"}>
              <div style={{ fontSize:24, marginBottom:6 }}>📎</div>
              <div style={{ fontSize:13, color:"#7a7570" }}>Click to attach an image</div>
              <div style={{ fontSize:11, color:"#aaa", marginTop:4 }}>PNG, JPG, GIF up to 4MB</div>
            </div>
          )}
          {imageError && <div style={{ fontSize:12, color:"#c0392b", marginTop:6 }}>{imageError}</div>}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display:"none" }} />
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #e8e2d8", borderRadius:3, padding:"8px 18px", fontSize:13, cursor:"pointer", color:"#7a7570" }}>Cancel</button>
          <button onClick={submit} disabled={!title.trim()||!body.trim()||loading} style={{ background:title.trim()&&body.trim()?"#c8692a":"#e8e2d8", color:title.trim()&&body.trim()?"white":"#aaa", border:"none", borderRadius:3, padding:"8px 20px", fontSize:13, fontWeight:500, cursor:title.trim()&&body.trim()?"pointer":"default" }}>{loading?"Posting...":"Post"}</button>
        </div>
      </div>
    </div>
  );
}

export function App({ currentUser, setCurrentUser, showAuth, setShowAuth, copiedId, handleShare, showDropdown, setShowDropdown }) {
  const [posts, setPosts] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [sort, setSort] = useState("hot");
  const [showNew, setShowNew] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarSeedInput, setAvatarSeedInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase.from("posts").select("*, users(avatar_seed)").order("created_at", { ascending: false });
    const { data: cc } = await supabase.from("comments").select("post_id");
    const countMap = {};
    (cc||[]).forEach(c => { countMap[c.post_id] = (countMap[c.post_id]||0)+1; });
    setPosts((data||[]).map(p => ({ ...p, comment_count: countMap[p.id]||0, userVote: 0, author_avatar_seed: p.users?.avatar_seed })));
    setLoaded(true);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleVote = async (postId, dir) => {
    if (!currentUser) { setShowAuth(true); return; }
    const post = posts.find(p => p.id === postId);
    const prev = post?.userVote || 0;
    const next = prev === dir ? 0 : dir;
    const delta = next - prev;
    setPosts(ps => ps.map(p => p.id!==postId ? p : { ...p, votes: p.votes+delta, userVote: next }));
    await supabase.from("posts").update({ votes: post.votes+delta }).eq("id", postId);
    if (next===0) await supabase.from("votes").delete().eq("post_id", postId).eq("user_id", currentUser.id);
    else if (prev===0) await supabase.from("votes").insert({ post_id: postId, user_id: currentUser.id, direction: next });
    else await supabase.from("votes").update({ direction: next }).eq("post_id", postId).eq("user_id", currentUser.id);
  };

  const handleDeletePost = async (e, postId, imageUrl) => {
    e.stopPropagation();
    if (!currentUser?.is_admin) return;
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    if (imageUrl) {
      const fileName = imageUrl.split("/").pop();
      await supabase.storage.from("post-images").remove([fileName]);
    }
    await supabase.from("votes").delete().eq("post_id", postId);
    await supabase.from("comments").delete().eq("post_id", postId);
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(ps => ps.filter(p => p.id !== postId));
  };

  const handleNewPost = async (data) => {
    if (!currentUser) return;
    const { data: np } = await supabase.from("posts").insert({ author_id: currentUser.id, author_username: currentUser.username, channel: data.channel, title: data.title, body: data.body, votes: 1, image_url: data.image_url || null }).select().single();
    if (np) setPosts(ps => [{ ...np, comment_count: 0, userVote: 1, author_avatar_seed: currentUser.avatar_seed }, ...ps]);
  };

  const filtered = posts.filter(p => !activeChannel || p.channel === activeChannel);
  const sorted = [...filtered].sort((a,b) => {
    if (sort==="hot") return (b.votes+(b.comment_count||0)*2)-(a.votes+(a.comment_count||0)*2);
    if (sort==="new") return new Date(b.created_at)-new Date(a.created_at);
    return b.votes-a.votes;
  });

  if (!loaded) return <div style={{ padding:60, textAlign:"center", fontFamily:"Georgia,serif", color:"#7a7570" }}>Loading Claude AI Community...</div>;

  return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", background:"#faf8f4", minHeight:"100vh" }}>
      <NavBar currentUser={currentUser} onAuth={()=>setShowAuth(true)} onNewPost={()=>setShowNew(true)} onHome={()=>{ setActiveChannel(null); navigate("/"); }} onSignOut={async()=>{ await supabase.auth.signOut(); setCurrentUser(null); }} showDropdown={showDropdown} setShowDropdown={setShowDropdown} setShowAvatarPicker={setShowAvatarPicker} setAvatarSeedInput={setAvatarSeedInput} />
      <div style={{ maxWidth:900, margin:"0 auto", padding:"20px 16px", display:"grid", gridTemplateColumns:"200px 1fr", gap:20 }}>
        <Sidebar onCreatePost={()=>currentUser?setShowNew(true):setShowAuth(true)} onChannelClick={setActiveChannel} activeChannel={activeChannel} />
        <div>
          <div style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, padding:"8px 14px", marginBottom:10, display:"flex", gap:4, alignItems:"center" }}>
            {["hot","new","top"].map(sv=>(
              <button key={sv} onClick={()=>setSort(sv)} style={{ background:sort===sv?"#f5f0e8":"none", border:"none", borderRadius:4, padding:"5px 12px", fontSize:13, fontWeight:500, cursor:"pointer", color:sort===sv?"#c8692a":"#7a7570" }}>{sv==="hot"?"🔥 Hot":sv==="new"?"✨ New":"⬆ Top"}</button>
            ))}
            <span style={{ marginLeft:"auto", fontSize:12, color:"#aaa" }}>{sorted.length} post{sorted.length!==1?"s":""}</span>
          </div>

          {activeChannel && (
            <div style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, padding:"16px 18px", marginBottom:12 }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{CHANNELS.find(c=>c.id===activeChannel)?.icon} <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:16 }}>{CHANNELS.find(c=>c.id===activeChannel)?.label}</span></div>
              <div style={{ fontSize:12, color:"#7a7570" }}>{CHANNELS.find(c=>c.id===activeChannel)?.desc}</div>
            </div>
          )}

          {sorted.map(p=>(
            <div key={p.id} onClick={()=>navigate(`/post/${p.id}`)} style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, padding:"14px 16px", display:"flex", gap:12, cursor:"pointer", marginBottom:8, transition:"all 0.15s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor="#c8692a";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.06)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e2d8";e.currentTarget.style.boxShadow="none";}}>
              <div onClick={e=>e.stopPropagation()}>
                <VoteBtn count={p.votes} voted={p.userVote} onUp={()=>handleVote(p.id,1)} onDown={()=>handleVote(p.id,-1)} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                  {!activeChannel && <span style={{ fontSize:11, fontWeight:500, background:"#f5f0e8", border:"1px solid #e8e2d8", borderRadius:100, padding:"2px 8px", color:"#7a7570" }}>{CHANNELS.find(c=>c.id===p.channel)?.icon} {CHANNELS.find(c=>c.id===p.channel)?.label}</span>}
                  <Avatar username={p.author_username} seed={p.author_avatar_seed} letter={p.author_username?.[0]} size={28} />
                  <span style={{ fontSize:12, color:"#7a7570" }}>u/{p.author_username}</span>
                  <span style={{ fontSize:12, color:"#aaa" }}>· {timeAgo(p.created_at)}</span>
                </div>
                <div style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:700, color:"#0f0e0d", marginBottom:6, lineHeight:1.3 }}>{p.title}</div>
                <div style={{ fontSize:13, color:"#7a7570", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{p.body}</div>
                {p.image_url && <img src={p.image_url} alt="post" style={{ marginTop:8, maxWidth:"100%", maxHeight:200, borderRadius:4, border:"1px solid #e8e2d8", display:"block", objectFit:"cover" }} onClick={e=>e.stopPropagation()} />}
                <div style={{ marginTop:8, display:"flex", gap:12, alignItems:"center" }} onClick={e=>e.stopPropagation()}>
                  <span style={{ fontSize:12, color:"#aaa" }}>💬 {p.comment_count||0} comment{p.comment_count!==1?"s":""}</span>
                  <button onClick={e=>handleShare(e,p.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:copiedId===p.id?"#1e7a47":"#aaa", padding:0 }}>{copiedId===p.id?"✓ Link copied!":"🔗 Share"}</button>
                  <button onClick={e=>{e.stopPropagation();if(!currentUser){setShowAuth(true);return;}setReportTarget({postId:p.id});}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#aaa", padding:0 }}>🚩 Report</button>
                  {currentUser?.is_admin===true && <button onClick={e=>handleDeletePost(e,p.id,p.image_url)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#c0392b", padding:0 }}>🗑️ Delete</button>}
                </div>
              </div>
            </div>
          ))}

          {sorted.length===0 && (
            <div style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, padding:"40px 20px", textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🏗️</div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:16, fontWeight:700, marginBottom:8 }}>Nothing here yet</div>
              <div style={{ fontSize:13, color:"#7a7570", marginBottom:16 }}>Be the first to post in this channel.</div>
              <button style={{ background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:"8px 20px", fontSize:13, fontWeight:500, cursor:"pointer" }} onClick={()=>currentUser?setShowNew(true):setShowAuth(true)}>Create Post</button>
            </div>
          )}
        </div>
      </div>

      {showNew && <NewPostModal channels={CHANNELS} currentUser={currentUser} onSubmit={handleNewPost} onClose={()=>setShowNew(false)} />}
      {showAvatarPicker && <AvatarPickerModal currentUser={currentUser} onClose={()=>setShowAvatarPicker(false)} onSave={seed=>setCurrentUser(u=>({...u,avatar_seed:seed}))} />}
      {reportTarget && <ReportModal postId={reportTarget.postId} commentId={reportTarget.commentId} currentUser={currentUser} onClose={()=>setReportTarget(null)} />}
    </div>
  );
}

export function PostPage({ currentUser: propUser, onAuthRequired, copiedId, handleShare }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(propUser);
  const [showDropdown, setShowDropdown] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarSeedInput, setAvatarSeedInput] = useState("");

  useEffect(() => { setCurrentUser(propUser); }, [propUser]);

  useEffect(() => {
    if (!propUser) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          const { data: u } = await supabase.from("users").select("*").eq("id", session.user.id).single();
          if (u) setCurrentUser(u);
        }
      });
    }
  }, [propUser]);

  useEffect(() => {
    supabase.from("posts").select("*, users(avatar_seed)").eq("id", id).single()
      .then(({ data }) => { setPost(data ? { ...data, userVote: 0, author_avatar_seed: data.users?.avatar_seed } : null); setLoading(false); });
    supabase.from("comments").select("*, users(avatar_seed)").eq("post_id", id).order("created_at", { ascending: true })
      .then(({ data }) => setComments((data||[]).map(c => ({ ...c, author_avatar_seed: c.users?.avatar_seed }))));
  }, [id]);

  const submitComment = async () => {
    if (!currentUser || !commentText.trim()) return;
    setCommentLoading(true);
    const { data: nc } = await supabase.from("comments").insert({ post_id: id, author_id: currentUser.id, author_username: currentUser.username, body: commentText.trim() }).select().single();
    if (nc) setComments(cs => [...cs, { ...nc, author_avatar_seed: currentUser.avatar_seed }]);
    setCommentText("");
    setCommentLoading(false);
  };

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  if (loading) return <div style={{ padding:60, textAlign:"center", color:"#aaa" }}>Loading...</div>;
  if (!post) return <div style={{ padding:60, textAlign:"center", color:"#aaa" }}>Post not found. <button onClick={()=>navigate("/")} style={{ color:"#c8692a", background:"none", border:"none", cursor:"pointer" }}>Go home</button></div>;

  const ch = CHANNELS.find(c => c.id === post.channel);

  return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", background:"#faf8f4", minHeight:"100vh" }}>
      <div style={{ background:"white", borderBottom:"1px solid #e8e2d8", padding:"0 20px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#0f0e0d", cursor:"pointer", letterSpacing:"-0.02em" }} onClick={()=>navigate("/")}>
          Claude AI<span style={{ color:"#c8692a" }}>Community</span>
          <span style={{ fontSize:12, fontWeight:400, color:"#aaa", marginLeft:6 }}>· AI Automation Community</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {currentUser ? (
            <div style={{ position:"relative" }}>
              <div onClick={()=>setShowDropdown(d=>!d)} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"4px 8px", borderRadius:4, border:"1px solid #e8e2d8", background:"white" }}>
                <Avatar username={currentUser.username} seed={currentUser.avatar_seed} letter={currentUser.avatar_letter||currentUser.username?.[0]} size={28} />
                <span style={{ fontSize:12, color:"#7a7570" }}>{getPrefix(currentUser)}/{currentUser.username}</span>
                <span style={{ fontSize:10, color:"#aaa" }}>▼</span>
              </div>
              {showDropdown && (
                <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, background:"white", border:"1px solid #e8e2d8", borderRadius:6, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", minWidth:180, zIndex:200 }}>
                  <div style={{ padding:"12px 14px", borderBottom:"1px solid #e8e2d8" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#0f0e0d" }}>{getPrefix(currentUser)}/{currentUser.username}</div>
                    <div style={{ fontSize:11, color:currentUser.is_admin?"#c8692a":"#aaa", marginTop:2 }}>{currentUser.is_admin?"⚡ Moderator":"Member"}</div>
                  </div>
                  <div onClick={()=>{setShowAvatarPicker(true);setShowDropdown(false);setAvatarSeedInput(currentUser.avatar_seed||currentUser.username);}} style={{ padding:"10px 14px", fontSize:13, cursor:"pointer", color:"#0f0e0d", display:"flex", alignItems:"center", gap:8 }} onMouseEnter={e=>e.currentTarget.style.background="#faf8f4"} onMouseLeave={e=>e.currentTarget.style.background="white"}>🤖 Change Avatar</div>
                  <div onClick={()=>navigate("/")} style={{ padding:"10px 14px", fontSize:13, cursor:"pointer", color:"#0f0e0d", display:"flex", alignItems:"center", gap:8 }} onMouseEnter={e=>e.currentTarget.style.background="#faf8f4"} onMouseLeave={e=>e.currentTarget.style.background="white"}>🏠 All Posts</div>
                  <div onClick={signOut} style={{ padding:"10px 14px", fontSize:13, cursor:"pointer", color:"#c0392b", display:"flex", alignItems:"center", gap:8, borderTop:"1px solid #e8e2d8" }} onMouseEnter={e=>e.currentTarget.style.background="#fdf0f0"} onMouseLeave={e=>e.currentTarget.style.background="white"}>🚪 Sign Out</div>
                </div>
              )}
            </div>
          ) : (
            <>
              <button onClick={onAuthRequired} style={{ background:"none", border:"1px solid #e8e2d8", borderRadius:3, padding:"6px 14px", fontSize:13, cursor:"pointer", color:"#7a7570" }}>Sign In</button>
              <button onClick={onAuthRequired} style={{ background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:"7px 16px", fontSize:13, fontWeight:500, cursor:"pointer" }}>Join Free</button>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"20px 16px", display:"grid", gridTemplateColumns:"200px 1fr", gap:20 }}>
        <Sidebar onCreatePost={()=>currentUser?null:onAuthRequired()} onChannelClick={()=>navigate("/")} activeChannel={null} />

        <div>
          <button onClick={()=>navigate("/")} style={{ background:"none", border:"none", cursor:"pointer", color:"#c8692a", fontSize:13, fontWeight:500, padding:"0 0 16px", display:"flex", alignItems:"center", gap:4 }}>← Back to community</button>

          <div style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, padding:"20px 20px 16px", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, background:"#f5f0e8", border:"1px solid #e8e2d8", borderRadius:100, padding:"2px 8px", color:"#7a7570" }}>{ch?.icon} {ch?.label}</span>
              <Avatar username={post.author_username} seed={post.author_avatar_seed} letter={post.author_username?.[0]} size={22} />
              <span style={{ fontSize:12, color:"#7a7570" }}>u/{post.author_username}</span>
              <span style={{ fontSize:12, color:"#aaa" }}>· {timeAgo(post.created_at)}</span>
              <button onClick={e=>handleShare(e,post.id)} style={{ marginLeft:"auto", background:"none", border:"1px solid #e8e2d8", borderRadius:3, padding:"4px 10px", fontSize:12, cursor:"pointer", color:copiedId===post.id?"#1e7a47":"#7a7570" }}>{copiedId===post.id?"✓ Copied!":"🔗 Share"}</button>
              {currentUser?.is_admin===true && (
                <button onClick={async(e)=>{ e.stopPropagation(); if(!window.confirm("Delete this post?")) return; if(post.image_url){const fn=post.image_url.split("/").pop();await supabase.storage.from("post-images").remove([fn]);} await supabase.from("votes").delete().eq("post_id",post.id); await supabase.from("comments").delete().eq("post_id",post.id); await supabase.from("posts").delete().eq("id",post.id); navigate("/"); }} style={{ background:"none", border:"1px solid #c0392b", borderRadius:3, padding:"4px 10px", fontSize:12, cursor:"pointer", color:"#c0392b" }}>🗑️ Delete post</button>
              )}
            </div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:"#0f0e0d", marginBottom:14, lineHeight:1.3 }}>{post.title}</div>
            <div style={{ fontSize:15, color:"#3a3835", lineHeight:1.8 }}>{post.body}</div>
            {post.image_url && <img src={post.image_url} alt="post" style={{ marginTop:16, maxWidth:"100%", borderRadius:6, border:"1px solid #e8e2d8", display:"block" }} />}
            <div style={{ marginTop:12, display:"flex", gap:12 }}>
              {!currentUser?.is_admin && <button onClick={()=>{if(!currentUser){onAuthRequired();return;}setReportTarget({postId:post.id});}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#aaa", padding:0 }}>🚩 Report post</button>}
            </div>
          </div>

          <div style={{ fontSize:13, fontWeight:600, color:"#0f0e0d", marginBottom:10 }}>{comments.length} Comment{comments.length!==1?"s":""}</div>

          {currentUser ? (
            <div style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, padding:14, marginBottom:16 }}>
              <div style={{ fontSize:12, color:"#aaa", marginBottom:8 }}>Commenting as {getPrefix(currentUser)}/{currentUser.username}</div>
              <textarea value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="What are your thoughts?" style={{ width:"100%", minHeight:80, border:"1px solid #e8e2d8", borderRadius:4, padding:"10px 12px", fontFamily:"inherit", fontSize:13, resize:"vertical", color:"#0f0e0d", background:"#faf8f4", outline:"none", boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor="#c8692a"} onBlur={e=>e.target.style.borderColor="#e8e2d8"} />
              <div style={{ marginTop:8, display:"flex", justifyContent:"flex-end" }}>
                <button onClick={submitComment} disabled={!commentText.trim()||commentLoading} style={{ background:commentText.trim()?"#c8692a":"#e8e2d8", color:commentText.trim()?"white":"#aaa", border:"none", borderRadius:3, padding:"7px 18px", fontSize:13, fontWeight:500, cursor:commentText.trim()?"pointer":"default" }}>{commentLoading?"Posting...":"Post Comment"}</button>
              </div>
            </div>
          ) : (
            <div style={{ background:"#fdf0e8", border:"1px solid #f0d5b8", borderRadius:6, padding:"14px 16px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:13, color:"#7a7570" }}>Sign in to join the conversation</span>
              <button onClick={onAuthRequired} style={{ background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:"6px 14px", fontSize:12, fontWeight:500, cursor:"pointer" }}>Sign In</button>
            </div>
          )}

          {comments.map(c=>(
            <div key={c.id} style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, padding:"12px 14px", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <Avatar username={c.author_username} seed={c.author_avatar_seed} letter={c.author_username?.[0]} size={24} />
                <span style={{ fontSize:12, fontWeight:500, color:"#0f0e0d" }}>u/{c.author_username}</span>
                <span style={{ fontSize:12, color:"#aaa" }}>· {timeAgo(c.created_at)}</span>
              </div>
              <div style={{ fontSize:13, color:"#3a3835", lineHeight:1.65, paddingLeft:32 }}>{c.body}</div>
              <div style={{ paddingLeft:32, marginTop:6, display:"flex", gap:12 }}>
                {!currentUser?.is_admin && currentUser && <button onClick={()=>setReportTarget({commentId:c.id})} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#aaa", padding:0 }}>🚩 Report</button>}
                {currentUser?.is_admin===true && <button onClick={async()=>{ if(!window.confirm("Delete this comment?")) return; await supabase.from("comments").delete().eq("id",c.id); setComments(cs=>cs.filter(x=>x.id!==c.id)); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#c0392b", padding:0 }}>🗑️ Delete comment</button>}
              </div>
            </div>
          ))}
          {comments.length===0 && <div style={{ textAlign:"center", padding:"30px 0", color:"#aaa", fontSize:13 }}>No comments yet. Be the first.</div>}
        </div>
      </div>

      {showAvatarPicker && <AvatarPickerModal currentUser={currentUser} onClose={()=>setShowAvatarPicker(false)} onSave={seed=>setCurrentUser(u=>({...u,avatar_seed:seed}))} />}
      {reportTarget && <ReportModal postId={reportTarget.postId} commentId={reportTarget.commentId} currentUser={currentUser} onClose={()=>setReportTarget(null)} />}
    </div>
  );
}

export default function Root() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: u } = await supabase.from("users").select("*").eq("id", session.user.id).single();
        if (u) setCurrentUser(u);
      }
    });
  }, []);

  const handleShare = (e, postId) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<App currentUser={currentUser} setCurrentUser={setCurrentUser} showAuth={showAuth} setShowAuth={setShowAuth} copiedId={copiedId} handleShare={handleShare} showDropdown={showDropdown} setShowDropdown={setShowDropdown} />} />
        <Route path="/post/:id" element={<PostPage currentUser={currentUser} onAuthRequired={()=>setShowAuth(true)} copiedId={copiedId} handleShare={handleShare} />} />
      </Routes>
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onLogin={user=>{ setCurrentUser(user); setShowAuth(false); }} />}
    </>
  );
}
