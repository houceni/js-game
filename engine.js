let mainCanvas = null
const canvas = []
let DeltaTime = 0
const OnStartFunctions = []
const ElementsAddedToScene = []

Math.Range = function(min,max){
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

const drawData = {
    type:String("arc"),
    x:0,
    y:0,
    radius:0,
    startAngle:0,
    endAngle:0,
    fillStyle:'#000',
    lineWidth:1,
    strokeStyle:'#000'
}

const gameComponent = {
    canvas:(mainCanvas,drawData) => {},
    physics:{
        weight:Number(),
        collision:{
            collide:Boolean(false),
            isFixed:Boolean(false),
            bounce:Boolean(false)
        }
    }
}

const Vector2Compare = (v1, v2) => v1.x === v2.x && v1.y === v2.y

const AudioComponent = {
    audios:[],
    poolSize:4,
    indexes:{},
    play:function(AudioResource){
        const r = AudioResource.getResource()
        const a = this.audios.filter(e => e.resource === r)

        let index = AudioComponent.indexes[r]
        if(typeof index === "undefined"){
            index = 0
        }
        const audio = a[index].AudioPlayer
        audio.currentTime = 0
        audio.play()
        AudioComponent.indexes[r] = (index + 1) % AudioComponent.poolSize
    }
}

const LightComponent = function(){

}

const BackgroundComponent = function(name,zIndex,canvasDrawData,metaData = {}){

    this.component = null

    BackgroundComponent.components.push({name,component:this})

    document.addEventListener("DOMContentLoaded",() => {
        addCanvas(name,zIndex)

        this.component = AddToScene({
            canvas: (canvas) => {
                const c = canvasDrawData(canvas)
                c.isBackground = true
                return c
            },
            physics: {
                weight: 0,
                collision: {
                    collide: false,
                    isFixed: true
                }
            },
            passive:true,
            layer:name,
            ...metaData
        },true)
        return this.component
    })

}
BackgroundComponent.components = []

const PointLightingComponent = function(canvasDrawData,metaData = {}){
    this.radius = 10
    this.color = "#FFF"

    if(!canvasDrawData)
        canvasDrawData = {}
    canvasDrawData.type = "PointLight"

    canvasDrawData.isAbsolute = true
    canvasDrawData.absolutePosition = new Vector2(0,0)


    this.getComponent = () => {
        return {
            ...metaData,
            canvas:() => (canvasDrawData),
            physics: {
                weight: 0,
                collision: {
                    collide: false,
                    isFixed: true
                }
            },
            passive: true,
            layer:"globalLightning"
        }

    }


}

const GlobalLightning = {
    addedToScene:false,
    update:null,
    color:null,
    onUpdate:function(fn){
        if(typeof fn === "function"){
            this.update = fn
        }
        this.addComponent()
    },
    setColor:color => {
        this.color = color
    },
    addComponent:function(){
        if(!this.addedToScene){
            AddToScene({
                canvas: (canvas) => {
                    const c = -(canvas.height / 2) - 50
                    return {
                        type: "rect",
                        position:new Vector2(-(canvas.width / 2) - 50,c),
                        width: canvas.width + 100,
                        height: canvas.height + 100
                    }
                },
                onUpdate:transform => {
                    if(typeof this.update === "function"){
                        this.update(transform)
                    }
                    transform.position.y = Camera.bounds.p1.y - 50
                    transform.position.x = Camera.bounds.p1.x - 50
                },
                physics: {
                    weight: 0,
                    collision: {
                        collide: false,
                        isFixed: true
                    }
                },
                passive:true,
                layer:"globalLightning"
            })
            this.addedToScene = true
        }

    }
}

const Background = {
    resource:null,
    setBackground:resource => {
        Background.resource = resource
    }
}

const Destroy = component => {
    const i = ElementsAddedToScene.findIndex(e => e._id === component._id)
    if(i !== -1) {
        ElementsAddedToScene.splice(i, 1)
        return true
    }
    return false
}

const Grid = function(canvasDrawData,children,metaData = {}){

    this.tiles = []

    this.component = {}

    this.SetTile = tile => {
        const addedTile = AddToScene(tile,true,this.component)
        this.tiles.push(addedTile)
        drawForCamera("main")
    }

    this.removeTileAt = position => {
        const tile = this.tiles.find(t => Vector2Compare(t.canvasDrawData.gridPosition,position))
        return this.removeTile(tile)
    }

    this.getTileAt = position => this.tiles.find(t => Vector2Compare(t.canvasDrawData.gridPosition,position))

    this.removeTile = tile => {
        const index = ElementsAddedToScene.findIndex(e => e._id === tile._id)
        const tileSize = this.component.canvasDrawData.tileSize
        if(index !== -1) {
            const tilePosition = new Vector2(ElementsAddedToScene[index].canvasDrawData.position.x + tileSize,ElementsAddedToScene[index].canvasDrawData.position.y+ tileSize)
            const tileIndex = this.tiles.findIndex(e => e._id === tile._id)
            if(tileIndex !== -1)
                this.tiles.splice(tileIndex,1)
            ElementsAddedToScene.splice(index, 1)
            drawFromPosition("main",{
                p1:tilePosition,
                p2:new Vector2(tilePosition.x + tileSize,tilePosition.y + tileSize)
            },null,false)
        }
    }

    this.removeMultiples = tiles => {
        tiles.forEach(tile => {
            const index = ElementsAddedToScene.findIndex(e => e._id === tile._id)
            if(index !== -1) {
                const tileIndex = this.tiles.findIndex(e => e._id === tile._id)
                if (tileIndex !== -1)
                    this.tiles.splice(tileIndex, 1)
                ElementsAddedToScene.splice(index, 1)
            }
        })
        drawForCamera("main")
    }

    this.getTileFromMousePosition = position => {
        if(position instanceof Vector2){
            const p = this.getTilePositionFromMousePosition(position)
            return this.tiles.find(e => Vector2Compare(e.canvasDrawData.gridPosition,p))
        }
        throw new Error("Position must be an instance of Vector2")
    }

    this.getTilePositionFromMousePosition = position => {
        if(position instanceof Vector2){
            const tileSize = this.component.canvasDrawData.tileSize
            let x = float2int(Camera.bounds.p1.x + MousePosition.x - this.component.canvasDrawData.position.x)
            let y = float2int(float2int(Camera.bounds.p1.y) + MousePosition.y - this.component.canvasDrawData.position.y)
            if(x < 0){
                x = float2int((x / tileSize) - 1)
            }else{
                x = float2int(x / tileSize)
            }
            if(y < 0){
                y = float2int((y / tileSize) - 1)
            }else{
                y = float2int(y / tileSize)
            }
            return new Vector2(x, y)
        }
        throw new Error("Position must be an instance of Vector2")
    }

    this.getTileFromPosition = position => {
        if(position instanceof Vector2)
            return this.tiles.find(e => Vector2Compare(e.canvasDrawData.gridPosition,position))
        throw new Error("Position must be an instance of Vector2")
    }

    this.getComponent = () => {
        this.component = {
            ...metaData,
            canvas:()=> {
                let c = canvasDrawData(mainCanvas)
                if(!c)
                    c = {}
                c.type = "Grid"
                return c
            },
            children:() => {
                return children()
            },
            physics: {
                weight: 0,
                collision: {
                    collide: false,
                    isFixed: true
                }
            },
            layer:"main",
            grid:this
        }
        return this.component
    }
}

const Tile = function(canvasDrawData,metaData = {}) {
    if(!canvasDrawData)
        canvasDrawData = {}
    canvasDrawData.type = "Tile"

    return {
        ...metaData,
        canvas:()=> (canvasDrawData),
        physics: {
            weight: 0,
            collision: {
                collide: false,
                isFixed: true
            }
        },
        passive: true,
        layer:"main"
    }
}

const Particles = function(type,height,width,maxParticles,maxDuration,speedMin,speedMax,canvasDrawData,hasCollision = false){
    this.type = type
    this.maxParticles = maxParticles
    this.maxDuration = maxDuration
    this.speedMin = speedMin
    this.speedMax = speedMax

    this.vy = 0

    this.canvasDrawData = canvasDrawData

    this.canvasDrawData.type = type
    this.canvasDrawData.height = height
    this.canvasDrawData.width = width

    this.minHeight = height
    this.minWidth = width

    this.position = canvasDrawData.position

    this.delay = 0

    this.setPosition = position  => {
        this.position = position
    }

    this.setMinHeight = h => {
        this.minHeight = h
    }

    this.setDelay = delay => {
        this.delay = delay
    }

    this.setMinWidth = w => {
        this.minWidth = w
    }

    this.setBackgroundColor = color => {
        this.canvasDrawData.backgroundColor = color
    }

    this.removeOnCollide = false

    this.play = (loop = false) => {

        const removeElement = component => {
            const index = ElementsAddedToScene.findIndex(e => e._id === component._id)
            if(index !== -1) {
                ElementsAddedToScene.splice(index, 1)
                if(loop){
                    generateParticle()
                }
            }
        }

        const generateParticle = () => {
            let newHeight = Math.Range(this.minHeight,height)
            let newWidth = Math.Range(this.minWidth,width)
            let appliedForce = false

            let position = null
            if(this.position instanceof Vector2)
                position = new Vector2(this.position.x,this.position.y)
            else if(typeof this.position === "object" && this.position.p1 && this.position.p2){
                const x = Math.Range(this.position.p1.x, this.position.p2.x)
                const y = Math.Range(this.position.p1.y, this.position.p2.y)
                position = new Vector2(x,y)
            }

            const component = AddToScene({
                vy: Math.Range(speedMin,speedMax),
                vx: Math.Range(speedMin,speedMax),
                isNegative:Math.random() < 0.5,
                canvas:()=> ({
                    ...this.canvasDrawData,
                    height:newHeight,
                    width:newWidth,
                    position
                }),
                onCollision:() => {
                    if(hasCollision && Destroy(component) && loop){
                        generateParticle()
                    }
                },
                onUpdate:function(transform,force){
                    if(!this.isNegative){
                        transform.position.x += (this.vx / 100) * DeltaTime
                    }else{
                        transform.position.x += (-this.vx / 100) * DeltaTime
                    }
                    if(!appliedForce){
                        force.AddForce(this.vy * 2)
                        appliedForce = true
                    }
                },
                physics: {
                    weight: 4,
                    collision: {
                        collide: false,
                        isFixed: false
                    }
                },
                passive: false,
                layer:"particles"
            })
            if(!hasCollision){
                setTimeout(() => {
                    Destroy(component)
                },maxDuration * 1000)
            }

        }

        for(let i = 0;i<this.maxParticles;i++){
            setTimeout(() => {
                generateParticle()
            },this.delay * i * 1000)
        }
    }

}

function CollidingBox() {
    //this.v1 = new Vector2(0,0)
    //this.v2 = new Vector2(0,0)
    //this.v3 = new Vector2(0,0)
    //this.v4 = new Vector2(0,0)
    this.radius = Number()
}

function Vector2(x,y){
    this.x = x
    this.y = y
}

function Resource(url,createMirror = false){
    Resource.addedRessources.push(this)
    this.hasMirror = createMirror
    this.mirrorImage = null

    this.url = "Resources/"+url
    this.loadedImage = null

    this.getResource = () => {
        return this.loadedImage
    }

    this.getMirror = () => {
        return this.mirrorImage
    }
}
Resource.addedRessources = []

const createMirror = img => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height

    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(img, 0, 0)

    return new Promise((resolve, reject) => {

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            const flippedImg = new Image()
            flippedImg.onload = () => {
                resolve({url,image:flippedImg})
            }
            flippedImg.onerror = e => console.error("COULD NOT CREATE MIRROR VERSION OF THE RESOURCE")
            flippedImg.src = url
        }, 'image/png')

    });

}

