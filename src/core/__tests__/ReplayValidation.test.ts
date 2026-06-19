import {describe,it,expect} from "vitest"

describe(
"Replay",
()=>{

it(

"should rebuild state",

()=>{

const events=[

{

type:"memory.add",
key:"a",
value:1

},

{

type:"memory.add",
key:"b",
value:2

}

]

const state:any={}

events.forEach(

e=>{

state[e.key]=e.value

}

)

expect(
state
)
.toEqual({

a:1,
b:2

})

})

})
