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
        this.startCheckboxListeners();
        this.startScorePlaceholderInputListener();
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
    startCheckboxListeners(){
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

        //setting in storage
        let result = await this.storageSync.setInStorage({"scorehider_settings": newStatList});

        if(result.success){
            //if it worked, then we update this.statList
            this.statList = newStatList;
            console.log("new statList:");
            console.log(this.statList);
        }
        return result;
    }

    /**
     * Makes the "score placeholder" input work, by taking the user input and storing it in the "score_placeholder" position of storage
     */
    async startScorePlaceholderInputListener(){
        //getting the score placeholder from storage
        let currentScorePlaceholder = await this.storageSync.getFromStorage("score_placeholder");

        //if we coudln't recover the score_placeholder from storage - Either by it not existing in storage, or due to some error in storage.sync -
        //we automatically set the scorePlaceholder as "?"
        if(currentScorePlaceholder?.error || !currentScorePlaceholder)
            currentScorePlaceholder = "?";

        if(currentScorePlaceholder?.error)
            console.error(currentScorePlaceholder.error);

        //getting the input element of the score placeholder and defining the score placeholder value
        let scorePlaceholderInput = document.getElementById("score-placeholder");
        scorePlaceholderInput.value = currentScorePlaceholder;

        //Starting the listener of the input
        //This listener gets the user input of #score-placeholder and submits it to storage
        scorePlaceholderInput.addEventListener("input", async (e)=>{

            //if the text length is 0, that is, if the user just erased text, this listener does nothing
            if(e.target.value.length <= 0)
                return undefined;


            //Segmenting the string into multiple GRAPHEMES
            //Javascript is one of many languages that calculates the length of strings by how manyUTF-16 code units ithas.
            //This is a problem when we deal with emojis and other special characters that has more than code unit per character.
            //e.g: "🌸".length returns "2". "test🌸".length returns "6"

            //So, in order to get the value that we want, we should first segment the string by its GRAPHEMES CLUSTERS.
            //A grapheme cluster is basically the sequence of one or more code units that represents a single character.
            //So "🌸" has TWO code units, but is only ONE grapheme.

            //Therefore, this code section does the aforementioned segmentation of the user input and converts each grapheme information into
            //an array entry. The length of this array is the `true` amount of characters of the string.
            let segmentedInput = Array.from(new Intl.Segmenter().segment(e.target.value));

            //if the user types (or pastes) more than 1 characters then we'll only get the FIRST character.
            if(segmentedInput.length > 1)
                e.target.value = segmentedInput[0].segment;

            //if the user typed a character that isn't the same we already set, set the NEW score_placeholder in storage
            if(e.target.value != currentScorePlaceholder){
                //setting the score_placeholder in storage
                let result = await this.storageSync.setInStorage({"score_placeholder": e.target.value});
                if(!result.success){
                    //TODO: find a way to print this message on the popup, so the user won't be confused.
                    console.error("Error while updating the score placeholder:", result.error);
                    //returning the input to its old value
                    e.target.value = currentScorePlaceholder;
                    return undefined;
                }
                //updating the old input value
                currentScorePlaceholder = e.target.value;
            }

        });
    }
}
document.addEventListener("DOMContentLoaded", ()=>{
    //instantiating just so the Popup code can be run.
    let popup = new PopupMenu();
});