function Sprite(){

    this.spriteSheet = []
    this.previousSet = ""
    this.defaultSet = ""

    this.currentSet = ""
    this.images = []
    this.isMirror = false
    this.lastFrameTime = 0
    this.currentFrame = 0

    this.playOneTime = false
    /**
     * @param name {String}
     * @param spritesSet {Object[]}
     * @param isDefault {Boolean}
     * @param timeBetweenFrames {Number}
     */
    this.set = function(name,spritesSet, isDefault = false,timeBetweenFrames = 20){
        this.spriteSheet.push({
            name,
            timeBetweenFrames,
            sprites:spritesSet.map(sprite => {
                //Store the sprites into memory
                Sprite.addedRessources.push(sprite.resource)
                const _id = Math.random().toString(36).substring(2,14)
                const img = new Image()
                img.onload = async () => {
                    this.images.push({
                        image:img,
                        type:"normal",
                        _id
                    })
                    //Store the sprites mirrors into memory
                    //Load the mirror version
                    const mirror = await createMirror(img)
                    Sprite.addedMirrorResources.push(mirror.url)
                    this.images.push({
                        _id,
                        type:"mirror",
                        image:mirror.image
                    })
                }
                img.onerror = (e) => console.error("COULD NOT LOAD RESOURCE")
                img.src = sprite.resource
                return {
                    ...sprite,
                    _id,
                }
            })
        })

        if(!this.defaultSet)
            this.defaultSet = name
        if(isDefault)
            this.defaultSet = name
    }

    this.setState = function(state){
        if(state !== this.currentSet && this.spriteSheet.find(e => e.name === state)){
            this.currentSet = state
            this.currentFrame = 0
        }
    }

    this.playOnce = function(state){
        if(state !== this.currentSet){
            this.previousSet = this.currentSet
            this.playOneTime = true
            this.currentSet = state
        }
    }

    this.onLoad = function(isMirror = false){
        if(this.currentSet === "")
            this.currentSet = this.defaultSet

        const spriteSheet = this.spriteSheet.find(s => s.name === this.currentSet)

        const currentTime = Date.now()
        let nextFrame = this.currentFrame
        if(currentTime > this.lastFrameTime + spriteSheet.timeBetweenFrames){
            this.lastFrameTime = currentTime

            nextFrame = this.currentFrame + 1

            if(nextFrame >= spriteSheet.sprites.length)
                nextFrame = 0

            if(nextFrame === 0 && this.playOneTime){
                this.playOneTime = false
                if(this.previousSet){
                    this.currentSet = this.previousSet
                    this.previousSet = ""
                }else{
                    this.currentSet = this.defaultSet
                }
            }

            this.currentFrame = nextFrame
            if(typeof spriteSheet.sprites[nextFrame].event=== "function"){
                spriteSheet.sprites[nextFrame].event()
            }
        }

        const i = this.images.find(e => e._id === spriteSheet.sprites[nextFrame]._id && e.type === (isMirror ? "mirror" : "normal"))
        if(i){
            return {
                ...spriteSheet.sprites[nextFrame],
                image:i.image
            }
        }



    }

}
//resource that will be loaded before launching the game
Sprite.addedRessources = []
Sprite.addedMirrorResources = []

