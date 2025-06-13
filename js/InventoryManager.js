export const InventoryManager = {
    slots:[],
    maxSlots:8,
    currentSlot:0,
    onChange:null,
    addItem: item => {
        let slotIndex = InventoryManager.slots.findIndex(e => e.item && e.item.name === item.name && e.count + 1 <= item.maxStack)
        if(slotIndex === -1) {
            slotIndex = InventoryManager.slots.findIndex(e => e.isEmpty)
            InventoryManager.slots[slotIndex] = {item: item, count: 1}
        }
        else{
            InventoryManager.slots[slotIndex].count++
        }

        InventoryManager.updateSlotsUI(slotIndex)

    },
    build:() => {
        const InventoryBarElement = document.getElementById("InventoryBar")
        InventoryBarElement.innerHTML = ""
        for(let i = 0; i < InventoryManager.maxSlots; i++){
            InventoryManager.slots.push({
                isEmpty:true
            })
            const slotElement = document.createElement("div")
            slotElement.className = "inventory-slot"
            if(i === 0){
                slotElement.className += " selected"
            }

            const slotImageElement = document.createElement("div")
            slotImageElement.className = "item-image"

            const slotCounterElement = document.createElement("div")
            slotCounterElement.className = "slot-counter"

            slotElement.appendChild(slotImageElement)
            slotElement.appendChild(slotCounterElement)

            InventoryBarElement.appendChild(slotElement)
        }
    },
    decreaseCurrentSlot:() => {
        const currentSlot = InventoryManager.slots[InventoryManager.currentSlot]
        if(currentSlot && currentSlot.count){
            if(currentSlot.count - 1 > 0){
                InventoryManager.slots[InventoryManager.currentSlot].count--
                return InventoryManager.updateSlotsUI(InventoryManager.currentSlot)
            }
        }
        InventoryManager.slots[InventoryManager.currentSlot] = {
            isEmpty:true
        }
        InventoryManager.updateSlotsUI(InventoryManager.currentSlot)
    },
    updateSlotsUI:slotIndex => {
        //REFRESH UI
        const InventoryBarElement = document.getElementById("InventoryBar")
        const slotElements = InventoryBarElement.querySelectorAll(".inventory-slot")

        if(InventoryManager.slots[slotIndex].count){
            slotElements[slotIndex].querySelector(".slot-counter").innerHTML = InventoryManager.slots[slotIndex].count
            slotElements[slotIndex].querySelector(".item-image").style.backgroundImage = `url("${InventoryManager.slots[slotIndex].item.resource.url}")`
        }else{
            slotElements[slotIndex].querySelector(".slot-counter").innerHTML = ""
            slotElements[slotIndex].querySelector(".item-image").style.backgroundImage = "none"
        }

    },
    slotUp:() => {
        let newSlot = InventoryManager.currentSlot + 1
        if(newSlot > InventoryManager.slots.length -1)
            newSlot = 0
        InventoryManager.currentSlot = newSlot
        InventoryManager.updateSlotUI()
        if(InventoryManager.onChange)
            InventoryManager.onChange(newSlot)
    },
    slotDown:() => {
        let newSlot = InventoryManager.currentSlot - 1
        if(newSlot < 0)
            newSlot = InventoryManager.slots.length - 1
        InventoryManager.currentSlot = newSlot
        InventoryManager.updateSlotUI()
        if(InventoryManager.onChange)
            InventoryManager.onChange(newSlot)
    },
    updateSlotUI:() => {
        const slots = document.getElementById("InventoryBar").querySelectorAll(".inventory-slot")
        slots.forEach(e => e.classList.remove('selected'))
        slots[InventoryManager.currentSlot].classList.add("selected")
    },
    onSlotChange:(fn) => {
        if(typeof fn === "function")
            InventoryManager.onChange = fn
    },
    getCurrentItem:() => {
        const currentSlot = InventoryManager.slots[InventoryManager.currentSlot]
        if(currentSlot.item)
            return currentSlot.item
        return {}
    }
}