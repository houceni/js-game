import {Item} from "./js/Items"
import {resources} from "./js/Resources"
import {InventoryManager} from "./js/InventoryManager";

document.addEventListener("DOMContentLoaded",() => {
    InventoryManager.build()
    InventoryManager.addItem(Item.all.Pickaxe)
    InventoryManager.addItem(Item.all.Axe)
    InventoryManager.addItem(Item.all.Torch)
})

window.addEventListener("wheel", e => {
    e.preventDefault()
    if (e.deltaY < 0) {
        InventoryManager.slotUp()
    } else {
        InventoryManager.slotDown()
    }
}, { passive: false })

const xLength = 500
const yLength = 200
const startingX = -25;

const startingY = 0;
const spriteChar = new Sprite()

const AudioPlayer = new Audio()
let focusedTile = null

const spriteItem = new Sprite()
spriteItem.set("wood",[{
    resource:"Resources/Images/Items/wood.png"
}])

spriteChar.set("idle",[{resource:"sprites/idle/sprite_char_hole.png"}],true)

spriteChar.set("move",[
    {
        resource:"sprites/move/sprite_walk_1.png"
    },
    {
        resource:"sprites/move/sprite_walk_2.png"
    },
    {
        resource:"sprites/move/sprite_walk_3.png"
    },
    {
        resource:"sprites/move/sprite_walk_4.png",
        event:() => {
            //PLAY SOUND EFFECT
            if(isColliding){
                const sounds = [AudioResources.grass_1,AudioResources.grass_2]
                const i = randomIntFromInterval(0,1)
                AudioComponent.play(sounds[i])
            }
        }
    },
    {
        resource:"sprites/move/sprite_walk_2.png"
    },
    {
        resource:"sprites/move/sprite_walk_1.png"
    },
    {
        resource:"sprites/idle/sprite_char_hole.png"
    }
],false,80);

spriteChar.set("attack",[
    {
        resource:"sprites/attack/sprite_attack_1.png"
    },
    {
        resource:"sprites/attack/sprite_attack_2.png"
    },
    {
        resource:"sprites/attack/sprite_attack_3.png",
        event:() => {
            if(focusedTile && focusedTile.tileType === "Wood"){
                AudioComponent.play(AudioResources.cut_tree)
            }
            if(focusedTile && (focusedTile.tileType === "Grass" || focusedTile.tileType === "Dirt")){
                AudioComponent.play(AudioResources.grass_2)
            }

        }
    },
    {
        resource:"sprites/attack/sprite_attack_4.png"
    }
],false,100)

const spriteTools = new Sprite()
spriteTools.set("Axe",[{resource:"Resources/Images/Tools/axe.png"}])
spriteTools.set("Pickaxe",[{resource:"Resources/Images/Tools/pickaxe.png"}],true)
spriteTools.set("Torch",[{resource:"Resources/Images/torch_1.png"},
    {resource:"Resources/Images/torch_2.png"},
    {resource:"Resources/Images/torch_3.png"}],false,200)

spriteTools.set("AxeAttack",[
    {
        resource:"Resources/Images/Tools/axe.png",
        rotate:0,
        position:new Vector2(8,-20)
    },
    {
        resource:"Resources/Images/Tools/axe.png",
        rotate:30,
        position:new Vector2(12,-3)
    },
    {
        resource:"Resources/Images/Tools/axe.png",
        rotate:50,
        position:new Vector2(12,2)
    },
    {
        resource:"Resources/Images/Tools/axe.png",
        rotate:70,
        position:new Vector2(12,10)
    }
],false,100)

spriteTools.set("PickaxeAttack",[
    {
        resource:"Resources/Images/Tools/pickaxe.png",
        rotate:0,
        position:new Vector2(8,-20)
    },
    {
        resource:"Resources/Images/Tools/pickaxe.png",
        rotate:30,
        position:new Vector2(12,-3)
    },
    {
        resource:"Resources/Images/Tools/pickaxe.png",
        rotate:50,
        position:new Vector2(12,2)
    },
    {
        resource:"Resources/Images/Tools/pickaxe.png",
        rotate:70,
        position:new Vector2(12,10)
    }
],false,100)


spriteTools.set("TorchAttack",[
    {
        resource:"Resources/Images/torch_1.png",
        rotate:0,
        position:new Vector2(8,-20)
    },
    {
        resource:"Resources/Images/torch_1.png",
        rotate:30,
        position:new Vector2(12,-3)
    },
    {
        resource:"Resources/Images/torch_1.png",
        rotate:50,
        position:new Vector2(12,2)
    },
    {
        resource:"Resources/Images/torch_1.png",
        rotate:70,
        position:new Vector2(12,10)
    }
],false,100)