const pressedKey = {}
let isKeyPressed = false
let MousePosition = new Vector2(0,0)
let GameMousePosition = new Vector2(0,0)

window.addEventListener("mousemove",e => {
    e.preventDefault()
    MousePosition = new Vector2(e.x,e.y)
    GameMousePosition = new Vector2(e.x,e.y)
})

window.addEventListener("mousedown",e => {
    e.preventDefault()
    pressedKey.mousedown = true
    isKeyPressed = true
})

window.addEventListener("mouseup",e => {
    e.preventDefault()
    pressedKey.mousedown = false
    isKeyPressed = false
})

window.addEventListener('keydown', (e) => {
    e.preventDefault()
    pressedKey[e.key] = true
    isKeyPressed = true
});

window.addEventListener('keyup', (e) => {
    e.preventDefault()
    pressedKey[e.key] = false
    isKeyPressed = false
});

function float2int (value) {
    return value | 0;
}

const Camera = {
    position:new Vector2(0,0),
    lastObjectPosition: new Vector2(0,0),
    followObject:null,
    dynamicCanvas:null,
    objectsInView:[],
    bounds:{
        p1:Vector2,
        p2:Vector2,
        width:0,
        height:0
    },
    addedToScene:false,
    follow:function(gameObject){
        Camera.followObject = gameObject
    },
    setPosition:function(position){
        if(position instanceof Vector2) {
            Camera.position = position
            //redraw
            drawForCamera("dynamic",position)
            drawForCamera("main",position)
        }
    },
    showBounds:function(){
        if(!Camera.addedToScene) {
            Camera.addedToScene = true
            AddToScene({
                canvas: (canvas) => {
                    return {
                        type: "rect",
                        position:this.bounds.p1,
                        width: canvas.width,
                        height: canvas.height,
                        lineWidth: 6,
                        strokeStyle: "#ff0000"
                    }
                },
                onUpdate:transform => {
                    transform.position.x = this.bounds.p1.x
                    transform.position.y = this.bounds.p1.y
                },
                physics: {
                    weight: 0,
                    collision: {
                        collide: false,
                        isFixed: true
                    }
                },
                passive: true
            })
        }
    },
    getPosition:function(){
        if(!getCanvas("dynamic"))
            return
        if(!Camera.dynamicCanvas){
            Camera.dynamicCanvas = getCanvas("dynamic").canvas
        }
        const dynamicCanvas = Camera.dynamicCanvas
        if(!Camera.bounds.height)
            Camera.bounds.height = dynamicCanvas.height
        if(!Camera.bounds.width)
            Camera.bounds.width = dynamicCanvas.width
        if(Camera.followObject){
            //Get the position of the object
            const objectPosition = this.followObject.canvasDrawData.position

            const screenY = dynamicCanvas.height / 2
            const screenX = dynamicCanvas.width / 2
            const newPosition = new Vector2(float2int(objectPosition.x - screenX),float2int(objectPosition.y - screenY))
            if(Camera.lastObjectPosition.x !== objectPosition.x || Camera.lastObjectPosition.y !== objectPosition.y){
                Camera.bounds.p1 = new Vector2( objectPosition.x - screenX,objectPosition.y - screenY)
                Camera.bounds.p2 = new Vector2((objectPosition.x - screenX) + dynamicCanvas.width, (objectPosition.y - screenY) + dynamicCanvas.height)
                //We do a soft draw without all the calculation
                drawForCamera("main",newPosition)
                BackgroundComponent.components.forEach(c => {
                    if(!c.component.component.onUpdate) {
                        drawForCamera(c.name, newPosition)
                    }
                })
                Camera.lastObjectPosition = new Vector2(objectPosition.x,objectPosition.y)
                Camera.position = newPosition
            }
            return newPosition
            //this.setPosition(newPosition)
        }


        return this.position
    }
}

