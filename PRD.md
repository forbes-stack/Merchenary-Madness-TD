Requirements Document

0.0 General Information 

Developed By:

Hollan Moore

Cameron Petry

Sebastian James

Landon Hogge

Carter Tovar

Purpose -

The purpose of this document is to provide a concrete document of requirements for our video game. The functionality, features, and system requirements.

Scope - 

A western themed tower defense design where the player can place given towers in locations seen on the map and once placed, one can start/fast forward/stop to have enemies start coming down the path, and one can upgrade their placed towers.  

**1.** **Functional Requirements**

 **1.1 Setup/Map/HUD**

- Path for enemies to follow

-Starting point indicator

-Placeable/non-placeable areas for towers

-Toggleable tower selection menu

-Health display

-Currency display

-Round Number display

**1.2 Towers**

-Tower cost

-Upgrade costs

-upgrade paths

-Opposite path closes after 3 upgrades in one direction

-starting range per tower

-starting rate of fire per tower

-damage per tower

-Size of tower (Some bigger/smaller than others)

-Sell cost

-Near/far/strong/weak targeting

-

**1.3 Enemies**

-Enemies have a set health

-Enemies have set speeds

-Some enemies have special features (Explosive, Camo, Fast, Regen)

-Multiple different enemies

-Enemies have set armor increases (think of metal balloons compared to normal)

**2. Non-Functional Requirements**

**2.1 Performance**

- Frame rate: The game should run at a minimum of 60 FPS on target devices.

- Loading time: Levels should load in under 3 seconds.

- Latency: Player actions (like placing a tower) should respond within 100 ms.

- Memory usage: Should not exceed X MB (based on platform limits)

- Level scaling: Should handle an increasing number of balloons and towers (e.g., 100+ entities on screen) without lag.

**2.2 Usability**

- UI clarity: Buttons and menus must be clearly labeled and sized for touch/mouse use.

- Tutorials: New players should be able to complete the tutorial without external help.

- User feedback: Provide visual/audio feedback when towers are placed or upgrades bought.

**2.3 Extensibility**

-Future Possible Additions

-Enemies can attack towers

-Tower dependency on user to reload their ammo

-Western Music

-More Sound Effects

-Game Speed (1x, 2x, 5x)

-Buying System after each round in the level (more ammo for revolvers, more cannonballs for cannoneer)

-Curved Path for Enemies to Follow

**2.4 Accessibility**

-Include Color-Blind Mode 

-Adjustable sound levels

**3. Technical Requirements**

-Built using p5.js and JavaScript

-VSCode as the code editor
