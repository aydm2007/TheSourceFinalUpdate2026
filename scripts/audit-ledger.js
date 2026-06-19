const fs=require("fs")

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

const chained=

entries.filter(

e=>

e.hash&&
e.previous_hash

)

console.error(JSON.stringify({

total:entries.length,
chained:chained.length,
coverage:

(
chained.length/
entries.length
*100
).toFixed(2)

+"%"

}))