const Input = {
    horizontalAxis:0,
    verticalAxis:0,
    percentage:0,
    resetValue:false,

    getKey(key){
        if(key.toLowerCase() === "space")
            return pressedKey[" "]
        return pressedKey[key]
    },

    getAxis(type){
        if(type === "Horizontal"){
            if(pressedKey.ArrowRight || pressedKey.d){
                this.percentage += 0.01;
                this.horizontalAxis = lerp(this.horizontalAxis, 1, this.percentage)
                this.resetValue = false
                if(this.horizontalAxis > 1)
                    this.horizontalAxis = 1
                return this.horizontalAxis.toFixed(3)
            }
            else if(pressedKey.ArrowLeft || pressedKey.q){
                this.percentage += 0.01;
                this.horizontalAxis = lerp(this.horizontalAxis, -1, this.percentage)
                this.resetValue = false
                if(this.horizontalAxis < -1)
                    this.horizontalAxis = -1
                return this.horizontalAxis.toFixed(3)
            }else{
                if(!this.resetValue) {
                    this.percentage = 0;
                    this.resetValue = true
                }else
                    this.percentage += 0.01
            }
            if(this.percentage > 1)
                this.percentage = 0

            if(this.percentage < 0)
                this.percentage = 0
            this.horizontalAxis = lerp(this.horizontalAxis, 0, this.percentage)
            return this.horizontalAxis.toFixed(3)
        }
        else if(type === "Vertical"){
            if(pressedKey.ArrowDown)
                return 1
            else if(pressedKey.ArrowUp)
                return -1
        }
        return 0
    }
}

function Force(component) {
    this.component = component
    this.AddForce = velocity => {
        component.physics.velocityY = -velocity
    }
}

const drawComponent = (component,type = "dynamic") => {
    drawComponents(type,false,component)
}

let lastCameraPosition = null

const drawFromPosition = (type,bounds,cameraPosition,reset = true) => {
    let context
    const canvas = getCanvas(type).canvas

    if(cameraPosition){
        lastCameraPosition = cameraPosition
    }
    if(!cameraPosition){
        cameraPosition = lastCameraPosition
    }

    context = canvas.getContext('2d')
    if(reset) {
        context.clearRect(0, 0, canvas.width, canvas.height)
    }else{
        context.clearRect(bounds.p1.x - cameraPosition.x, bounds.p1.y - cameraPosition.y,bounds.p1.x - bounds.p2.x, bounds.p1.y - bounds.p2.y)
    }

    const objectsInView = []

    ElementsAddedToScene.filter(e => {
        if(type === "dynamic"){
            return e.passive === false
        }
        return e.layer === type
    }).forEach(e => {
        const canvasDrawData = e.canvasDrawData
        if(type === "main"){
            if(
                canvasDrawData.position.x + 50 >= Camera.bounds.p1.x &&
                canvasDrawData.position.x - 50 <= Camera.bounds.p2.x &&
                canvasDrawData.position.y + 50 >= Camera.bounds.p1.y &&
                canvasDrawData.position.y - 50 <= Camera.bounds.p2.y
            ) {
                objectsInView.push(e)
            }
        }


        if(
            (canvasDrawData.position.x + 50 >= bounds.p1.x &&
            canvasDrawData.position.x - 50 <= bounds.p2.x &&
            canvasDrawData.position.y + 50 >= bounds.p1.y &&
            canvasDrawData.position.y - 50 <= bounds.p2.y)

            || (canvasDrawData.isFixed)
        ){
            context.beginPath()
            const centerX = canvasDrawData.position.x
            const centerY = canvasDrawData.position.y

            if(canvasDrawData.type === "arc"){
                const radius = canvasDrawData.radius
                context[canvasDrawData.type](centerX - cameraPosition.x, centerY - cameraPosition.y, radius, canvasDrawData.startAngle, canvasDrawData.endAngle, false)
            }else if(canvasDrawData.type === "rect" ||  canvasDrawData.type === "Grid" || canvasDrawData.type === "Tile"){
                if(!canvasDrawData.image)
                    context.rect(centerX - cameraPosition.x, centerY - cameraPosition.y, canvasDrawData.width,canvasDrawData.height)
            }else if(canvasDrawData.type === "Sprite"){
                //sprite handling
                const image = canvasDrawData.sprite.onLoad(canvasDrawData.isMirror === true)
                canvasDrawData.width = image.image.width * (canvasDrawData.scale || 1)
                canvasDrawData.height = image.image.height * (canvasDrawData.scale || 1)
                context.drawImage(image.image,centerX - cameraPosition.x,centerY - cameraPosition.y,canvasDrawData.width,canvasDrawData.height)
            }

            if(canvasDrawData.image){
                if(canvasDrawData.opacity){
                    context.globalAlpha = canvasDrawData.opacity
                }
                if(canvasDrawData.isFixed){
                    console.log('HERE')
                    context.drawImage(canvasDrawData.isMirror ? canvasDrawData.image.getMirror() : canvasDrawData.image.loadedImage,centerX,centerY,canvasDrawData.width,canvasDrawData.height)
                }else{
                    context.drawImage(canvasDrawData.isMirror ? canvasDrawData.image.getMirror() : canvasDrawData.image.loadedImage,centerX - cameraPosition.x,centerY - cameraPosition.y,canvasDrawData.width,canvasDrawData.height)
                }
                if(canvasDrawData.opacity){
                    context.globalAlpha = 1
                }
            }
            if(canvasDrawData.fillStyle || canvasDrawData.backgroundColor){
                context.fillStyle = canvasDrawData.fillStyle || canvasDrawData.backgroundColor
                context.fill()
            }
            if(canvasDrawData.lineWidth || canvasDrawData.strokeStyle){
                context.lineWidth = canvasDrawData.lineWidth
                context.strokeStyle = canvasDrawData.strokeStyle
                context.stroke()
            }


        }

    })
    if(type === "main") {
        ElementsAddedToScene.filter(e => !e.passive && e.canvasDrawData &&
            e.canvasDrawData.position.x + 50 >= Camera.bounds.p1.x &&
            e.canvasDrawData.position.x - 50 <= Camera.bounds.p2.x &&
            e.canvasDrawData.position.y + 50 >= Camera.bounds.p1.y &&
            e.canvasDrawData.position.y - 50 <= Camera.bounds.p2.y
        ).forEach(e => objectsInView.push(e))
        Camera.objectsInView = objectsInView
    }
}

const drawForCamera = (type,cameraPosition) => {
    drawFromPosition(type,Camera.bounds,cameraPosition)
}

