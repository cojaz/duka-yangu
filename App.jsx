import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

// ─── PALETTE ────────────────────────────────────────────────────────────────
// Warm clay earth + deep indigo night + harvest gold — coastal Kenya vernacular
// Risk: the "ledger green" single accent is replaced by a dual-temperature system:
// gold for money flowing IN, terracotta for money flowing OUT. Every number is colour-coded.
const C = {
  bg:       "#11100F",
  surface:  "#1A1815",
  card:     "#211F1C",
  border:   "#312E29",
  gold:     "#D4A843",
  goldDim:  "#6B5220",
  clay:     "#C0614A",
  clayDim:  "#5C2A1F",
  sage:     "#7AB87A",
  sageDim:  "#2E4F2E",
  sky:      "#5B8FA8",
  text:     "#EDE8DF",
  muted:    "#8A8278",
  faint:    "#3A3730",
};

// ─── FULL PRODUCT CATALOGUE ──────────────────────────────────────────────────
// Columns: id, name, category, qty, sellPrice, buyPrice (estimated wholesale Kenya 2024)
// buyPrice researched against Nairobi/Mombasa wholesale rates
const INITIAL_STOCK = [
  // BEVERAGES
  { id:"w500",  name:"Water 500ml",       cat:"Beverages",   qty:13,  sell:25,  buy:18  },
  { id:"w1500", name:"Water 1.5L",        cat:"Beverages",   qty:8,   sell:60,  buy:42  },
  { id:"tuzo800",name:"Tuzo Milk 800ml",  cat:"Beverages",   qty:17,  sell:35,  buy:28  },
  { id:"tuzo300",name:"Tuzo Milk 300ml",  cat:"Beverages",   qty:12,  sell:70,  buy:55  },
  { id:"juice", name:"Juice (small)",     cat:"Beverages",   qty:17,  sell:20,  buy:14  },
  { id:"ngano", name:"Ngano (drink)",     cat:"Beverages",   qty:12,  sell:85,  buy:65  },
  { id:"csoda", name:"Club Soda",         cat:"Beverages",   qty:27,  sell:45,  buy:32  },
  // FOOD & STAPLES
  { id:"sugar", name:"Sugar 1kg",         cat:"Staples",     qty:20,  sell:160, buy:130 },
  { id:"rice",  name:"Rice 1kg",          cat:"Staples",     qty:30,  sell:120, buy:90  },
  { id:"beans", name:"Beans 1kg",         cat:"Staples",     qty:8,   sell:120, buy:90  },
  { id:"maize", name:"Maize 1kg",         cat:"Staples",     qty:80,  sell:60,  buy:45  },
  { id:"sima",  name:"Sima Flour 1kg",    cat:"Staples",     qty:24,  sell:80,  buy:60  },
  { id:"salt1", name:"Salt (large)",      cat:"Staples",     qty:36,  sell:25,  buy:18  },
  { id:"salt2", name:"Salt (small)",      cat:"Staples",     qty:24,  sell:15,  buy:10  },
  { id:"tleaf", name:"Tea Leaves",        cat:"Staples",     qty:40,  sell:30,  buy:22  },
  { id:"pasta", name:"Pasta",             cat:"Staples",     qty:10,  sell:80,  buy:60  },
  { id:"spices",name:"Spices (sachets)",  cat:"Staples",     qty:40,  sell:10,  buy:6   },
  { id:"royco", name:"RoyCo Cubes",       cat:"Staples",     qty:50,  sell:5,   buy:3   },
  { id:"samli", name:"Samli Ghee 1kg",    cat:"Staples",     qty:4,   sell:320, buy:270 },
  { id:"oil4l", name:"Cooking Oil 4L",    cat:"Staples",     qty:4,   sell:300, buy:250 },
  { id:"doffi", name:"Doffi Soap 1kg",    cat:"Soap/Clean",  qty:7,   sell:200, buy:155 },
  { id:"omo",   name:"Omo (sachet)",      cat:"Soap/Clean",  qty:30,  sell:30,  buy:20  },
  { id:"msafi1",name:"Msafi Powder S",    cat:"Soap/Clean",  qty:5,   sell:130, buy:100 },
  { id:"msafi2",name:"Msafi Powder L",    cat:"Soap/Clean",  qty:25,  sell:50,  buy:38  },
  { id:"ksmbas",name:"Kamba Rope S",      cat:"Household",   qty:5,   sell:150, buy:110 },
  { id:"ksmbal",name:"Kamba Rope L",      cat:"Household",   qty:3,   sell:250, buy:190 },
  { id:"saung", name:"Saung (sachet)",    cat:"Household",   qty:7,   sell:20,  buy:13  },
  { id:"clothe",name:"Leso/Clothe",       cat:"Household",   qty:10,  sell:700, buy:500 },
  // HEALTH & BODY
  { id:"dawa",  name:"Dawa (tablets)",    cat:"Health",      qty:500, sell:5,   buy:3   },
  { id:"nazi",  name:"Nazi Coconut Oil",  cat:"Health",      qty:40,  sell:50,  buy:35  },
  { id:"bodyc", name:"Body Care",         cat:"Health",      qty:8,   sell:20,  buy:13  },
  { id:"razor", name:"Razor Blades",      cat:"Health",      qty:36,  sell:50,  buy:35  },
  { id:"tpaste",name:"Toothpaste",        cat:"Health",      qty:24,  sell:25,  buy:18  },
  { id:"tgard", name:"T-Guard Toothpaste",cat:"Health",      qty:10,  sell:60,  buy:45  },
  { id:"colg",  name:"Colgate",           cat:"Health",      qty:8,   sell:65,  buy:50  },
  { id:"cbi",   name:"Cbi Toothbrush",    cat:"Health",      qty:7,   sell:75,  buy:55  },
  { id:"bugS",  name:"Bug Ointment S",    cat:"Health",      qty:5,   sell:70,  buy:50  },
  { id:"bugL",  name:"Nazi Oil Large",    cat:"Health",      qty:6,   sell:45,  buy:32  },
  // CONFECTIONERY & SNACKS
  { id:"bisco", name:"Biscuits (pkt)",    cat:"Snacks",      qty:120, sell:5,   buy:3   },
  { id:"kusskids",name:"Kuss Kids",       cat:"Snacks",      qty:40,  sell:20,  buy:14  },
  { id:"choco", name:"Choco",             cat:"Snacks",      qty:20,  sell:10,  buy:7   },
  { id:"farm",  name:"Farm (snack)",      cat:"Snacks",      qty:12,  sell:40,  buy:28  },
  { id:"sweet", name:"Sweets (bag)",      cat:"Snacks",      qty:4,   sell:100, buy:70  },
  { id:"dofr",  name:"Doffi (small)",     cat:"Snacks",      qty:6,   sell:150, buy:110 },
  // STATIONERY
  { id:"bookA4",name:"Exercise Book A4",  cat:"Stationery",  qty:12,  sell:60,  buy:45  },
  { id:"bookA5",name:"Exercise Book A5",  cat:"Stationery",  qty:24,  sell:20,  buy:14  },
  { id:"pens",  name:"Pens",              cat:"Stationery",  qty:60,  sell:10,  buy:7   },
  // COOKING & MISC
  { id:"bicarb",name:"Bicarbonate",       cat:"Cooking",     qty:19,  sell:65,  buy:45  },
  { id:"chefm", name:"Chef's Masala",     cat:"Cooking",     qty:10,  sell:40,  buy:28  },
  { id:"energy",name:"Energy (sachet)",   cat:"Cooking",     qty:12,  sell:45,  buy:32  },
  { id:"sokoni",name:"Sokoni",            cat:"Cooking",     qty:7,   sell:60,  buy:42  },
  { id:"gluc",  name:"Glucose",           cat:"Health",      qty:12,  sell:35,  buy:24  },
  { id:"candle",name:"Candle",            cat:"Household",   qty:12,  sell:80,  buy:55  },
  { id:"pangi", name:"Pangi",             cat:"Household",   qty:6,   sell:150, buy:108 },
  { id:"royco2",name:"Royco (sachet sm)", cat:"Cooking",     qty:50,  sell:5,   buy:3   },
  { id:"pocho", name:"Pocho (sachet)",    cat:"Snacks",      qty:50,  sell:5,   buy:3   },
];

const CATEGORIES = [...new Set(INITIAL_STOCK.map(p => p.cat))];

// ─── STORAGE ─────────────────────────────────────────────────────────────────
// Real database via Supabase. Same storeSet(key,val)/storeGet(key,fallback)
// interface as before — only the engine underneath changed. One table
// "app_state" holds every key as a JSON blob, mirroring the old localStorage
// model 1:1 so nothing else in this file needs to change.
//
// REQUIRED SUPABASE TABLE (run once in Table Editor or SQL):
//   create table app_state (
//     key text primary key,
//     value jsonb,
//     updated_at timestamptz default now()
//   );

// localStorage stays as an instant-feeling local cache so the UI never
// flickers empty while waiting on the network — Supabase is the source
// of truth, localStorage is just a fast mirror.
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}
function lsGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}

