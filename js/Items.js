import {resources} from "./Resources"
export const Item = function(name){
    this.name = name
    this.resource = null
    this.maxStack = 1
    this.isWeapon = false
    this.isPlaceable = false
    this.sprite = null
    Item.all[name] = this
}
Item.all = {};

const pickaxe = new Item("Pickaxe")
pickaxe.maxStack = 1
pickaxe.resource = resources.pickaxe
pickaxe.isWeapon = true

const axe = new Item("Axe")
axe.maxStack = 1
axe.resource = resources.axe
axe.isWeapon = true


const spriteTorch = new Sprite()
spriteTorch.set("idle",[
    {resource:"Resources/Images/torch_1.png"},
    {resource:"Resources/Images/torch_2.png"},
    {resource:"Resources/Images/torch_3.png"}
],true,100)

const spriteDirt = new Sprite()
spriteDirt.set("idle",[
    {resource:"Resources/Images/Terrains/dirt.png"},
])

const spriteStone = new Sprite()
spriteStone.set("idle",[
    {resource:"Resources/Images/Terrains/stone.png"},
])

const spriteWood = new Sprite()
spriteWood.set("idle",[
    {resource:"Resources/images/Items/wood.png"}
])

const grass = new Item("Grass")
grass.maxStack = 100
grass.resource = resources.grass
grass.isPlaceable = true
grass.particlesColor = "#3d5116"
grass.checkSide = ["left","right","bottom","top"]
grass.health = 1
grass.dropItem = "Dirt"
grass.sprite = spriteDirt

const torch = new Item("Torch")
torch.maxStack = 10
torch.resource = resources.torch
torch.isPlaceable = true
torch.sprite = spriteTorch
torch.checkSide = ["left","right","bottom"]
torch.health = 1
torch.dropItem = "Torch"
torch.particlesColor = "#744A27"


const wood = new Item("Wood")
wood.maxStack = 100
wood.resource = resources.wood_item
wood.isPlaceable = false
wood.particlesColor = "#744A27"
wood.checkSide = ["left","right","bottom","top"]
wood.health = 2
wood.dropItem = "Wood"
wood.sprite = spriteWood

const dirt = new Item("Dirt")
dirt.maxStack = 100
dirt.resource = resources.dirt
dirt.particlesColor = "#744A27"
dirt.sprite = spriteDirt
dirt.isPlaceable = true
dirt.checkSide = ["left","right","bottom","top"]
dirt.health = 2
dirt.dropItem = "Dirt"

const stone = new Item("Stone")
stone.maxStack = 100
stone.resource = resources.stone
stone.isPlaceable = true
stone.particlesColor = "#666862"
stone.sprite = spriteStone
stone.checkSide = ["left","right","bottom","top"]
stone.health = 3
stone.dropItem = "Stone"
