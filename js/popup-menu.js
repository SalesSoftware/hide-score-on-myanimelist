/**
 * This class contains the logic behind the Popup menu's actions.
 */
class PopupMenu{

    /**
     * Defines the statList attribute and starts the appropriate functions
     * @constructor
     */
    constructor(){
        this.statList = []; //attribute that will get the list of elements that are checked
        this.storageSync = new StorageSync(); //from js/storageSync.class.js
        this.defineInitialChecks();
        this.startListeners();
    }

    /**
     * retrieves the settings in storage by calling {@link defineInitialChecks()}, and checks all checkboxes of the elements that are set to be
     * hidden.
     *
     * If there's an error, it hides all elements of the popup and shows a error message instead.
     * @async
     */
    async defineInitialChecks(){
        this.statList = (await this.storageSync.getFromStorage("scorehider_settings"));
        console.log("initial statList");
        console.log(this.statList);

        if(this.statList && !this.statList?.error){
            for(let statName of this.statList)
                document.getElementById(statName).checked = true;

        }else if(this.statList?.error){
            //transcribing the error message
            this.showErrorTabMessage(`There was an error while attempting to retrieve the settings from storage:\n${this.statList.error}\nPlease report the bug in https://github.com/SalesSoftware/hide-score-on-myanimelist/issues`);
            console.error(this.statList.error);

        }else if(this.statList == undefined || this.statList == null){
            this.showErrorTabMessage("ERROR: There weren't any values for the setting in storage.\nPlease report the bug in https://github.com/SalesSoftware/hide-score-on-myanimelist/issues");
        }
    }

    /**
     * Hides the <main> element, shows the <div class="errorTab">, and prints an error message in that <div>
     * @param {string} message - The message that will be written in the popup
     */
    showErrorTabMessage(message){
        let errorTab = document.querySelector(".errorTab");

        document.querySelector("main").style.display = "none"; //hiding <main>
        errorTab.style.display = "block";

        //transcribing the error message
        errorTab.querySelector("b").innerText = message;
    }
    /**
     * sets up the listeners of the popup.
     */
    startListeners(){
        //CHECKBOX LISTENER:
        //Each time the checkbox referring to a stat is checked/unchecked in the popup, the element will be hidden/shown in the actual page.
        for(let element of document.querySelectorAll(".stat-option > input[type=checkbox]")){
            element.addEventListener("change", async (e)=>{
                //updates the settings in storage, adding or removing the element the checkbox refers to
                let result = await this.updateSettings(e.target.name, (e.target.checked ? "add" : "remove"));
                if(result.success)
                    console.log(`${e.target.name} CHANGED - CHECKED = ${e.target.checked}`);
                else{
                    //there was an error in the updateSettings execution, so we revert the checkbox selection
                    //from the user's perspective, it'll look like the click "didn't register". Ofc error logs will be available in the
                    //popup console.
                    console.error(result.error);
                    e.target.checked = !e.target.checked;
                }
            })
        };
    }


    /**
     * Removes or adds value to the "scorehider_settings" position of storage by calling {@link StorageSync#setInStorage()}
     * Then it updates "this.statList" with the new post-updated list.
     * @async
     * @param {string} statName - the name of the stat that we will add or remove in storage.
     * @param {"add"|"remove"} action - the action that will be done with "statName".
     * @returns {<boolean>} - Whether the update was succesful or not.
     */
    async updateSettings(statName, action){
        console.log(`${action == "add" ? "ADDING" : (action == "remove" ? "REMOVING" : "")} "${statName}" IN this.statList`);

        //We have to use Array.from() here because just using "scorehider_settings = this.statList" would just create a new REFERENCE
        //to this.statList since this.statList is not a primitive vale.
        //More information in: https://en.wikipedia.org/wiki/Evaluation_strategy#Call_by_sharing
        let newStatList = Array.from(this.statList);

        switch(action){
            case "add":
                //if the value isn't in statList already, add it to statList
                if(newStatList.indexOf(statName) == -1)
                    newStatList.push(statName);
                break;
            case "remove":
                //removing the stat from statList
                newStatList = newStatList.filter((stat)=>stat!=statName);
                break;
        }

        let result = await this.storageSync.setInStorage({"scorehider_settings": newStatList});

        if(result.success){
            //if it worked, then we update this.statList
            this.statList = newStatList;
            console.log("new statList:");
            console.log(this.statList);
        }
        return result;
    }
}
document.addEventListener("DOMContentLoaded", ()=>{
    //instantiating just so the Popup code can be run.
    let popup = new PopupMenu();
});