async function storeSet(key, val) {
  lsSet(key, val); // instant local mirror
  try {
    const { error } = await supabase
      .from("app_state")
      .upsert({ key, value: val, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) console.error("Supabase save error:", error.message);
  } catch (e) {
    console.error("Supabase save failed:", e);
  }
}

async function storeGet(key, fallback) {
  try {
    const { data, error } = await supabase
      .from("app_state")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (!error && data) {
      lsSet(key, data.value); // refresh local mirror
      return data.value;
    }
  } catch (e) {
    console.error("Supabase load failed, using local cache:", e);
  }
  // Network/Supabase unreachable — fall back to local mirror, then hardcoded default
  const local = lsGet(key);
  return local !== null ? local : fallback;
}
const SK = {
  stock:       "duka-stock-v2",
  dailyLogs:   "duka-daily-v2",
  credits:     "duka-credits-v2",
  capital:     "duka-capital-v2",
  passion:     "duka-passion-v2",
  posho:       "duka-posho-v2",
  savings:     "duka-savings-v2",
  famConsump:  "duka-family-v2",
  personalUse: "duka-personal-v2",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt  = n => `KSh ${Number(n||0).toLocaleString("en-KE")}`;
const fmtN = n => Number(n||0).toLocaleString("en-KE");
const pct  = (a,b) => b ? ((a/b)*100).toFixed(1)+"%" : "—";
const today= () => new Date().toISOString().split("T")[0];
const sum  = (arr, k) => arr.reduce((s,x) => s+(parseFloat(x[k])||0), 0);

// ─── TINY UI ATOMS ────────────────────────────────────────────────────────────
const Card = ({children, style={}}) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,...style}}>
    {children}
  </div>
);
const Tag = ({label, color=C.gold}) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}33`,borderRadius:5,
    padding:"2px 7px",fontSize:10,fontWeight:700,letterSpacing:.6,textTransform:"uppercase"}}>
    {label}
  </span>
);
const Pill = ({label, active, onClick}) => (
  <button onClick={onClick} style={{padding:"5px 12px",borderRadius:20,border:"none",cursor:"pointer",
    fontSize:12,fontWeight:600,fontFamily:"inherit",
    background: active ? C.gold : C.faint,
    color: active ? C.bg : C.muted}}>
    {label}
  </button>
);
const Inp = ({style={}, ...props}) => (
  <input {...props} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,
    padding:"7px 10px",color:C.text,fontSize:13,fontFamily:"inherit",outline:"none",
    width:"100%",boxSizing:"border-box",...style}}/>
);
const Btn = ({children, color=C.gold, onClick, style={}}) => (
  <button onClick={onClick} style={{background:color,color:color===C.gold?C.bg:C.text,
    border:"none",borderRadius:7,padding:"8px 16px",fontWeight:800,fontSize:12,
    cursor:"pointer",fontFamily:"inherit",...style}}>
    {children}
  </button>
);
const Row2 = ({label, value, color=C.text, small}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
    padding:"5px 0",borderBottom:`1px solid ${C.border}22`}}>
    <span style={{fontSize:small?11:12,color:C.muted}}>{label}</span>
    <span style={{fontSize:small?12:13,fontWeight:600,color}}>{value}</span>
  </div>
);
const Alert2 = ({msg, type="warn"}) => (
  <div style={{background:type==="red"?C.clayDim+"66":C.goldDim+"66",
    border:`1px solid ${type==="red"?C.clay:C.gold}44`,
    borderRadius:7,padding:"7px 11px",fontSize:11,
    color:type==="red"?C.clay:C.gold,marginTop:6,lineHeight:1.5}}>
    {type==="red"?"⚠ ":"💡 "}{msg}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: DASHBOARD (overview)
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard({stock, dailyLogs, credits, passion, posho, capital, savings, famConsump, personalUse}) {
  const last7  = dailyLogs.slice(-7);
  const last30 = dailyLogs.slice(-30);

  const totalStockValue   = stock.reduce((s,p) => s+(p.qty*p.sell),0);
  const totalStockCost    = stock.reduce((s,p) => s+(p.qty*p.buy),0);
  const stockMargin       = totalStockValue - totalStockCost;

  const w7Sales   = sum(last7,"shopSales") + sum(last7,"pochiSales");
  const w7Profit  = sum(last7,"netProfit");
  const w7Fam     = sum(last7,"famConsump");
  const w7Withdraw= sum(last7,"withdrawals");
  const w7Personal= (personalUse||[]).filter(e=>{
    const d=new Date(e.date), now=new Date(); return (now-d)/(1000*60*60*24)<=7;
  }).reduce((s,e)=>s+(e.amount||0),0);
  const totalCredit = credits.filter(c=>!c.paid).reduce((s,c)=>s+c.amount,0);
  const passionBatches = passion.batches || [];
  const pendingPassion = passionBatches.filter(b=>!b.paid).reduce((s,b)=>s+(b.kgSold*35),0);

  // Posho P&L: profit = collected − diesel − wages (no arbitrary multiplier)
  const dieselSpent    = posho.totalDiesel    || 0;
  const poshoCollected = posho.totalCollected || 0;
  const poshoNetProfit = poshoCollected - dieselSpent - (posho.totalWages||0);
  const poshoUncovered = Math.max(0, dieselSpent - poshoCollected); // diesel not yet recovered

  const savingsTotal = savings || 0;
  const savingsToGoal = Math.max(0, 200000 - savingsTotal);

  const avgDailyProfit = last30.length ? sum(last30,"netProfit")/last30.length : 0;
  const daysTo200k = avgDailyProfit > 0
    ? Math.ceil((200000-savingsTotal)/(avgDailyProfit*0.3)) : null;

  const alerts = [];
  if (totalCredit >= 3500) alerts.push({msg:`Credit outstanding: ${fmt(totalCredit)} — near KSh 4,000 limit. Stop new credit until cleared.`,type:"red"});
  if (w7Withdraw > w7Profit*0.45) alerts.push({msg:`Withdrawals ate ${pct(w7Withdraw,w7Profit)} of last 7-day profit. Cap at 35%.`,type:"red"});
  if (w7Personal > w7Profit*0.20) alerts.push({msg:`Personal use: ${fmt(w7Personal)} this week (${pct(w7Personal,w7Profit)} of profit). Budget KSh ${Math.round(w7Profit*0.15).toLocaleString()}/week max.`,type:"warn"});
  if (w7Fam > 2500) alerts.push({msg:`Family consumption: ${fmt(w7Fam)} this week (${fmt(Math.round(w7Fam/7))}/day vs KSh 300 budget).`,type:"warn"});
  if (poshoUncovered > 0) alerts.push({msg:`Posho mill: ${fmt(poshoUncovered)} still needed to cover diesel cost. Current profit: ${fmt(poshoNetProfit)}.`,type:"warn"});

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      {/* Hero: Today's pulse */}
      <Card style={{gridColumn:"1/-1",background:`linear-gradient(135deg,#1E1B16,#2A2318)`}}>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
          Business Pulse — {today()}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {label:"Stock Value",     value:fmt(totalStockValue), color:C.gold},
            {label:"Stock Margin",    value:fmt(stockMargin),     color:C.sage},
            {label:"Credit Out",      value:fmt(totalCredit),     color:totalCredit>=3000?C.clay:C.muted},
            {label:"Passion Pending", value:fmt(pendingPassion),  color:C.sky},
          ].map((s,i)=>(
            <div key={i}>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{s.label}</div>
              <div style={{fontSize:18,fontWeight:900,color:s.color,fontVariantNumeric:"tabular-nums"}}>{s.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly snapshot */}
      <Card>
        <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Last 7 Days
        </div>
        <Row2 label="Shop + Pochi Sales" value={fmt(w7Sales)} color={C.gold}/>
        <Row2 label="Posho Mill Income"  value={fmt(sum(last7,"poshoIncome"))} color={C.gold}/>
        <Row2 label="Cyber Income"       value={fmt(sum(last7,"cyberIncome"))} color={C.gold}/>
        <Row2 label="Passion Profit"     value={fmt(sum(last7,"passionProfit"))} color={C.gold}/>
        <Row2 label="Family Consumption" value={fmt(w7Fam)} color={C.clay}/>
        <Row2 label="Withdrawals"        value={fmt(w7Withdraw)} color={C.clay}/>
        <Row2 label="Personal Use"       value={fmt(w7Personal)} color={C.clay}/>
        <Row2 label="Net Profit"         value={fmt(w7Profit)} color={w7Profit>=0?C.sage:C.clay}/>
      </Card>

      {/* Savings */}
      <Card>
        <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Savings to KSh 200K
        </div>
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:12,color:C.muted}}>Saved</span>
            <span style={{fontSize:13,fontWeight:700,color:C.gold}}>{fmt(savingsTotal)}</span>
          </div>
          <div style={{background:C.border,borderRadius:5,height:8,overflow:"hidden"}}>
            <div style={{width:`${Math.min((savingsTotal/200000)*100,100)}%`,
              background:`linear-gradient(90deg,${C.goldDim},${C.gold})`,height:"100%",borderRadius:5}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <span style={{fontSize:10,color:C.sage}}>{((savingsTotal/200000)*100).toFixed(1)}%</span>
            <span style={{fontSize:10,color:C.muted}}>{fmt(savingsToGoal)} to go</span>
          </div>
        </div>
        <Row2 label="Avg Daily Profit"   value={fmt(Math.round(avgDailyProfit))}/>
        <Row2 label="Days to KSh 200K"   value={daysTo200k ? `~${daysTo200k} days` : "Record more days"}/>
        <Row2 label="Days to KSh 300K"   value={avgDailyProfit>0 ? `~${Math.ceil((300000-savingsTotal)/(avgDailyProfit*0.3))} days` : "—"}/>
      </Card>

      {/* Posho P&L tracker */}
      <Card>
        <div style={{fontSize:11,color:C.sky,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Posho Mill — P&L
        </div>
        <Row2 label="Diesel Spent"       value={fmt(dieselSpent)}     color={C.clay}/>
        <Row2 label="Collected So Far"   value={fmt(poshoCollected)}  color={C.gold}/>
        <Row2 label="Wages Paid"         value={fmt(posho.totalWages||0)} color={C.clay}/>
        <Row2 label="Net Profit"         value={fmt(poshoNetProfit)}  color={poshoNetProfit>=0?C.sage:C.clay}/>
        {poshoUncovered > 0 && <Alert2 msg={`Need ${fmt(poshoUncovered)} more to cover diesel cost.`} type="warn"/>}
      </Card>

      {/* Capital injections */}
      <Card>
        <div style={{fontSize:11,color:C.sage,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          External Capital Injected
        </div>
        {capital.length===0 && <div style={{color:C.muted,fontSize:12,padding:"10px 0"}}>None recorded yet.</div>}
        {capital.slice(-5).map((c,i)=>(
          <Row2 key={i} label={c.date+" — "+c.source} value={fmt(c.amount)} color={C.sage} small/>
        ))}
        <Row2 label="Total Injected" value={fmt(sum(capital,"amount"))} color={C.sage}/>
      </Card>

      {/* Alerts */}
      {alerts.length>0 && (
        <Card style={{gridColumn:"1/-1"}}>
          <div style={{fontSize:11,color:C.clay,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:.7}}>
            ⚠ Live Alerts
          </div>
          {alerts.map((a,i)=><Alert2 key={i} msg={a.msg} type={a.type}/>)}
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: DAILY ENTRY  
// ─────────────────────────────────────────────────────────────────────────────
// CASH MODEL (zero double counting):
//
//   You count ONE pile at end of day. That pile contains everything.
//   You tell the system: closing total, posho collected, cyber collected,
//   passion cash received, outside capital added, and all expenses paid.
//
//   Shop revenue (derived, never entered manually):
//     = (closing − opening) + restocking + passionBought + transport
//       + utilities + famExpense + personalSpend + other
//       − poshoIncome − cyberIncome − passionCashIn − externalCapital
//
//   Logic: pile went up by (closing−opening). But some of that rise came from
//   non-shop sources (posho/cyber/passion/external) — subtract those.
//   And some expenses shrank the pile — add those back to recover gross shop revenue.
//
//   Total business income = shopRevenue + poshoIncome + cyberIncome
//                           + passionCashIn + externalCapital
//   Total expenses        = restocking + passionBought + transport
//                           + utilities + famExpense + personalSpend + other
//   Net profit            = total income − total expenses
//
//   Personal spending deducted from non-shop pot:
//     nonShopPot = poshoIncome + cyberIncome + externalCapital
//     If personalSpend > nonShopPot → flag: eating into shop capital
// ═══════════════════════════════════════════════════════════════════════════════
function DailyEntry({stock, setStock, dailyLogs, setDailyLogs, credits, setCredits, famConsump, setFamConsump}) {
  const [date, setDate]                       = useState(today());
  const [openCash, setOpenCash]               = useState("");
  const [closingCash, setClosingCash]         = useState("");
  // non-shop income (logged separately, already in the pile)
  const [poshoIncome, setPoshoIncome]         = useState("");
  const [cyberIncome, setCyberIncome]         = useState("");
  const [passionCashIn, setPassionCashIn]     = useState(""); // actual cash received from passion sales
  const [passionSoldKg, setPassionSoldKg]     = useState(""); // kg — for stats/margin only
  const [passionBoughtKg, setPassionBoughtKg] = useState(""); // kg bought — cost auto-calced
  const [externalCapital, setExternalCapital] = useState("");
  const [externalNote, setExternalNote]       = useState("");
  // expenses (cash LEFT the pile)
  const [restocking, setRestocking]           = useState("");
  const [transport, setTransport]             = useState("");
  const [utilities, setUtilities]             = useState("");
  const [famExpense, setFamExpense]           = useState("300");
  const [personalSpend, setPersonalSpend]     = useState("");
  const [personalNote, setPersonalNote]       = useState("");
  const [other, setOther]                     = useState("");
  // credit & note
  const [creditName, setCreditName]           = useState("");
  const [creditAmt, setCreditAmt]             = useState("");
  const [note, setNote]                       = useState("");

  const g = v => parseFloat(v)||0;

  const passionBuyCost  = g(passionBoughtKg) * 20; // KSh 20/kg fixed
  const totalExpenses   = g(restocking) + passionBuyCost + g(transport)
                        + g(utilities) + g(famExpense) + g(personalSpend) + g(other);
  const nonShopIncome   = g(poshoIncome) + g(cyberIncome) + g(passionCashIn) + g(externalCapital);
  const pileDiff        = g(closingCash) - g(openCash); // how much pile moved

  // Shop revenue — derived from the pile movement
  // pile went up by pileDiff. Non-shop sources inflated it. Expenses deflated it.
  // So shopRevenue = pileDiff + expenses − nonShopIncome
  const shopRevenue     = g(closingCash) > 0
    ? pileDiff + totalExpenses - nonShopIncome
    : 0;

  const totalIncome     = shopRevenue + nonShopIncome;
  const netProfit       = totalIncome - totalExpenses;

  // Personal spend check: should come from posho+cyber+external, not shop
  const nonShopPot      = g(poshoIncome) + g(cyberIncome) + g(externalCapital);
  const personalEatingShop = g(personalSpend) > nonShopPot && g(personalSpend) > 0;

  // Passion stats
  const passionMargin   = g(passionSoldKg) * 15; // KSh 15/kg gross margin

  const ready = g(openCash) > 0 && g(closingCash) > 0;

  const save = () => {
    if (!ready) { alert("Enter both opening and closing cash."); return; }

    const entry = {
      id: Date.now(), date, note,
      openCash: g(openCash), closingCash: g(closingCash),
      // derived shop revenue — the key number
      shopSales: shopRevenue,
      pochiSales: 0, // pochi is folded into shopRevenue via pile method
      poshoIncome: g(poshoIncome),
      cyberIncome: g(cyberIncome),
      passionCashIn: g(passionCashIn),
      passionSoldKg: g(passionSoldKg),
      passionBoughtKg: g(passionBoughtKg),
      passionBuyCost,
      passionMargin,
      externalCapital: g(externalCapital),
      externalNote,
      restocking: g(restocking),
      transport: g(transport),
      utilities: g(utilities),
      famConsump: g(famExpense),
      personalSpend: g(personalSpend),
      personalNote,
      other: g(other),
      totalIncome, totalExpenses, netProfit,
      nonShopIncome,
      // legacy compat
      passionProfit: passionMargin - passionBuyCost,
      withdrawals: g(personalSpend),
    };

    const newLogs = [...dailyLogs, entry];
    setDailyLogs(newLogs); storeSet(SK.dailyLogs, newLogs);

    if (creditName && g(creditAmt) > 0) {
      const nc = [...credits, {id:Date.now(),date,name:creditName,amount:g(creditAmt),paid:false}];
      setCredits(nc); storeSet(SK.credits, nc);
    }
    if (g(famExpense) > 0) {
      const fc = [...famConsump, {date, amount:g(famExpense), note:"Daily family"}];
      setFamConsump(fc); storeSet(SK.famConsump, fc);
    }

    setOpenCash(""); setClosingCash(""); setPoshoIncome(""); setCyberIncome("");
    setPassionCashIn(""); setPassionSoldKg(""); setPassionBoughtKg("");
    setExternalCapital(""); setExternalNote(""); setRestocking("");
    setTransport(""); setUtilities(""); setFamExpense("300");
    setPersonalSpend(""); setPersonalNote(""); setOther("");
    setCreditName(""); setCreditAmt(""); setNote("");
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>

      {/* STEP 1 — The pile */}
      <Card style={{gridColumn:"1/-1",border:`1px solid ${C.gold}44`}}>
        <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Step 1 — Count Your Pile
        </div>
        <div style={{fontSize:10,color:C.muted,marginBottom:12,lineHeight:1.6,
          background:C.surface,borderRadius:6,padding:"8px 12px"}}>
          Count everything at end of night — shop cash, Pochi float, posho money, cyber money, passion money. One number. Then log the others separately below so we can subtract them out.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,alignItems:"end"}}>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>Date</div>
            <Inp type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>Opening Cash (yesterday's closing)</div>
            <Inp type="number" placeholder="e.g. 4500" value={openCash} onChange={e=>setOpenCash(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>Closing Cash (total pile tonight)</div>
            <Inp type="number" placeholder="everything counted" value={closingCash} onChange={e=>setClosingCash(e.target.value)}/>
          </div>
          <div style={{background:C.surface,borderRadius:8,padding:10,textAlign:"center"}}>
            <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:.4,marginBottom:3}}>Pile Movement</div>
            <div style={{fontSize:20,fontWeight:900,color:pileDiff>=0?C.gold:C.clay}}>
              {ready ? fmt(pileDiff) : "—"}
            </div>
            <div style={{fontSize:9,color:C.muted,marginTop:2}}>closing − opening</div>
          </div>
        </div>
      </Card>

      {/* STEP 2 — Non-shop income inside the pile */}
      <Card style={{border:`1px solid ${C.sky}33`}}>
        <div style={{fontSize:11,color:C.sky,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:.7}}>
          Step 2 — Non-Shop Money in the Pile
        </div>
        <div style={{fontSize:10,color:C.muted,marginBottom:10,lineHeight:1.5,
          background:C.surface,borderRadius:6,padding:"7px 10px"}}>
          How much of tonight's pile came from posho, cyber, passion, or outside? We subtract these to isolate pure shop revenue.
        </div>

        <div style={{marginBottom:4,fontSize:10,color:C.sky,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>⚙ Posho Mill</div>
        <div style={{marginBottom:10}}>
          <Inp type="number" placeholder="0" value={poshoIncome} onChange={e=>setPoshoIncome(e.target.value)}/>
        </div>

        <div style={{marginBottom:4,fontSize:10,color:C.sage,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>💻 Cyber Café</div>
        <div style={{marginBottom:10}}>
          <Inp type="number" placeholder="0" value={cyberIncome} onChange={e=>setCyberIncome(e.target.value)}/>
        </div>

        <div style={{marginBottom:4,fontSize:10,color:C.clay,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>🍋 Passion Fruit Cash Received</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Cash collected (KSh)</div>
            <Inp type="number" placeholder="0" value={passionCashIn} onChange={e=>setPassionCashIn(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Kg sold (for stats)</div>
            <Inp type="number" placeholder="0" value={passionSoldKg} onChange={e=>setPassionSoldKg(e.target.value)}/>
          </div>
        </div>

        <div style={{marginBottom:4,fontSize:10,color:C.sage,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>💼 Outside Capital Added</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Inp type="number" placeholder="0" value={externalCapital} onChange={e=>setExternalCapital(e.target.value)}/>
          <Inp placeholder="What — sold phone, gift…" value={externalNote} onChange={e=>setExternalNote(e.target.value)}/>
        </div>
      </Card>

      {/* STEP 3 — Expenses */}
      <Card style={{border:`1px solid ${C.clay}33`}}>
        <div style={{fontSize:11,color:C.clay,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:.7}}>
          Step 3 — Expenses Paid From the Pile Today
        </div>
        <div style={{fontSize:10,color:C.muted,marginBottom:10,lineHeight:1.5,
          background:C.surface,borderRadius:6,padding:"7px 10px"}}>
          Cash that left the pile. Adding these back recovers your gross shop revenue.
        </div>

        {[
          ["Restocking (stock bought today)",  restocking,  setRestocking],
          ["Transport",                         transport,   setTransport],
          ["Utilities",                         utilities,   setUtilities],
          ["Other",                             other,       setOther],
        ].map(([l,v,s])=>(
          <div key={l} style={{marginBottom:8}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{l}</div>
            <Inp type="number" placeholder="0" value={v} onChange={e=>s(e.target.value)}/>
          </div>
        ))}

        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>
            Passion Fruit Bought (kg) — auto KSh 20/kg
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Inp type="number" placeholder="0" value={passionBoughtKg}
              onChange={e=>setPassionBoughtKg(e.target.value)} style={{flex:1}}/>
            {g(passionBoughtKg)>0 && (
              <span style={{fontSize:11,color:C.clay,whiteSpace:"nowrap"}}>{fmt(passionBuyCost)}</span>
            )}
          </div>
        </div>

        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:4}}>
          <div style={{fontSize:10,color:C.clay,marginBottom:3,fontWeight:700}}>
            Family (stock taken home — KSh 300 default)
          </div>
          <Inp type="number" placeholder="300" value={famExpense} onChange={e=>setFamExpense(e.target.value)}/>
        </div>

        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:8}}>
          <div style={{fontSize:10,color:C.clay,marginBottom:3,fontWeight:700}}>
            Personal Spending
            <span style={{color:C.muted,fontWeight:400}}> — deducted from posho+cyber+external, not shop</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <Inp type="number" placeholder="0" value={personalSpend} onChange={e=>setPersonalSpend(e.target.value)}/>
            <Inp placeholder="What for?" value={personalNote} onChange={e=>setPersonalNote(e.target.value)}/>
          </div>
          {personalEatingShop && (
            <Alert2 msg={`Personal spending (${fmt(g(personalSpend))}) exceeds non-shop income (${fmt(nonShopPot)}). KSh ${fmt(g(personalSpend)-nonShopPot)} is eating into shop capital.`} type="red"/>
          )}
        </div>
      </Card>

      {/* STEP 4 — Credit & note */}
      <Card>
        <div style={{fontSize:11,color:C.sky,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Step 4 — Credit Given Today
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Customer Name</div>
            <Inp placeholder="e.g. Mama Amina" value={creditName} onChange={e=>setCreditName(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Amount (KSh)</div>
            <Inp type="number" placeholder="0" value={creditAmt} onChange={e=>setCreditAmt(e.target.value)}/>
          </div>
        </div>
        <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Day Note</div>
        <Inp placeholder="market day, restocked, slow…" value={note} onChange={e=>setNote(e.target.value)}/>
      </Card>

      {/* LIVE BREAKDOWN */}
      <Card>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Live Breakdown
        </div>
        <div style={{marginBottom:8,padding:"8px 10px",background:C.surface,borderRadius:7,
          border:`1px solid ${C.gold}33`}}>
          <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>🏪 Shop Revenue (derived)</div>
          <div style={{fontSize:20,fontWeight:900,color:ready?(shopRevenue>=0?C.gold:C.clay):C.faint}}>
            {ready ? fmt(shopRevenue) : "enter closing cash"}
          </div>
          <div style={{fontSize:9,color:C.muted,marginTop:2}}>pile movement + expenses − non-shop income</div>
        </div>
        {[
          {label:"⚙ Posho Mill",        val:g(poshoIncome),   color:C.sky},
          {label:"💻 Cyber",             val:g(cyberIncome),   color:C.sage},
          {label:"🍋 Passion received",  val:g(passionCashIn), color:C.clay},
          {label:"💼 External capital",  val:g(externalCapital),color:C.sage},
        ].map((d,i)=>(
          <Row2 key={i} label={d.label} value={d.val>0?fmt(d.val):"—"} color={d.val>0?d.color:C.faint}/>
        ))}
        <div style={{borderTop:`1px solid ${C.border}`,marginTop:6,paddingTop:6}}>
          <Row2 label="Total Expenses" value={fmt(totalExpenses)} color={C.clay}/>
          <Row2 label="Total Income"   value={fmt(totalIncome)}   color={C.gold}/>
        </div>
        {g(passionSoldKg)>0 && (
          <div style={{marginTop:8,fontSize:11,color:C.muted}}>
            Passion margin on {g(passionSoldKg)}kg: <span style={{color:C.sage,fontWeight:700}}>{fmt(passionMargin)}</span>
          </div>
        )}
      </Card>

      {/* SUMMARY & SAVE */}
      <Card style={{gridColumn:"1/-1",background:`linear-gradient(135deg,#1A1815,#231F19)`,border:`1px solid ${C.gold}44`}}>
        <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:12,textTransform:"uppercase",letterSpacing:.7}}>
          Today's Summary
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
          {[
            {label:"Shop Revenue",   val:ready?fmt(shopRevenue):"—",    color:shopRevenue>=0?C.gold:C.clay},
            {label:"Total Income",   val:fmt(totalIncome),               color:C.gold},
            {label:"Total Expenses", val:fmt(totalExpenses),             color:C.clay},
            {label:"Net Profit",     val:fmt(netProfit),                 color:netProfit>=0?C.sage:C.clay},
          ].map((s,i)=>(
            <div key={i} style={{background:C.surface,borderRadius:8,padding:10,textAlign:"center"}}>
              <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:15,fontWeight:900,color:s.color,fontVariantNumeric:"tabular-nums"}}>{s.val}</div>
            </div>
          ))}
        </div>
        {shopRevenue < 0 && ready && (
          <Alert2 msg={`Shop revenue is negative (${fmt(shopRevenue)}). Either non-shop income is overstated, an expense is missing, or it was genuinely a loss day. Double-check posho/cyber/passion figures.`} type="red"/>
        )}
        <Btn onClick={save} style={{width:"100%",padding:"12px 0",fontSize:14}}
          color={ready?C.gold:C.faint}>
          {ready ? "SAVE TODAY'S RECORD" : "ENTER OPENING & CLOSING CASH FIRST"}
        </Btn>
      </Card>

      {/* Recent entries */}
      {dailyLogs.length > 0 && (
        <Card style={{gridColumn:"1/-1"}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:.7}}>
            Recent Entries
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${C.border}`}}>
                  {["Date","Shop Rev","Posho","Cyber","Passion","Total In","Expenses","Net Profit","Note"]
                    .map(h=><th key={h} style={{textAlign:"left",padding:"4px 8px",fontSize:10,
                      color:C.muted,textTransform:"uppercase",letterSpacing:.4,whiteSpace:"nowrap"}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {[...dailyLogs].reverse().slice(0,10).map(l=>(
                  <tr key={l.id} style={{borderBottom:`1px solid ${C.border}22`}}>
                    <td style={{padding:"5px 8px",whiteSpace:"nowrap"}}>{l.date}</td>
                    <td style={{padding:"5px 8px",color:C.gold,fontWeight:700}}>{fmt(l.shopSales||0)}</td>
                    <td style={{padding:"5px 8px",color:C.sky}}>{fmt(l.poshoIncome||0)}</td>
                    <td style={{padding:"5px 8px",color:C.sage}}>{fmt(l.cyberIncome||0)}</td>
                    <td style={{padding:"5px 8px",color:C.clay}}>{fmt(l.passionCashIn||0)}</td>
                    <td style={{padding:"5px 8px",color:C.gold}}>{fmt(l.totalIncome||0)}</td>
                    <td style={{padding:"5px 8px",color:C.clay}}>{fmt(l.totalExpenses||0)}</td>
                    <td style={{padding:"5px 8px",fontWeight:700,color:(l.netProfit||0)>=0?C.sage:C.clay}}>{fmt(l.netProfit||0)}</td>
                    <td style={{padding:"5px 8px",color:C.muted,fontSize:11}}>{l.note||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════
const ALL_CATS = ["Beverages","Staples","Soap/Clean","Household","Health","Snacks","Stationery","Cooking","Other"];

function Inventory({stock, setStock}) {
  const [filterCat, setFilterCat] = useState("All");
  const [search, setSearch]       = useState("");
  const [mode, setMode]           = useState("view"); // "view" | "weekly" | "add"
  const [editId, setEditId]       = useState(null);
  const [editFields, setEditFields]= useState({});
  // weekly update: bulk qty changes
  const [weeklyQtys, setWeeklyQtys]= useState({});
  // add new product
  const [newName, setNewName]     = useState("");
  const [newCat, setNewCat]       = useState("Staples");
  const [newQty, setNewQty]       = useState("");
  const [newBuy, setNewBuy]       = useState("");
  const [newSell, setNewSell]     = useState("");

  const cats = [...new Set(stock.map(p=>p.cat))];
  const filtered = stock
    .filter(p => filterCat==="All" || p.cat===filterCat)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const totalValue = stock.reduce((s,p)=>s+p.qty*p.sell,0);
  const totalCost  = stock.reduce((s,p)=>s+p.qty*p.buy,0);
  const outOfStock = stock.filter(p=>p.qty===0);
  const lowStock   = stock.filter(p=>p.qty>0&&p.qty<=3);
  const slowMovers = stock.filter(p=>p.qty>20&&!["Staples","Snacks"].includes(p.cat));
  const margin = p => p.sell>0?(((p.sell-p.buy)/p.sell)*100).toFixed(0)+"%":"—";

  // Full edit (name, cat, qty, buy, sell)
  const startEdit = p => {
    setEditId(p.id);
    setEditFields({name:p.name,cat:p.cat,qty:p.qty,buy:p.buy,sell:p.sell});
  };
  const saveEdit = id => {
    const f = editFields;
    const updated = stock.map(p=>p.id===id
      ? {...p,name:f.name||p.name,cat:f.cat||p.cat,
          qty:parseInt(f.qty)||p.qty,buy:parseFloat(f.buy)||p.buy,sell:parseFloat(f.sell)||p.sell}
      : p);
    setStock(updated); storeSet(SK.stock, updated); setEditId(null);
  };
  const deleteProduct = id => {
    if (!window.confirm("Delete this product?")) return;
    const updated = stock.filter(p=>p.id!==id);
    setStock(updated); storeSet(SK.stock, updated);
  };

  // Weekly stock update: set new qty for each product
  const [weeklyDone, setWeeklyDone] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(null);

  const initWeekly = () => {
    const init = {};
    stock.forEach(p=>{ init[p.id] = p.qty; });
    setWeeklyQtys(init);
    setWeeklyDone(false);
    setMode("weekly");
  };
  const saveWeekly = () => {
    const updated = stock.map(p=>({
      ...p, qty: parseInt(weeklyQtys[p.id]??p.qty)||0
    }));
    // Generate report: what dropped most (sold fast), what didn't move
    const changes = stock.map(p=>{
      const newQty = parseInt(weeklyQtys[p.id]??p.qty)||0;
      const sold = p.qty - newQty;
      const soldValue = sold * p.sell;
      return {...p, newQty, sold, soldValue};
    });
    const topSellers = changes.filter(c=>c.sold>0).sort((a,b)=>b.soldValue-a.soldValue).slice(0,5);
    const noMovers   = changes.filter(c=>c.sold===0 && c.qty>5).slice(0,5);
    const newOOS     = changes.filter(c=>c.newQty===0 && c.qty>0);
    const totalSoldValue = changes.reduce((s,c)=>s+(c.sold>0?c.soldValue:0),0);
    setWeeklyReport({topSellers, noMovers, newOOS, totalSoldValue, date:today()});
    setStock(updated); storeSet(SK.stock, updated);
    setWeeklyDone(true);
    setMode("view");
  };

  // Add new product
  const addProduct = () => {
    if (!newName||!newSell) return;
    const np = {
      id: "p_"+Date.now(),
      name: newName, cat: newCat,
      qty: parseInt(newQty)||0,
      buy: parseFloat(newBuy)||0,
      sell: parseFloat(newSell)||0,
    };
    const updated = [...stock, np];
    setStock(updated); storeSet(SK.stock, updated);
    setNewName(""); setNewQty(""); setNewBuy(""); setNewSell(""); setNewCat("Staples");
    setMode("view");
  };

  return (
    <div>
      {/* Summary */}
      <Card style={{marginBottom:12}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
          {[
            {label:"Stock Value",    val:fmt(totalValue),              color:C.gold},
            {label:"Stock Cost",     val:fmt(totalCost),               color:C.muted},
            {label:"Margin",         val:fmt(totalValue-totalCost),    color:C.sage},
            {label:"Out of Stock",   val:outOfStock.length+" items",   color:outOfStock.length?C.clay:C.muted},
            {label:"Low Stock ≤3",   val:lowStock.length+" items",     color:lowStock.length?C.gold:C.muted},
          ].map((s,i)=>(
            <div key={i}>
              <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>{s.label}</div>
              <div style={{fontSize:15,fontWeight:800,color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Mode buttons */}
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        <Btn onClick={()=>setMode("view")}  color={mode==="view"?C.gold:C.faint}
          style={{color:mode==="view"?C.bg:C.muted,fontSize:12}}>📋 View</Btn>
        <Btn onClick={initWeekly}           color={mode==="weekly"?C.sky:C.faint}
          style={{color:mode==="weekly"?C.bg:C.muted,fontSize:12}}>📦 Weekly Update</Btn>
        <Btn onClick={()=>setMode("add")}   color={mode==="add"?C.sage:C.faint}
          style={{color:mode==="add"?C.bg:C.muted,fontSize:12}}>+ Add Product</Btn>
        <Inp placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:140,marginLeft:"auto"}}/>
      </div>

      {/* Category pills */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {["All",...cats].map(c=>(
          <Pill key={c} label={c} active={filterCat===c} onClick={()=>setFilterCat(c)}/>
        ))}
      </div>

      {/* Weekly performance report */}
      {weeklyDone && weeklyReport && (
        <Card style={{marginBottom:10,border:`1px solid ${C.sky}44`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:11,color:C.sky,fontWeight:700,textTransform:"uppercase",letterSpacing:.7}}>
              📊 Weekly Stock Report — {weeklyReport.date}
            </div>
            <button onClick={()=>setWeeklyDone(false)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}}>×</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
            <div style={{background:C.surface,borderRadius:7,padding:10}}>
              <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Est. Turnover</div>
              <div style={{fontSize:18,fontWeight:900,color:C.gold}}>{fmt(weeklyReport.totalSoldValue)}</div>
            </div>
            <div style={{background:C.surface,borderRadius:7,padding:10}}>
              <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",marginBottom:4}}>New Out-of-Stock</div>
              <div style={{fontSize:18,fontWeight:900,color:weeklyReport.newOOS.length?C.clay:C.sage}}>{weeklyReport.newOOS.length} items</div>
            </div>
            <div style={{background:C.surface,borderRadius:7,padding:10}}>
              <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",marginBottom:4}}>Non-Movers</div>
              <div style={{fontSize:18,fontWeight:900,color:weeklyReport.noMovers.length?C.gold:C.sage}}>{weeklyReport.noMovers.length} items</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <div style={{fontSize:10,color:C.gold,fontWeight:700,marginBottom:6}}>🔥 TOP SELLERS (by value)</div>
              {weeklyReport.topSellers.length===0 && <div style={{fontSize:11,color:C.muted}}>No movement recorded</div>}
              {weeklyReport.topSellers.map((p,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                  <span style={{fontSize:11}}>{p.name}</span>
                  <span style={{fontSize:11,color:C.gold,fontWeight:700}}>{p.sold} sold · {fmt(p.soldValue)}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontSize:10,color:C.clay,fontWeight:700,marginBottom:6}}>⚠ SLOW MOVERS (stop reordering)</div>
              {weeklyReport.noMovers.length===0 && <div style={{fontSize:11,color:C.muted}}>All products moved</div>}
              {weeklyReport.noMovers.map((p,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                  <span style={{fontSize:11}}>{p.name}</span>
                  <span style={{fontSize:11,color:C.clay}}>{p.qty} still in stock</span>
                </div>
              ))}
            </div>
          </div>
          {weeklyReport.newOOS.length>0 && (
            <Alert2 msg={`Restock urgently: ${weeklyReport.newOOS.map(p=>p.name).join(", ")}`} type="red"/>
          )}
        </Card>
      )}

      {/* Inventory Alerts */}
      {slowMovers.length>0 && <Alert2 msg={`Slow movers: ${slowMovers.map(p=>p.name).join(", ")} — high qty, non-staple. Stop reordering until cleared.`} type="warn"/>}
      {lowStock.length>0   && <Alert2 msg={`Reorder soon: ${lowStock.map(p=>p.name).join(", ")}`} type="red"/>}

      {/* ADD PRODUCT FORM */}
      {mode==="add" && (
        <Card style={{marginTop:10,border:`1px solid ${C.sage}44`}}>
          <div style={{fontSize:11,color:C.sage,fontWeight:700,marginBottom:12,textTransform:"uppercase",letterSpacing:.7}}>
            Add New Product
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:8,marginBottom:10}}>
            <div>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Product Name *</div>
              <Inp placeholder="e.g. Omo 500g" value={newName} onChange={e=>setNewName(e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Category</div>
              <select value={newCat} onChange={e=>setNewCat(e.target.value)}
                style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,
                  padding:"7px 8px",color:C.text,fontSize:12,width:"100%",fontFamily:"inherit",outline:"none"}}>
                {ALL_CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Qty</div>
              <Inp type="number" placeholder="0" value={newQty} onChange={e=>setNewQty(e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Buy KSh</div>
              <Inp type="number" placeholder="0" value={newBuy} onChange={e=>setNewBuy(e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Sell KSh *</div>
              <Inp type="number" placeholder="0" value={newSell} onChange={e=>setNewSell(e.target.value)}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={addProduct} color={C.sage} style={{flex:1}}>SAVE PRODUCT</Btn>
            <Btn onClick={()=>setMode("view")} color={C.faint} style={{color:C.muted}}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* WEEKLY UPDATE MODE */}
      {mode==="weekly" && (
        <Card style={{marginTop:10,border:`1px solid ${C.sky}44`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontSize:11,color:C.sky,fontWeight:700,textTransform:"uppercase",letterSpacing:.7}}>
                Weekly Stock Count — Update All Quantities
              </div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>Enter actual counted qty for each product. Leave unchanged if not counted.</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={saveWeekly} color={C.sky} style={{color:C.bg}}>SAVE ALL</Btn>
              <Btn onClick={()=>setMode("view")} color={C.faint} style={{color:C.muted,fontSize:12}}>Cancel</Btn>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6,maxHeight:400,overflowY:"auto"}}>
            {filtered.map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,
                background:C.surface,borderRadius:7,padding:"6px 10px"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                  <div style={{fontSize:10,color:C.muted}}>Was: {p.qty}</div>
                </div>
                <Inp type="number" value={weeklyQtys[p.id]??p.qty}
                  onChange={e=>setWeeklyQtys(prev=>({...prev,[p.id]:e.target.value}))}
                  style={{width:65,padding:"5px 8px",fontSize:13,fontWeight:700,
                    color:parseInt(weeklyQtys[p.id])<p.qty?C.clay:parseInt(weeklyQtys[p.id])>p.qty?C.sage:C.text}}/>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MAIN TABLE */}
      {mode==="view" && (
        <Card style={{marginTop:10,overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${C.border}`}}>
                {["Product","Cat","Qty","Buy","Sell","Margin","Value","Actions"]
                  .map(h=><th key={h} style={{textAlign:"left",padding:"6px 8px",fontSize:10,
                    color:C.muted,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id} style={{borderBottom:`1px solid ${C.border}22`,
                  background:p.qty===0?C.clayDim+"22":p.qty<=3?C.goldDim+"22":"transparent"}}>
                  {editId===p.id ? (
                    <>
                      <td style={{padding:"4px 6px"}}>
                        <Inp value={editFields.name} onChange={e=>setEditFields(f=>({...f,name:e.target.value}))} style={{padding:"3px 6px"}}/>
                      </td>
                      <td style={{padding:"4px 6px"}}>
                        <select value={editFields.cat} onChange={e=>setEditFields(f=>({...f,cat:e.target.value}))}
                          style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:5,
                            padding:"4px 6px",color:C.text,fontSize:11,fontFamily:"inherit",outline:"none",width:"100%"}}>
                          {ALL_CATS.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={{padding:"4px 6px"}}>
                        <Inp type="number" value={editFields.qty} onChange={e=>setEditFields(f=>({...f,qty:e.target.value}))} style={{width:55,padding:"3px 6px"}}/>
                      </td>
                      <td style={{padding:"4px 6px"}}>
                        <Inp type="number" value={editFields.buy} onChange={e=>setEditFields(f=>({...f,buy:e.target.value}))} style={{width:60,padding:"3px 6px"}}/>
                      </td>
                      <td style={{padding:"4px 6px"}}>
                        <Inp type="number" value={editFields.sell} onChange={e=>setEditFields(f=>({...f,sell:e.target.value}))} style={{width:60,padding:"3px 6px"}}/>
                      </td>
                      <td/><td/>
                      <td style={{padding:"4px 6px"}}>
                        <div style={{display:"flex",gap:4}}>
                          <Btn onClick={()=>saveEdit(p.id)} style={{padding:"3px 9px",fontSize:11}}>✓</Btn>
                          <Btn onClick={()=>setEditId(null)} color={C.faint} style={{padding:"3px 9px",fontSize:11,color:C.muted}}>✕</Btn>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{padding:"5px 8px",color:C.text,fontWeight:600}}>{p.name}</td>
                      <td style={{padding:"5px 8px"}}><Tag label={p.cat} color={C.muted}/></td>
                      <td style={{padding:"5px 8px",color:p.qty===0?C.clay:p.qty<=3?C.gold:C.text,fontWeight:700}}>{p.qty}</td>
                      <td style={{padding:"5px 8px",color:C.muted}}>{fmtN(p.buy)}</td>
                      <td style={{padding:"5px 8px",color:C.gold}}>{fmtN(p.sell)}</td>
                      <td style={{padding:"5px 8px",color:C.sage}}>{margin(p)}</td>
                      <td style={{padding:"5px 8px",color:C.text}}>{fmt(p.qty*p.sell)}</td>
                      <td style={{padding:"5px 8px"}}>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={()=>startEdit(p)}
                            style={{background:C.faint,border:"none",borderRadius:5,padding:"3px 8px",
                              color:C.muted,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Edit</button>
                          <button onClick={()=>deleteProduct(p.id)}
                            style={{background:C.clayDim+"55",border:"none",borderRadius:5,padding:"3px 7px",
                              color:C.clay,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Del</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PASSION FRUIT
// ═══════════════════════════════════════════════════════════════════════════════
function PassionFruit({passion, setPassion}) {
  const [batchDate, setBatchDate]   = useState(today());
  const [kgBought, setKgBought]     = useState("");
  const [kgSold, setKgSold]         = useState("");
  const [buyerName, setBuyerName]   = useState("");
  const [paid, setPaid]             = useState(false);
  const [note, setNote]             = useState("");

  const totalInStore    = passion.kgInStore || 130;
  const totalPendingKSh = (passion.batches||[]).filter(b=>!b.paid).reduce((s,b)=>s+b.kgSold*35,0);
  const totalLossKg     = (passion.batches||[]).reduce((s,b)=>s+(b.lossKg||0),0);
  const totalProfit     = (passion.batches||[]).reduce((s,b)=>s+b.profit,0);

  // ripening loss: 15% of stock in store
  const estimatedRipenLoss = totalInStore * 0.15;
  const netAfterLoss       = totalInStore - estimatedRipenLoss;

  const addBatch = () => {
    const kg   = parseFloat(kgBought)||0;
    const sold = parseFloat(kgSold)||0;
    const lossKg = kg * 0.175; // avg 17.5% ripening loss
    const profit = (sold*35) - (kg*20) - (lossKg*20);
    const batch = {
      id:Date.now(), date:batchDate, kgBought:kg, kgSold:sold,
      buyerName, paid, note, lossKg: parseFloat(lossKg.toFixed(1)),
      profit: parseFloat(profit.toFixed(0)),
    };
    const newBatches = [...(passion.batches||[]), batch];
    const newKgInStore = Math.max(0, (passion.kgInStore||130) - sold + kg);
    const updated = {...passion, batches:newBatches, kgInStore:newKgInStore};
    setPassion(updated); storeSet(SK.passion, updated);
    setKgBought(""); setKgSold(""); setBuyerName(""); setPaid(false); setNote("");
  };

  const markPaid = (id) => {
    const updated = {...passion, batches:(passion.batches||[]).map(b=>b.id===id?{...b,paid:true}:b)};
    setPassion(updated); storeSet(SK.passion, updated);
  };

  const updateStock = (val) => {
    const updated = {...passion, kgInStore:parseFloat(val)||0};
    setPassion(updated); storeSet(SK.passion, updated);
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Card>
        <div style={{fontSize:11,color:C.sage,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          🍋 Passion Fruit Status
        </div>
        <Row2 label="Kg In Store (ripening)" value={`${totalInStore} kg`} color={C.gold}/>
        <Row2 label="Est. Ripening Loss (15%)" value={`~${estimatedRipenLoss.toFixed(1)} kg`} color={C.clay}/>
        <Row2 label="Expected sellable kg" value={`~${netAfterLoss.toFixed(1)} kg`} color={C.sage}/>
        <Row2 label="Value if all sold" value={fmt(netAfterLoss*35)} color={C.gold}/>
        <Row2 label="Cost of current stock" value={fmt(totalInStore*20)} color={C.clay}/>
        <Row2 label="Max possible profit" value={fmt(netAfterLoss*35 - totalInStore*20)} color={C.sage}/>
        <Row2 label="Pending payment" value={fmt(totalPendingKSh)} color={C.sky}/>
        <div style={{marginTop:10}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:4}}>UPDATE KG IN STORE</div>
          <div style={{display:"flex",gap:8}}>
            <Inp type="number" placeholder={totalInStore} onBlur={e=>updateStock(e.target.value)} style={{flex:1}}/>
          </div>
        </div>
        <Alert2 msg="Yesterday 48kg sold — awaiting payment today. Mark as paid when collected." type="warn"/>
      </Card>

      <Card>
        <div style={{fontSize:11,color:C.sage,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Record Batch
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Date</div>
            <Inp type="date" value={batchDate} onChange={e=>setBatchDate(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Kg Bought</div>
            <Inp type="number" placeholder="0" value={kgBought} onChange={e=>setKgBought(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Kg Sold</div>
            <Inp type="number" placeholder="0" value={kgSold} onChange={e=>setKgSold(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Buyer Name</div>
            <Inp placeholder="Optional" value={buyerName} onChange={e=>setBuyerName(e.target.value)}/>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
          <label style={{fontSize:12,color:C.muted,display:"flex",gap:6,alignItems:"center",cursor:"pointer"}}>
            <input type="checkbox" checked={paid} onChange={e=>setPaid(e.target.checked)}
              style={{accentColor:C.sage}}/>
            Payment received immediately
          </label>
        </div>
        <Inp placeholder="Note..." value={note} onChange={e=>setNote(e.target.value)} style={{marginBottom:8}}/>
        <Btn onClick={addBatch} style={{width:"100%"}}>RECORD BATCH</Btn>

        {/* Preview */}
        {(parseFloat(kgBought)||parseFloat(kgSold)) ? (
          <div style={{marginTop:8,background:C.surface,borderRadius:7,padding:10}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Batch P&L Preview</div>
            <Row2 label="Revenue" value={fmt((parseFloat(kgSold)||0)*35)} color={C.gold}/>
            <Row2 label="Buy cost" value={fmt((parseFloat(kgBought)||0)*20)} color={C.clay}/>
            <Row2 label="Loss cost (~17.5%)" value={fmt((parseFloat(kgBought)||0)*0.175*20)} color={C.clay}/>
            <Row2 label="Est. Profit" value={fmt((parseFloat(kgSold)||0)*35-(parseFloat(kgBought)||0)*20-(parseFloat(kgBought)||0)*0.175*20)}
              color={C.sage}/>
          </div>
        ):null}
      </Card>

      {/* Batch history */}
      <Card style={{gridColumn:"1/-1"}}>
        <div style={{fontSize:11,color:C.sage,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Batch History — Totals: Profit {fmt(totalProfit)} · Loss {totalLossKg.toFixed(1)}kg
        </div>
        {!(passion.batches||[]).length && <div style={{color:C.muted,fontSize:12}}>No batches recorded yet. 48kg sold yesterday pending payment.</div>}
        {(passion.batches||[]).slice().reverse().map(b=>(
          <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"7px 0",borderBottom:`1px solid ${C.border}22`}}>
            <div>
              <div style={{fontSize:12,fontWeight:600}}>{b.date} — {b.kgSold}kg sold</div>
              <div style={{fontSize:10,color:C.muted}}>Bought:{b.kgBought}kg · Loss:{b.lossKg}kg · {b.buyerName||"Walk-in"}</div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:12,fontWeight:700,color:b.profit>=0?C.sage:C.clay}}>{fmt(b.profit)}</span>
              {!b.paid
                ? <Btn onClick={()=>markPaid(b.id)} color={C.sage} style={{padding:"3px 10px",fontSize:11}}>Mark Paid</Btn>
                : <Tag label="Paid" color={C.sage}/>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: POSHO MILL
// ═══════════════════════════════════════════════════════════════════════════════
function PoshoMill({posho, setPostho}) {
  const [dieselAmt, setDieselAmt]   = useState("");
  const [dieselDate, setDieselDate] = useState(today());
  const [collected, setCollected]   = useState("");
  const [collectDate, setCollectDate]= useState(today());
  const [partTimeWage, setPartTimeWage]= useState("");

  // Flour price states
  const [newGrade1, setNewGrade1]   = useState("");
  const [newGrade2, setNewGrade2]   = useState("");
  const [priceDate, setPriceDate]   = useState(today());
  const [priceNote, setPriceNote]   = useState("");

  const totalDiesel    = posho.totalDiesel    || 5000;
  const totalCollected = posho.totalCollected || 2400;
  const totalWages     = posho.totalWages     || 0;
  const flourPrices    = posho.flourPrices    || [{date:"2026-06-12",grade1:17,grade2:9,note:"Starting price"}];
  const currentPrices  = flourPrices[flourPrices.length-1] || {grade1:17, grade2:9};

  // Posho mill logic:
  // You spend KSh 5,000 on a gallon of diesel → mill earns KSh 10,000+ → profit = collected − diesel − wages
  // No arbitrary multiplier. Profit is simply what came in minus what you spent.
  const netProfit       = totalCollected - totalDiesel - totalWages;
  const breakEvenPoint  = totalDiesel + totalWages; // minimum you need to collect to cover costs
  const profitAboveCost = totalCollected - breakEvenPoint;
  // Progress: 0–100% = "have you covered diesel cost?", above 100% = you're in profit
  const profitProgress  = breakEvenPoint > 0 ? Math.min((totalCollected / breakEvenPoint) * 100, 200) : 0;
  const coveredDiesel   = totalCollected >= breakEvenPoint;

  const addDiesel = () => {
    const updated = {
      ...posho,
      totalDiesel: totalDiesel + (parseFloat(dieselAmt)||0),
      dieselHistory: [...(posho.dieselHistory||[]), {date:dieselDate, amount:parseFloat(dieselAmt)||0}],
    };
    setPostho(updated); storeSet(SK.posho, updated);
    setDieselAmt("");
  };

  const addCollected = () => {
    const updated = {
      ...posho,
      totalCollected: totalCollected + (parseFloat(collected)||0),
      collectHistory: [...(posho.collectHistory||[]), {date:collectDate, amount:parseFloat(collected)||0}],
    };
    setPostho(updated); storeSet(SK.posho, updated);
    setCollected("");
  };

  const addWage = () => {
    const updated = {...posho, totalWages: totalWages + (parseFloat(partTimeWage)||0)};
    setPostho(updated); storeSet(SK.posho, updated);
    setPartTimeWage("");
  };

  const updateFlourPrice = () => {
    const g1 = parseFloat(newGrade1);
    const g2 = parseFloat(newGrade2);
    if (!g1 && !g2) return;
    const prev = currentPrices;
    const entry = {
      date: priceDate,
      grade1: g1 || prev.grade1,
      grade2: g2 || prev.grade2,
      note: priceNote || "",
    };
    const updated = {...posho, flourPrices:[...flourPrices, entry]};
    setPostho(updated); storeSet(SK.posho, updated);
    setNewGrade1(""); setNewGrade2(""); setPriceNote("");
  };

  const estimatedDailyAvg = totalCollected > 0 ? (totalCollected / Math.max(1,(posho.collectHistory||[]).length)) : 0;

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Card style={{gridColumn:"1/-1"}}>
        <div style={{fontSize:11,color:C.sky,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          ⚙ Posho Mill — P&L Tracker
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
          {[
            {label:"Diesel Spent",      val:fmt(totalDiesel),   color:C.clay,   sub:"your cost"},
            {label:"Collected So Far",  val:fmt(totalCollected),color:C.gold,   sub:"revenue in"},
            {label:"Wages Paid",        val:fmt(totalWages),    color:C.clay,   sub:"labour cost"},
            {label:"Net Profit",        val:fmt(netProfit),     color:netProfit>=0?C.sage:C.clay, sub:netProfit>=0?"you're in profit":"diesel not covered yet"},
          ].map((s,i)=>(
            <div key={i} style={{background:C.surface,borderRadius:8,padding:10,textAlign:"center"}}>
              <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:16,fontWeight:900,color:s.color,fontVariantNumeric:"tabular-nums"}}>{s.val}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:3}}>{s.sub}</div>
            </div>
          ))}
        </div>
        {/* Progress: 0–100% = covering diesel, beyond = profit */}
        <div style={{marginBottom:4}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:10}}>
            <span style={{color:C.muted}}>Break-even: {fmt(breakEvenPoint)}</span>
            <span style={{color:coveredDiesel?C.sage:C.gold}}>{coveredDiesel ? `✓ Diesel covered — profit: ${fmt(profitAboveCost)}` : `Need ${fmt(breakEvenPoint-totalCollected)} more to cover diesel`}</span>
          </div>
          <div style={{background:C.border,borderRadius:5,height:8,overflow:"hidden"}}>
            <div style={{width:`${Math.min(profitProgress,100)}%`,
              background:coveredDiesel?`linear-gradient(90deg,${C.sage},${C.sage})`:`linear-gradient(90deg,${C.sky},${C.gold})`,
              height:"100%",borderRadius:5,transition:"width 0.4s"}}/>
          </div>
        </div>
        <div style={{fontSize:10,color:C.muted,marginTop:4}}>
          Avg daily collection: {fmt(Math.round(estimatedDailyAvg))} · {(posho.collectHistory||[]).length} collection entries
        </div>
        <Alert2 msg={`How it works: KSh 5,000 diesel → earns KSh 10,000+ → profit = collected − diesel − wages. Record every collection to track your real profit.`} type="warn"/>
      </Card>

      {/* Flour Price Tracker */}
      <Card style={{gridColumn:"1/-1",border:`1px solid ${C.gold}33`}}>
        <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          🌾 Flour Processing Prices (fluctuating)
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:12}}>
          <div style={{background:C.surface,borderRadius:8,padding:12,textAlign:"center"}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>BEST GRADE 1 — Current</div>
            <div style={{fontSize:28,fontWeight:900,color:C.gold}}>KSh {currentPrices.grade1}<span style={{fontSize:13,color:C.muted}}>/kg</span></div>
            <div style={{fontSize:10,color:C.muted,marginTop:4}}>Best flour, highest charge</div>
          </div>
          <div style={{background:C.surface,borderRadius:8,padding:12,textAlign:"center"}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>GRADE 2 — Current</div>
            <div style={{fontSize:28,fontWeight:900,color:C.sky}}>KSh {currentPrices.grade2}<span style={{fontSize:13,color:C.muted}}>/kg</span></div>
            <div style={{fontSize:10,color:C.muted,marginTop:4}}>Standard flour, lower charge</div>
          </div>
        </div>
        <div style={{background:C.surface,borderRadius:8,padding:12,marginBottom:10}}>
          <div style={{fontSize:10,color:C.gold,fontWeight:700,marginBottom:8}}>UPDATE PRICE (when price changes)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
            <div>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Date</div>
              <Inp type="date" value={priceDate} onChange={e=>setPriceDate(e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Grade 1 new price (KSh/kg)</div>
              <Inp type="number" placeholder={currentPrices.grade1} value={newGrade1} onChange={e=>setNewGrade1(e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Grade 2 new price (KSh/kg)</div>
              <Inp type="number" placeholder={currentPrices.grade2} value={newGrade2} onChange={e=>setNewGrade2(e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Reason (optional)</div>
              <Inp placeholder="e.g. season change" value={priceNote} onChange={e=>setPriceNote(e.target.value)}/>
            </div>
          </div>
          <Btn onClick={updateFlourPrice} style={{marginTop:8,width:"100%"}}>RECORD PRICE CHANGE</Btn>
        </div>
        {/* Price history */}
        <div style={{maxHeight:160,overflowY:"auto"}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:6,textTransform:"uppercase"}}>Price History</div>
          {[...flourPrices].reverse().map((p,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"5px 0",borderBottom:`1px solid ${C.border}22`}}>
              <div>
                <span style={{fontSize:11,fontWeight:600}}>{p.date}</span>
                {p.note && <span style={{fontSize:10,color:C.muted}}> — {p.note}</span>}
              </div>
              <div style={{display:"flex",gap:14}}>
                <span style={{fontSize:11,color:C.gold}}>G1: KSh {p.grade1}/kg</span>
                <span style={{fontSize:11,color:C.sky}}>G2: KSh {p.grade2}/kg</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{fontSize:11,color:C.clay,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Add Diesel Purchase
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Date</div>
            <Inp type="date" value={dieselDate} onChange={e=>setDieselDate(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Amount (KSh)</div>
            <Inp type="number" placeholder="0" value={dieselAmt} onChange={e=>setDieselAmt(e.target.value)}/>
          </div>
        </div>
        <Btn onClick={addDiesel} color={C.clay} style={{width:"100%"}}>RECORD DIESEL</Btn>
        <div style={{marginTop:12}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Part-Time Worker Wage</div>
          <div style={{display:"flex",gap:8}}>
            <Inp type="number" placeholder="0" value={partTimeWage} onChange={e=>setPartTimeWage(e.target.value)}/>
            <Btn onClick={addWage} color={C.faint} style={{padding:"8px 12px",color:C.muted}}>+</Btn>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:11,color:C.sage,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Record Collection
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Date</div>
            <Inp type="date" value={collectDate} onChange={e=>setCollectDate(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Amount Collected (KSh)</div>
            <Inp type="number" placeholder="700" value={collected} onChange={e=>setCollected(e.target.value)}/>
          </div>
        </div>
        <Btn onClick={addCollected} style={{width:"100%"}}>RECORD COLLECTION</Btn>

        <div style={{marginTop:12,maxHeight:120,overflowY:"auto"}}>
          {(posho.collectHistory||[]).slice().reverse().map((h,i)=>(
            <Row2 key={i} label={h.date} value={fmt(h.amount)} color={C.gold} small/>
          ))}
        </div>
      </Card>

      <Card style={{gridColumn:"1/-1"}}>
        <Alert2 msg={`Diesel cost: ${fmt(totalDiesel)} · Collected: ${fmt(totalCollected)} · Net profit so far: ${fmt(netProfit)}. Keep recording daily collections to track your true profit.`} type="warn"/>
        <Alert2 msg="Revenue guide: Grade 1 KSh 17/kg → 100kg/day = KSh 1,700/day. Grade 2 KSh 9/kg → 100kg/day = KSh 900/day. Record kg ground daily to know if diesel is yielding proper return." type="warn"/>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: CREDIT BOOK
// ═══════════════════════════════════════════════════════════════════════════════
function CreditBook({credits, setCredits}) {
  const [name, setName]   = useState("");
  const [amt, setAmt]     = useState("");
  const [date, setDate]   = useState(today());
  const [note, setNote]   = useState("");

  const outstanding = credits.filter(c=>!c.paid);
  const totalOut    = outstanding.reduce((s,c)=>s+c.amount,0);
  const headroom    = Math.max(0, 4000 - totalOut);

  const add = () => {
    if (!name||!amt) return;
    if (totalOut + (parseFloat(amt)||0) > 4000) {
      alert(`Credit limit KSh 4,000 reached. Current: ${fmt(totalOut)}. Clear existing credit first.`);
      return;
    }
    const nc = [...credits, {id:Date.now(),date,name,amount:parseFloat(amt)||0,paid:false,note}];
    setCredits(nc); storeSet(SK.credits, nc);
    setName(""); setAmt(""); setNote("");
  };

  const markPaid = id => {
    const nc = credits.map(c=>c.id===id?{...c,paid:true,paidDate:today()}:c);
    setCredits(nc); storeSet(SK.credits, nc);
  };

  const partialPay = (id, partial) => {
    const nc = credits.map(c=>c.id===id
      ? {...c, amount:Math.max(0,c.amount-(parseFloat(partial)||0)),
          paid:(c.amount-(parseFloat(partial)||0))<=0}
      : c);
    setCredits(nc); storeSet(SK.credits, nc);
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Card>
        <div style={{fontSize:11,color:C.clay,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Credit Status
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:9,color:C.muted,textTransform:"uppercase"}}>Outstanding</div>
            <div style={{fontSize:18,fontWeight:900,color:totalOut>=3500?C.clay:C.gold}}>{fmt(totalOut)}</div>
          </div>
          <div>
            <div style={{fontSize:9,color:C.muted,textTransform:"uppercase"}}>Credit Headroom</div>
            <div style={{fontSize:18,fontWeight:900,color:headroom<500?C.clay:C.sage}}>{fmt(headroom)}</div>
          </div>
          <div>
            <div style={{fontSize:9,color:C.muted,textTransform:"uppercase"}}>Debtors</div>
            <div style={{fontSize:18,fontWeight:900,color:C.text}}>{outstanding.length}</div>
          </div>
        </div>
        <div style={{background:C.border,borderRadius:5,height:7,overflow:"hidden",marginBottom:6}}>
          <div style={{width:`${Math.min((totalOut/4000)*100,100)}%`,
            background:totalOut>=3500?`linear-gradient(90deg,${C.clay},${C.clay})`:`linear-gradient(90deg,${C.goldDim},${C.gold})`,
            height:"100%",borderRadius:5}}/>
        </div>
        <div style={{fontSize:10,color:C.muted}}>{((totalOut/4000)*100).toFixed(0)}% of KSh 4,000 limit used</div>
        {totalOut>=3500 && <Alert2 msg="STOP. Do not give more credit. Chase existing debtors first." type="red"/>}
      </Card>

      <Card>
        <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Add Credit Entry
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Customer Name</div>
            <Inp placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Amount (KSh)</div>
            <Inp type="number" placeholder="0" value={amt} onChange={e=>setAmt(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Date</div>
            <Inp type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Note</div>
            <Inp placeholder="What they took" value={note} onChange={e=>setNote(e.target.value)}/>
          </div>
        </div>
        <Btn onClick={add} style={{width:"100%"}}>ADD CREDIT</Btn>
      </Card>

      <Card style={{gridColumn:"1/-1"}}>
        <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Credit Book — Outstanding
        </div>
        {outstanding.length===0 && <div style={{color:C.sage,fontSize:12}}>✓ No outstanding credit. Clean slate.</div>}
        {outstanding.map(c=>(
          <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"8px 0",borderBottom:`1px solid ${C.border}22`}}>
            <div>
              <div style={{fontSize:13,fontWeight:700}}>{c.name}</div>
              <div style={{fontSize:10,color:C.muted}}>{c.date} {c.note && "· "+c.note}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:800,color:C.clay}}>{fmt(c.amount)}</span>
              <Btn onClick={()=>markPaid(c.id)} color={C.sage} style={{padding:"4px 10px",fontSize:11}}>Paid</Btn>
            </div>
          </div>
        ))}
        {credits.filter(c=>c.paid).length>0 && (
          <div style={{marginTop:12}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:6,textTransform:"uppercase"}}>Cleared</div>
            {credits.filter(c=>c.paid).slice(-5).map(c=>(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",
                padding:"5px 0",opacity:.5}}>
                <span style={{fontSize:12}}>{c.name} — {c.date}</span>
                <div style={{display:"flex",gap:8}}>
                  <span style={{fontSize:12,color:C.sage}}>{fmt(c.amount)}</span>
                  <Tag label="Cleared" color={C.sage}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: FAMILY CONSUMPTION
// ═══════════════════════════════════════════════════════════════════════════════
function FamilyConsumption({famConsump, setFamConsump, dailyLogs}) {
  const [date, setDate]   = useState(today());
  const [amt, setAmt]     = useState("300");
  const [items, setItems] = useState("");

  const add = () => {
    const fc = [...famConsump, {id:Date.now(),date,amount:parseFloat(amt)||300,items,note:"Manual entry"}];
    setFamConsump(fc); storeSet(SK.famConsump, fc);
    setAmt("300"); setItems("");
  };

  const total30  = famConsump.slice(-30).reduce((s,f)=>s+(f.amount||0),0);
  const total7   = famConsump.slice(-7).reduce((s,f)=>s+(f.amount||0),0);
  const avgDaily = famConsump.length>0 ? (famConsump.reduce((s,f)=>s+(f.amount||0),0)/famConsump.length) : 300;

  // Impact: how much of profit does family eat?
  const w7Profit = dailyLogs.slice(-7).reduce((s,l)=>s+(l.netProfit||0),0);
  const famImpact = w7Profit > 0 ? ((total7/w7Profit)*100).toFixed(0) : "—";

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Card>
        <div style={{fontSize:11,color:C.clay,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Family Consumption Impact
        </div>
        <Row2 label="Last 7 days total"  value={fmt(total7)}         color={C.clay}/>
        <Row2 label="Last 30 days total" value={fmt(total30)}        color={C.clay}/>
        <Row2 label="Daily average"      value={fmt(Math.round(avgDaily))} color={C.clay}/>
        <Row2 label="Budget"             value="KSh 300/day"         color={C.muted}/>
        <Row2 label="Monthly budget"     value="KSh 9,000"           color={C.muted}/>
        <Row2 label="% of weekly profit" value={famImpact+"%"}       color={parseFloat(famImpact)>20?C.clay:C.sage}/>
        {avgDaily > 400 && <Alert2 msg={`Avg family consumption KSh ${Math.round(avgDaily)}/day exceeds KSh 300 budget. Over 30 days this costs extra ${fmt(Math.round((avgDaily-300)*30))} vs budget.`} type="red"/>}
        <div style={{marginTop:10,background:C.surface,borderRadius:7,padding:10,fontSize:11,color:C.muted,lineHeight:1.6}}>
          <strong style={{color:C.text}}>Rule:</strong> Track every item taken — sugar (KSh 160/kg), tea leaves (KSh 30/pkt), milk (KSh 35/800ml). These are real costs. They reduce your stock without appearing in sales.
        </div>
      </Card>

      <Card>
        <div style={{fontSize:11,color:C.clay,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Record Today's Family Consumption
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Date</div>
          <Inp type="date" value={date} onChange={e=>setDate(e.target.value)}/>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Amount (KSh)</div>
          <Inp type="number" placeholder="300" value={amt} onChange={e=>setAmt(e.target.value)}/>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Items taken (optional)</div>
          <Inp placeholder="e.g. 1kg sugar, 2 Tuzo milk, tea" value={items} onChange={e=>setItems(e.target.value)}/>
        </div>
        <Btn onClick={add} color={C.clay} style={{width:"100%"}}>RECORD CONSUMPTION</Btn>
      </Card>

      <Card style={{gridColumn:"1/-1"}}>
        <div style={{fontSize:11,color:C.clay,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          History
        </div>
        {famConsump.slice(-20).reverse().map((f,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",
            padding:"5px 0",borderBottom:`1px solid ${C.border}22`}}>
            <div>
              <span style={{fontSize:12}}>{f.date}</span>
              {f.items && <span style={{fontSize:10,color:C.muted}}> — {f.items}</span>}
            </div>
            <span style={{fontSize:12,fontWeight:700,color:C.clay}}>{fmt(f.amount)}</span>
          </div>
        ))}
        {famConsump.length===0 && <div style={{color:C.muted,fontSize:12}}>No entries yet. Daily entry auto-records KSh 300.</div>}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PERSONAL USE (money taken for personal spending)
// ═══════════════════════════════════════════════════════════════════════════════
function PersonalUse({personalUse, setPersonalUse, dailyLogs, savings}) {
  const [date, setDate]     = useState(today());
  const [amt, setAmt]       = useState("");
  const [purpose, setPurpose] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [advice, setAdvice]  = useState(null);
  const [loading, setLoading]= useState(false);

  const PERSONAL_CATS = ["Shopping","Food/Restaurant","Transport","Clothing","Electronics","Health","Entertainment","Other"];

  const add = () => {
    if (!amt) return;
    const entry = {id:Date.now(), date, amount:parseFloat(amt)||0, purpose, category};
    const updated = [...personalUse, entry];
    setPersonalUse(updated); storeSet(SK.personalUse, updated);
    setAmt(""); setPurpose("");
  };

  const remove = (id) => {
    if (!window.confirm("Delete this entry?")) return;
    const updated = personalUse.filter(e=>e.id!==id);
    setPersonalUse(updated); storeSet(SK.personalUse, updated);
  };

  const total7   = personalUse.slice(-20).filter(e=>{
    const d=new Date(e.date), now=new Date(); return (now-d)/(1000*60*60*24)<=7;
  }).reduce((s,e)=>s+(e.amount||0),0);
  const total30  = personalUse.slice(-60).filter(e=>{
    const d=new Date(e.date), now=new Date(); return (now-d)/(1000*60*60*24)<=30;
  }).reduce((s,e)=>s+(e.amount||0),0);
  const totalAll = personalUse.reduce((s,e)=>s+(e.amount||0),0);

  // by category
  const byCat = PERSONAL_CATS.map(cat=>({
    cat, total: personalUse.filter(e=>e.category===cat).reduce((s,e)=>s+(e.amount||0),0)
  })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  const w7Profit = dailyLogs.slice(-7).reduce((s,l)=>s+(l.netProfit||0),0);
  const personalPct = w7Profit>0 ? ((total7/w7Profit)*100).toFixed(0) : "—";

  // AI savings advisor
  const getSavingsAdvice = async () => {
    setLoading(true); setShowAdvisor(true);
    const last7Days  = dailyLogs.slice(-7);
    const w7Sales    = last7Days.reduce((s,l)=>s+(l.shopSales||0)+(l.pochiSales||0),0);
    const w7Expenses = last7Days.reduce((s,l)=>s+(l.restocking||0)+(l.transport||0)+(l.utilities||0)+(l.other||0),0);
    const w7Fam      = last7Days.reduce((s,l)=>s+(l.famConsump||0),0);
    const w7Withdraw = last7Days.reduce((s,l)=>s+(l.withdrawals||0),0);
    const avgDailyProfit = w7Profit/Math.max(1,last7Days.length);

    const prompt = `You are a sharp Kenyan duka business advisor. Give DIRECT, NUMBER-SPECIFIC advice.

Business data — last 7 days:
- Sales (shop+pochi): KSh ${w7Sales}
- Net Profit: KSh ${w7Profit} (avg KSh ${Math.round(avgDailyProfit)}/day)
- Family consumption: KSh ${w7Fam} (KSh ${Math.round(w7Fam/7)}/day)
- Personal withdrawals from daily entry: KSh ${w7Withdraw}
- Personal use (personal spending logged): KSh ${total7} this week
- Total personal spending (withdrawals + personal use): KSh ${w7Withdraw+total7}
- Business expenses (restocking, transport, etc): KSh ${w7Expenses}
- Current savings: KSh ${savings||0}
- Days of data logged: ${dailyLogs.length}

Top personal spending categories this week: ${byCat.slice(0,3).map(c=>c.cat+": KSh "+c.total).join(", ") || "none logged yet"}

Give me:
1. RECOMMENDED WEEKLY SAVE AMOUNT: Give a specific KSh figure based on this performance. Be realistic.
2. MAX PERSONAL USE BUDGET: What is the safe weekly personal spending limit?
3. ONE ACTION: One specific thing to do to improve savings rate.
4. HONEST ASSESSMENT: Is this business performing well enough to save meaningfully? Be blunt in 2 sentences.

Keep it under 120 words. Use KSh numbers. No fluff.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          messages:[{role:"user",content:prompt}]
        })
      });
      const data = await res.json();
      const text = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("") || "Could not generate advice.";
      setAdvice(text);
    } catch(e) {
      setAdvice("Could not connect to advisor. Check your internet connection.");
    }
    setLoading(false);
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      {/* Summary */}
      <Card>
        <div style={{fontSize:11,color:C.clay,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          💸 Personal Use Summary
        </div>
        <Row2 label="This week"       value={fmt(total7)}  color={C.clay}/>
        <Row2 label="Last 30 days"    value={fmt(total30)} color={C.clay}/>
        <Row2 label="All time"        value={fmt(totalAll)} color={C.muted}/>
        <Row2 label="% of weekly profit" value={personalPct+"%"} color={parseFloat(personalPct)>25?C.clay:C.sage}/>
        {parseFloat(personalPct)>30 && <Alert2 msg={`Personal use is ${personalPct}% of weekly profit. This is high — cap at 20% to grow savings faster.`} type="red"/>}
        {byCat.length>0 && (
          <div style={{marginTop:10}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:6,textTransform:"uppercase"}}>By Category</div>
            {byCat.map(c=>(
              <div key={c.cat} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                <span style={{fontSize:11,color:C.muted}}>{c.cat}</span>
                <span style={{fontSize:11,fontWeight:700,color:C.clay}}>{fmt(c.total)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add entry */}
      <Card>
        <div style={{fontSize:11,color:C.clay,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Record Personal Spending
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Date</div>
          <Inp type="date" value={date} onChange={e=>setDate(e.target.value)}/>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Amount (KSh)</div>
          <Inp type="number" placeholder="0" value={amt} onChange={e=>setAmt(e.target.value)}/>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Category</div>
          <select value={category} onChange={e=>setCategory(e.target.value)}
            style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,
              padding:"7px 10px",color:C.text,fontSize:12,width:"100%",fontFamily:"inherit",outline:"none"}}>
            {PERSONAL_CATS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>What did you buy? (optional)</div>
          <Inp placeholder="e.g. shoes, medicine, airtime" value={purpose} onChange={e=>setPurpose(e.target.value)}/>
        </div>
        <Btn onClick={add} color={C.clay} style={{width:"100%"}}>RECORD SPENDING</Btn>
      </Card>

      {/* AI Savings Advisor */}
      <Card style={{gridColumn:"1/-1",border:`1px solid ${C.gold}44`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:11,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:.7}}>
            🤖 AI Savings Advisor
          </div>
          <Btn onClick={getSavingsAdvice} color={C.gold} style={{padding:"7px 16px",fontSize:12}}>
            {loading ? "Analysing..." : "Get Weekly Advice"}
          </Btn>
        </div>
        {!showAdvisor && (
          <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>
            After logging your weekly stock, click "Get Weekly Advice" to get a personalised recommendation on how much to save this week, your personal spending cap, and one action to improve profitability.
          </div>
        )}
        {loading && (
          <div style={{background:C.surface,borderRadius:8,padding:14}}>
            <div style={{fontSize:12,color:C.muted,textAlign:"center"}}>Studying your metrics...</div>
          </div>
        )}
        {advice && !loading && (
          <div style={{background:C.surface,borderRadius:8,padding:14}}>
            <div style={{fontSize:13,color:C.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{advice}</div>
            <div style={{marginTop:8,fontSize:10,color:C.muted}}>Based on last {dailyLogs.length} days of data · {today()}</div>
          </div>
        )}
      </Card>

      {/* History */}
      <Card style={{gridColumn:"1/-1"}}>
        <div style={{fontSize:11,color:C.clay,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          History
        </div>
        {personalUse.length===0 && <div style={{color:C.muted,fontSize:12}}>No personal spending recorded yet.</div>}
        {[...personalUse].reverse().slice(0,30).map((e,i)=>(
          <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"6px 0",borderBottom:`1px solid ${C.border}22`}}>
            <div>
              <div style={{fontSize:12}}>{e.date} <span style={{color:C.muted,fontSize:10}}>— {e.category}</span></div>
              {e.purpose && <div style={{fontSize:10,color:C.muted}}>{e.purpose}</div>}
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:700,color:C.clay}}>{fmt(e.amount)}</span>
              <button onClick={()=>remove(e.id)} style={{background:"none",border:"none",
                color:C.clay,cursor:"pointer",fontSize:13,opacity:.5}}>×</button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: CAPITAL & SAVINGS
// ═══════════════════════════════════════════════════════════════════════════════
function CapitalAndSavings({capital, setCapital, savings, setSavings, dailyLogs}) {
  const [src, setSrc]     = useState("");
  const [amt, setAmt]     = useState("");
  const [date, setDate]   = useState(today());
  const [saveAmt, setSaveAmt]= useState("");

  const addCapital = () => {
    if (!src||!amt) return;
    const nc = [...capital, {id:Date.now(),date,source:src,amount:parseFloat(amt)||0}];
    setCapital(nc); storeSet(SK.capital, nc);
    setSrc(""); setAmt("");
  };

  const addSavings = () => {
    const newTotal = (savings||0) + (parseFloat(saveAmt)||0);
    setSavings(newTotal); storeSet(SK.savings, newTotal);
    setSaveAmt("");
  };

  const totalCapital = capital.reduce((s,c)=>s+c.amount,0);
  const avgProfit30  = dailyLogs.slice(-30).length
    ? dailyLogs.slice(-30).reduce((s,l)=>s+(l.netProfit||0),0)/dailyLogs.slice(-30).length : 0;
  const savingsRate  = 0.30;
  const daysTo200k   = avgProfit30>0 ? Math.ceil((200000-(savings||0))/(avgProfit30*savingsRate)) : null;
  const daysTo300k   = avgProfit30>0 ? Math.ceil((300000-(savings||0))/(avgProfit30*savingsRate)) : null;
  const daysTo500k   = avgProfit30>0 ? Math.ceil((500000-(savings||0))/(avgProfit30*savingsRate)) : null;

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Card>
        <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Savings Progress
        </div>
        {[{goal:200000,label:"KSh 200K"},{goal:300000,label:"KSh 300K"},{goal:500000,label:"KSh 500K"}].map(g=>{
          const pctDone = Math.min(((savings||0)/g.goal)*100,100);
          const days = avgProfit30>0 ? Math.ceil((g.goal-(savings||0))/(avgProfit30*savingsRate)) : null;
          return (
            <div key={g.goal} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:700}}>{g.label}</span>
                <span style={{fontSize:11,color:C.muted}}>{days ? `~${days} days` : "—"}</span>
              </div>
              <div style={{background:C.border,borderRadius:4,height:6,overflow:"hidden"}}>
                <div style={{width:`${pctDone}%`,
                  background:`linear-gradient(90deg,${C.goldDim},${C.gold})`,height:"100%",borderRadius:4}}/>
              </div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>
                {fmt(savings||0)} of {fmt(g.goal)} — {pctDone.toFixed(1)}%
              </div>
            </div>
          );
        })}
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <Inp type="number" placeholder="Add to savings..." value={saveAmt}
            onChange={e=>setSaveAmt(e.target.value)}/>
          <Btn onClick={addSavings} style={{padding:"8px 14px"}}>+SAVE</Btn>
        </div>
      </Card>

      <Card>
        <div style={{fontSize:11,color:C.sage,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          External Capital Tracker
        </div>
        <Row2 label="Total Injected" value={fmt(totalCapital)} color={C.sage}/>
        <div style={{marginTop:10,marginBottom:8}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:6}}>RECORD NEW INJECTION</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <Inp placeholder="Source (sold item, gift...)" value={src} onChange={e=>setSrc(e.target.value)}/>
            <Inp type="number" placeholder="Amount" value={amt} onChange={e=>setAmt(e.target.value)}/>
          </div>
          <Inp type="date" value={date} onChange={e=>setDate(e.target.value)} style={{marginBottom:8}}/>
          <Btn onClick={addCapital} color={C.sage} style={{width:"100%"}}>RECORD</Btn>
        </div>
        <div style={{maxHeight:180,overflowY:"auto"}}>
          {capital.map((c,i)=>(
            <Row2 key={i} label={c.date+" — "+c.source} value={fmt(c.amount)} color={C.sage} small/>
          ))}
          {capital.length===0 && <div style={{color:C.muted,fontSize:12}}>No external capital recorded.</div>}
        </div>
      </Card>

      <Card style={{gridColumn:"1/-1"}}>
        <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.7}}>
          Projections (at 30% save rate, avg profit {fmt(Math.round(avgProfit30))}/day)
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[
            {label:"Best Case (50% save)",   days:avgProfit30>0?Math.ceil((200000-(savings||0))/(avgProfit30*.5)):null, goal:"KSh 200K"},
            {label:"Realistic (30% save)",   days:avgProfit30>0?Math.ceil((200000-(savings||0))/(avgProfit30*.3)):null, goal:"KSh 200K"},
            {label:"Worst Case (15% save)",  days:avgProfit30>0?Math.ceil((200000-(savings||0))/(avgProfit30*.15)):null,goal:"KSh 200K"},
          ].map((s,i)=>(
            <div key={i} style={{background:C.surface,borderRadius:8,padding:12}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:20,fontWeight:900,color:C.gold}}>{s.days ? `${s.days}d` : "—"}</div>
              <div style={{fontSize:10,color:C.muted}}>to {s.goal}</div>
            </div>
          ))}
        </div>
        {!dailyLogs.length && <Alert2 msg="Record at least 7 days of data for accurate projections." type="warn"/>}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  {key:"dash",       label:"Overview"},
  {key:"daily",      label:"Daily Entry"},
  {key:"inventory",  label:"Inventory"},
  {key:"passion",    label:"Passion Fruit"},
  {key:"posho",      label:"Posho Mill"},
  {key:"credit",     label:"Credit Book"},
  {key:"family",     label:"Family Use"},
  {key:"personal",   label:"Personal Use"},
  {key:"capital",    label:"Capital & Savings"},
];

export default function App() {
  const [tab, setTab]           = useState("dash");
  const [loaded, setLoaded]     = useState(false);
  const [stock, setStock]       = useState(INITIAL_STOCK);
  const [dailyLogs, setDailyLogs]= useState([]);
  const [credits, setCredits]   = useState([]);
  const [capital, setCapital]   = useState([]);
  const [passion, setPassion]   = useState({kgInStore:130, batches:[], diesel:5000});
  const [posho, setPosho]       = useState({totalDiesel:5000,totalCollected:2400,totalWages:0,
    expectedTotal:15000,dieselHistory:[{date:"2026-06-09",amount:5000}],
    collectHistory:[{date:"2026-06-11",amount:700},{date:"2026-06-12",amount:1700}],
    flourPrices:[{date:"2026-06-12",grade1:17,grade2:9,note:"Starting price"}]});
  const [savings, setSavings]   = useState(0);
  const [famConsump, setFamConsump]= useState([]);
  const [personalUse, setPersonalUse]= useState([]);

  useEffect(()=>{
    (async()=>{
      const s  = await storeGet(SK.stock,    INITIAL_STOCK);
      const d  = await storeGet(SK.dailyLogs,[]);
      const cr = await storeGet(SK.credits,  []);
      const ca = await storeGet(SK.capital,  []);
      const pa = await storeGet(SK.passion,  {kgInStore:130,batches:[],diesel:5000});
      const po = await storeGet(SK.posho,    {totalDiesel:5000,totalCollected:2400,totalWages:0,
        expectedTotal:15000,dieselHistory:[{date:"2026-06-09",amount:5000}],
        collectHistory:[{date:"2026-06-11",amount:700},{date:"2026-06-12",amount:1700}],
        flourPrices:[{date:"2026-06-12",grade1:17,grade2:9,note:"Starting price"}]});
      const sv = await storeGet(SK.savings,  0);
      const fc = await storeGet(SK.famConsump,[]);
      const pu = await storeGet(SK.personalUse,[]);
      setStock(s); setDailyLogs(d); setCredits(cr); setCapital(ca);
      setPassion(pa); setPosho(po); setSavings(sv); setFamConsump(fc); setPersonalUse(pu);
      setLoaded(true);
    })();
  },[]);

  if (!loaded) return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{fontSize:24,fontWeight:900,letterSpacing:-1}}>
        <span style={{color:"#D4A843"}}>DUKA</span>
        <span style={{color:"#EDE8DF"}}> YANGU</span>
        <span style={{color:"#C0614A"}}> PRO</span>
      </div>
      <div style={{color:"#8A8278",fontSize:13}}>Loading your business data...</div>
      <div style={{width:120,height:3,background:"#312E29",borderRadius:3,overflow:"hidden"}}>
        <div style={{width:"60%",height:"100%",background:"#D4A843",borderRadius:3,
          animation:"none"}}/>
      </div>
      <div style={{fontSize:11,color:"#3A3730"}}>All records stored locally on this device</div>
    </div>
  );

  const totalStockVal = stock.reduce((s,p)=>s+(p.qty*p.sell),0);
  const lastLog = dailyLogs.length > 0 ? dailyLogs[dailyLogs.length-1] : null;

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Inter','Segoe UI',sans-serif",color:C.text}}>
      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,
        padding:"12px 20px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:900,fontSize:20,letterSpacing:-0.5,lineHeight:1.1}}>
                <span style={{color:C.gold}}>DUKA</span>
                <span style={{color:C.text}}> YANGU</span>
                <span style={{color:C.clay}}> PRO</span>
              </div>
              <div style={{fontSize:10,color:C.muted,letterSpacing:.5,marginTop:2}}>
                KWALE COUNTY · FULL BUSINESS INTELLIGENCE
              </div>
            </div>
            <div style={{display:"flex",gap:16,alignItems:"center"}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:.5}}>Stock Value</div>
                <div style={{fontSize:16,fontWeight:800,color:C.gold}}>{fmt(totalStockVal)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:.5}}>Days Logged</div>
                <div style={{fontSize:16,fontWeight:800,color:C.sage}}>{dailyLogs.length}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:.5}}>Last Entry</div>
                <div style={{fontSize:12,fontWeight:700,color:lastLog?C.sage:C.muted}}>
                  {lastLog ? lastLog.date : "None yet"}
                </div>
              </div>
            </div>
          </div>
          {/* Data status bar */}
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,
            padding:"4px 8px",background:C.bg,borderRadius:5,width:"fit-content"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:C.sage}}/>
            <span style={{fontSize:10,color:C.muted}}>
              Data saved locally on this device · {dailyLogs.length} daily records · {credits.filter(c=>!c.paid).length} open credits
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,overflowX:"auto"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",gap:2,padding:"0 16px"}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{
              padding:"10px 14px",border:"none",cursor:"pointer",
              fontSize:12,fontWeight:700,background:"transparent",
              whiteSpace:"nowrap",fontFamily:"inherit",
              color: tab===t.key ? C.gold : C.muted,
              borderBottom: tab===t.key ? `2px solid ${C.gold}` : "2px solid transparent",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"16px"}}>
        {tab==="dash"      && <Dashboard stock={stock} dailyLogs={dailyLogs} credits={credits}
          passion={passion} posho={posho} capital={capital} savings={savings} famConsump={famConsump}
          personalUse={personalUse}/>}
        {tab==="daily"     && <DailyEntry stock={stock} setStock={setStock}
          dailyLogs={dailyLogs} setDailyLogs={setDailyLogs}
          credits={credits} setCredits={setCredits}
          famConsump={famConsump} setFamConsump={setFamConsump}/>}
        {tab==="inventory" && <Inventory stock={stock} setStock={setStock}/>}
        {tab==="passion"   && <PassionFruit passion={passion} setPassion={setPassion}/>}
        {tab==="posho"     && <PoshoMill posho={posho} setPostho={setPosho}/>}
        {tab==="credit"    && <CreditBook credits={credits} setCredits={setCredits}/>}
        {tab==="family"    && <FamilyConsumption famConsump={famConsump} setFamConsump={setFamConsump} dailyLogs={dailyLogs}/>}
        {tab==="personal"  && <PersonalUse personalUse={personalUse} setPersonalUse={setPersonalUse} dailyLogs={dailyLogs} savings={savings}/>}
        {tab==="capital"   && <CapitalAndSavings capital={capital} setCapital={setCapital}
          savings={savings} setSavings={setSavings} dailyLogs={dailyLogs}/>}
      </div>
    </div>
  );
}