const leafMetaData = {
    health:1,
    tileType:"Leaf"
}


const AudioResources = {
    grass_1:new Resource("Sounds/footstep_grass_1.mp3"),
    grass_2:new Resource("Sounds/footstep_grass_2.mp3"),
    cut_tree:new Resource("Sounds/cut.mp3"),
    tree_down:new Resource("Sounds/tree-fall.mp3")
}

const emptyTile = () => ({
    type:"Air"
})

const grassTile = () => ({
    type:"Grass",
    image:null,
    health:1
})

const dirtTile = () => ({
    type:"Dirt",
    image:null,
    health:2
})

const stoneTile = () => ({
    type:"Stone",
    image: null,
    health:4
})



//Camera.showBounds()

//const map = []

function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getResourceByType(type){
    let resource = null
    switch (type){
        case "Grass":
            resource = resources.grass
            break
        case "Dirt":
            resource = resources.dirt
            break
        case "Stone":
            resource = resources.stone
            break
    }
    return resource
}

function getTileByType(type){
    let tile = null
    switch (type){
        case "Grass":
            tile = grassTile()
            break
        case "Dirt":
            tile = dirtTile()
            break
        case "Stone":
            tile = stoneTile()
            break
        case "Air":
            tile = emptyTile()
            break
    }
    return tile
}

const generateMap = () => {
    let map = []
    const firstBlockPositions = new Array(xLength)

    for(let x = 0;x<xLength;x++){
        map.push([])
        const noiseValue = noise.perlin2(x * 0.02, 0)
        const terrainHeight = Math.floor(lerp(30, 70, noiseValue))
        for(let y = 0;y<yLength;y++){
            map[x].push([])
            const isFilled = Math.random() < 0.45
            const previousTileIsGrass = (x - 1 >= 0 && map[x - 1][y].type === "Grass")
            if ((isFilled || previousTileIsGrass && Math.random() < 0.2) && y >= terrainHeight)
            {
                if (firstBlockPositions[x] === undefined)
                {
                    map[x][y] = grassTile()
                    firstBlockPositions[x] = y
                }
                else if(y <= firstBlockPositions[x] + 3)
                    map[x][y] = dirtTile()
                else if (y <= firstBlockPositions[x] + randomIntFromInterval(3,5))
                {
                    map[x][y] = dirtTile()
                }
                else
                {
                    map[x][y] = stoneTile()
                }
            }
        else
            {
                map[x][y] = emptyTile()
            }
        }

    }


    let newMap = JSON.parse(JSON.stringify(map))

    for (let i = 0; i < 6; i++)
    {
        // string output = "";
        let i = 0


        for (let row = 0; row < yLength; row++)
        {
            for (let col = 0; col < xLength; col++)
            {
                //We count how much filled tile are around
                let countFilled = []
                let filledIteration = 0
                for (let newX = col - 1; newX <= col + 1; newX++)
                {
                    for (let newY = row - 1; newY <= row + 1; newY++)
                    {

                        if (newY === row && newX === col) continue
                        //If it's filled
                        if (newX >= 0 && newX < map.length && newY >= 0 && newY < map.length)
                        {
                            if (newX > 0 && newY > 0)
                            {
                                countFilled[filledIteration] = map[newX][newY]
                                filledIteration++
                            }
                        }

                    }
                }

                const numberOfTiles = countFilled.reduce((acc,tile) => {
                    if(tile){
                        let accType = acc.find(e => e.type === tile.type)
                        if (!accType) {
                            accType = getTileByType(tile.type)
                            accType.count = 0
                            acc.push(accType)
                        }
                        accType.count++
                    }
                    return acc
                }, [])

                const airTiles = numberOfTiles.find(e => e.type === 'Air')

                if (airTiles && airTiles.count > 4)
                {
                    newMap[col][row] = emptyTile()
                }
                else
                {
                    // Get the tile with the greatest value
                    const tile = numberOfTiles.filter(tile => tile.type !== "Air")
                    if(!tile.length) {
                        newMap[col][row] = emptyTile()
                    }else{
                        const r = tile.reduce((max, tile) => {
                            return tile.count > max.count ? tile : max
                        }, {count:0})
                        newMap[col][row] = r

                    }


                    if(!newMap[col][row].type){
                        return console.log('HERE')
                    }
                }


            }
        }
        map = JSON.parse(JSON.stringify(newMap))

    }


    return newMap;
}