const getCollideBoxBounds = (component,canvasDrawData = null) => {
    if(canvasDrawData === null)
        canvasDrawData = component.canvasDrawData
    let bounds = {
        x:null,
        y:null,
        height:null,
        width:null
    }

    if(component.physics.collision.collideBox){
        if(component.physics.collision.collideBox.x !== null){
            bounds.x = bounds.y = canvasDrawData.position.x + component.physics.collision.collideBox.x
        }
        if(component.physics.collision.collideBox.y !== null){
            bounds.y = bounds.y = canvasDrawData.position.y + component.physics.collision.collideBox.y
        }
        if(component.physics.collision.collideBox.height !== null){
            bounds.height = component.physics.collision.collideBox.height
        }
        if(component.physics.collision.collideBox.width !== null){
            bounds.width = component.physics.collision.collideBox.width
        }
    }

    if(bounds.x === null){
        bounds.x = canvasDrawData.position.x
    }
    if(bounds.y === null){
        bounds.y = canvasDrawData.position.y
    }
    if(bounds.width === null){
        bounds.width = canvasDrawData.width
    }
    if(bounds.height === null){
        bounds.height = canvasDrawData.height
    }

    return bounds
}

const isInCameraBounds = (component,canvasDrawData) => {
    if(component.parent){
        return (
            component.parent.canvasDrawData.position.x >= Camera.bounds.p1.x &&
            component.parent.canvasDrawData.position.x <= Camera.bounds.p2.x &&
            component.parent.canvasDrawData.position.y >= Camera.bounds.p1.y &&
            component.parent.canvasDrawData.position.y <= Camera.bounds.p2.y
        )
    }
    return (
        canvasDrawData.position.x >= Camera.bounds.p1.x &&
        canvasDrawData.position.x <= Camera.bounds.p2.x &&
        canvasDrawData.position.y >= Camera.bounds.p1.y &&
        canvasDrawData.position.y <= Camera.bounds.p2.y
    )
}

const computeCanvasDrawData = (component,parent) => {
    if(typeof component === 'object' && typeof component.canvas === 'function') {

        let canvasDrawData = component.canvasDrawData
        if (!canvasDrawData) {
            canvasDrawData = component.canvas(mainCanvas, drawData)
        }

        let centerX = 0
        let centerY = 0
        let width = 0
        let height = 0
        if (canvasDrawData.position && canvasDrawData.position instanceof Vector2) {
            centerX = canvasDrawData.position.x
            centerY = canvasDrawData.position.y
        }
        if (parent || component.parent) {
            if (!parent) {
                parent = component.parent
            }
            component.parent = parent
            if (parent.canvasDrawData.type === "Grid" && canvasDrawData.type === "Tile") {
                centerX = centerX * parent.canvasDrawData.tileSize + parent.canvasDrawData.position.x
                centerY = centerY * parent.canvasDrawData.tileSize + parent.canvasDrawData.position.y
                width = parent.canvasDrawData.tileSize
                height = parent.canvasDrawData.tileSize

                if (canvasDrawData.type === "Tile") {
                    canvasDrawData.gridPosition = new Vector2(canvasDrawData.position.x, canvasDrawData.position.y)
                }
            } else {
                if (canvasDrawData.isAbsolute) {
                    centerX = parent.canvasDrawData.position.x
                    centerY = parent.canvasDrawData.position.y
                    if (canvasDrawData.absolutePosition && canvasDrawData.absolutePosition instanceof Vector2) {
                        centerY += canvasDrawData.absolutePosition.y
                        centerX += canvasDrawData.absolutePosition.x
                    }
                } else {
                    centerX = centerX + parent.canvasDrawData.position.x
                    centerY = centerY + parent.canvasDrawData.position.y
                }

            }

            canvasDrawData.width = width
            canvasDrawData.height = height
        }


        if (!canvasDrawData.isAbsolute) {
            canvasDrawData.position.y = float2int(centerY)
            canvasDrawData.position.x = float2int(centerX)
        }

        if(canvasDrawData.type === "Sprite"){
            //sprite handling
            const image = canvasDrawData.sprite.onLoad(canvasDrawData.isMirror === true)
            canvasDrawData.width = image.image.width * (canvasDrawData.scale || 1)
            canvasDrawData.height = image.image.height * (canvasDrawData.scale || 1)
        }

        component.canvasDrawData = canvasDrawData

        return {
            component,
            centerX,
            centerY,
            width,
            height
        }
    }
}

