const fs=require("fs")
const crypto=require("crypto")

const files=[

".agents/skills/nexus-core/master.md"

]

for(

const file of files

){

const content=

fs.readFileSync(

file,
"utf8"

)

const hash=

crypto
.createHash("sha256")
.update(content)
.digest("hex")

console.error({

file,
hash

})

}
