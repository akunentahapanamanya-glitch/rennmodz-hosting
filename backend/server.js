const express = require("express")
const fetch = require("node-fetch")
const cors = require("cors")
const config = require("./config")

const app = express()
app.use(cors())
app.use(express.json())

let orders = []
let users = []

const panels = {
 "1gb": { ram:1024,disk:2048,cpu:50,price:2500 },
 "2gb": { ram:2048,disk:3072,cpu:80,price:4000 },
 "3gb": { ram:3072,disk:4096,cpu:100,price:6000 },
 "4gb": { ram:4096,disk:5120,cpu:120,price:7000 },
 "5gb": { ram:5120,disk:6144,cpu:150,price:8000 },
 "6gb": { ram:6144,disk:7168,cpu:180,price:9000 },
 "7gb": { ram:7168,disk:8192,cpu:200,price:10000 },
 "8gb": { ram:8192,disk:9216,cpu:230,price:11000 },
 "9gb": { ram:9216,disk:10240,cpu:250,price:12000 },
 "10gb":{ ram:10240,disk:11264,cpu:290,price:13000 },
 "15gb":{ ram:15360,disk:16384,cpu:350,price:15000 },
 "20gb":{ ram:20480,disk:21404,cpu:400,price:20000 }
}

const validUser = u => /^[a-z0-9]+$/.test(u)

app.post("/order", async (req,res)=>{
 const {username,plan} = req.body
 if(!validUser(username)) return res.status(400).json({error:"INVALID USERNAME"})

 const data = panels[plan]
 if(!data) return res.status(400).json({error:"INVALID PLAN"})

 const ref = username+"-"+Date.now()

 const qris = await fetch("https://api.pkasir.com/qris",{
  method:"POST",
  headers:{
   Authorization: config.pkasir.apikey,
   "Content-Type":"application/json"
  },
  body: JSON.stringify({
    slug: config.pkasir.slug,
    amount: data.price,
    reference: ref
  })
 }).then(r=>r.json())

 orders.push({ref,username,plan,status:"PENDING"})

 res.json(qris)
})

app.post("/webhook", async (req,res)=>{
 if(req.body.status !== "PAID") return res.send("OK")

 const ref = req.body.reference
 const order = orders.find(o=>o.ref===ref)
 if(!order) return res.send("OK")

 order.status = "PAID"

 const email = order.username+"@renn.modz"

 const user = await fetch(
  config.ptero.domain+"/api/application/users",{
   method:"POST",
   headers:{
    Authorization:"Bearer "+config.ptero.apikey,
    "Content-Type":"application/json"
   },
   body: JSON.stringify({
    email,
    username:order.username,
    first_name:order.username,
    last_name:"panel"
   })
 }).then(r=>r.json())

 users.push({email,id:user.id,plan:order.plan})

 res.send("DONE")
})

app.get("/admin/orders",(r,s)=>s.json(orders))
app.get("/admin/users",(r,s)=>s.json(users))

app.listen(3000,()=>console.log("RENN MODZ SYSTEM LIVE"))