const drawComponents = (type = "main",first = true,child) => {

    let context
    const canvas = getCanvas(type).canvas

    context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)



    const onAddedToScene = (e,parent) => {

        if(typeof e === 'object' && typeof e.canvas === 'function'){



            const computedCanvasDrawData = computeCanvasDrawData(e,parent)

            const canvasDrawData = computedCanvasDrawData.component.canvasDrawData

            const cameraPosition = Camera.getPosition()

            if(isInCameraBounds(computedCanvasDrawData.component,canvasDrawData) || type === "globalLightning"){

                context.beginPath()

                if(canvasDrawData.type === "arc"){
                    const radius = canvasDrawData.radius
                    context[canvasDrawData.type](computedCanvasDrawData.centerX - cameraPosition.x, computedCanvasDrawData.centerY - cameraPosition.y, radius, canvasDrawData.startAngle, canvasDrawData.endAngle, false)
                }else if(canvasDrawData.type === "rect" || canvasDrawData.type === "Grid" || canvasDrawData.type === "Tile"){
                    context.rect(computedCanvasDrawData.centerX - cameraPosition.x, computedCanvasDrawData.centerY - cameraPosition.y, computedCanvasDrawData.width || canvasDrawData.width,computedCanvasDrawData.height || canvasDrawData.height)
                }else if(canvasDrawData.type === "Sprite"){
                    //sprite handling
                    const image = canvasDrawData.sprite.onLoad(canvasDrawData.isMirror === true)

                    if(canvasDrawData.rotate !== undefined || image.rotate !== undefined){
                        let rotate = canvasDrawData.rotate || image.rotate
                        let angleRad = rotate * Math.PI / 180
                        if(canvasDrawData.isMirror)
                            angleRad = -angleRad
                        context.save()

                        if(image.position){
                            if(canvasDrawData.isMirror){
                                computedCanvasDrawData.centerY += image.position.y
                                computedCanvasDrawData.centerX -= image.position.x
                            }else{
                                computedCanvasDrawData.centerY += image.position.y
                                computedCanvasDrawData.centerX += image.position.x
                            }

                        }
                        let p = 0
                        if(canvasDrawData.isMirror && image.position){
                            p = image.position.x
                        }

                        context.translate(computedCanvasDrawData.centerX - cameraPosition.x + p + canvasDrawData.width / 2, computedCanvasDrawData.centerY  - cameraPosition.y + canvasDrawData.height / 2)

                        context.rotate(angleRad)

                        context.drawImage(image.image,-canvasDrawData.width / 2, -canvasDrawData.height / 2,canvasDrawData.width,canvasDrawData.height)

                        context.restore()
                    }
                    else{
                        context.drawImage(image.image,computedCanvasDrawData.centerX - cameraPosition.x,computedCanvasDrawData.centerY - cameraPosition.y,canvasDrawData.width,canvasDrawData.height)
                    }

                }else if(canvasDrawData.type === "PointLight"){
                    context.globalCompositeOperation = "destination-out"
                    const gradient = context.createRadialGradient(computedCanvasDrawData.centerX - cameraPosition.x, computedCanvasDrawData.centerY - cameraPosition.y, 0, computedCanvasDrawData.centerX - cameraPosition.x, computedCanvasDrawData.centerY - cameraPosition.y, canvasDrawData.radius)
                    gradient.addColorStop(0.0, "rgba(0, 0, 0, 0.9)")
                    gradient.addColorStop(0.2, "rgba(0, 0, 0, 0.7)")
                    gradient.addColorStop(0.4, "rgba(0, 0, 0, 0.4)")
                    gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.2)")
                    gradient.addColorStop(1.0, "rgba(0, 0, 0, 0)")

                    context.fillStyle = gradient
                    context.beginPath()
                    context.arc(computedCanvasDrawData.centerX - cameraPosition.x, computedCanvasDrawData.centerY - cameraPosition.y, canvasDrawData.radius, 0, Math.PI * 2)
                    context.fill()
                    context.globalCompositeOperation = "source-over"
                }

                if(canvasDrawData.image){

                    if(canvasDrawData.rotate){
                        const angleRad = canvasDrawData.rotate * Math.PI / 180

                        context.save()

                        context.translate(computedCanvasDrawData.centerX + canvasDrawData.width / 2, computedCanvasDrawData.centerY + canvasDrawData.height / 2)

                        context.rotate(angleRad)

                        context.drawImage(canvasDrawData.image.loadedImage,computedCanvasDrawData.centerX  - cameraPosition.x -canvasDrawData.width / 2, computedCanvasDrawData.centerY  - cameraPosition.y -canvasDrawData.height / 2,canvasDrawData.width,canvasDrawData.height)

                        context.restore()
                    }else{
                        context.drawImage(canvasDrawData.image.loadedImage,computedCanvasDrawData.centerX - cameraPosition.x,computedCanvasDrawData.centerY - cameraPosition.y,canvasDrawData.width,canvasDrawData.height)
                    }

                }

                if(computedCanvasDrawData.component.physics.collision.collideBox && computedCanvasDrawData.component.physics.collision.collideBox.display === true){
                    const collideBounds = getCollideBoxBounds(computedCanvasDrawData.component,canvasDrawData)
                    context.rect(collideBounds.x - cameraPosition.x, collideBounds.y - cameraPosition.y, collideBounds.width,collideBounds.height)
                    context.lineWidth = 1
                    context.strokeStyle = "#be02cc"
                    context.stroke()
                }


                if(canvasDrawData.fillStyle || canvasDrawData.backgroundColor){

                    context.fillStyle = canvasDrawData.fillStyle || canvasDrawData.backgroundColor
                    context.fill()
                }
                if(canvasDrawData.lineWidth || canvasDrawData.strokeStyle){
                    context.lineWidth = canvasDrawData.lineWidth
                    context.strokeStyle = canvasDrawData.strokeStyle
                    context.stroke()
                }
            }

            computedCanvasDrawData.component.canvasDrawData = canvasDrawData

            if(typeof e.children === 'function' && first) {
                console.log(e)
                e.children().forEach(c => {
                    c._id = Math.random().toString(36).substring(2,14)
                    c._toUpdate = {
                        position:null
                    }
                    ElementsAddedToScene.push(c)
                    onAddedToScene(c,e)
                    if(e.grid){
                        e.grid.tiles.push(c)
                    }
                })
            }
        }
    }

    if(child){
        if(child.length){
            return child.forEach(c => onAddedToScene(c))
        }
        return onAddedToScene(child)
    }
    ElementsAddedToScene.filter(component => {
        if(type === "dynamic"){
            return component.passive === false
        }
        return component.layer === type
    }).forEach(component => {
        onAddedToScene(component)
        if(first){
            if(typeof component.onStart === 'function')
                component.onStart(component)
        }
    })
}

const addCanvas = (name,zIndex) => {
    const c = document.createElement("canvas")
    c.width = window.innerWidth
    c.height = window.innerHeight
    c.style.cssText = "background:transparent;position: absolute;z-index: "+zIndex+";"
    c.id = "canvas-for-"+name
    document.body.appendChild(c)
    canvas.push({
        canvas:c,
        name
    })
    return c
}

const getCanvas = name => canvas.find(e => e.name === name)

