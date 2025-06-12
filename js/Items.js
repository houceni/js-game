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

const torch = new Item("Torch")
torch.maxStack = 10
torch.resource = resources.torch
torch.isPlaceable = true
torch.sprite = spriteTorch

const wood = new Item("Wood")
wood.maxStack = 100
wood.resource = resources.wood
wood.isPlaceable = true

