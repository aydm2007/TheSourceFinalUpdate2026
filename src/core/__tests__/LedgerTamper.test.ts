import crypto from "crypto"
import {describe,it,expect} from "vitest"

describe(
"Tamper Detection",
()=>{

it(

"should detect modified event",

()=>{

const event={

message:"original"

}

const hash=

crypto
.createHash("sha256")
.update(
JSON.stringify(event)
)
.digest("hex")

event.message="hacked"

const newHash=

crypto
.createHash("sha256")
.update(
JSON.stringify(event)
)
.digest("hex")

expect(
hash
)
.not.toBe(
newHash
)

})

})
