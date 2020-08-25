let nickname = localStorage.getItem("nickname")
let time = Date.now()
if (nickname) {
  document.getElementById('nickname').value = nickname
}

let oldState = []
let newState = []
let sprites = new Map()
let oAttributes = new Map()
let textures = new Map()
let destroing = []
let currentOffset = {
  x: 0,
  y: 0
}
let offsettingTo = {
  x: 0,
  y: 0
}
let me;
window.messages = []

function fetchTexture(path) {
  if (textures.get(path)) {
    return textures.get(path)
  } else {
    let texture = PIXI.Texture.from("/assets/" + path)
    textures.set(path, texture)
    return texture
  }
}

function genId(prefix) {
  if (!prefix) {
    prefix = "unk"
  }
  return prefix + Date.now().toString(16) + (Math.random() * 100000).toString(16)
}
document.getElementById('nickname').oninput = function() {
  nickname = document.getElementById('nickname').value
  localStorage.setItem("nickname", document.getElementById('nickname').value)
}
async function startGame() {
  window.app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight
  });
  document.getElementById("welcome").style.display = "none"
  document.getElementById("interface").style.display = "inline-block"
  app.view.id = "game"
  app.renderer.backgroundColor = 0x575757
  document.body.appendChild(app.view);
play()
}

