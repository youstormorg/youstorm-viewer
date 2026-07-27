import { initialiseMap } from "./map.js";

import { initialiseUI } from "./ui.js";

function initialiseApplication() {

    initialiseUI();

    initialiseMap();

    console.log("YouStorm started");

}

initialiseApplication();