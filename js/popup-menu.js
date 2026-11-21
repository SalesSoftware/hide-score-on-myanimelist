/**
 * This class contains the logic behind the Popup menu's actions.
 */
class PopupMenu{

    /**
     * Defines the settings attribute and starts the appropriate functions
     * @constructor
     */
    constructor(){
        this.settings = []; //attribute that will get the list of elements that are checked
        this.storageSync = new StorageSync(); //from js/storageSync.class.js
    }

    /**
     * Retrieves the settings from storage (calls {@link StorageSync#setSettingsFirstUse()} if there's no settings in storage)
     * And then calls for the appropriate functions to execute the popup
     *
     * @async
     */
    async start(){
        //GETTING SETTINGS FROM STORAGE
        this.settings = (await this.storageSync.getFromStorage("scorehider_settings"));
        console.log("initial settings");
        console.log(this.settings);

        if(this.settings?.error){
            //getFromStorage has returned an error. show it to the user
            console.error(this.settings.error);
            this.showErrorTabMessage(`Couldn't load your settings: \n${this.settings.error}`);
            return undefined; //exit start()

        }else if(this.settings == undefined || this.settings == null){
            //settings weren't stored yet. So we call for setSettingsFirstUse() from StorageSync
            console.log("Couldn't find settings data.\nStoring settings for the first time.");
            let result = await this.storageSync.setSettingsFirstUse();
            if(result.success){
                 //if the settings were stored, then just assign it to this.settings
                this.settings = result.dataStored.scorehider_settings;
                console.log("initial settings stored successfully", this.settings);
            }else{
                //setSettingsFirstUse() returned an error. Show it to the user.
                this.showErrorTabMessage(`Couldn't store the INITIAL settings. \n${result?.error}`);
                console.error(result?.error);
                return undefined;
            }
        }

        //if we could retrieve the settings, execute the other functions
        this.startErrorPopupListener();
        this.populateCheckboxes();
        this.startHideAllShowAllListeners();
        this.startCheckboxListeners();
        this.startScorePlaceholderInputListener();
        this.startThemeListener();
    }

    /**
     * This function checks all the checkboxes whose value is set in this.settings
     * ATTENTION: This is intended to be run when the popup is OPENED. i.e: It should NOT be called more than once.
     */
    populateCheckboxes(){
        for(let statName of this.settings)
            document.getElementById(statName).checked = true;
    }

