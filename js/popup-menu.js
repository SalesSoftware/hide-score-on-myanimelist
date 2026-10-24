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
        this.statList = (await this.getSettings());
        console.log("initial statList");
        console.log(this.statList);

        if(this.statList && !this.statList.error){
            for(let statName of this.statList)
                document.getElementById(statName).checked = true;
        }else if(this.statList.error){
            document.querySelector("main").style.display = "none"; //hiding <main>
            //showing the error tab.
            let errorTab = document.querySelector(".errorTab");

            errorTab.style.display = "block";

            //transcribing the error message
            errorTab.querySelector("b").innerText =
            `ERROR: ${this.statList.error}\nPlease report the bug in https://github.com/SalesSoftware/hide-score-on-myanimelist/issues`;

            console.error(this.statList.error);
        }
    }

    /**
     * Searches for the "scorehider_settings" position in storage, and returns the value it finds
     * @returns {Promise<Array>} - contains the name of every stat that this class is supposed to hide.
     *
     * TODO this method is repeated with scorehider.class.js. It would be interesting to have a StorageSync class and such
     */
    getSettings(){
        //browser.storage.sync.get("scorehider_settings")
        //Promise.reject(new Error("Simulated error2"))
        return browser.storage.sync.get("scorehider_settings").then(
            (value)=> value?.scorehider_settings,
        ).catch(
            (error)=>{return {error}}
        );
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
                let updated = await this.updateSettings(e.target.name, (e.target.checked ? "add" : "remove"));
                if(updated)
                    console.log(`${e.target.name} CHANGED - CHECKED = ${e.target.checked}`);
                else
                    //there was an error in the updateSettings execution, so we revert the checkbox selection
                    //from the user's perspective, it'll look like the click "didn't register". Ofc error logs will be available in the
                    //popup console.
                    e.target.checked = !e.target.checked;

            })
        };
    }

    //Updates the scorehider_settings position in the storage.
    //statName is the value that we'll add/remove on storage
    //
    /**
     * Updates the "scorehider_settings" position of storage, removing or adding the checked/unchecked element in the array.
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
        let scorehider_settings = Array.from(this.statList);

        switch(action){
            case "add":
                //if the value isn't in statList already, add it to statList
                if(scorehider_settings.indexOf(statName) == -1)
                    scorehider_settings.push(statName);
                break;
            case "remove":
                //removing the stat from statList
                scorehider_settings = scorehider_settings.filter((stat)=>stat!=statName);
                break;
        }

        let success = false;
        //browser.storage.sync.set({scorehider_settings})
        //Promise.reject(new Error("Simulated error2"))
        //actually storing the new settings in storage
        await browser.storage.sync.set({scorehider_settings}).then(
            ()=>{
                console.log("updated settings succesfully");
                success = true;
            }
        ).catch(
            (error)=>{
                console.error(error);
            }
        );

        if(success){
            //if it worked, then we update this.statList
            this.statList = scorehider_settings;
            console.log("new statList:");
            console.log(this.statList);
        }

        return success;
    }
}
document.addEventListener("DOMContentLoaded", ()=>{
    //instantiating just so the Popup code can be run.
    let popup = new PopupMenu();
});