async function play() {

  const background = new PIXI.TilingSprite(
   fetchTexture("druon-grid.png"),
    10000,
    10000,
  );
  app.stage.addChild(background);

  window.socket = io("/game")
  socket.emit("spawn", nickname)
  socket.on("disconnect",()=>{
    document.body.removeChild(app.view);
    // app.stage.destroy()
    // app.renderer.destroy()
    app.destroy()
    delete window.socket
   window.onkeyup=()=>{}
    window.onkeydown=()=>{}
  sprites = new Map()
  oAttributes = new Map()
    textures = new Map()
   destroing = []
   newState=[]
    document.getElementById("welcome").style.display = "inline-block"
    document.getElementById("interface").style.display = "none"
    clearInterval(pi);

Object.keys(PIXI.utils.TextureCache).forEach(function(texture) {  PIXI.utils.TextureCache[texture].destroy(true);});
  })
  socket.on("id", (id) => {
    window.id = id
  })
  app.stage.interactive = true
  socket.emit("pingx", Date.now())
  window.pi=setInterval(() => {
    time = Date.now()
    socket.emit("pingx", Date.now())
  }, 1000)
  socket.on("pongx", (ping) => {
    document.getElementById("ping").innerHTML = Date.now() - time + "ms"
  })
  app.stage.on("mousemove", (event) => {
    var dist_Y = (app.screen.height / 2) + currentOffset.y - event.data.global.y;
    var dist_X = (app.screen.width / 2) + currentOffset.x - event.data.global.x;
    var angle = Math.atan2(dist_Y, dist_X);

    socket.emit("rotate", angle)
  })

  app.stage.on("pointerdown", (event) => {
    socket.emit("shoting", true)
  })
  app.stage.on("pointerup", (event) => {
    socket.emit("shoting", false)
  })
  socket.on("upgrades", (objects) => {
    newState = objects
  })

  socket.on("chat-message", (id, message) => {
    let style = new PIXI.TextStyle({

      fill: "#776d8a",
      fontFamily: "Alata",
      fontSize: 18
    });
    let text = new PIXI.Text(message, style);
    text.anchor.set(0.5, 0.5)
    let author = sprites.get(id);

    let oMap = oAttributes.get(author.id)
    let bId = "message"
    if (oMap.get(bId)) {
      app.stage.removeChild(oMap.get(bId).sprite)
      clearTimeout(oMap.get(bId).timeout)
    }
    oMap.set(bId, {
      x: 0,
      y: -50,
      sprite: text,
      timeout: setTimeout(() => {
        oMap.delete(bId)
        app.stage.removeChild(text)
        oAttributes.set(author.id, oMap)
      }, 5000)
    })
    oAttributes.set(author.id, oMap)
    app.stage.addChild(text)


  })
  socket.on("leaders", (leaders) => {
    document.getElementById("leaderboard").innerHTML = "<h1>Leaderboard</h1>" + leaders
  })
  let chatting = false
  window.onkeydown = async (ev) => {
    if (chatting) {
      return handleChatting(ev)
    }
    if (ev.code == "KeyA") {
      socket.emit("move", "x", -1)
    } else if (ev.code == "KeyD") {
      socket.emit("move", "x", 1)
    } else if (ev.code == "KeyW") {
      socket.emit("move", "y", -1)
    } else if (ev.code == "KeyS") {
      socket.emit("move", "y", 1)
    } else if (ev.code == "Enter") {
      let chat = document.getElementById("chat")
      chat.style.display = "block"
      chat.focus()
      chatting = true
    }
  }
  async function handleChatting(ev) {
    if (ev.code == "Enter") {
      let chat = document.getElementById("chat")
      let message = chat.value;
      chat.value = ""
      chat.style.display = "none"
      chatting = false
      if (message.trim() == "") {
        return
      }
      socket.emit("chat-message", message)
    }
  }
  window.onkeyup = async (ev) => {
    if (ev.code == "KeyA" || ev.code == "KeyD") {
      socket.emit("move", "x", 0)
    } else if (ev.code == "KeyW" || ev.code == "KeyS") {
      socket.emit("move", "y", 0)
    }
  }

  app.ticker.add(async (delta) => {
    if(!socket){return}
    for (let obj of newState) {
      let sprite = sprites.get(obj.id)

      if (!sprite) {

        sprite = new PIXI.Sprite(fetchTexture("skins/" + obj.skin))

        sprite.id = obj.id
        sprite.anchor.set(0.5, 0.5)
        sprites.set(obj.id, sprite)
        app.stage.addChild(sprite)
        sprite.width = obj.width ? obj.width : obj.size
        sprite.height = obj.height ? obj.height : obj.size
        oAttributes.set(obj.id, new Map())
        if (obj.type == "PLAYER") {
          let nickStyle = new PIXI.TextStyle({

            fill: "#056676",
            fontFamily: "Alata",
            fontSize: 14
          });
          let xpStyle = new PIXI.TextStyle({

            fill: "#68b0ab",
            fontFamily: "Alata",
            fontSize: 12
          });
          let nickname = new PIXI.Text(obj.nickname, nickStyle);
          let xp = new PIXI.Text(obj.xp + "xp", xpStyle);
          nickname.anchor.set(0.5, 0.5)
          xp.anchor.set(0.5, 0.5)
          let oMap = oAttributes.get(obj.id)
          let healthFull = drawRect(0x4a7785, sprite.width / 2, 10)
          let healthCurrent = drawRect(0x38da4d, ((sprite.width / 2) / obj.maxHp) * obj.hp, 10)
          let oj = [{
              x: -xp.width / 2,
              y: 40,
              id: "nickname",
              sprite: nickname
            },
            {
              x: -sprite.width / 4,
              y: 60,
              id: "healthFull",
              sprite: healthFull
            },
            {
              x: -sprite.width / 4,
              y: 60,
              id: "healthCurrent",
              sprite: healthCurrent
            },
            {
              x: nickname.width - (xp.width / 2),
              y: 41,
              id: "xp",
              sprite: xp
            }
          ];
          oj.forEach(o => {
            oMap.set(o.id, o)
            app.stage.addChild(o.sprite)
          })

          oAttributes.set(obj.id, oMap)

        }
      }
      sprite.position.set(obj.x, obj.y)
      sprite.rotation = obj.rotation
      sprite.width = obj.width ? obj.width : obj.size
      sprite.height = obj.height ? obj.height : obj.size
      if (obj.id == id) {
        me = sprite
        offsettingTo = obj.velocity
        app.stage.pivot.set(currentOffset.x + me.position.x - (app.screen.width / 2), currentOffset.y + me.position.y - (app.screen.height / 2))
      }

      let attributes = oAttributes.get(obj.id)
      let vals = [...attributes.values()]
      vals.forEach((a) => {
        if (a.id == "xp") {
          a.sprite.text = obj.xp + "xp"
        } else if (a.id == "healthCurrent") {
          a.sprite.width = (sprite.width / 2) / obj.maxHp * obj.hp

          a.sprite.visible = !(obj.hp >= obj.maxHp)

        } else if (a.id == "healthFull") {
          a.sprite.visible = !(obj.hp >= obj.maxHp)
        }
        a.sprite.position.set(sprite.position.x + a.x, sprite.position.y + a.y)
      });

    }
    for (var prop in offsettingTo) {
      if (!currentOffset[prop]) {
        currentOffset[prop] = 0
      }

      if (offsettingTo[prop] > 0) {
        if (currentOffset[prop] < offsettingTo[prop]) {
          currentOffset[prop] += offsettingTo[prop] / 10
        }
        if (currentOffset[prop] > offsettingTo[prop]) {
          currentOffset[prop] -= offsettingTo[prop] / 10
        }
      } else if (offsettingTo[prop] < 0) {
        if (currentOffset[prop] > offsettingTo[prop]) {
          currentOffset[prop] += offsettingTo[prop] / 10
        }
        if (currentOffset[prop] < offsettingTo[prop]) {
          currentOffset[prop] -= offsettingTo[prop] / 10
        }
      } else if (currentOffset[prop].toFixed(1) !== 0) {
        let minuser = Math.abs(currentOffset[prop]) / 10 > 0.1 ? Math.abs(currentOffset[prop]) / 10 : 0.1
        currentOffset[prop] += currentOffset[prop] < 0 ? minuser : -minuser
      } else {
        currentOffset[prop] = 0
      }
    }
    let sa = [...sprites.values()]
    let toDestroy = sa.filter(s => {
      return !newState.find(o => o.id == s.id)
    })

    toDestroy.forEach((sprite, i) => {

      destroing.push(sprite)

      setTimeout(() => {
          if(!socket||!app.stage){return}
        let index = destroing.findIndex(s => s.id == sprite.id)

        destroing.splice(index, 1)
        sprites.delete(sprite.id)
        oAttributes.delete(sprite.id)
        app.stage.removeChild(sprite)

      }, 500)

    });
    destroing.forEach(sp => {
      if (!sp) {
        return
      }
      let aatr = oAttributes.get(sp.id);
      if(aatr){
        [...aatr.values()].forEach(v => {
          app.stage.removeChild(v.sprite);
        aatr.delete(v.id)
        })
        oAttributes.set(sp.id,aatr)
      }

      sp.alpha -= 0.03 * delta
      sp.scale.x += 0.01 * delta
      sp.scale.y += 0.01 * delta
    })

  })
  setInterval(() => {
    if (!me) {
      return
    }
    document.getElementById("cords").innerHTML = "X - " + me.position.x + " | Y - " + me.position.y
  }, 3000)
}
window.onresize = () => {
  app.renderer.resize(window.innerWidth, window.innerHeight);
}

function drawRect(color, width, height, borderSize, borderColor) {
  var graphics = new PIXI.Graphics();
  if (!borderSize) {
    borderSize = 0
  }
  if (!borderColor) {
    borderColor = 0x00000000
  }
  graphics.beginFill(color);

  graphics.lineStyle(borderSize, borderColor);

  graphics.drawRect(0, 0, width, height);
  return graphics

}