const main = () => {

    let lastTime = 0;
    const fps = 60;
    const interval = 1000 / fps;

    const lastPositions = []

    const preventSide = {
        left:false,
        right:false,
        top:false,
        bottom:false
    }

    document.body.style.padding = "0"
    document.body.style.margin = "0"
    mainCanvas = document.createElement("canvas")
    mainCanvas.width = window.innerWidth
    mainCanvas.height = window.innerHeight
    canvas.push({
        name:"main",
        canvas:mainCanvas
    })

    addCanvas("dynamic",1)
    addCanvas("particles",2)
    addCanvas("globalLightning",10)

    document.body.appendChild(mainCanvas)

    const onCollision = (component1,component2) => {

    }

    const getCollidingBox = component => {
        let collidingBox = new CollidingBox()
        const componentCollidingBounds = getCollideBoxBounds(component)
        collidingBox.v1 = new Vector2(parseFloat(componentCollidingBounds.x),parseFloat(componentCollidingBounds.y))
        switch(component.canvasDrawData.type){
            case "rect":
                collidingBox.v2 = new Vector2(componentCollidingBounds.x + componentCollidingBounds.width, componentCollidingBounds.y)
                collidingBox.v3 = new Vector2(componentCollidingBounds.x,componentCollidingBounds.y + componentCollidingBounds.height)
                collidingBox.v4 = new Vector2(componentCollidingBounds.x + componentCollidingBounds.width, componentCollidingBounds.height + componentCollidingBounds.y)
                break
            case "arc":
                collidingBox.v2 = new Vector2(componentCollidingBounds.x + (component.canvasDrawData.radius * 2), componentCollidingBounds.y)
                collidingBox.v3 = new Vector2(componentCollidingBounds.x,componentCollidingBounds.y + component.canvasDrawData.radius * 2)
                collidingBox.v4 = new Vector2(componentCollidingBounds.x + component.canvasDrawData.radius * 2, component.canvasDrawData.radius * 2 + componentCollidingBounds.y)
                break

            case "Tile":
                collidingBox.v2 = new Vector2(componentCollidingBounds.x + componentCollidingBounds.width, componentCollidingBounds.y)
                collidingBox.v3 = new Vector2(componentCollidingBounds.x,componentCollidingBounds.y + componentCollidingBounds.height)
                collidingBox.v4 = new Vector2(componentCollidingBounds.x + componentCollidingBounds.width, componentCollidingBounds.height + componentCollidingBounds.y)
                break
            case "Sprite":
                //console.log(component.canvasDrawData.width, component.canvasDrawData.height)
                collidingBox.v2 = new Vector2(componentCollidingBounds.x + componentCollidingBounds.width, componentCollidingBounds.y)
                collidingBox.v3 = new Vector2(componentCollidingBounds.x,componentCollidingBounds.y + componentCollidingBounds.height)
                collidingBox.v4 = new Vector2(componentCollidingBounds.x + componentCollidingBounds.width, componentCollidingBounds.height + componentCollidingBounds.y)
                break
        }

        collidingBox.type = component.canvasDrawData.type
        return collidingBox
    }

    const getCollision = (collidingBox1, collidingBox2) => {
        return (
            collidingBox1.v1.x < collidingBox2.v2.x &&
            collidingBox1.v2.x > collidingBox2.v1.x &&
            collidingBox1.v1.y < collidingBox2.v4.y &&
            collidingBox1.v4.y > collidingBox2.v1.y - 2
        )
    }

    const detectCollision = component => {
        //get the colliding box of the component
        const componentCollidingBox = getCollidingBox(component)
        const collisions = []
        for(let i = 0;i < Camera.objectsInView.length;i++){
            const currentObject = Camera.objectsInView[i]
            if(currentObject._id !== component._id && currentObject.physics.collision.collide && !currentObject.isBackground) {
                if(component.physics && typeof component.physics.collision.notCollideWith === "function" && component.physics.collision.notCollideWith(currentObject)) {
                    continue
                }
                //compare the colliding box with this one
                const otherCollidingBox = getCollidingBox(currentObject)
                if (getCollision(componentCollidingBox, otherCollidingBox)) {
                    if(typeof component.beforeCollision === "function" && component.beforeCollision(currentObject) === false){
                        continue
                    }
                    const side = getCollisionSide(currentObject.canvasDrawData,component.canvasDrawData)
                    collisions.push({collidingBox: otherCollidingBox, component: currentObject,side})
                }
            }
        }
        if(collisions.length)
            return collisions
        return false
    }

    const getCollisionSide = (a, b) => {

        const dx = (a.position.x + a.width / 2) - (b.position.x + b.width / 2)
        const dy = (a.position.y + a.height / 2) - (b.position.y + b.height / 2)
        const width = (a.width + b.width) / 2
        const height = (a.height + b.height) / 2

        const crossWidth = width * dy
        const crossHeight = height * dx

        if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
            if (crossWidth > crossHeight) {
                return (crossWidth > -crossHeight) ? "bottom" : "left"
            } else {
                return (crossWidth > -crossHeight) ? "right" : "top"
            }
        }
        return null
    }

    const collides = []

    const beforeUpdatingComponent = component => {
        const collisionsElement = detectCollision(component)
        if(collisionsElement){
            const sides = collisionsElement.map(e => e.side)

            component.physics.fallTimer = undefined
            component.physics.fallY = component.canvasDrawData.position.y

            if(sides.indexOf("left") !== -1 || sides.indexOf("right") !== -1){

                if(component.beforeUpdate){
                    component.canvasDrawData.position.x = component.beforeUpdate.position.x
                }

                if(sides.indexOf("left") !== -1)
                    preventSide.left = true
                if(sides.indexOf("right") !== -1)
                    preventSide.right = true
            }
            if(sides.indexOf("bottom") !== -1){
                component.physics.velocityY = 0
                if(component.canvasDrawData.type === "arc")
                    component.canvasDrawData.position.y = collisionsElement[0].collidingBox.v1.y - component.canvasDrawData.radius
                else if(component.canvasDrawData.type === "Sprite") {
                    //console.log(collisionElement.collidingBox.v1.y,sceneElement.canvasDrawData.height)
                    component.canvasDrawData.position.y = collisionsElement[0].collidingBox.v1.y - component.canvasDrawData.height
                }
                component.physics.fallY = component.canvasDrawData.position.y

            }
            if(sides.indexOf("top") !== -1){
                if(component.canvasDrawData.type === "arc")
                    component.canvasDrawData.position.y = collisionsElement[0].collidingBox.v1.y + component.canvasDrawData.radius
                else if(component.canvasDrawData.type === "Sprite") {
                    //console.log(collisionElement.collidingBox.v1.y,sceneElement.canvasDrawData.height)
                    component.canvasDrawData.position.y = collisionsElement[0].collidingBox.v1.y + component.canvasDrawData.height / 2
                }
            }
            if(typeof component.onCollision === 'function')
                collisionsElement.forEach(collision => {
                    component.onCollision(collision)
                })
        }

    }

    const applyPhysics = t => {

        const computeFall = sceneElement => {
            if (sceneElement.physics.fallTimer === undefined) {
                sceneElement.physics.fallTimer = Date.now()
                sceneElement.physics.fallY = sceneElement.canvasDrawData.position.y
            }
            const elapsedTime = Date.now() - sceneElement.physics.fallTimer

            let fallDistance = Math.abs(sceneElement.canvasDrawData.position.y - sceneElement.physics.fallY)

            let speed = Math.sqrt(2 * 9.81 * (fallDistance === 0 ? 1 : fallDistance))
            if(sceneElement.physics.velocityY && sceneElement.physics.velocityY < 0){
                sceneElement.physics.velocityY += speed
                speed = -speed
                sceneElement.physics.fallY = sceneElement.canvasDrawData.position.y + sceneElement.physics.velocityY
            }
            sceneElement.physics.vy = speed
            sceneElement.canvasDrawData.position.y = float2int(sceneElement.physics.fallY + (speed * sceneElement.physics.weight) * (elapsedTime / 1000))
        }
        //Apply the physics on active objects


        t = t.filter(e => e.passive === false)
        t.forEach(sceneElement => {
            const componentLastPosition = lastPositions.find(e => sceneElement._id === e._id)
            if(!componentLastPosition){
                lastPositions.push({
                    _id:sceneElement._id,
                    position:new Vector2(0,0)
                })
            }
            if(!componentLastPosition || componentLastPosition.position.x !== sceneElement.canvasDrawData.position.x ||
                componentLastPosition.position.y !== sceneElement.canvasDrawData.position.y || sceneElement.physics.fallTimer || sceneElement.physics.velocityY){
                if(componentLastPosition){
                    componentLastPosition.position = new Vector2(sceneElement.canvasDrawData.position.x,sceneElement.canvasDrawData.position.y)
                }
                if(sceneElement.physics.weight > 0 && sceneElement.physics.collision.collide){
                    const collisionsElement = detectCollision(sceneElement)
                    if(!collisionsElement || sceneElement.physics.velocityY) {
                        if(typeof sceneElement.onCollision === 'function')
                            sceneElement.onCollision(false)

                        computeFall(sceneElement)
                    }
                    beforeUpdatingComponent(sceneElement)
                }else if(sceneElement.physics.weight > 0){
                    if(sceneElement.physics.velocityY) {
                        computeFall(sceneElement)
                        //beforeUpdatingComponent(sceneElement)
                    }
                }

            }
        })
    }

    const updateLayers = components => {
        const props = components.reduce((acc, obj) => {
            let key = obj.layer
            if(key === undefined)
                key = "dynamic"
            acc[key] = acc[key] || []
            acc[key].push(obj)
            return acc
        }, {})

        //REWORK HERE TO DRAW ON EVERY LAYER IF !PASSIVE
        //!PASSIVE = onUpdate() IN THE OBJECT

        canvas.forEach(c => {
            if(c.name !== "main" && c.name !== "background")
                drawComponent(props[c.name] || [],c.name)
        })

    }

    const updateComponents = components => {
        components.forEach(component => {
            if(component && typeof component.onUpdate === "function" && component.canvasDrawData){
                component.beforeUpdate = JSON.parse(JSON.stringify(component.canvasDrawData))
                const f = new Force(component)
                component.onUpdate(component.canvasDrawData,f)

                if(component.layer === "globalLightning"){
                    return
                }

                beforeUpdatingComponent(component)
            }
        })
    }

    const onFrameCallback = () => {
        const elements = ElementsAddedToScene.filter(e => e.passive === false || typeof e.onUpdate === "function")
        applyPhysics(elements)
        updateComponents(elements)
        updateLayers(elements)
    }

    const onFrameRefresh = (time) => {
        requestAnimationFrame(onFrameRefresh)
        DeltaTime = time - lastTime;
        if (DeltaTime >= interval) {
            lastTime = time - (DeltaTime % interval);
            onFrameCallback()
        }
    }

    const onEngineLoad = () => {
        canvas.forEach(c => {
            drawComponents(c.name)
        })

        OnStartFunctions.forEach(e => typeof e === 'function' && e(mainCanvas))
        requestAnimationFrame(onFrameRefresh)
    }

    let loadedResource = 0
    const onResourceLoaded = () => {
        loadedResource++
        if(loadedResource === Sprite.addedRessources.length){


            let mirrorResourceLoaded = 0

            let addedMirrorResourcesLength = Sprite.addedMirrorResources.length
            const onMirrorResourceLoaded = () => {
                mirrorResourceLoaded++

                if(Sprite.addedMirrorResources.length !== addedMirrorResourcesLength){
                    addedMirrorResourcesLength = Sprite.addedMirrorResources.length
                    mirrorResourceLoaded = 0
                    return loadMirrorResources()
                }

                if(mirrorResourceLoaded === Sprite.addedMirrorResources.length)
                    onEngineLoad()
            }

            const loadMirrorResources = () => {
                Sprite.addedMirrorResources.forEach(resource => {
                    const img = new Image()
                    img.onload = () => onMirrorResourceLoaded()
                    img.onerror = (e) => console.error("COULD NOT LOAD RESSOURCE")
                    img.src = resource
                })
            }
            setTimeout(() => {
                loadMirrorResources()
            },10)

        }
    }

    let lr = 0
    const onLoadResource = function(){
        lr++
        if(lr >= Resource.addedRessources.length){
            Sprite.addedRessources.forEach(resource => {
                const img = new Image()
                img.onload = () => {
                    onResourceLoaded()
                }
                img.onerror = (e) => console.error("COULD NOT LOAD RESSOURCE")
                img.src = resource
            })
        }
    }

    Resource.addedRessources.forEach(resource => {
        if(resource.url.indexOf("mp3") !== -1){
            const poolSize = AudioComponent.poolSize
            for (let i = 0; i < poolSize; i++) {
                const audio = new Audio(resource.url)
                audio.preload = "auto"
                audio.load()
                AudioComponent.audios.push({
                    resource:resource.url,
                    AudioPlayer:audio
                })
            }
            resource.loadedImage = resource.url
            onLoadResource()
        }else{
            const img = new Image()
            img.onload = async () => {
                resource.loadedImage = img
                if(resource.hasMirror){
                    const mirror = await createMirror(img)
                    resource.mirrorImage = mirror.image
                }
                onLoadResource()
            }
            img.onerror = (e) => console.error("COULD NOT LOAD RESSOURCE")
            img.src = resource.url
        }

    })
    if(!Resource.addedRessources.length)
        onLoadResource()


}

/**
 *
 * @param component gameComponent
 * @param forceDraw boolean
 * @param parent gameComponent
 * @constructor
 */
const AddToScene = (component,forceDraw = false,parent = null) => {
    if(typeof component.getComponent === "function")
        component = component.getComponent()
    component._id = Math.random().toString(36).substring(2,14)
    ElementsAddedToScene.push(component)
    if(forceDraw){
        computeCanvasDrawData(component,parent)
        if(typeof component.children === 'function') {
            component.children().forEach(c => {
                if(typeof c.getComponent === "function")
                    c = c.getComponent()
                c._id = Math.random().toString(36).substring(2,14)
                c._toUpdate = {
                    position:null
                }
                ElementsAddedToScene.push(c)
                computeCanvasDrawData(c,component)
            })
        }
    }
    return component
}

const OnStart = fn => {
    OnStartFunctions.push(fn)
}

document.addEventListener("DOMContentLoaded",() => {
    main()
})
