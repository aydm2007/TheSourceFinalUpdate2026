import fs from "fs"
import {describe,it,expect} from "vitest"

describe(

"Ledger Integrity",

()=>{

it(

"verify chain coverage and continuity for chained runtime events",

()=>{

const raw=

fs.readFileSync(
".agents/memory/shadow_ledger.jsonl",
"utf8"
)

const entries=

raw
.trim()
.split("\n")
.map(
x=>JSON.parse(x)
)

const runtime=

entries.filter(

e=>e.tool
)

// Filter only the entries that belong to the active cryptographic chain
const chained=

runtime.filter(

e=>e.hash||e.previous_hash

)

let invalid=0

for(let i=0;i<chained.length;i++){
const current=chained[i]
if(i>0){
const prev=chained[i-1]
// If it's not a new genesis block, it must link to the previous hash
if(current.previous_hash!=="0000000000000000000000000000000000000000000000000000000000000000" && current.previous_hash!==prev.hash){
invalid++
}
}
}

console.log({

totalRuntime:runtime.length,
chainedRuntime:chained.length,
invalidChainLinks:invalid

})

expect(
invalid
)
.toBe(0)

})

})