const particles = new Particles("rect",4,4,10,0.5,5,10,{
    position:new Vector2(100,100),
    backgroundColor:"#744A27"
},false)

particles.setMinHeight(2)
particles.setMinWidth(2)

const rain = new Particles("rect",4,2,100,5,6,8,{
    backgroundColor: "#437bed"
},true)

rain.setPosition({
    p1:new Vector2(Camera.bounds.p1.x,Camera.bounds.p1.y - 20),
    p2:new Vector2(Camera.bounds.p2.x,Camera.bounds.p2.y - 10)
})

rain.setMinHeight(2)

rain.setDelay(0.1)

rain.vy = 0

//rain.play(true)

let time = 0
const daySpeed = 0.0001

const getNightOverlayAlpha = (time) => {
    return Math.min(1 - Math.cos(time * 2 * Math.PI),0.9)
}

GlobalLightning.onUpdate(function(transform){
    time += daySpeed
    if (time > 1) time = 0
    transform.backgroundColor = `rgba(0, 0, 0, ${getNightOverlayAlpha(time)})`
})

new BackgroundComponent("background",-2,canvas => ({
    type:"rect",
    image:resources.background,
    height:canvas.height,
    width:canvas.width,
    position:new Vector2(0,0)
}))

const childrenCanvas = {
    type:"Sprite",
    sprite:spriteTools,
    position:new Vector2(0,0),
    isAbsolute:true,
    absolutePosition:new Vector2(23,18)
}
let isColliding = false

InventoryManager.onSlotChange(currentSlot => {
    if(InventoryManager.slots[currentSlot].item){
        spriteTools.setState(InventoryManager.slots[currentSlot].item.name)
    }
})

