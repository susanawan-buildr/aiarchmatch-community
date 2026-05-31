import { useState, useEffect, useCallback } from "react";
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

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return Math.floor(d/60)+"m ago";
  if (d < 86400) return Math.floor(d/3600)+"h ago";
  return Math.floor(d/86400)+"d ago";
}

const s = {
  wrap: { fontFamily:"'Segoe UI',sans-serif", background:"#faf8f4", minHeight:"100vh" },
  nav: { background:"white", borderBottom:"1px solid #e8e2d8", padding:"0 20px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 },
  logo: { fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#0f0e0d", cursor:"pointer", letterSpacing:"-0.02em" },
  layout: { maxWidth:900, margin:"0 auto", padding:"20px 16px", display:"grid", gridTemplateColumns:"200px 1fr", gap:20 },
  sideBox: { background:"white", border:"1px solid #e8e2d8", borderRadius:6, overflow:"hidden", marginBottom:16 },
  sideHead: { padding:"10px 14px", borderBottom:"1px solid #e8e2d8", fontSize:10, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#aaa" },
  card: { background:"white", border:"1px solid #e8e2d8", borderRadius:6 },
  btn: { background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:"7px 16px", fontSize:13, fontWeight:500, cursor:"pointer" },
  btnOut: { background:"none", border:"1px solid #e8e2d8", borderRadius:3, padding:"6px 14px", fontSize:13, cursor:"pointer", color:"#7a7570" },
};

function Avatar({ letter, size=32 }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", background:ac(letter), color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:size*0.4, flexShrink:0, fontFamily:"Georgia,serif" }}>{letter?.toUpperCase()}</div>;
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
        const { data, error: e } = await supabase.auth.signUp({ email, password });
        if (e) { setError(e.message); setLoading(false); return; }
        await supabase.from("users").insert({ id: data.user.id, email, username: username.trim(), avatar_letter: username.trim()[0].toUpperCase() });
        onLogin({ id: data.user.id, username: username.trim(), avatar_letter: username.trim()[0].toUpperCase() });
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
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="Choose a username"
              style={{ ...inp, marginBottom:4 }}
            />
            <div style={{ fontSize:11, color:"#aaa", paddingLeft:2 }}>
              Lowercase letters, numbers and underscores only. No capitals or spaces.
            </div>
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

function NewPostModal({ channels, currentUser, onSubmit, onClose }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState(channels[0].id);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    await onSubmit({ title: title.trim(), body: body.trim(), channel });
    setLoading(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,14,13,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:"white", borderRadius:8, padding:28, width:"100%", maxWidth:580, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }} onClick={e=>e.stopPropagation()}>
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
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:500, color:"#7a7570", marginBottom:6 }}>Post</div>
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Share your knowledge, question, or build..." style={{ width:"100%", minHeight:120, border:"1px solid #e8e2d8", borderRadius:4, padding:"10px 12px", fontFamily:"inherit", fontSize:13, resize:"vertical", color:"#0f0e0d", background:"#faf8f4", outline:"none", boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor="#c8692a"} onBlur={e=>e.target.style.borderColor="#e8e2d8"} />
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #e8e2d8", borderRadius:3, padding:"8px 18px", fontSize:13, cursor:"pointer", color:"#7a7570" }}>Cancel</button>
          <button onClick={submit} disabled={!title.trim()||!body.trim()||loading} style={{ background:title.trim()&&body.trim()?"#c8692a":"#e8e2d8", color:title.trim()&&body.trim()?"white":"#aaa", border:"none", borderRadius:3, padding:"8px 20px", fontSize:13, fontWeight:500, cursor:title.trim()&&body.trim()?"pointer":"default" }}>{loading?"Posting...":"Post"}</button>
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [posts, setPosts] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activePost, setActivePost] = useState(null);
  const [sort, setSort] = useState("hot");
  const [showNew, setShowNew] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleShare = (e, postId) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    const { data: cc } = await supabase.from("comments").select("post_id");
    const countMap = {};
    (cc||[]).forEach(c => { countMap[c.post_id] = (countMap[c.post_id]||0)+1; });
    setPosts((data||[]).map(p => ({ ...p, comment_count: countMap[p.id]||0, userVote: 0 })));
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchPosts();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: u } = await supabase.from("users").select("*").eq("id", session.user.id).single();
        if (u) setCurrentUser(u);
      }
    });
  }, [fetchPosts]);

  useEffect(() => {
    if (!activePost) return;
    supabase.from("comments").select("*").eq("post_id", activePost.id).order("created_at", { ascending: true })
      .then(({ data }) => setComments(data||[]));
  }, [activePost]);

  const navigate = useNavigate();

  const handleVote = async (postId, dir) => {
    if (!currentUser) { setShowAuth(true); return; }
    const post = posts.find(p => p.id === postId);
    const prev = post?.userVote || 0;
    const next = prev === dir ? 0 : dir;
    const delta = next - prev;
    setPosts(ps => ps.map(p => p.id!==postId ? p : { ...p, votes: p.votes+delta, userVote: next }));
    if (activePost?.id === postId) setActivePost(p => ({ ...p, votes: p.votes+delta, userVote: next }));
    await supabase.from("posts").update({ votes: post.votes+delta }).eq("id", postId);
    if (next===0) await supabase.from("votes").delete().eq("post_id", postId).eq("user_id", currentUser.id);
    else if (prev===0) await supabase.from("votes").insert({ post_id: postId, user_id: currentUser.id, direction: next });
    else await supabase.from("votes").update({ direction: next }).eq("post_id", postId).eq("user_id", currentUser.id);
  };

  const handleNewPost = async (data) => {
    if (!currentUser) return;
    const { data: np } = await supabase.from("posts").insert({ author_id: currentUser.id, author_username: currentUser.username, channel: data.channel, title: data.title, body: data.body, votes: 1 }).select().single();
    if (np) setPosts(ps => [{ ...np, comment_count: 0, userVote: 1 }, ...ps]);
  };

  const handleDeletePost = async (e, postId) => {
    e.stopPropagation();
    if (!currentUser?.is_admin) return;
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    await supabase.from("votes").delete().eq("post_id", postId);
    await supabase.from("comments").delete().eq("post_id", postId);
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(ps => ps.filter(p => p.id !== postId));
    if (activePost?.id === postId) setActivePost(null);
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser?.is_admin) return;
    if (!window.confirm("Delete this comment?")) return;
    await supabase.from("comments").delete().eq("id", commentId);
    setComments(cs => cs.filter(c => c.id !== commentId));
  };

  const handleComment = async () => {
    if (!currentUser || !commentText.trim() || !activePost) return;
    setCommentLoading(true);
    const { data: nc } = await supabase.from("comments").insert({ post_id: activePost.id, author_id: currentUser.id, author_username: currentUser.username, body: commentText.trim() }).select().single();
    if (nc) setComments(cs => [...cs, nc]);
    setCommentText("");
    setCommentLoading(false);
  };

  const filtered = posts.filter(p => !activeChannel || p.channel === activeChannel);
  const sorted = [...filtered].sort((a,b) => {
    if (sort==="hot") return (b.votes+(b.comment_count||0)*2)-(a.votes+(a.comment_count||0)*2);
    if (sort==="new") return new Date(b.created_at)-new Date(a.created_at);
    return b.votes-a.votes;
  });

  if (!loaded) return <div style={{ padding:60, textAlign:"center", fontFamily:"Georgia,serif", color:"#7a7570" }}>Loading Claude AI Community...</div>;

  return (
    <div style={s.wrap}>
      <div style={s.nav}>
        <div style={s.logo} onClick={()=>{setActiveChannel(null);setActivePost(null);}}>
          Claude AI<span style={{ color:"#c8692a" }}>Community</span>
          
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {currentUser ? <>
            <Avatar letter={currentUser.avatar_letter||currentUser.username[0]} size={28} />
            <span style={{ fontSize:12, color:"#7a7570" }}>u/{currentUser.username}</span>
            <button style={s.btn} onClick={()=>setShowNew(true)}>+ Post</button>
            <button style={s.btnOut} onClick={async()=>{await supabase.auth.signOut();setCurrentUser(null);}}>Sign Out</button>
          </> : <>
            <button style={s.btnOut} onClick={()=>setShowAuth(true)}>Sign In</button>
            <button style={s.btn} onClick={()=>setShowAuth(true)}>Join Free</button>
          </>}
        </div>
      </div>

      <div style={s.layout}>
        <div>
          <div style={s.sideBox}>
            <div style={s.sideHead}>Channels</div>
            {[{id:null,label:"All Posts",icon:"🌐"},...CHANNELS].map(ch=>(
              <div key={ch.id??"all"} onClick={()=>{setActiveChannel(ch.id);setActivePost(null);}} style={{ padding:"9px 14px", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:8, background:activeChannel===ch.id?"#fdf0e8":"white", color:activeChannel===ch.id?"#c8692a":"#3a3835", fontWeight:activeChannel===ch.id?500:400, borderLeft:activeChannel===ch.id?"2px solid #c8692a":"2px solid transparent", transition:"all 0.15s" }} onMouseEnter={e=>{if(activeChannel!==ch.id)e.currentTarget.style.background="#faf8f4";}} onMouseLeave={e=>{if(activeChannel!==ch.id)e.currentTarget.style.background="white";}}>
                <span>{ch.icon}</span><span>{ch.label}</span>
              </div>
            ))}
          </div>
          <div style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, padding:14 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#0f0e0d", marginBottom:8, fontFamily:"Georgia,serif" }}>About</div>
            <div style={{ fontSize:12, color:"#7a7570", lineHeight:1.6, marginBottom:12 }}>The home for AI automation builders. Share what you build, learn from others, find work. Free to join.</div>
            <div style={{ fontSize:12, color:"#aaa", display:"flex", flexDirection:"column", gap:4, marginBottom:14 }}>
              <div>🤖 All AI tools welcome</div>
              <div>🔒 No real names needed</div>
              <div>🌍 Global community</div>
            </div>
            <button style={{ display:"block", width:"100%", background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:8, fontSize:12, fontWeight:500, cursor:"pointer" }} onClick={()=>currentUser?setShowNew(true):setShowAuth(true)}>Create Post</button>
          </div>
        </div>

        <div>
          {activePost ? (
            <div>
              <button onClick={()=>navigate(-1)} style={{ background:"none", border:"none", cursor:"pointer", color:"#c8692a", fontSize:13, fontWeight:500, padding:"0 0 16px", display:"flex", alignItems:"center", gap:4 }}>← Back</button>
              <div style={{ ...s.card, padding:"20px 20px 16px", marginBottom:20 }}>
                <div style={{ display:"flex", gap:14 }}>
                  <VoteBtn count={activePost.votes} voted={activePost.userVote} onUp={()=>handleVote(activePost.id,1)} onDown={()=>handleVote(activePost.id,-1)} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, background:"#f5f0e8", border:"1px solid #e8e2d8", borderRadius:100, padding:"2px 8px", color:"#7a7570" }}>{CHANNELS.find(c=>c.id===activePost.channel)?.icon} {CHANNELS.find(c=>c.id===activePost.channel)?.label}</span>
                      <Avatar letter={activePost.author_username?.[0]} size={22} />
                      <span style={{ fontSize:12, color:"#7a7570" }}>u/{activePost.author_username}</span>
                      <span style={{ fontSize:12, color:"#aaa" }}>· {timeAgo(activePost.created_at)}</span>
                    </div>
                    <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#0f0e0d", marginBottom:12, lineHeight:1.3 }}>{activePost.title}</div>
                    <div style={{ fontSize:14, color:"#3a3835", lineHeight:1.75 }}>{activePost.body}</div>
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}><div style={{ fontSize:13, fontWeight:600, color:"#0f0e0d" }}>{comments.length} Comment{comments.length!==1?"s":""}</div><button onClick={e=>handleShare(e,activePost.id)} style={{ background:"none", border:"1px solid #e8e2d8", borderRadius:3, padding:"5px 12px", fontSize:12, cursor:"pointer", color:copiedId===activePost.id?"#1e7a47":"#7a7570", display:"flex", alignItems:"center", gap:5 }}>{copiedId===activePost.id ? "✓ Copied!" : "🔗 Share post"}</button></div>

              {currentUser ? (
                <div style={{ ...s.card, padding:14, marginBottom:16 }}>
                  <div style={{ fontSize:12, color:"#aaa", marginBottom:8 }}>Commenting as u/{currentUser.username}</div>
                  <textarea value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="What are your thoughts?" style={{ width:"100%", minHeight:80, border:"1px solid #e8e2d8", borderRadius:4, padding:"10px 12px", fontFamily:"inherit", fontSize:13, resize:"vertical", color:"#0f0e0d", background:"#faf8f4", outline:"none", boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor="#c8692a"} onBlur={e=>e.target.style.borderColor="#e8e2d8"} />
                  <div style={{ marginTop:8, display:"flex", justifyContent:"flex-end" }}>
                    <button onClick={handleComment} disabled={!commentText.trim()||commentLoading} style={{ background:commentText.trim()?"#c8692a":"#e8e2d8", color:commentText.trim()?"white":"#aaa", border:"none", borderRadius:3, padding:"7px 18px", fontSize:13, fontWeight:500, cursor:commentText.trim()?"pointer":"default" }}>{commentLoading?"Posting...":"Post Comment"}</button>
                  </div>
                </div>
              ) : (
                <div style={{ background:"#fdf0e8", border:"1px solid #f0d5b8", borderRadius:6, padding:"14px 16px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:13, color:"#7a7570" }}>Sign in to join the conversation</span>
                  <button onClick={()=>setShowAuth(true)} style={{ background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:"6px 14px", fontSize:12, fontWeight:500, cursor:"pointer" }}>Sign In</button>
                </div>
              )}

              {comments.map(c=>(
                <div key={c.id} style={{ ...s.card, padding:"12px 14px", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <Avatar letter={c.author_username?.[0]} size={24} />
                    <span style={{ fontSize:12, fontWeight:500, color:"#0f0e0d" }}>u/{c.author_username}</span>
                    <span style={{ fontSize:12, color:"#aaa" }}>· {timeAgo(c.created_at)}</span>
                  </div>
                  <div style={{ fontSize:13, color:"#3a3835", lineHeight:1.65, paddingLeft:32 }}>{c.body}</div>
                </div>
              ))}
              {comments.length===0 && <div style={{ textAlign:"center", padding:"30px 0", color:"#aaa", fontSize:13 }}>No comments yet. Be the first.</div>}
            </div>
          ) : (
            <>
              {activeChannel && (
                <div style={{ ...s.card, padding:"16px 18px", marginBottom:12 }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{CHANNELS.find(c=>c.id===activeChannel)?.icon} <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:16 }}>{CHANNELS.find(c=>c.id===activeChannel)?.label}</span></div>
                  <div style={{ fontSize:12, color:"#7a7570" }}>{CHANNELS.find(c=>c.id===activeChannel)?.desc}</div>
                </div>
              )}
              <div style={{ ...s.card, padding:"8px 14px", marginBottom:10, display:"flex", gap:4, alignItems:"center" }}>
                {["hot","new","top"].map(sv=>(
                  <button key={sv} onClick={()=>setSort(sv)} style={{ background:sort===sv?"#f5f0e8":"none", border:"none", borderRadius:4, padding:"5px 12px", fontSize:13, fontWeight:500, cursor:"pointer", color:sort===sv?"#c8692a":"#7a7570" }}>{sv==="hot"?"🔥 Hot":sv==="new"?"✨ New":"⬆ Top"}</button>
                ))}
                <span style={{ marginLeft:"auto", fontSize:12, color:"#aaa" }}>{sorted.length} post{sorted.length!==1?"s":""}</span>
              </div>
              {sorted.map(p=>(
                <div key={p.id} onClick={()=>navigate(`/post/${p.id}`)} style={{ ...s.card, padding:"14px 16px", display:"flex", gap:12, cursor:"pointer", marginBottom:8, transition:"all 0.15s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor="#c8692a";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.06)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e2d8";e.currentTarget.style.boxShadow="none";}}>
                  <div onClick={e=>e.stopPropagation()}>
                    <VoteBtn count={p.votes} voted={p.userVote} onUp={()=>handleVote(p.id,1)} onDown={()=>handleVote(p.id,-1)} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                      {!activeChannel && <span style={{ fontSize:11, fontWeight:500, background:"#f5f0e8", border:"1px solid #e8e2d8", borderRadius:100, padding:"2px 8px", color:"#7a7570" }}>{CHANNELS.find(c=>c.id===p.channel)?.icon} {CHANNELS.find(c=>c.id===p.channel)?.label}</span>}
                      <Avatar letter={p.author_username?.[0]} size={20} />
                      <span style={{ fontSize:12, color:"#7a7570" }}>u/{p.author_username}</span>
                      <span style={{ fontSize:12, color:"#aaa" }}>· {timeAgo(p.created_at)}</span>
                    </div>
                    <div style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:700, color:"#0f0e0d", marginBottom:6, lineHeight:1.3 }}>{p.title}</div>
                    <div style={{ fontSize:13, color:"#7a7570", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{p.body}</div>
                    <div style={{ marginTop:8, display:"flex", gap:12, alignItems:"center" }}><span style={{ fontSize:12, color:"#aaa" }}>💬 {p.comment_count||0} comment{p.comment_count!==1?"s":""}</span><button onClick={e=>handleShare(e,p.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:copiedId===p.id?"#1e7a47":"#aaa", display:"flex", alignItems:"center", gap:4, padding:0 }}>{copiedId===p.id ? "✓ Link copied!" : "🔗 Share"}</button>
                      {currentUser?.is_admin === true && <button onClick={e=>handleDeletePost(e,p.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#c0392b", display:"flex", alignItems:"center", gap:4, padding:0, marginLeft:4 }}>🗑️ Delete</button>}
                    </div>
                  </div>
                </div>
              ))}
              {sorted.length===0 && (
                <div style={{ ...s.card, padding:"40px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🏗️</div>
                  <div style={{ fontFamily:"Georgia,serif", fontSize:16, fontWeight:700, marginBottom:8 }}>Nothing here yet</div>
                  <div style={{ fontSize:13, color:"#7a7570", marginBottom:16 }}>Be the first to post in this channel.</div>
                  <button style={s.btn} onClick={()=>currentUser?setShowNew(true):setShowAuth(true)}>Create Post</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showNew && <NewPostModal channels={CHANNELS} currentUser={currentUser} onSubmit={handleNewPost} onClose={()=>setShowNew(false)} />}
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onLogin={user=>{setCurrentUser(user);setShowAuth(false);}} />}
    </div>
  );
}

// ─── ROOT WRAPPER ───
export default function Root() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

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
        <Route path="/" element={<App currentUser={currentUser} setCurrentUser={setCurrentUser} showAuth={showAuth} setShowAuth={setShowAuth} copiedId={copiedId} handleShare={handleShare} />} />
        <Route path="/post/:id" element={<PostPage currentUser={currentUser} onAuthRequired={() => setShowAuth(true)} copiedId={copiedId} handleShare={handleShare} />} />
      </Routes>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={user => { setCurrentUser(user); setShowAuth(false); }} />}
    </>
  );
}

// ─── POST PAGE (direct URL access) ───
export function PostPage({ currentUser: propUser, onAuthRequired, onVote, copiedId, handleShare }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(propUser);

  useEffect(() => {
    setCurrentUser(propUser);
  }, [propUser]);

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
    supabase.from("posts").select("*").eq("id", id).single()
      .then(({ data }) => { setPost(data ? { ...data, userVote: 0 } : null); setLoading(false); });
    supabase.from("comments").select("*").eq("post_id", id).order("created_at", { ascending: true })
      .then(({ data }) => setComments(data || []));
  }, [id]);

  const submitComment = async () => {
    if (!currentUser || !commentText.trim()) return;
    setCommentLoading(true);
    const { data: nc } = await supabase.from("comments").insert({
      post_id: id, author_id: currentUser.id,
      author_username: currentUser.username, body: commentText.trim()
    }).select().single();
    if (nc) setComments(cs => [...cs, nc]);
    setCommentText("");
    setCommentLoading(false);
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#aaa" }}>Loading...</div>;
  if (!post) return <div style={{ padding: 60, textAlign: "center", color: "#aaa" }}>Post not found. <button onClick={() => navigate("/")} style={{ color: "#c8692a", background: "none", border: "none", cursor: "pointer" }}>Go home</button></div>;

  const ch = CHANNELS.find(c => c.id === post.channel);

  return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", background:"#faf8f4", minHeight:"100vh" }}>
      <div style={{ background:"white", borderBottom:"1px solid #e8e2d8", padding:"0 20px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#0f0e0d", cursor:"pointer", letterSpacing:"-0.02em" }} onClick={()=>navigate("/")}>
          Claude AI<span style={{ color:"#c8692a" }}>Community</span>
          <span style={{ fontSize:12, fontWeight:400, color:"#aaa", marginLeft:6 }}>· AI Automation Community</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {currentUser ? <>
            <Avatar letter={currentUser.avatar_letter||currentUser.username?.[0]} size={28} />
            <span style={{ fontSize:12, color:"#7a7570" }}>u/{currentUser.username}</span>
          </> : <>
            <button onClick={onAuthRequired} style={{ background:"none", border:"1px solid #e8e2d8", borderRadius:3, padding:"6px 14px", fontSize:13, cursor:"pointer", color:"#7a7570" }}>Sign In</button>
            <button onClick={onAuthRequired} style={{ background:"#c8692a", color:"white", border:"none", borderRadius:3, padding:"7px 16px", fontSize:13, fontWeight:500, cursor:"pointer" }}>Join Free</button>
          </>}
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"20px 16px", display:"grid", gridTemplateColumns:"200px 1fr", gap:20 }}>
        <div>
          <div style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, overflow:"hidden", marginBottom:16 }}>
            <div style={{ padding:"10px 14px", borderBottom:"1px solid #e8e2d8", fontSize:10, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#aaa" }}>Channels</div>
            {[{id:null,label:"All Posts",icon:"🌐"},...CHANNELS].map(ch=>(
              <div key={ch.id??"all"} onClick={()=>navigate("/")} style={{ padding:"9px 14px", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:8, color:"#3a3835", borderLeft:"2px solid transparent", transition:"all 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#faf8f4"}
                onMouseLeave={e=>e.currentTarget.style.background="white"}>
                <span>{ch.icon}</span><span>{ch.label}</span>
              </div>
            ))}
          </div>
          <div style={{ background:"white", border:"1px solid #e8e2d8", borderRadius:6, padding:14 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#0f0e0d", marginBottom:8, fontFamily:"Georgia,serif" }}>About</div>
            <div style={{ fontSize:12, color:"#7a7570", lineHeight:1.6, marginBottom:12 }}>The home for AI automation builders. Share what you build, learn from others, find work.</div>
            <div style={{ fontSize:12, color:"#aaa", display:"flex", flexDirection:"column", gap:4 }}>
              <div>🤖 All AI tools welcome</div>
              <div>🔒 No real names needed</div>
              <div>🌍 Global community</div>
            </div>
          </div>
        </div>

        <div>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "#c8692a", fontSize: 13, fontWeight: 500, padding: "0 0 16px", display: "flex", alignItems: "center", gap: 4 }}>← Back to community</button>

          <div style={{ background: "white", border: "1px solid #e8e2d8", borderRadius: 6, padding: "20px 20px 16px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, background: "#f5f0e8", border: "1px solid #e8e2d8", borderRadius: 100, padding: "2px 8px", color: "#7a7570" }}>{ch?.icon} {ch?.label}</span>
              <Avatar letter={post.author_username?.[0]} size={22} />
              <span style={{ fontSize: 12, color: "#7a7570" }}>u/{post.author_username}</span>
              <span style={{ fontSize: 12, color: "#aaa" }}>· {timeAgo(post.created_at)}</span>
              <button onClick={e => handleShare(e, post.id)} style={{ marginLeft: "auto", background: "none", border: "1px solid #e8e2d8", borderRadius: 3, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: copiedId === post.id ? "#1e7a47" : "#7a7570" }}>
                {copiedId === post.id ? "✓ Copied!" : "🔗 Share"}
              </button>
        </div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: "#0f0e0d", marginBottom: 14, lineHeight: 1.3 }}>{post.title}</div>
        <div style={{ fontSize: 15, color: "#3a3835", lineHeight: 1.8 }}>{post.body}</div>
      </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f0e0d", marginBottom: 10 }}>{comments.length} Comment{comments.length !== 1 ? "s" : ""}</div>

          {currentUser ? (
            <div style={{ background: "white", border: "1px solid #e8e2d8", borderRadius: 6, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>Commenting as u/{currentUser.username}</div>
              <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="What are your thoughts?" style={{ width: "100%", minHeight: 80, border: "1px solid #e8e2d8", borderRadius: 4, padding: "10px 12px", fontFamily: "inherit", fontSize: 13, resize: "vertical", color: "#0f0e0d", background: "#faf8f4", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#c8692a"} onBlur={e => e.target.style.borderColor = "#e8e2d8"} />
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={submitComment} disabled={!commentText.trim() || commentLoading} style={{ background: commentText.trim() ? "#c8692a" : "#e8e2d8", color: commentText.trim() ? "white" : "#aaa", border: "none", borderRadius: 3, padding: "7px 18px", fontSize: 13, fontWeight: 500, cursor: commentText.trim() ? "pointer" : "default" }}>{commentLoading ? "Posting..." : "Post Comment"}</button>
              </div>
            </div>
          ) : (
            <div style={{ background: "#fdf0e8", border: "1px solid #f0d5b8", borderRadius: 6, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#7a7570" }}>Sign in to join the conversation</span>
              <button onClick={onAuthRequired} style={{ background: "#c8692a", color: "white", border: "none", borderRadius: 3, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Sign In</button>
            </div>
          )}

          {comments.map(c => (
            <div key={c.id} style={{ background: "white", border: "1px solid #e8e2d8", borderRadius: 6, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Avatar letter={c.author_username?.[0]} size={24} />
                <span style={{ fontSize: 12, fontWeight: 500, color: "#0f0e0d" }}>u/{c.author_username}</span>
                <span style={{ fontSize: 12, color: "#aaa" }}>· {timeAgo(c.created_at)}</span>
              </div>
              <div style={{ fontSize: 13, color: "#3a3835", lineHeight: 1.65, paddingLeft: 32 }}>{c.body}</div>
        </div>
      ))}
          {comments.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: "#aaa", fontSize: 13 }}>No comments yet. Be the first.</div>}
        </div>
      </div>
    </div>
  );
}
