# Game Interface & Instructions

## 🎮 Game Start

https://script-logic.github.io/roguelite-pet-project/
Keep an eye on the tips at the bottom of the screen while playing.
---

## 🎯 Gameplay Loop

1.  **Make a choice** from the right panel (select a skill or item).
2.  **An enemy will spawn.**
3.  **Choose your action:**
    *   Attack the presented enemy.
    *   Skip to find another foe.
4.  **Victory Reward:** Defeating an enemy carrying powerful gear allows you to **loot it** and add it to your inventory.

---

## 🏆 Primary Objective
**Survive for as many rounds as possible!**

---

## 📊 Interface Layout

### **Left Panel**
Detailed characteristics of:
*   Inventory Items
*   Skills

### **Center Panel (Top → Bottom)**
1.  **Active Buffs/Debuffs**
2.  **Health Points (HP)**
3.  **Shields**
4.  **Active Skills**
5.  **Equipped Gear**
6.  **Backpack**

### **Right Panel**
Skill or Item selection menu.

---

### **BUGS**

**1. Weapon Master Line 418 Crash**
*   **File/Line:** `weapon_master` case, line 418.
*   **Trigger:** The `weapon_damage` function threw an error when an enemy had an item of type "weapon" in their inventory.
*   **Oddities:** The bug did **NOT** occur if:
    *   *I* had a "weapon" type item in my inventory.
    *   *I* had the "Weapon Master" skill.
*   **Suspicion:** Possibly triggered when the *enemy* had the "Weapon Master" skill.

**2. Poor Feedback for Unique Item Transfer**
*   **Issue:** When attempting to move an item that has a "max one equipped" restriction, the tooltip behaves as if the transfer was successful (especially when dragging from the item's icon). However, the item does not actually move, and the misleading tooltip ends up covering the original item's information.
*   **Result:** User receives incorrect visual feedback and loses access to the item's stats.

**3. (Unconfirmed) Bot Bonuses Not Applying from Gear**
*   **Description:** A bot may not be receiving a bonus to a specific damage type (e.g., Fire) from an item that grants a bonus to that type (e.g., a melee weapon with "+Fire Damage").
*   **Status:** Needs verification (`Exactly?`).

**4. (Unconfirmed) Debuff Duration Reduction Not Scaling**
*   **Description:** The reduction of debuff durations over time does not increase as intended (e.g., with stats or skills that should accelerate it).
*   **Status:** Needs verification (`Exactly?`).

**5. Freeze Penalty Info Mismatch**
*   **Description:** The penalty value displayed for the "Freeze" debuff in the debuffs panel does not match the value shown in the combat log.

**6. Missing Final Combat Log Entry**
*   **Description:** The final log message under the combat graph, which should show the last instance of damage taken from an enemy, does not appear.

**7. Incorrect Tooltip Timing for Enemy Debuffs**
*   **Trigger:** During the preparation phase.
*   **Bug:** Hovering the cursor over an enemy's debuff displays a tooltip title that incorrectly states the battle has been ongoing for some time.

**8. Fatigues (Phasic?) Damage Frequency & Timing**
*   **Question 1:** Can the damage from "Fatigue" (`fatic`/`phasic`?) occur every second?
*   **Question 2:** Can the "Fatigue" skill have an odd-numbered duration (in seconds), potentially affecting tick timing?

**9. Fire Damage vs. Shields**
*   **Question:** Does Fire damage not reduce Shields?