AddToScene({
    movementSpeed:0.25,
    isRight:true,
    canvas:() => ({
        type:"Sprite",
        position:new Vector2(0,100),
        sprite:spriteChar,
        scale:0.5,
    }),
    physics: {
        weight: 6,
        collision: {
            collide: true,
            isFixed: false,
            collideBox:{
                y:6,
                x:null,
                width:26,
                height:60,
                display:false
            }
        }
    },
    onStart:function(gameObject){
        Camera.follow(gameObject)
    },
    beforeCollision:function(component){
        if(component.isItem){
            Destroy(component)
        }
        return !component.isItem
    },
    onCollision:function(collision){
        isColliding = !!collision
        //console.log(collision)
    },
    children:function(){
        return [{
            canvas:() => childrenCanvas,
            physics:{
                weight:0,
                collision:{
                    collide:false,
                    isFixed:false
                }
            },
            passive:false
        }]
    },
    onUpdate:function(transform,force) {
        const movement = Input.getAxis("Horizontal")
        const isSprinting = Input.getKey("Shift")
        const isAttacking = Input.getKey("mousedown") && isColliding && spriteChar.currentSet === "idle"

        //rain.setPosition({
        //    p1:new Vector2(Camera.bounds.p1.x - 100,Camera.bounds.p1.y - 100),
        //    p2:new Vector2(Camera.bounds.p2.x + 100,Camera.bounds.p1.y - 90)
        //})

        if(movement < 0 && this.isRight){
            this.isRight = false
            transform.isMirror = true
            childrenCanvas.isMirror = true
            childrenCanvas.absolutePosition = new Vector2(-23,18)
        }else if(movement > 0 && !this.isRight){
            transform.isMirror = false
            this.isRight = true
            childrenCanvas.isMirror = false
            childrenCanvas.absolutePosition = new Vector2(23,18)
        }

        if(isColliding && Input.getKey("Space")){
            force.AddForce(30)
        }
        //Previous Tile

        const newTile = grid.getTileFromMousePosition(MousePosition)
        //if(newTile){
        //    console.log(newTile)
        //    newTile.canvasDrawData.opacity = 0.5
        //}
        focusedTile = newTile

        if(isAttacking && (InventoryManager.getCurrentItem().isWeapon || !InventoryManager.getCurrentItem().name)){
            if(spriteTools.currentSet.indexOf("Attack") === -1) {
                spriteTools.playOnce(spriteTools.currentSet + "Attack")
            }else{
                spriteTools.playOnce(spriteTools.currentSet)
            }
            spriteChar.playOnce("attack")
            if(newTile){
                if(newTile.tileType === "Stone"){
                    particles.setBackgroundColor("#666862")
                }else if(newTile.tileType === "Grass" || newTile.tileType === "Leaf"){
                    particles.setBackgroundColor("#3d5116")
                }else{
                    particles.setBackgroundColor("#744A27")
                }
                particles.setPosition(new Vector2(newTile.canvasDrawData.position.x,newTile.canvasDrawData.position.y))
                particles.play()

                DamageTile(newTile)
            }
        }else if(isAttacking && InventoryManager.getCurrentItem().isPlaceable){
            const currentPosition = grid.getTilePositionFromMousePosition(MousePosition)
            const nearTile = grid.tiles.find(t => {
                if(t.tileType === "Wood" || t.tileType === "Attached")
                    return false
                const tile = t.canvasDrawData
                    return (tile.gridPosition.y === currentPosition.y + 1 && tile.gridPosition.x === currentPosition.x) ||
                (tile.gridPosition.x === currentPosition.x - 1 && tile.gridPosition.y === currentPosition.y) ||
                    (tile.gridPosition.x === currentPosition.x + 1 && tile.gridPosition.y === currentPosition.y)
                }
            )
            if(nearTile && !grid.getTileFromPosition(currentPosition)){
                const newSprite = Object.assign(Object.create(Object.getPrototypeOf(InventoryManager.getCurrentItem().sprite)), InventoryManager.getCurrentItem().sprite)
                //Attach the item on the tile
                AddToScene({
                    canvas:() => ({
                        type:"Sprite",
                        position:new Vector2(currentPosition.x,currentPosition.y),
                        sprite:newSprite,
                        height:32,
                        width:32
                    }),
                    physics: {
                        weight: 0,
                        collision: {
                            collide: true,
                            isFixed: false
                        }
                    },
                    passive: true,
                    layer:"main",
                    tileType:"Torch"
                },true)
                const newTile = new Tile({
                    position: new Vector2(currentPosition.x, currentPosition.y)
                },{
                    tileType:"Attached"
                })
                grid.SetTile(newTile)

            }
        }

        if(movement > 0 || movement < 0){
            //move to the right
            if(spriteChar.currentSet !== "move")
                spriteChar.setState("move")
            transform.position.x += (!isSprinting ? 1 : 1.5) * movement * this.movementSpeed * DeltaTime
        }else{
            if(spriteChar.currentSet === "move")
                spriteChar.setState("idle")
        }
    },
    passive: false,
    isPlayer:true
})
const grid = new Grid((canvas) => ({
    position:new Vector2(0,canvas.height / 2),
    tileSize:32,
    width:1920
}),() =>{
    const tiles = []


    //Generate the map
    const generatedMap = generateMap()

    const firstBlockPositions = [];
    for (let row = 0; row < yLength; row++)
    {
        for (let col = 0; col < xLength; col++)
        {
            if (generatedMap[col][row].type !== "Air" && firstBlockPositions[col] === undefined)
            {
                firstBlockPositions[col] = row
            }
        }
    }


    //Placing the tiles

    for (let row = 0; row < yLength; row++)
    {
        for (let col = 0; col < xLength; col++)
        {
            //Check the firsts tiles which aren't TileType.Air and convert them into TileType.Grass
            if (firstBlockPositions[col] === row)
            {
                generatedMap[col][row] = grassTile()
                const randomDirtPosition = row + randomIntFromInterval(3, 5) + 1
                for (let i = row + 1; i < randomDirtPosition; i++)
                {
                    generatedMap[col][i] = dirtTile()
                }
            }

            const x = startingX + col;
            const y = startingY + row;
            if (generatedMap[col][row].type !== "Air")
            {

                const tile = new Tile({
                    position: new Vector2(x, y),
                    image:getResourceByType(generatedMap[col][row].type)
                },{
                    tileType:generatedMap[col][row].type,
                    health:generatedMap[col][row].health
                })
                tile.physics.collision.collide = true
                tiles.push(tile)
            }
        }
    }

    let lastPlacement = 0
    let nextTree = randomIntFromInterval(7, 10)
    for (let col = 0; col < firstBlockPositions.length; col++)
    {
        //firstBlockPositions[col] -> first block of in the X axis

        if (lastPlacement + nextTree <= col)
        {
            const x = startingX + col
            const y = startingY + firstBlockPositions[col] - 1

            const treeLength = randomIntFromInterval(6, 12)
            for (let i = 0; i <= treeLength; i++)
            {

                tiles.push(new Tile({
                    position: new Vector2(x, y - i),
                    image:resources.wood
                },{
                    tileType:"Wood",
                    health:3
                }))
                //Map[new Vector2Int(x, y + i)] = resources["Wood"];
            }

            //Place the leafs

            tiles.push(new Tile({
                position: new Vector2(x, y - treeLength - 1),
                image:resources.leaf_1
            },{
                ...leafMetaData
            }))
            tiles.push(new Tile({
                position: new Vector2(x, y - treeLength - 2),
                image:resources.leaf
            },{
                ...leafMetaData
            }))
            tiles.push(new Tile({
                position: new Vector2(x, y - treeLength - 3),
                image:resources.leaf_5
            },{
                ...leafMetaData
            }))

            tiles.push(new Tile({
                position: new Vector2(x - 1, y - treeLength - 1),
                image:resources.leaf_2
            },{
                ...leafMetaData
            }))
            tiles.push(new Tile({
                position: new Vector2(x - 1, y - treeLength - 2),
                image:resources.leaf_3
            },{
                ...leafMetaData
            }))
            tiles.push(new Tile({
                position: new Vector2(x - 1, y - treeLength - 3),
                image:resources.leaf_4
            },{
                ...leafMetaData
            }))

            tiles.push(new Tile({
                position: new Vector2(x + 1, y - treeLength - 1),
                image:resources.leaf_2,
                isMirror:true
            },{
                ...leafMetaData
            }))
            tiles.push(new Tile({
                position: new Vector2(x + 1, y - treeLength - 2),
                image:resources.leaf_3,
                isMirror:true
            },{
                ...leafMetaData
            }))
            tiles.push(new Tile({
                position: new Vector2(x + 1, y - treeLength - 3),
                image:resources.leaf_4,
                isMirror:true
            },{
                ...leafMetaData
            }))

            //AlHamdoulilah

            lastPlacement = col
            nextTree = randomIntFromInterval(7, 10)
        }

    }


    return tiles
})