    /**
     * If the user clicks in "HIDE ALL" all checkboxes will be checked and every stat will be stored in scorehider_settings
     * If the user clicks in "SHOW ALL" all checkboxes will be UNCHECKED and every stat will be REMOVED from scorehider_settings
     */
    startHideAllShowAllListeners(){
        //getting both buttons "hide-all" and "show-all"
        let buttons = document.querySelectorAll(".container-apply-all button");
        for (let button of buttons){
            button.addEventListener("click", async (e)=>{
                let scorehider_settings;
                let checked;

                let btn = e.target;
                //checking which button was clicked, and setting "scorehider_settings" and "checked" accordingly
                switch(btn.id){
                    case "hide-all":
                        //if the button clicked was "hide all", we send EVERY STAT to "scorehider_settings" in storage
                        scorehider_settings = [
                            "recommended",
                            "mixed",
                            "not_recommended",
                            "review_amount",
                            "ratio_bar",
                            "favorites",
                            "members",
                            "popularity",
                            "rank",
                            "users",
                            "score"
                        ];
                        checked = true;
                        console.log("hiding all", scorehider_settings);
                        break;
                    case "show-all":

                        //if the button clicked was "show all", we REMOVE EVERY STAT from "scorehider_settings" in storage
                        scorehider_settings = [];
                        checked = false;
                        console.log("showing all", scorehider_settings);
                        break;
                }

                //updating the settings
                let result = await this.updateSettings(scorehider_settings);
                if(!result.success){
                    //if this.updateSettings returns an error
                    console.error(`ERROR AFTER PRESSING #${btn.id}, COULDN'T SET VALUE IN STORAGE. scorehider_settings`, scorehider_settings,"error", result.error);
                    this.showErrorPopup(`[#${btn.id}] couldn't set new value in storage:\n${result.error}`);
                    return undefined;
                }

                //CHECKING (or unchecking) ALL THE CHECKBOXES
                for(let checkbox of document.querySelectorAll(".stat-option input[type=checkbox]"))
                    checkbox.checked = checked;
            });
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
        errorTab.querySelector("p.error").innerText = message;
    }

    /**
     * Starts the listener that CLOSES the error popup when the user clicks the "close-popup" element
     */
    startErrorPopupListener(){
        document.getElementById("close-popup").addEventListener("click", ()=>{
            let errorPopup = document.getElementById("error-popup");

            //Making the error popup FADE-OUT from the page
            errorPopup.classList.remove("fade-in");
            errorPopup.classList.add("fade-out");
        });
    }

    /**
     * Shows an error popup to the user with a message defined in the parameter
     * @param {string} message - The message that is going to be trascribed in the error Popup. ATTENTION, depending on the message informed,
     *        the popup will show a different message to the user. Please look for "PREDETERMINED MESSAGES" in the comments for more information.
     */
    showErrorPopup(message){
        //PREDETERMINED MESSAGES.===============================================================================================================
        //Depending on the type of error, we're going to show a different message to the user, to avoid the popups from becoming too technical.

        //MAX_WRITE_OPERATIONS_PER_MINUTE - In Chrome, if you make too many "set" requests to storage too quickly, (e.g spamming the
        //score placeholder input) then the MAX_WRITE_OPERATIONS_PER_MINUTE error is triggered.
        //When this error is triggered, it stops the user from making ANY "set" requests to storage for about 60 seconds.
        //As such, we need to inform the user that they're making too many requests, and that now they'll have to wait for a minute to be able to
        //make changes again.
        if(message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE"))
            message = "You've made too many requests.\nPlease wait a minute, then try again.";
        //======================================================================================================================================

        let errorPopup = document.getElementById("error-popup");
        errorPopup.querySelector("p").textContent = message; //putting the message in the popup

        //Making the popup FADE IN the page.
        errorPopup.classList.remove("fade-out");
        errorPopup.classList.add("fade-in");
    }
    /**
     * Starts the listeners of the checkboxes related to the stats. In a way that, when a stat is checked it is ADDED to the "scorehider_settings"
     * position of storage, and if it is UNCHECKED it is REMOVED from that same list.
     */
    startCheckboxListeners(){
        //CHECKBOX LISTENER:
        //Each time the checkbox referring to a stat is checked/unchecked in the popup, the element will be hidden/shown in the actual page.
        for(let element of document.querySelectorAll(".stat-option input[type=checkbox]")){
            element.addEventListener("change", async (e)=>{
                //updates the settings in storage, adding or removing the element the checkbox refers to
                let newSettings;

                if(e.target.checked)
                    //if it's checked, we must ADD the value to "scorehider_settings".
                    //To do that, we join the current iteration of the settings WITH the stat we want to add, thus making a new array.
                    newSettings = this.settings.concat(e.target.name);
                else
                    //if it's UNCHECKED, we must REMOVE the value from "scorehider_settings"
                    //to do that, we simply filter the current "this.settings", removing the stat that was unchecked.
                    newSettings = this.settings.filter((stat)=>stat != e.target.name);

                //reverting the checked attribute so the "toggle" animation will only play when the changes are successfully stored in storage
                e.target.checked = !e.target.checked;

                //sending the new settings to storage
                let result = await this.updateSettings(newSettings);
                if(result.success){
                    //changes were successfully stored
                    //returning to the original checked status so the "toggle" animation can be played
                    e.target.checked = !e.target.checked;
                    console.log(`${e.target.name} was ${e.target.checked ? "CHECKED" : "UNCHECKED"}`);
                }else{
                    //there was an error in the updateSettings execution, so we revert the checkbox selection
                    //Since we already reverted the checked status earlier, the checkbox will remain with whatever value it had before calling
                    //this request

                    console.error(`error while trying to set "${e.target.name}"`, result.error);
                    this.showErrorPopup(`error while trying to set "${e.target.name}":\n${result.error}`);
                    //The line below supposedly prints the first line of the stack. Not sure if we're gonna need it, but I'm commenting just in case
                    //this.showErrorPopup(`error while trying to set "${e.target.name}":\n${result.error}\n${result.error?.stack.split("\n")[0]}`);
                }
            })
        };
    }


    /**
     * Takes an array of values and sets in "scorehider_settings" in storag by calling {@link StorageSync#setInStorage()}
     * Then it updates "this.settings" with the new setting list.
     *
     * I keep this function for convenience.
     * @async
     * @param {Array} newSettings - the new "scorehider_settings" that we'll set in storage
     * @returns {Promise<{"success": true, "error": undefined} | {"success": false, "error": Error}>}
     *          - The return result from {@link StorageSync#setInStorage()}
     */
    async updateSettings(newSettings){
        //setting in storage
        let result = await this.storageSync.setInStorage({"scorehider_settings": newSettings});

        if(result.success){
            //if it worked, then we update this.settings
            this.settings = newSettings;
            console.log("new settings:");
            console.log(this.settings);
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
        if(currentScorePlaceholder?.error || !currentScorePlaceholder){
            console.error(`couldn't recover the score placeholder from storage, using "?" by default.\nError: `, currentScorePlaceholder?.error);
            currentScorePlaceholder = "?";
        }

        //getting the input element of the score placeholder and defining the score placeholder value
        let scorePlaceholderInput = document.getElementById("score-placeholder");
        scorePlaceholderInput.value = currentScorePlaceholder;

        //Starting the listener of the input
        //This listener gets the CHARACTER that the user typed in #score-placeholder and submits it to storage
        //IF the user copy-pastes a text with more than one character, we'll only use the FIRST character THAT IS NOT AN EMPTY SPACE as the
        //score placeholder
        scorePlaceholderInput.addEventListener("input", async (e)=>{
            //if the text length is 0 the user erased text. So this listener does nothing
            if(e.target.value.length <= 0)
                return undefined;

            //trimming the value to disallow empty spaces being registered as a score placeholder
            let newScorePlaceholder = e.data.trim();

            if(newScorePlaceholder.length <= 0){
                //if the e.data is empty after trimming, chances are that the user just inputted a blank space. So we console.error a message
                //(the user shall not see this error) and revert the input value to what it was before the user inputted a blank space.
                console.error("newScorePlaceholder is empty (probably a blank space)", newScorePlaceholder);
                e.target.value = currentScorePlaceholder;
                return undefined;
            }
            //Segmenting the string into multiple GRAPHEMES
            //Javascript is one of many languages that calculates the length of strings by how many UTF-16 code units ithas.
            //This is a problem when we deal with emojis and other special characters that has more than code unit per character.
            //e.g: "🌸".length returns "2". "test🌸".length returns "6"

            //So, in order to get the value that we want, we should first segment the string by its GRAPHEMES CLUSTERS.
            //A grapheme cluster is basically the sequence of one or more code units that represents a single character.
            //So "🌸" has TWO code units, but is only ONE grapheme.

            //Therefore, this code section does the aforementioned segmentation of the user input and converts each grapheme information into
            //an array entry. The length of this array is the `true` amount of characters of the string.
            let segmentedData = Array.from(new Intl.Segmenter().segment(newScorePlaceholder));

            //if the user types (or pastes) more than 1 character then we'll only get the FIRST character.
            if(segmentedData.length > 1)
                newScorePlaceholder = segmentedData[0].segment;

            //sending the trimmed, segmented character to the input box
            e.target.value = newScorePlaceholder;

            //if the user typed a character that isn't the same we already set, set the NEW score_placeholder in storage
            if(e.target.value != currentScorePlaceholder){
                //setting the score_placeholder in storage
                let result = await this.storageSync.setInStorage({"score_placeholder": e.target.value});
                if(!result.success){
                    console.error("Error while updating the score placeholder:", result.error);
                    this.showErrorPopup(`Error while updating the score placeholder:\n${result.error}`);
                    //returning the input to its old value
                    e.target.value = currentScorePlaceholder;
                    return undefined;
                }
                //updating the old input value
                currentScorePlaceholder = e.target.value;
            }

        });
    }

    /**
     * Sets up the light or dark theme upon loading the popup
     * !ATTENTION: Should be run BEFORE DOMContentLoaded.
     */
    async definePopupTheme(){
        //getting the theme from storage
        let theme = await this.storageSync.getFromStorage("theme");
        console.log("theme", theme);
        if(!theme?.error){
            //if the theme is "dark" we set the dark theme. Otherwise, we don't do nothing, as :root's default theme is "light"
            if(theme == "dark")
                document.querySelector(":root").classList.add("dark");
        }else
            console.error("there was an error while trying to define the initial popup theme", theme.error, "execution will proceed normally");

    }

    /**
     * If the theme button is clicked, toggles the "dark" class in :root
     * also sets the "theme" position in storage to "dark" or "light", depending on the theme that's being used
     */
    startThemeListener(){
        let themeButton = document.getElementById("theme-button");
        themeButton.addEventListener("click", async ()=> {
            //toggle the class "dark" in :root. (P.S: :root is in light mode by default, :root.dark makes it dark mode)
            let root = document.querySelector(":root");
            root.classList.toggle("dark");

            //Sets the current theme in storage with the position "theme"
            let theme = root.classList.contains("dark") ? "dark" : "light";
            let result = await this.storageSync.setInStorage({theme});

            //if there was an error, we console.error it.
            //the user shall not see this error on the error-popup.

            //Having an error won't stop the theme from being switched, but since it won't set in storage once the user closes the popup
            //it'll still be the old theme.
            if(result.error)
                console.error("There was an error while setting the theme in storage", result.error);
        });
    }
}

let popup = new PopupMenu();
//running the definePopupTheme in here so the dark/light theme gets automatically executed
popup.definePopupTheme();
document.addEventListener("DOMContentLoaded", ()=>{
    //starting the popup's js
    popup.start();
});