const DamageTile = tile => {
    if(tile.health > 0) {
        tile.health--
        if(tile.health === 0){
            if(tile.tileType === "Wood"){
                const tilesToRemove = []
                tilesToRemove.push(tile)
                //ChopTree(tilePosition,resourceObject.gameObject);
                let x = tile.canvasDrawData.gridPosition.x

                const woodTiles = grid.tiles.filter(t => t.tileType === "Wood" && t.canvasDrawData.gridPosition.x === x)

                if(woodTiles.length){
                    let lastY = tile.canvasDrawData.gridPosition.y

                    let i = lastY
                    const breakAt = i - 20

                    let tileAbove = null

                    while (i > breakAt)
                    {
                        i--
                        tileAbove = woodTiles.find(tile => tile.canvasDrawData.gridPosition.y === i)

                        if (tileAbove)
                        {
                            lastY = i
                            const x = randomIntFromInterval(-10,10)
                            const y = randomIntFromInterval(-10,10)
                            const p = new Vector2(tileAbove.canvasDrawData.position.x + x,tileAbove.canvasDrawData.position.y + y)
                            AddToScene({
                                canvas:() => ({
                                    type:"Sprite",
                                    position:p,
                                    sprite:spriteItem,
                                    scale:0.8,
                                    height:32,
                                    width:32,
                                }),
                                physics: {
                                    weight: 4,
                                    collision: {
                                        collide: true,
                                        isFixed: false,
                                        collideBox:{
                                            y:4,
                                            x:null,
                                            width:28,
                                            height:20,
                                            display: false
                                        },
                                        notCollideWith:component => component.isItem
                                    }
                                },
                                passive: false,
                                isItem:true
                            },true)
                            tilesToRemove.push(tileAbove)

                            //ChopTree(tilePosition, resourceObject.gameObject);
                        }
                        else
                        {
                            break
                        }
                    }
                    AudioComponent.play(AudioResources.tree_down)
                    //Remove the leaves
                    RemoveLeaves(new Vector2(x,lastY - 1)).forEach(t => tilesToRemove.push(t))
                }
                grid.removeMultiples(tilesToRemove)
            }else{
                grid.removeTile(tile)
            }
        }
    }
}

const RemoveLeaves = position => {
    const r = grid.tiles.find(tile => tile.canvasDrawData.gridPosition.y === position.y && tile.canvasDrawData.gridPosition.x === position.x)
    const tiles = []
    if(r && r.tileType === "Leaf")
    {
        for(let col = position.x - 1; col <= position.x + 1; col++)
        {
            for(let row = position.y;row >= position.y - 2; row--)
            {
                tiles.push(grid.getTileAt(new Vector2(col,row)))
            }
        }
    }
    return tiles
}

AddToScene(grid)